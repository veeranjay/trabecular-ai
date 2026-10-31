export type ImplicitParameters = {
  thickness: number; width: number; hole_radius: number; hole_shift: number;
  force: number; resolution: number; subdivisions: number; grid_shift: number; stabilization: number;
};
export const implicitDefaults: ImplicitParameters = { thickness: 1.5, width: 8, hole_radius: 1.2, hole_shift: 0,
  force: 5, resolution: 24, subdivisions: 2, grid_shift: .17, stabilization: .01 };
export type ImplicitMesh = { positions: number[]; indices: number[] };
export type ImplicitPreview = {
  input_hash: string; params: ImplicitParameters; mesh: ImplicitMesh;
  slice: { shape: [number, number]; bounds_mm: number[][]; values_mm: number[] };
  grid: { bounds_mm: number[][]; resolution: number[]; spacing_mm: number[]; active_centers_mm: number[][]; volume_fractions: number[] };
  analytic_volume_mm3: number; surface_chord_error_mm: number; scope: string;
};
export type ImplicitResult = {
  model: string; input_hash: string; params: ImplicitParameters; device: string; provider: string;
  mesh: ImplicitMesh; fields: { stress_mpa: number[]; displacement_mm: number[] };
  nodes: number; dofs: number; active_cells: number; quadrature_points: number;
  peak_stress_mpa: number; tip_deflection_mm: number; max_displacement_mm: number;
  relative_residual: number; force_balance_error: number; moment_balance_error: number;
  affine_energy_relative_error: number; gpu_cpu_sdf_max_error_mm: number; volume_error_pct: number;
  analytical_deflection_mm: number | null; deflection_error_pct: number | null;
  elapsed_seconds: number; numerically_resolved: boolean; qualified: boolean;
  scope: string; assumptions: string[]; unresolved_gates: string[];
  cloud_budget?: { reservation_usd: number; monthly_reserved_usd: number; ceiling_usd: number };
};
export type ImplicitRun = {
  id: string; state: "queued" | "running" | "completed" | "failed" | "cancelled";
  params: ImplicitParameters; provider: "local" | "modal-cpu" | "modal-gpu";
  stage: string; created_at: string; result?: ImplicitResult; error?: string; reused?: boolean;
};
