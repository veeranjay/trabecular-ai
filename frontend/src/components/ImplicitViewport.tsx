"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ImplicitMesh, ImplicitPreview, ImplicitResult } from "@/lib/implicit";

function meshGeometry(packet: ImplicitMesh, field?: ImplicitResult, amplification = 0) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(packet.positions);
  if (field && field.fields.displacement_mm.length === positions.length)
    for (let i = 0; i < positions.length; i++) positions[i] += field.fields.displacement_mm[i] * amplification;
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(packet.indices); geometry.computeVertexNormals();
  return geometry;
}
function dispose(group: THREE.Object3D) {
  group.traverse(item => {
    if (item instanceof THREE.Mesh || item instanceof THREE.LineSegments) {
      item.geometry.dispose();
      (Array.isArray(item.material) ? item.material : [item.material]).forEach(m => m.dispose());
    }
  });
  group.clear();
}

export default function ImplicitViewport({ preview, result, baseline, mode, showGrid, amplification }: {
  preview: ImplicitPreview | null; result: ImplicitResult | null; baseline: ImplicitResult | null;
  mode: "solid" | "distance" | "stress" | "displacement"; showGrid: boolean; amplification: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const runtime = useRef<{ group: THREE.Group } | null>(null);
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); }
    catch { container.textContent = "Enable browser hardware acceleration to inspect the 3D specimen."; return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene(), group = new THREE.Group(); scene.add(group);
    const camera = new THREE.PerspectiveCamera(34, 1, .1, 1000);
    camera.up.set(0, 0, 1); camera.position.set(26, -43, 36);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = .08; controls.minDistance = 20; controls.maxDistance = 150;
    scene.add(new THREE.HemisphereLight(0xf4ffe9, 0x14231c, 2));
    for (const [color, intensity, position] of [[0xffffff, 3, [-20, -20, 40]], [0xc5e5a8, 3, [20, 15, 12]], [0x90b9d0, 2, [-10, 30, 20]]] as [number, number, number[]][]) {
      const light = new THREE.DirectionalLight(color, intensity); light.position.set(position[0], position[1], position[2]); scene.add(light);
    }
    runtime.current = { group };
    const resize = new ResizeObserver(() => { const w = container.clientWidth, h = container.clientHeight; if (!w || !h) return; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); });
    resize.observe(container);
    let frame = 0;
    const render = () => { frame = requestAnimationFrame(render); controls.update(); renderer.render(scene, camera); }; render();
    return () => { cancelAnimationFrame(frame); resize.disconnect(); controls.dispose(); dispose(group); renderer.dispose(); container.removeChild(renderer.domElement); runtime.current = null; };
  }, []);
  useEffect(() => {
    const group = runtime.current?.group;
    if (!group || !preview) return;
    dispose(group);
    const packet = result?.mesh || preview.mesh;
    const geometry = meshGeometry(packet, mode === "displacement" ? result || undefined : undefined, amplification);
    const stress = mode === "stress" && result;
    if (stress && result.fields.stress_mpa.length * 3 === packet.positions.length) {
      const max = Math.max(...result.fields.stress_mpa, 1), colors = new Float32Array(packet.positions.length);
      result.fields.stress_mpa.forEach((value, i) => {
        const color = new THREE.Color().setHSL(.6 * (1 - Math.min(1, value / max)), .65, .52);
        colors.set([color.r, color.g, color.b], i * 3);
      });
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    }
    const material = new THREE.MeshStandardMaterial({ color: stress ? 0xffffff : 0xcfd8c7, metalness: .62, roughness: .3,
      transparent: mode === "distance", opacity: mode === "distance" ? .13 : 1, depthWrite: mode !== "distance", vertexColors: !!stress });
    group.add(new THREE.Mesh(geometry, material));
    if (baseline) group.add(new THREE.Mesh(meshGeometry(baseline.mesh), new THREE.MeshBasicMaterial({ color: 0x8faebe, wireframe: true, transparent: true, opacity: .22, depthWrite: false })));
    if (mode === "distance") {
      const [rows, cols] = preview.slice.shape;
      const plane = new THREE.PlaneGeometry(44, 16, cols - 1, rows - 1);
      // PlaneGeometry rows run top-to-bottom; the sampled slice runs bottom-to-top.
      const distances = new Float32Array(rows * cols);
      for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) distances[row * cols + col] = preview.slice.values_mm[(rows - row - 1) * cols + col];
      plane.setAttribute("distanceValue", new THREE.BufferAttribute(distances, 1));
      const shader = new THREE.ShaderMaterial({ transparent: true, side: THREE.DoubleSide, depthWrite: false,
        vertexShader: "attribute float distanceValue; varying float distanceField; void main(){distanceField=distanceValue;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
        fragmentShader: "varying float distanceField; void main(){float d=distanceField;vec3 c=mix(vec3(.10,.29,.43),vec3(.58,.82,.48),step(d,0.));float contour=1.-smoothstep(.02,.08,abs(fract(abs(d)*2.)-.5));float edge=1.-smoothstep(.015,.09,abs(d));c=mix(c,c*1.8,contour*.65);c=mix(c,vec3(.85,1.,.7),edge);gl_FragColor=vec4(c,.65);}" });
      group.add(new THREE.Mesh(plane, shader));
    }
    if (showGrid) {
      const lines: number[] = [];
      const half = preview.grid.spacing_mm.map(v => v / 2);
      const corners = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
      const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
      preview.grid.active_centers_mm.forEach(center => edges.forEach(edge => edge.forEach(index => corners[index].forEach((v, axis) => lines.push(center[axis] + v * half[axis])))));
      const lattice = new THREE.BufferGeometry(); lattice.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
      group.add(new THREE.LineSegments(lattice, new THREE.LineBasicMaterial({ color: 0xc5e5a8, transparent: true, opacity: .13, depthWrite: false })));
    }
  }, [preview, result, baseline, mode, showGrid, amplification]);
  return <div ref={host} className="implicit-canvas" aria-label="Interactive implicit plate, sampled distance field and background integration cells" />;
}
