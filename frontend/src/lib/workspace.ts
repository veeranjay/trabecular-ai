export type Vec3 = [number, number, number];
export type Region = {
  id: string;
  kind: "support" | "load" | "keep_out";
  center: Vec3;
  radius: number;
  vector?: Vec3;
  points?: Vec3[] | null;
  source: string;
};
export type PlateParameters = {
  thickness: number;
  width: number;
  offset: number;
  load: number;
  modulus: number;
  min_clearance: number;
  min_sf: number;
  advancement: number;
  screw_length: number;
  screw_angle: number;
  plate_shift: number;
  load_case: "bilateral" | "left" | "right";
};
export type Case = {
  cad_version?: 3 | 4 | 5;
  id: string;
  name: string;
  anatomy_id: string;
  regions: Region[];
  units: string;
  reviewed: boolean;
  latest_revision_id: string;
  updated_at: string;
  import_id?: string;
  import_orientation?: Vec3;
  import_metadata?: {
    dimensions_mm: number[];
    triangles: number;
    geometry_quality: { watertight: boolean; positive_volume: boolean };
    missing_preparation: string[];
  };
};
export type Checks = {
  available?: boolean;
  min_clearance_mm: number | null;
  clearance_pass: boolean;
  min_hole_spacing_mm: number | null;
  hole_spacing_pass: boolean;
  min_bone_engagement_proxy_mm: number | null;
  engagement_pass: boolean;
  plate_volume_mm3: number | null;
  note: string;
};
export type Revision = {
  cad_version?: 3 | 4 | 5;
  id: string;
  case_id: string;
  label: string;
  parent_id: string | null;
  params: PlateParameters;
  regions: Region[];
  geometry_hash: string;
  geometry_checks: Checks;
  preparation_reviewed: boolean;
  created_at: string;
  import_orientation?: Vec3;
};
export type MeshPacket = {
  id: string;
  material: "bone" | "titanium";
  positions: number[];
  indices: number[];
};
export type Geometry = {
  geometry_hash: string;
  meshes: MeshPacket[];
  params: PlateParameters;
  checks: Checks;
  regions: Region[];
  anatomy: {
    id: string;
    name: string;
    license: string;
    source_url: string;
    source_paper: string;
    source_sha256: string;
    triangles: number;
    osteotomy: string;
    registration: string;
    bounds: number[][];
    geometry_quality: { watertight: boolean; positive_volume: boolean };
  };
};
export type JawResult = {
  model: string;
  geometry_hash: string;
  params: PlateParameters;
  device: string;
  nodes: number;
  tetrahedra: number;
  dofs: number;
  peak_titanium_stress_mpa: number;
  peak_bone_stress_mpa: number;
  max_displacement_mm: number;
  max_abs_bone_principal_strain: number;
  safety_factor: number;
  relative_residual: number;
  force_balance_error: number;
  moment_balance_error: number;
  iterations: number;
  solve_seconds: number;
  elapsed_seconds: number;
  max_bond_slip_mm: number;
  max_locking_slip_mm?: number;
  hardware_attachment?: string;
  numerically_resolved: boolean;
  qualified: boolean;
  status: string;
  assumptions: string[];
  unresolved_gates: string[];
  fields: Record<string, { stress_mpa: number[]; displacement_mm: number[] }>;
  geometry_checks: Checks;
  field_artifact?: string;
  stress_recovery?: string;
};
export type BenchmarkResult = {
  model: string;
  device: string;
  passed: boolean;
  independent_reference: {
    relative_displacement_difference: number;
    passed: boolean;
  };
  cpu_gpu: { relative_displacement_difference: number; passed: boolean };
  refinement: {
    resolution: number[];
    deflection_error_pct: number;
    relative_residual: number;
    force_balance_error: number;
    solve_seconds: number;
    qualified: boolean;
  }[];
  limitations: string[];
  thin_plate_check?: {
    passed: boolean;
    last_deflection_change_pct: number;
    series: {
      resolution: number[];
      degree: number;
      error_pct: number;
      thickness_layers: number;
    }[];
  };
};
export type StudyResult = {
  scenarios: {
    id?: string;
    case_id?: string;
    revision_id?: string;
    anatomy_id: string;
    load_case: string;
    modulus: number;
    state: string;
    error?: string;
    result?: JawResult;
  }[];
  total: number;
  distinct_anatomies: number;
  resolved: number;
  qualified: number;
  completed?: number;
  failed?: number;
  governing?: Record<string, { scenario_id: string; value: number }>;
  scope: string;
};
export type SearchCandidate = {
  id?: string;
  params: PlateParameters;
  state: string;
  checks?: Checks;
  quality?: string;
  volume_mm3?: number;
  error?: string;
  refinement_change?: Record<string, number>;
  result?: JawResult;
};
export type SearchResult = {
  candidates: SearchCandidate[];
  refinement?: SearchCandidate[];
  envelope?: SearchCandidate[];
  winner: null | SearchCandidate;
  state?: string;
  geometry_screen_scope?: string;
  reason: string;
  scope: string;
};
export type JobResult =
  JawResult | BenchmarkResult | StudyResult | SearchResult;
