import type { MeshPacket, Vec3 } from "./workspace";
export type ClipSettings = {
  axis: "off" | "x" | "y" | "z";
  position: number;
  flipped: boolean;
};
export type MeasurementPoint = { reference: Vec3; display: Vec3 };
export type CameraBookmark = {
  id: string;
  name: string;
  position: Vec3;
  target: Vec3;
  aspect: number;
  geometry_hash?: string;
};
export function sectionSegments(
  packet: MeshPacket,
  axis: number,
  position: number,
  display: ArrayLike<number> = packet.positions,
) {
  const output: number[] = [];
  const epsilon = 1e-5;
  for (let face = 0; face < packet.indices.length; face += 3) {
    const ids = packet.indices.slice(face, face + 3),
      distance = ids.map((i) => display[3 * i + axis] - position);
    if (distance.every((d) => Math.abs(d) < epsilon)) continue;
    const hits: Vec3[] = [];
    const add = (point: Vec3) => {
      if (
        !hits.some(
          (p) => Math.hypot(...p.map((v, i) => v - point[i])) < epsilon,
        )
      )
        hits.push(point);
    };
    for (let edge = 0; edge < 3; edge++) {
      const a = ids[edge],
        b = ids[(edge + 1) % 3],
        da = distance[edge],
        db = distance[(edge + 1) % 3];
      if (Math.abs(da) < epsilon)
        add([display[3 * a], display[3 * a + 1], display[3 * a + 2]]);
      if (da * db < 0 && Math.abs(da) >= epsilon && Math.abs(db) >= epsilon) {
        const t = da / (da - db);
        add(
          [0, 1, 2].map(
            (i) =>
              display[3 * a + i] +
              t * (display[3 * b + i] - display[3 * a + i]),
          ) as Vec3,
        );
      }
    }
    if (hits.length === 2) output.push(...hits[0], ...hits[1]);
  }
  return output;
}
export function referencePoint(
  display: ArrayLike<number>,
  reference: ArrayLike<number>,
  face: [number, number, number],
  point: Vec3,
): Vec3 | null {
  const [a, b, c] = face.map((id) =>
    [0, 1, 2].map((axis) => display[3 * id + axis]),
  );
  const u = b.map((v, i) => v - a[i]),
    v = c.map((w, i) => w - a[i]),
    w = point.map((x, i) => x - a[i]);
  const dot = (x: number[], y: number[]) =>
    x.reduce((sum, n, i) => sum + n * y[i], 0);
  const uu = dot(u, u),
    uv = dot(u, v),
    vv = dot(v, v),
    wu = dot(w, u),
    wv = dot(w, v),
    denominator = uu * vv - uv * uv;
  if (Math.abs(denominator) < 1e-18) return null;
  const beta = (vv * wu - uv * wv) / denominator,
    gamma = (uu * wv - uv * wu) / denominator,
    weights = [1 - beta - gamma, beta, gamma];
  return [0, 1, 2].map((axis) =>
    face.reduce((sum, id, i) => sum + weights[i] * reference[3 * id + axis], 0),
  ) as Vec3;
}
