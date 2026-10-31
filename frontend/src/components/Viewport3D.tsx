"use client";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  Camera,
  Expand,
  Focus,
  MoveUpRight,
  RotateCcw,
  Ruler,
  X,
} from "lucide-react";
import { Anatomy, CameraView, download, Parameters, Run } from "@/lib/engine";

export type ViewportHandle = {
  screenshot: () => void;
  exportPlate: () => void;
};
type Props = {
  anatomy: Anatomy;
  params: Parameters;
  run: Run | null;
  view: { name: CameraView; tick: number };
  heatmap: boolean;
  bone: boolean;
  hardware: boolean;
  nerve: boolean;
  wireframe: boolean;
  opacity: number;
  onView: (view: CameraView) => void;
};
const stops = [
  "#3157bd",
  "#2da4ce",
  "#45c9a0",
  "#d5d764",
  "#ef9e43",
  "#e95355",
];
function stressColor(value: number) {
  const t = THREE.MathUtils.clamp(value / 1000, 0, 1) * (stops.length - 1);
  const i = Math.min(Math.floor(t), stops.length - 2);
  return new THREE.Color(stops[i]).lerp(new THREE.Color(stops[i + 1]), t - i);
}
function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
      child.geometry.dispose();
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];
      materials.forEach((m) => m.dispose());
    }
  });
}

