import { test } from "node:test";
import * as assert from "node:assert/strict";
import { sectionSegments, referencePoint } from "./inspection";
import type { MeshPacket, Vec3 } from "./workspace";
const cube: MeshPacket = {
  id: "known-cube",
  material: "bone",
  positions: [
    -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1, 1, 1, -1, 1, 1, 1, 1,
    -1, 1, 1,
  ],
  indices: [
    0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2,
    3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7,
  ],
};
function length(segments: number[]) {
  let total = 0;
  for (let i = 0; i < segments.length; i += 6)
    total += Math.hypot(
      ...[0, 1, 2].map((axis) => segments[i + axis] - segments[i + 3 + axis]),
    );
  return total;
}
test("section through the cube has its known physical perimeter", () => {
  const lines = sectionSegments(cube, 0, 0);
  assert.ok(Math.abs(length(lines) - 8) < 1e-12);
  for (let i = 0; i < lines.length; i += 3) assert.equal(lines[i], 0);
});
test("coplanar faces do not introduce triangulation diagonals", () =>
  assert.ok(Math.abs(length(sectionSegments(cube, 0, 1)) - 8) < 1e-12));
test("a plane outside the solid produces no invented section", () =>
  assert.equal(sectionSegments(cube, 2, 2).length, 0));
test("deformed picks map back to physical source coordinates", () => {
  const source = [0, 0, 0, 2, 0, 0, 0, 2, 0],
    display = [4, 3, 5, 8, 3, 5, 6, 9, 7],
    weights = [0.2, 0.3, 0.5];
  const point = [0, 1, 2].map((axis) =>
    weights.reduce((sum, w, i) => sum + w * display[3 * i + axis], 0),
  ) as Vec3;
  const mapped = referencePoint(display, source, [0, 1, 2], point)!;
  assert.ok(Math.abs(mapped[0] - 0.6) < 1e-12);
  assert.ok(Math.abs(mapped[1] - 1) < 1e-12);
  assert.equal(mapped[2], 0);
});
test("collapsed displayed triangles cannot produce a source measurement", () =>
  assert.equal(
    referencePoint(
      [0, 0, 0, 1, 0, 0, 2, 0, 0],
      [0, 0, 0, 1, 0, 0, 0, 1, 0],
      [0, 1, 2],
      [1, 0, 0],
    ),
    null,
  ));
