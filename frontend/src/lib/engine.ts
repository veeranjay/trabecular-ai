export type Parameters = {
  thickness: number;
  width: number;
  offset: number;
  load: number;
  modulus: number;
  min_clearance: number;
  min_sf: number;
};
export const defaults: Parameters = {
  thickness: 1.5,
  width: 3,
  offset: 0,
  load: 520,
  modulus: 1200,
  min_clearance: 4,
  min_sf: 1.8,
};
export type Run = {
  id: string;
  created_at: string;
  params: Parameters;
  method: string;
  model: string;
  plate_length_mm: number;
  peak_stress: number;
  safety_factor: number;
  clearance: number;
  stress_pass: boolean;
  nerve_pass: boolean;
  passed: boolean;
  max_displacement: number;
  stress: number[];
  displacement: number[];
  residual: number;
  iterations: number;
  dofs: number;
  elapsed_ms: number;
  assumptions: string[];
};
export type Optimization = {
  winner: Run | null;
  candidates: Run[];
  evaluated: number;
  elapsed_ms: number;
  reason: string | null;
};
export type Cohort = {
  samples: Run[];
  passed: number;
  total: number;
  min_sf: number;
  max_stress: number;
  description: string;
};
export type Benchmark = {
  name: string;
  analytical_deflection: number;
  analytical_bending_stress: number;
  rows: {
    elements: number;
    tip_deflection: number;
    error_pct: number;
    residual: number;
  }[];
  note: string;
};
export type Anatomy = {
  name: string;
  source_url: string;
  source_paper: string;
  dataset_doi: string;
  license: string;
  authors: string;
  triangles: number;
  plate_anchors: [number, number, number][];
  nerve_center: [number, number, number];
  nerve_radius_mm: number;
  registration: string;
  osteotomy: string;
  source_sha256: string;
};
export type CameraView =
  "perspective" | "front" | "left" | "top" | "plate" | "nerve";
export async function engine<T>(
  action: string,
  params: Parameters,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch("/api/engine", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, params }),
    signal,
  });
  const data = await response.json();
  if (!response.ok || data.error)
    throw new Error(data.error || "The analysis could not finish. Try again.");
  return data as T;
}
export function sameParameters(a: Parameters, b: Parameters) {
  return (Object.keys(defaults) as (keyof Parameters)[]).every(
    (key) => a[key] === b[key],
  );
}
export function download(
  filename: string,
  content: BlobPart,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function downloadCSV(cohort: Cohort) {
  const rows = [
    "scenario,bone_modulus_mpa,plate_thickness_mm,peak_stress_mpa,safety_factor,nerve_clearance_mm,status",
  ];
  cohort.samples.forEach((s, i) =>
    rows.push(
      `${i + 1},${s.params.modulus},${s.params.thickness},${s.peak_stress},${s.safety_factor},${s.clearance},${s.passed ? "PASS" : "FAIL"}`,
    ),
  );
  download("trabecular-stiffness-sweep.csv", rows.join("\n"), "text/csv");
}