const Viewport3D = forwardRef<ViewportHandle, Props>(
  function Viewport3D(props, ref) {
    const {
      anatomy,
      params,
      run,
      view,
      heatmap,
      bone,
      hardware,
      nerve,
      wireframe,
      opacity,
      onView,
    } = props;
    const host = useRef<HTMLDivElement>(null);
    const runtime = useRef<{
      scene: THREE.Scene;
      camera: THREE.PerspectiveCamera;
      renderer: THREE.WebGLRenderer;
      controls: OrbitControls;
      bone: THREE.Mesh | null;
      hardware: THREE.Group;
      nerve: THREE.Group;
      measurement: THREE.Group;
      target: THREE.Vector3 | null;
      position: THREE.Vector3 | null;
    } | null>(null);
    const [status, setStatus] = useState("Loading CT-derived surface…");
    const [error, setError] = useState("");
    const [measuring, setMeasuring] = useState(false);
    const [distance, setDistance] = useState<number | null>(null);
    const measureRef = useRef(false);
    const settings = useRef({ bone, wireframe, opacity });
    settings.current = { bone, wireframe, opacity };
    useImperativeHandle(
      ref,
      () => ({
        screenshot() {
          const rt = runtime.current;
          if (!rt) return;
          rt.renderer.render(rt.scene, rt.camera);
          rt.renderer.domElement.toBlob((blob) => {
            if (blob) download("trabecular-viewport.png", blob, "image/png");
          });
        },
        exportPlate() {
          const rt = runtime.current;
          if (!rt) return;
          const result = new STLExporter().parse(rt.hardware, { binary: true });
          download(
            "trabecular-plate-and-screws.stl",
            result.buffer as ArrayBuffer,
            "application/octet-stream",
          );
        },
      }),
      [],
    );
    useEffect(() => {
      if (!host.current) return;
      const container = host.current;
      let disposed = false,
        animation = 0;
      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
        });
      } catch {
        setError(
          "3D rendering is unavailable. Enable browser hardware acceleration and reload.",
        );
        return;
      }
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.domElement.setAttribute(
        "aria-label",
        "Interactive CT-derived mandible. Drag to rotate; scroll to zoom; right-drag to pan.",
      );
      container.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 1500);
      camera.position.set(-145, 70, 205);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.09;
      controls.target.set(0, -4, 0);
      controls.minDistance = 18;
      controls.maxDistance = 440;
      controls.addEventListener("start", () => {
        if (runtime.current) {
          runtime.current.target = null;
          runtime.current.position = null;
        }
      });
      scene.add(new THREE.HemisphereLight(0xe6f0e6, 0x302a24, 2.2));
      const key = new THREE.DirectionalLight(0xfff5e7, 3.5);
      key.position.set(-80, 150, 180);
      key.castShadow = true;
      key.shadow.mapSize.set(2048, 2048);
      key.shadow.camera.left = -110;
      key.shadow.camera.right = 110;
      key.shadow.camera.top = 110;
      key.shadow.camera.bottom = -110;
      key.shadow.bias = -0.0005;
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xc4d7eb, 2.4);
      rim.position.set(100, 60, -80);
      scene.add(rim);
      const fill = new THREE.DirectionalLight(0xffffff, 1.1);
      fill.position.set(-100, -20, -100);
      scene.add(fill);
      const grid = new THREE.GridHelper(280, 28, 0x303637, 0x161c1d);
      grid.position.y = -55;
      const gm = grid.material as THREE.Material;
      gm.transparent = true;
      gm.opacity = 0.3;
      scene.add(grid);
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(500, 500),
        new THREE.ShadowMaterial({ opacity: 0.32 }),
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -54.8;
      ground.receiveShadow = true;
      scene.add(ground);
      const hardwareGroup = new THREE.Group(),
        nerveGroup = new THREE.Group(),
        measurement = new THREE.Group();
      scene.add(hardwareGroup, nerveGroup, measurement);
      const center = new THREE.Vector3(...anatomy.nerve_center);
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(anatomy.nerve_radius_mm, 24, 24),
        new THREE.MeshBasicMaterial({
          color: 0xe7ac5d,
          transparent: true,
          opacity: 0.24,
          depthWrite: false,
        }),
      );
      sphere.position.copy(center);
      nerveGroup.add(sphere);
      const buffer = new THREE.Mesh(
        new THREE.SphereGeometry(anatomy.nerve_radius_mm, 16, 12),
        new THREE.MeshBasicMaterial({
          color: 0xe7ac5d,
          wireframe: true,
          transparent: true,
          opacity: 0.35,
        }),
      );
      buffer.position.copy(center);
      nerveGroup.add(buffer);
      runtime.current = {
        scene,
        camera,
        renderer,
        controls,
        bone: null,
        hardware: hardwareGroup,
        nerve: nerveGroup,
        measurement,
        target: null,
        position: null,
      };
      new STLLoader().load(
        "/assets/mandible.stl",
        (geometry) => {
          if (disposed) {
            geometry.dispose();
            return;
          }
          geometry.deleteAttribute("normal");
          const smooth = mergeVertices(geometry, 0.03);
          geometry.dispose();
          smooth.computeVertexNormals();
          const material = new THREE.MeshStandardMaterial({
            color: 0xd9d4c5,
            roughness: 0.69,
            metalness: 0.06,
            side: THREE.DoubleSide,
          });
          const mesh = new THREE.Mesh(smooth, material);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.visible = settings.current.bone;
          material.wireframe = settings.current.wireframe;
          material.opacity = settings.current.opacity;
          material.transparent = settings.current.opacity < 1;
          scene.add(mesh);
          if (runtime.current) runtime.current.bone = mesh;
          setStatus("");
        },
        undefined,
        () => {
          if (!disposed)
            setError("Could not load the anatomy asset. Reload to retry.");
        },
      );
      const resize = new ResizeObserver(() => {
        const w = container.clientWidth,
          h = container.clientHeight;
        if (!w || !h) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      });
      resize.observe(container);
      const points: THREE.Vector3[] = [];
      const pointer = new THREE.Vector2();
      const raycaster = new THREE.Raycaster();
      let down = { x: 0, y: 0 };
      const onDown = (event: PointerEvent) => {
        down = { x: event.clientX, y: event.clientY };
      };
      const onClick = (event: PointerEvent) => {
        const rt = runtime.current;
        if (
          !measureRef.current ||
          !rt?.bone ||
          Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5
        )
          return;
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.set(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          (-(event.clientY - rect.top) / rect.height) * 2 + 1,
        );
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObject(rt.bone)[0];
        if (!hit) return;
        if (points.length === 2) {
          points.length = 0;
          disposeObject(measurement);
          measurement.clear();
          setDistance(null);
        }
        points.push(hit.point.clone());
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(0.8, 12, 12),
          new THREE.MeshBasicMaterial({ color: 0xc7efa2, depthTest: false }),
        );
        dot.position.copy(hit.point);
        dot.renderOrder = 5;
        measurement.add(dot);
        if (points.length === 2) {
          const line = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(points),
            new THREE.LineBasicMaterial({ color: 0xc7efa2, depthTest: false }),
          );
          line.renderOrder = 5;
          measurement.add(line);
          setDistance(points[0].distanceTo(points[1]));
        }
      };
      renderer.domElement.addEventListener("pointerdown", onDown);
      renderer.domElement.addEventListener("pointerup", onClick);
      const animate = () => {
        if (disposed) return;
        animation = requestAnimationFrame(animate);
        const rt = runtime.current;
        if (rt?.target && rt.position) {
          camera.position.lerp(rt.position, 0.09);
          controls.target.lerp(rt.target, 0.09);
          if (camera.position.distanceTo(rt.position) < 0.03) {
            rt.position = null;
            rt.target = null;
          }
        }
        controls.update();
        renderer.render(scene, camera);
      };
      animate();
      return () => {
        disposed = true;
        cancelAnimationFrame(animation);
        resize.disconnect();
        controls.dispose();
        renderer.domElement.removeEventListener("pointerdown", onDown);
        renderer.domElement.removeEventListener("pointerup", onClick);
        disposeObject(scene);
        renderer.dispose();
        renderer.domElement.remove();
        runtime.current = null;
      };
    }, [anatomy]);
    useEffect(() => {
      const rt = runtime.current;
      if (!rt) return;
      const group = rt.hardware;
      disposeObject(group);
      group.clear();
      const anchors = anatomy.plate_anchors.map((p) => new THREE.Vector3(...p));
      anchors[2].y += params.offset;
      const tangent = new THREE.Vector3().subVectors(anchors[3], anchors[0]);
      tangent.y = 0;
      tangent.normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
      const original = anchors;
      const total = original
        .slice(1)
        .reduce((sum, p, i) => sum + p.distanceTo(original[i]), 0);
      function addMesh(geometry: THREE.BufferGeometry, metal = false) {
        const count = geometry.attributes.position.count;
        const colors = new Float32Array(count * 3);
        const pos = geometry.attributes.position;
        for (let i = 0; i < count; i++) {
          const point = new THREE.Vector3().fromBufferAttribute(pos, i);
          let best = Infinity,
            along = 0,
            cumulative = 0;
          for (let j = 0; j < 3; j++) {
            const segment = new THREE.Line3(anchors[j], anchors[j + 1]);
            const t = segment.closestPointToPointParameter(point, true);
            const nearest = segment.at(t, new THREE.Vector3());
            const d = point.distanceToSquared(nearest);
            if (d < best) {
              best = d;
              along = cumulative + t * original[j].distanceTo(original[j + 1]);
            }
            cumulative += original[j].distanceTo(original[j + 1]);
          }
          const index = Math.min(
            (run?.stress.length || 1) - 1,
            Math.max(
              0,
              Math.floor((along / total) * (run?.stress.length || 1)),
            ),
          );
          const color =
            heatmap && run
              ? stressColor(run.stress[index])
              : new THREE.Color(metal ? "#aebcc8" : "#b9c8cb");
          colors.set([color.r, color.g, color.b], i * 3);
        }
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        const mesh = new THREE.Mesh(
          geometry,
          new THREE.MeshStandardMaterial({
            vertexColors: true,
            metalness: heatmap && run?.stress ? 0.15 : 0.72,
            roughness: 0.38,
            side: THREE.DoubleSide,
          }),
        );
        mesh.castShadow = true;
        group.add(mesh);
      }
      const rotation = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        normal,
      );
      anchors.forEach((anchor, i) => {
        const center = anchor
          .clone()
          .addScaledVector(normal, 2 + params.thickness / 2);
        const shape = new THREE.Shape();
        shape.absarc(
          0,
          0,
          Math.max(2.5, params.width * 0.7),
          0,
          Math.PI * 2,
          false,
        );
        const hole = new THREE.Path();
        hole.absarc(0, 0, 1.15, 0, Math.PI * 2, true);
        shape.holes.push(hole);
        const ring = new THREE.ExtrudeGeometry(shape, {
          depth: params.thickness,
          bevelEnabled: true,
          bevelSegments: 2,
          steps: 1,
          bevelSize: 0.15,
          bevelThickness: 0.15,
          curveSegments: 24,
        });
        ring.translate(0, 0, -params.thickness / 2);
        ring.applyQuaternion(rotation);
        ring.translate(center.x, center.y, center.z);
        addMesh(ring);
        const screwAnchor = anchor.clone().addScaledVector(normal, 2);
        const shaft = new THREE.CylinderGeometry(1.1, 1.1, 8, 16);
        shaft.applyQuaternion(
          new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            normal,
          ),
        );
        const middle = screwAnchor.clone().addScaledVector(normal, -4);
        shaft.translate(middle.x, middle.y, middle.z);
        addMesh(shaft, true);
        const head = new THREE.CylinderGeometry(1.75, 1.75, 0.65, 24);
        head.applyQuaternion(
          new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            normal,
          ),
        );
        const headPos = screwAnchor
          .clone()
          .addScaledVector(normal, params.thickness + 0.4);
        head.translate(headPos.x, headPos.y, headPos.z);
        addMesh(head, true);
        if (i < 3) {
          const a = center,
            b = anchors[i + 1]
              .clone()
              .addScaledVector(normal, 2 + params.thickness / 2);
          const direction = b.clone().sub(a).normalize();
          const basisY = new THREE.Vector3()
            .crossVectors(normal, direction)
            .normalize();
          const basisNormal = new THREE.Vector3()
            .crossVectors(direction, basisY)
            .normalize();
          const matrix = new THREE.Matrix4().makeBasis(
            direction,
            basisY,
            basisNormal,
          );
          const bridge = new THREE.BoxGeometry(
            a.distanceTo(b),
            params.width,
            params.thickness,
            12,
            1,
            1,
          );
          bridge.applyMatrix4(matrix);
          const midpoint = a.clone().add(b).multiplyScalar(0.5);
          bridge.translate(midpoint.x, midpoint.y, midpoint.z);
          addMesh(bridge);
        }
      });
      group.visible = hardware;
    }, [
      anatomy,
      params.thickness,
      params.width,
      params.offset,
      run,
      heatmap,
      hardware,
    ]);
    useEffect(() => {
      const rt = runtime.current;
      if (!rt) return;
      if (rt.bone) {
        rt.bone.visible = bone;
        const mat = rt.bone.material as THREE.MeshStandardMaterial;
        mat.wireframe = wireframe;
        mat.opacity = opacity;
        mat.transparent = opacity < 1;
        mat.depthWrite = opacity === 1;
      }
      rt.nerve.visible = nerve;
    }, [bone, nerve, wireframe, opacity, status]);
    useEffect(() => {
      const rt = runtime.current;
      if (!rt) return;
      const nervePoint = new THREE.Vector3(...anatomy.nerve_center);
      const presets: Record<CameraView, [THREE.Vector3, THREE.Vector3]> = {
        perspective: [
          new THREE.Vector3(-145, 70, 205),
          new THREE.Vector3(0, -4, 0),
        ],
        front: [new THREE.Vector3(0, 5, 255), new THREE.Vector3(0, -4, 0)],
        left: [new THREE.Vector3(-255, 10, 5), new THREE.Vector3(0, -4, 0)],
        top: [new THREE.Vector3(0, 255, 5), new THREE.Vector3(0, -4, 0)],
        plate: [
          new THREE.Vector3(-95, 0, 100),
          new THREE.Vector3(-31, -25, 14),
        ],
        nerve: [
          nervePoint.clone().add(new THREE.Vector3(-45, 20, 60)),
          nervePoint,
        ],
      };
      [rt.position, rt.target] = presets[view.name];
    }, [view, anatomy]);
    const toggleMeasure = () => {
      const next = !measuring;
      setMeasuring(next);
      measureRef.current = next;
      if (!next) {
        const g = runtime.current?.measurement;
        if (g) {
          disposeObject(g);
          g.clear();
        }
        setDistance(null);
      }
    };
    return (
      <div className={`viewport ${measuring ? "is-measuring" : ""}`}>
        <div ref={host} className="canvas-host" />
        <div className="viewport-top">
          <div>
            <span className="eyebrow">ANATOMICAL VIEW</span>
            <p>
              Mandible <span>/</span>{" "}
              {heatmap && run ? "Plate stress" : "Surface anatomy"}
            </p>
          </div>
          <span className="surface-badge">
            <i /> CT-derived surface
          </span>
        </div>
        <div className="viewport-tools glass">
          <button
            title="Fit anatomy"
            aria-label="Fit anatomy"
            onClick={() => onView("perspective")}
          >
            <Focus size={17} />
          </button>
          <button
            title="Reset camera"
            aria-label="Reset camera"
            onClick={() => onView("front")}
          >
            <RotateCcw size={17} />
          </button>
          <span />
          <button
            title="Measure between two surface points"
            aria-label="Measure surface distance"
            aria-pressed={measuring}
            className={measuring ? "active" : ""}
            onClick={toggleMeasure}
          >
            <Ruler size={17} />
          </button>
          <button
            title="Save viewport image"
            aria-label="Save viewport image"
            onClick={() => {
              const rt = runtime.current;
              rt?.renderer.domElement.toBlob((b) => {
                if (b) download("trabecular-viewport.png", b, "image/png");
              });
            }}
          >
            <Camera size={17} />
          </button>
          <button
            title="Fullscreen viewport"
            aria-label="Fullscreen viewport"
            onClick={() => {
              const el = host.current?.parentElement;
              if (document.fullscreenElement) void document.exitFullscreen();
              else
                void el
                  ?.requestFullscreen()
                  .catch(() =>
                    setError("Fullscreen is unavailable in this browser."),
                  );
            }}
          >
            <Expand size={17} />
          </button>
        </div>
        <div className="orientation">
          <span className="axis-y">S</span>
          <div>
            <span className="axis-x">R</span>
            <MoveUpRight size={25} />
            <span className="axis-z">A</span>
          </div>
        </div>
        <div className="viewport-bottom">
          <span>
            Drag to orbit <b>·</b> Scroll to zoom <b>·</b> Right-drag to pan
          </span>
          <span>
            mm <b>·</b> {anatomy.triangles.toLocaleString()} triangles
          </span>
        </div>
        {heatmap && run && (
          <div className="stress-legend glass">
            <span>
              Plate equivalent stress <small>MPa</small>
            </span>
            <div className="color-scale" />
            <div className="scale-labels">
              <span>0</span>
              <span>250</span>
              <span>500</span>
              <span>750</span>
              <span>1,000+</span>
            </div>
          </div>
        )}
        {measuring && (
          <div className="measure-hint glass">
            <Ruler size={15} />
            {distance === null
              ? "Pick two points on the bone"
              : `${distance.toFixed(2)} mm · click to measure again`}
            <button aria-label="Stop measuring" onClick={toggleMeasure}>
              <X size={14} />
            </button>
          </div>
        )}
        {(status || error) && (
          <div className="viewport-message" role="status">
            {error || status}
          </div>
        )}
        <span className="reference-caption">
          Reference anatomy · illustrative implant registration
        </span>
      </div>
    );
  },
);
export default Viewport3D;
