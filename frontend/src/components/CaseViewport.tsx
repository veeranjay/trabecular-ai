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
import { Camera, Focus, Layers3, RotateCcw, Ruler, X } from "lucide-react";
import {
  Geometry,
  JawResult,
  Region,
  Vec3,
  saveBlob,
  saveJSON,
} from "@/lib/workspace";
import {
  ClipSettings,
  MeasurementPoint,
  sectionSegments,
  referencePoint,
  CameraBookmark,
} from "@/lib/inspection";

export type CaseViewportHandle = {
  view: (name: string) => void;
  focus: (region: Region) => void;
  screenshot: () => void;
  captureView: () => Omit<CameraBookmark, "id" | "name"> | null;
  restoreView: (view: CameraBookmark) => void;
};
type Props = {
  geometry: Geometry | null;
  result: JawResult | null;
  dirty: boolean;
  mode: "material" | "stress" | "displacement";
  bone: boolean;
  regions: boolean;
  opacity: number;
  clip: ClipSettings;
  amplification: number;
  comparison: Geometry | null;
  comparisonResult: JawResult | null;
  comparisonBones: boolean;
  onCameraChanged: (name: string) => void;
  selection: string | null;
  onPick: (position: Vec3) => void;
};
function dispose(group: THREE.Object3D) {
  group.traverse((object) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
      object.geometry.dispose();
      (Array.isArray(object.material)
        ? object.material
        : [object.material]
      ).forEach((material) => material.dispose());
    }
  });
}
const colors = [
  "#334fad",
  "#2b95bf",
  "#57bfab",
  "#d4d471",
  "#e79c52",
  "#d9595c",
].map((value) => new THREE.Color(value));
function scalarColor(value: number, max: number) {
  const t = Math.max(0, Math.min(1, value / max)) * (colors.length - 1);
  const i = Math.min(colors.length - 2, Math.floor(t));
  return colors[i].clone().lerp(colors[i + 1], t - i);
}