export type Job = {
  id: string;
  case_id: string;
  revision_id: string;
  action: "solve" | "study" | "optimize" | "benchmark3d";
  state: "queued" | "running" | "completed" | "cancelled" | "failed";
  stage: string;
  progress: number;
  error?: string;
  created_at: string;
  finished_at?: string;
  summary?: Partial<JawResult>;
  input: { geometry_hash: string; quality: string; params: PlateParameters };
  provider: string;
  reused?: boolean;
};
export type Capabilities = {
  deepgram: boolean;
  supabase: boolean;
  modal: boolean;
  auth_mode: string;
  storage_mode: string;
  cloud_enabled: boolean;
  cloud_execution_available: boolean;
  compute_device: string;
  cloud_budget_usd: number;
  local_gpu: string;
  model_qualified: boolean;
  note: string;
};
export type WorkspaceState = {
  cases: Case[];
  revisions: Revision[];
  jobs: Job[];
  capabilities: Capabilities;
};
let accessToken: string | null = null;
export class WorkspaceError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export function setAccessToken(token: string | null) {
  accessToken = token;
}
export async function importSTL(file: File, units: string): Promise<Case> {
  if (file.size > 20 * 1024 * 1024)
    throw new Error("Choose an STL up to 20 MB.");
  const form = new FormData();
  form.append("file", file);
  form.append("units", units);
  const response = await fetch("/api/workspace/imports", {
    method: "POST",
    body: form,
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  const data = await response.json();
  if (!response.ok)
    throw new WorkspaceError(
      typeof data.detail === "string" ? data.detail : "Import failed.",
      response.status,
    );
  return data;
}
export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const response = await fetch(`/api/workspace/${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });
  const data = await response.json();
  if (!response.ok)
    throw new WorkspaceError(
      typeof data.detail === "string"
        ? data.detail
        : "Check the entered values and try again.",
      response.status,
    );
  return data as T;
}
export async function exportCase(caseId: string, revisionId: string) {
  const response = await fetch(
    `/api/workspace/cases/${caseId}/revisions/${revisionId}/export`,
    { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} },
  );
  if (!response.ok)
    throw new Error((await response.json()).detail || "Export failed.");
  saveBlob("trabecular-case.zip", await response.blob());
}
export async function exportReport(caseId: string, revisionId: string) {
  const response = await fetch(
    `/api/workspace/cases/${caseId}/revisions/${revisionId}/report`,
    { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} },
  );
  if (!response.ok)
    throw new Error(
      (await response.json()).detail || "Report generation failed.",
    );
  saveBlob("trabecular-case.pdf", await response.blob());
}
export async function exportVolumeFields(jobId: string) {
  const response = await fetch(`/api/workspace/jobs/${jobId}/fields`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  if (!response.ok)
    throw new Error(
      (await response.json()).detail || "Volume field download failed.",
    );
  saveBlob("trabecular-fields.npz", await response.blob());
}
export async function exportStudyCSV(jobId: string) {
  const response = await fetch(`/api/workspace/jobs/${jobId}/study.csv`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  if (!response.ok)
    throw new Error((await response.json()).detail || "Study export failed.");
  saveBlob("trabecular-study.csv", await response.blob());
}
export function saveBlob(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
export function saveJSON(name: string, data: unknown) {
  saveBlob(
    name,
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
}
export function parametersEqual(a: PlateParameters, b: PlateParameters) {
  return Object.keys(a).every(
    (key) =>
      a[key as keyof PlateParameters] === b[key as keyof PlateParameters],
  );
}
export function isJaw(result: JobResult | null): result is JawResult {
  return !!result && "fields" in result;
}