const CaseViewport = forwardRef<CaseViewportHandle, Props>(
  function CaseViewport(props, ref) {
    const host = useRef<HTMLDivElement>(null);
    const runtime = useRef<{
      scene: THREE.Scene;
      camera: THREE.PerspectiveCamera;
      renderer: THREE.WebGLRenderer;
      controls: OrbitControls;
      objects: THREE.Group;
      annotations: THREE.Group;
      comparison: THREE.Group;
      section: THREE.Group;
      measurements: THREE.Group;
      clipPlane: THREE.Plane;
      center: THREE.Vector3;
      radius: number;
    } | null>(null);
    const latest = useRef(props);
    latest.current = props;
    const fittedAnatomy = useRef("");
    const cameraMotion = useRef<{ start: number; from: THREE.Vector3; to: THREE.Vector3; targetFrom: THREE.Vector3; targetTo: THREE.Vector3 } | null>(null);
    function moveCamera(position: THREE.Vector3, target: THREE.Vector3) {
      const rt = runtime.current;
      if (!rt) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || rt.camera.position.length() < 1) {
        cameraMotion.current = null;
        rt.camera.position.copy(position);
        rt.controls.target.copy(target);
        rt.controls.update();
        return;
      }
      cameraMotion.current = { start: performance.now(), from: rt.camera.position.clone(), to: position.clone(), targetFrom: rt.controls.target.clone(), targetTo: target.clone() };
    }
    const [error, setError] = useState("");
    const [annotationKey, setAnnotationKey] = useState(false);
    const [measuring, setMeasuring] = useState(false);
    const [measurementPoints, setMeasurementPoints] = useState<
      MeasurementPoint[]
    >([]);
    const measurementMode = useRef(measuring);
    measurementMode.current = measuring;
    function view(name: string) {
      const rt = runtime.current;
      if (!rt) return;
      const dirs: Record<string, number[]> = {
        perspective: [1, 0.35, 1.3],
        front: [0, 0.12, 1],
        left: [-1, 0.15, 0],
        right: [1, 0.15, 0],
        top: [0, 1, 0.001],
      };
      const direction = new THREE.Vector3(
        ...(dirs[name] || dirs.perspective),
      ).normalize();
      const verticalHalf = THREE.MathUtils.degToRad(rt.camera.fov / 2);
      const limitingHalf = Math.atan(
        Math.tan(verticalHalf) * Math.min(1, rt.camera.aspect),
      );
      const destination = rt.center.clone()
        .addScaledVector(
          direction,
          (rt.radius / Math.sin(limitingHalf)) * 1.04,
        );
      moveCamera(destination, rt.center);
      latest.current.onCameraChanged(name);
    }
    useImperativeHandle(ref, () => ({
      view,
      captureView() {
        const rt = runtime.current;
        return rt
          ? {
              position: rt.camera.position.toArray() as Vec3,
              target: rt.controls.target.toArray() as Vec3,
              aspect: rt.camera.aspect,
              geometry_hash: latest.current.geometry?.geometry_hash,
            }
          : null;
      },
      restoreView(bookmark) {
        const rt = runtime.current;
        if (!rt) return;
        const half = THREE.MathUtils.degToRad(rt.camera.fov / 2),
          before = Math.atan(
            Math.tan(half) * Math.min(1, bookmark.aspect || rt.camera.aspect),
          ),
          after = Math.atan(Math.tan(half) * Math.min(1, rt.camera.aspect));
        const target = new THREE.Vector3(...bookmark.target);
        const destination = new THREE.Vector3()
          .set(...bookmark.position)
          .sub(target)
          .multiplyScalar(Math.sin(before) / Math.sin(after))
          .add(target);
        moveCamera(destination, target);
        latest.current.onCameraChanged("custom");
      },
      focus(region) {
        const rt = runtime.current;
        if (!rt) return;
        const target = new THREE.Vector3(...region.center);
        const direction = rt.camera.position
          .clone()
          .sub(rt.controls.target)
          .normalize();
        moveCamera(target.clone().addScaledVector(direction, Math.max(35, region.radius * 6)), target);
      },
      screenshot() {
        const rt = runtime.current;
        if (!rt) return;
        rt.renderer.render(rt.scene, rt.camera);
        rt.renderer.domElement.toBlob((blob) => {
          if (blob) saveBlob("trabecular-view.png", blob);
        });
      },
    }));
    useEffect(() => {
      const container = host.current;
      if (!container) return;
      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
        });
      } catch {
        queueMicrotask(() =>
          setError(
            "3D display is unavailable. Enable hardware acceleration in your browser.",
          ),
        );
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.localClippingEnabled = true;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.3;
      container.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 10000);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minDistance = 0.5;
      controls.maxDistance = 5000;
      controls.addEventListener("end", () => {
        const direction = camera.position
          .clone()
          .sub(controls.target)
          .normalize();
        const options: Record<string, Vec3> = {
          perspective: [1, 0.35, 1.3],
          front: [0, 0.12, 1],
          left: [-1, 0.15, 0],
          right: [1, 0.15, 0],
          top: [0, 1, 0.001],
        };
        latest.current.onCameraChanged(
          Object.entries(options).find(
            ([, value]) =>
              direction.distanceTo(new THREE.Vector3(...value).normalize()) <
              0.001,
          )?.[0] || "custom",
        );
      });
      scene.add(new THREE.HemisphereLight(0xfff9eb, 0x242d33, 2));
      for (const [color, intensity, position] of [
        [0xfff2dc, 3.2, [-100, 140, 150]],
        [0xbacfe5, 2.1, [130, 90, -100]],
        [0xffffff, 0.8, [0, -60, 150]],
      ] as [number, number, number[]][]) {
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(...(position as Vec3));
        scene.add(light);
      }
      const grid = new THREE.GridHelper(300, 30, 0x283032, 0x171e20);
      grid.position.y = -58;
      (grid.material as THREE.Material).transparent = true;
      (grid.material as THREE.Material).opacity = 0.45;
      scene.add(grid);
      const objects = new THREE.Group(),
        annotations = new THREE.Group(),
        comparison = new THREE.Group(),
        section = new THREE.Group(),
        measurements = new THREE.Group();
      scene.add(objects, annotations, comparison, section, measurements);
      runtime.current = {
        scene,
        camera,
        renderer,
        controls,
        objects,
        annotations,
        comparison,
        section,
        measurements,
        clipPlane: new THREE.Plane(new THREE.Vector3(1, 0, 0), 0),
        center: new THREE.Vector3(0, 0, 0),
        radius: 90,
      };
      view("perspective");
      const resize = new ResizeObserver(() => {
        const w = container.clientWidth,
          h = container.clientHeight;
        if (!w || !h) return;
        const half = THREE.MathUtils.degToRad(camera.fov / 2);
        const before = Math.atan(Math.tan(half) * Math.min(1, camera.aspect));
        const after = Math.atan(Math.tan(half) * Math.min(1, w / h));
        camera.position
          .sub(controls.target)
          .multiplyScalar(Math.sin(before) / Math.sin(after))
          .add(controls.target);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      });
      resize.observe(container);
      let down = { x: 0, y: 0 };
      const pointerDown = (event: PointerEvent) => {
        cameraMotion.current = null;
        down = { x: event.clientX, y: event.clientY };
      };
      const pick = (event: PointerEvent) => {
        if (
          (!latest.current.selection && !measurementMode.current) ||
          Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5
        )
          return;
        const rect = renderer.domElement.getBoundingClientRect();
        const ray = new THREE.Raycaster();
        ray.setFromCamera(
          new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            (-(event.clientY - rect.top) / rect.height) * 2 + 1,
          ),
          camera,
        );
        const hit = ray
          .intersectObjects(objects.children)
          .find(
            (value) =>
              value.object.visible &&
              (measurementMode.current ||
                value.object.userData.material === "bone") &&
              (latest.current.clip.axis === "off" ||
                runtime.current!.clipPlane.distanceToPoint(value.point) >=
                  -1e-5),
          );
        if (hit && hit.face && hit.object instanceof THREE.Mesh) {
          const reference = referencePoint(
            hit.object.geometry.getAttribute("position").array,
            hit.object.userData.referencePositions,
            [hit.face.a, hit.face.b, hit.face.c],
            hit.point.toArray() as Vec3,
          );
          if (!reference) {
            setError(
              "This displayed triangle has collapsed. Set deformation scale to zero before measuring.",
            );
            return;
          }
          setError("");
          if (measurementMode.current)
            setMeasurementPoints((previous) => [
              ...(previous.length === 2 ? [] : previous),
              { reference, display: hit.point.toArray() as Vec3 },
            ]);
          else latest.current.onPick(reference);
        }
      };
      renderer.domElement.addEventListener("pointerdown", pointerDown);
      renderer.domElement.addEventListener("pointerup", pick);
      let frame = 0;
      const animate = () => {
        frame = requestAnimationFrame(animate);
        const movement = cameraMotion.current;
        if (movement) {
          const t = Math.min(1, (performance.now() - movement.start) / 650);
          const eased = 1 - Math.pow(1 - t, 3);
          camera.position.lerpVectors(movement.from, movement.to, eased);
          controls.target.lerpVectors(movement.targetFrom, movement.targetTo, eased);
          if (t === 1) cameraMotion.current = null;
        }
        controls.update();
        renderer.render(scene, camera);
      };
      animate();
      return () => {
        cancelAnimationFrame(frame);
        resize.disconnect();
        controls.dispose();
        dispose(scene);
        renderer.dispose();
        renderer.domElement.removeEventListener("pointerdown", pointerDown);
        renderer.domElement.removeEventListener("pointerup", pick);
        renderer.domElement.remove();
        runtime.current = null;
      };
    }, []);
    useEffect(() => {
      const rt = runtime.current;
      if (!rt || !props.geometry) return;
      dispose(rt.objects);
      rt.objects.clear();
      dispose(rt.annotations);
      rt.annotations.clear();
      const matching =
        !props.dirty &&
        props.result?.geometry_hash === props.geometry.geometry_hash;
      for (const packet of props.geometry.meshes) {
        const geometry = new THREE.BufferGeometry();
        const displayPositions = new Float32Array(packet.positions);
        const displaced =
          matching && props.mode === "displacement"
            ? props.result?.fields[packet.id]?.displacement_mm
            : undefined;
        if (displaced?.length === displayPositions.length)
          for (let i = 0; i < displayPositions.length; i++)
            displayPositions[i] += props.amplification * displaced[i];
        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(displayPositions, 3),
        );
        geometry.setIndex(packet.indices);
        geometry.computeVertexNormals();
        const field = matching ? props.result?.fields[packet.id] : undefined;
        const mapped = field && props.mode !== "material";
        if (mapped) {
          const values =
            props.mode === "stress"
              ? field.stress_mpa
              : Array.from({ length: packet.positions.length / 3 }, (_, i) =>
                  Math.hypot(...field.displacement_mm.slice(i * 3, i * 3 + 3)),
                );
          const rgb = values.flatMap((value) =>
            scalarColor(value, props.mode === "stress" ? 2000 : 5).toArray(),
          );
          geometry.setAttribute(
            "color",
            new THREE.Float32BufferAttribute(rgb, 3),
          );
        }
        const isBone = packet.material === "bone";
        const material = new THREE.MeshStandardMaterial({
          color: mapped ? 0xffffff : isBone ? 0xded8c8 : 0xaeb9c2,
          roughness: isBone ? 0.72 : 0.31,
          metalness: isBone ? 0.03 : 0.7,
          vertexColors: !!mapped,
          transparent: isBone && props.opacity < 1,
          opacity: isBone ? props.opacity : 1,
          side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = packet.id;
        mesh.userData.material = packet.material;
        mesh.userData.referencePositions = packet.positions;
        mesh.visible = !isBone || props.bone;
        rt.objects.add(mesh);
      }
      for (const region of props.geometry.regions) {
        const color =
          region.kind === "support"
            ? 0x9ac3d6
            : region.kind === "load"
              ? 0xc5e5a8
              : 0xe0bd80;
        if (region.points?.length) {
          const material = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: region.id === props.selection ? 0.3 : 0.15,
            depthWrite: false,
          });
          for (const point of region.points) {
            const sphere = new THREE.Mesh(
              new THREE.SphereGeometry(region.radius, 12, 8),
              material,
            );
            sphere.position.set(...point);
            rt.annotations.add(sphere);
          }
          for (let i = 1; i < region.points.length; i++) {
            const a = new THREE.Vector3(...region.points[i - 1]),
              b = new THREE.Vector3(...region.points[i]),
              direction = b.clone().sub(a);
            if (direction.length() < 0.001) continue;
            const tube = new THREE.Mesh(
              new THREE.CylinderGeometry(
                region.radius,
                region.radius,
                direction.length(),
                12,
                1,
              ),
              material,
            );
            tube.position.copy(a).add(b).multiplyScalar(0.5);
            tube.quaternion.setFromUnitVectors(
              new THREE.Vector3(0, 1, 0),
              direction.normalize(),
            );
            rt.annotations.add(tube);
          }
          const line = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(
              region.points.map((p) => new THREE.Vector3(...p)),
            ),
            new THREE.LineBasicMaterial({ color }),
          );
          rt.annotations.add(line);
          continue;
        }
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(region.radius, 20, 14),
          new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: region.id === props.selection ? 0.3 : 0.12,
            depthWrite: false,
          }),
        );
        sphere.position.set(...region.center);
        rt.annotations.add(sphere);
        const wire = new THREE.LineSegments(
          new THREE.EdgesGeometry(
            new THREE.SphereGeometry(region.radius, 12, 8),
          ),
          new THREE.LineBasicMaterial({
            color,
            transparent: true,
            opacity: 0.3,
          }),
        );
        wire.position.copy(sphere.position);
        rt.annotations.add(wire);
        if (region.kind === "load") {
          const direction = new THREE.Vector3(
            ...(region.vector || [0, -1, 0]),
          ).normalize();
          const arrow = new THREE.ArrowHelper(
            direction,
            sphere.position.clone().addScaledVector(direction, -23),
            18,
            color,
            4,
            2,
          );
          rt.annotations.add(arrow);
        }
      }
      rt.annotations.visible = props.regions || annotationKey;
      const bounds = new THREE.Box3().setFromObject(rt.objects);
      bounds.getCenter(rt.center);
      rt.radius = bounds.getSize(new THREE.Vector3()).length() / 2;
      if (fittedAnatomy.current !== props.geometry.anatomy.id) {
        fittedAnatomy.current = props.geometry.anatomy.id;
        view("perspective");
      }
    }, [
      props.geometry,
      props.result,
      props.mode,
      props.dirty,
      props.bone,
      props.regions,
      props.opacity,
      props.amplification,
      props.selection,
      annotationKey,
    ]);
    useEffect(() => {
      const rt = runtime.current;
      if (!rt) return;
      dispose(rt.comparison);
      rt.comparison.clear();
      if (!props.comparison) return;
      const allBone = props.comparison.meshes.every(
        (p) => p.material === "bone",
      );
      for (const packet of props.comparison.meshes) {
        if (
          packet.material === "bone" &&
          (!props.bone || (!props.comparisonBones && !allBone))
        )
          continue;
        const field =
          props.comparisonResult?.geometry_hash ===
          props.comparison.geometry_hash
            ? props.comparisonResult.fields[packet.id]
            : undefined;
        const positions = new Float32Array(packet.positions);
        if (
          !props.dirty &&
          props.mode === "displacement" &&
          field?.displacement_mm.length === positions.length
        )
          for (let i = 0; i < positions.length; i++)
            positions[i] += props.amplification * field.displacement_mm[i];
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(positions, 3),
        );
        geometry.setIndex(packet.indices);
        const mapped = !props.dirty && props.mode !== "material" && !!field;
        if (mapped) {
          const values =
            props.mode === "stress"
              ? field.stress_mpa
              : field.displacement_mm
                  .filter((_, i) => i % 3 === 0)
                  .map((_, i) =>
                    Math.hypot(
                      ...field.displacement_mm.slice(3 * i, 3 * i + 3),
                    ),
                  );
          geometry.setAttribute(
            "color",
            new THREE.Float32BufferAttribute(
              values.flatMap((v) =>
                scalarColor(v, props.mode === "stress" ? 2000 : 5).toArray(),
              ),
              3,
            ),
          );
        }
        const material = new THREE.MeshBasicMaterial({
          color: mapped ? 0xffffff : 0x89bdf6,
          wireframe: true,
          transparent: true,
          opacity: packet.material === "bone" ? 0.13 : 0.65,
          depthWrite: false,
          vertexColors: mapped,
        });
        rt.comparison.add(new THREE.Mesh(geometry, material));
      }
    }, [
      props.comparison,
      props.comparisonResult,
      props.comparisonBones,
      props.bone,
      props.mode,
      props.amplification,
      props.dirty,
    ]);
    useEffect(() => {
      const rt = runtime.current;
      if (!rt) return;
      const enabled = props.clip.axis !== "off",
        axis = Math.max(0, ["x", "y", "z"].indexOf(props.clip.axis));
      const normal = new THREE.Vector3();
      normal.setComponent(axis, props.clip.flipped ? -1 : 1);
      rt.clipPlane.set(
        normal,
        -props.clip.position * (props.clip.flipped ? -1 : 1),
      );
      for (const group of [rt.objects, rt.comparison])
        group.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            const materials = Array.isArray(object.material)
              ? object.material
              : [object.material];
            for (const material of materials) {
              const wasEnabled = !!material.clippingPlanes?.length;
              material.clippingPlanes = enabled ? [rt.clipPlane] : null;
              if (wasEnabled !== enabled) material.needsUpdate = true;
            }
          }
        });
      dispose(rt.section);
      rt.section.clear();
      if (enabled && props.geometry)
        for (const packet of props.geometry.meshes) {
          const mesh = rt.objects.getObjectByName(packet.id) as
            THREE.Mesh | undefined;
          if (!mesh?.visible) continue;
          const segments = sectionSegments(
            packet,
            axis,
            props.clip.position,
            mesh.geometry.getAttribute("position").array,
          );
          if (segments.length) {
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute(
              "position",
              new THREE.Float32BufferAttribute(segments, 3),
            );
            rt.section.add(
              new THREE.LineSegments(
                geometry,
                new THREE.LineBasicMaterial({
                  color: packet.material === "bone" ? 0xc5e5a8 : 0x89bdf6,
                  depthTest: false,
                  transparent: true,
                  opacity: 0.9,
                }),
              ),
            );
          }
        }
    }, [
      props.clip,
      props.geometry,
      props.comparison,
      props.comparisonResult,
      props.comparisonBones,
      props.bone,
      props.mode,
      props.amplification,
      props.result,
      props.dirty,
      props.opacity,
      props.regions,
      props.selection,
      annotationKey,
    ]);
    useEffect(() => {
      queueMicrotask(() => setMeasurementPoints([]));
    }, [props.geometry?.geometry_hash, props.mode, props.amplification]);
    useEffect(() => {
      const rt = runtime.current;
      if (!rt) return;
      dispose(rt.measurements);
      rt.measurements.clear();
      for (const point of measurementPoints) {
        const marker = new THREE.Mesh(
          new THREE.SphereGeometry(0.55, 12, 8),
          new THREE.MeshBasicMaterial({ color: 0xc5e5a8, depthTest: false }),
        );
        marker.position.set(...point.display);
        rt.measurements.add(marker);
      }
      if (measurementPoints.length === 2)
        rt.measurements.add(
          new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(
              measurementPoints.map((p) => new THREE.Vector3(...p.display)),
            ),
            new THREE.LineBasicMaterial({ color: 0xc5e5a8, depthTest: false }),
          ),
        );
    }, [measurementPoints]);
    return (
      <div className={`case-viewport ${props.selection ? "picking" : ""}`}>
        <div
          ref={host}
          className="case-canvas"
          aria-label="Interactive mandible and fixation assembly"
        />
        {error && <div className="canvas-message error">{error}</div>}
        {!props.geometry && !error && (
          <div className="canvas-message">Loading your case…</div>
        )}
        <div className="ws-viewport-tools glass" aria-label="Viewport tools">
          <button
            title="Fit anatomy"
            aria-label="Fit anatomy"
            onClick={() => view("perspective")}
          >
            <Focus size={18} />
          </button>
          <button
            title="Front view"
            aria-label="Front view"
            onClick={() => view("front")}
          >
            <RotateCcw size={17} />
          </button>
          <button
            title="Toggle registered regions"
            aria-label="Toggle registered regions"
            aria-pressed={annotationKey || props.regions}
            onClick={() => setAnnotationKey(!annotationKey)}
          >
            <Layers3 size={17} />
          </button>
          <button
            title="Measure distance"
            aria-label="Measure distance"
            aria-pressed={measuring}
            onClick={() => setMeasuring(!measuring)}
          >
            <Ruler size={17} />
          </button>
          <button
            title="Save image"
            aria-label="Save image"
            onClick={() => {
              const rt = runtime.current;
              if (rt) {
                rt.renderer.render(rt.scene, rt.camera);
                rt.renderer.domElement.toBlob((blob) => {
                  if (blob) saveBlob("trabecular-view.png", blob);
                });
              }
            }}
          >
            <Camera size={17} />
          </button>
        </div>
        {measuring && (
          <div className="pick-instruction glass">
            {measurementPoints.length === 1
              ? "Pick a second surface point"
              : "Pick two surface points to measure"}{" "}
            · source coordinates
          </div>
        )}
        {measurementPoints.length > 0 && (
          <div className="ws-measurement glass">
            <button
              className="ws-icon"
              aria-label="Clear measurement"
              onClick={() => setMeasurementPoints([])}
            >
              <X size={14} />
            </button>
            <span>Distance on original geometry</span>
            <strong>
              {measurementPoints.length === 2
                ? `${Math.hypot(...measurementPoints[0].reference.map((v, i) => v - measurementPoints[1].reference[i])).toFixed(2)} mm`
                : "First point selected"}
            </strong>
            <small>Surface picks · saved geometry coordinates</small>
            {measurementPoints.length === 2 && (
              <button
                className="ws-button"
                onClick={() =>
                  saveJSON("trabecular-measurement.json", {
                    geometry_hash: props.geometry?.geometry_hash,
                    units: "mm",
                    points: measurementPoints.map((p) => p.reference),
                    distance_mm: Math.hypot(
                      ...measurementPoints[0].reference.map(
                        (v, i) => v - measurementPoints[1].reference[i],
                      ),
                    ),
                  })
                }
              >
                Save measurement
              </button>
            )}
          </div>
        )}
        {!measuring && props.selection && (
          <div className="pick-instruction glass">
            Click the bone surface to place{" "}
            {props.selection.replaceAll("_", " ")}
          </div>
        )}
        {props.mode !== "material" && props.result && !props.dirty && (
          <div className="field-legend glass">
            <span>
              {props.mode === "stress"
                ? "Equivalent stress · MPa"
                : "Displacement · mm"}
            </span>
            <div />
            <small>
              0 <span>{props.mode === "stress" ? "≥ 2,000" : "≥ 5"}</span>
            </small>
            <p>Interpolated display · raw values in Evidence</p>
            {props.mode === "displacement" && (
              <p>
                Shape deformation ×{props.amplification} · values remain
                unscaled
              </p>
            )}
          </div>
        )}
        {(props.clip.axis !== "off" || props.comparison) && (
          <div className="ws-inspection-caption glass">
            {props.clip.axis !== "off" && (
              <span>
                Section {props.clip.axis.toUpperCase()} ={" "}
                {props.clip.position.toFixed(1)} mm · surface outline
              </span>
            )}
            {props.comparison && (
              <span>
                {props.mode === "material" ||
                props.dirty ||
                !props.comparisonResult
                  ? "Blue wireframe: saved comparison"
                  : "Wireframe: saved comparison · shared field scale"}
              </span>
            )}
          </div>
        )}
        <div className="viewport-caption">
          Drag to orbit <span>·</span> Scroll to zoom <span>·</span> Shift +
          drag to pan
        </div>
      </div>
    );
  },
);
export default CaseViewport;
