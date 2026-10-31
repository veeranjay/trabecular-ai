"use client";
import {
  ArrowUpRight,
  Check,
  CircleAlert,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
import { Parameters, Run } from "@/lib/engine";
export default function TelemetryPanel({
  run,
  stale,
  params,
  onFocus,
}: {
  run: Run | null;
  stale: boolean;
  params: Parameters;
  onFocus: (view: "plate" | "nerve") => void;
}) {
  return (
    <aside className={`results-panel glass ${stale ? "is-stale" : ""}`}>
      <div className="panel-heading">
        <span className="eyebrow">VERIFICATION</span>
        <span
          className={`tiny-tag ${run ? (stale ? "amber" : run.passed ? "green" : "red") : ""}`}
        >
          {run
            ? stale
              ? "Out of date"
              : run.passed
                ? "Constraints met"
                : "Review needed"
            : "Not run"}
        </span>
      </div>
      <h2>Design performance</h2>
      <p className="muted small">
        {run
          ? stale
            ? "Inputs changed. These are the previous results; run analysis again."
            : "Results from the plate beam model."
          : "Run an analysis to evaluate this design."}
      </p>
      <div className="metric">
        <div className="metric-label">
          <span>Peak equivalent stress</span>
          <button
            title="Focus on plate"
            aria-label="Focus on plate"
            onClick={() => onFocus("plate")}
          >
            <ArrowUpRight size={15} />
          </button>
        </div>
        <div
          className={`metric-value ${run && !run.stress_pass ? "red-text" : ""}`}
        >
          {run ? run.peak_stress.toFixed(1) : "—"} <small>MPa</small>
        </div>
        <div className="metric-meter">
          <i
            style={{
              width: run
                ? `${Math.min(100, (run.peak_stress / 1000) * 100)}%`
                : "0%",
              background: run?.stress_pass ? "var(--accent)" : "var(--red)",
            }}
          />
          <b
            style={{
              left: `${Math.min(98, (880 / params.min_sf / 1000) * 100)}%`,
            }}
          />
        </div>
        <span className="metric-caption">
          Allowable stress{" "}
          <strong>{(880 / params.min_sf).toFixed(1)} MPa</strong>
        </span>
      </div>
      <div className="metric">
        <div className="metric-label">
          <span>Safety factor</span>
          <ShieldCheck size={15} />
        </div>
        <div className="metric-value">
          {run ? run.safety_factor.toFixed(2) : "—"}
          <small>×</small>
        </div>
        <span className="metric-caption">
          Design policy <strong>≥ {params.min_sf.toFixed(1)}×</strong>
        </span>
      </div>
      <div className="metric">
        <div className="metric-label">
          <span>Nerve clearance</span>
          <button
            title="Focus on nerve zone"
            aria-label="Focus on nerve zone"
            onClick={() => onFocus("nerve")}
          >
            <ArrowUpRight size={15} />
          </button>
        </div>
        <div
          className={`metric-value ${run && !run.nerve_pass ? "amber-text" : ""}`}
        >
          {run ? run.clearance.toFixed(2) : "—"} <small>mm</small>
        </div>
        <span className="metric-caption">
          Required clearance{" "}
          <strong>≥ {params.min_clearance.toFixed(1)} mm</strong>
        </span>
      </div>
      <div className="checks">
        <span className="eyebrow">DESIGN CHECKS</span>
        <div>
          {run?.stress_pass ? <Check size={14} /> : <CircleAlert size={14} />}
          <span>Mechanical constraint</span>
          <b
            className={run ? (run.stress_pass ? "green-text" : "red-text") : ""}
          >
            {run ? (run.stress_pass ? "Met" : "Below policy") : "Pending"}
          </b>
        </div>
        <div>
          {run?.nerve_pass ? <Check size={14} /> : <CircleAlert size={14} />}
          <span>Geometric clearance</span>
          <b
            className={
              run ? (run.nerve_pass ? "green-text" : "amber-text") : ""
            }
          >
            {run ? (run.nerve_pass ? "Met" : "Too close") : "Pending"}
          </b>
        </div>
      </div>
      <details className="solver-details">
        <summary>
          <ScanLine size={14} /> Analysis details
        </summary>
        <dl>
          <div>
            <dt>Method</dt>
            <dd>CPU beam FE</dd>
          </div>
          <div>
            <dt>Plate centerline</dt>
            <dd>{run ? `${run.plate_length_mm?.toFixed(2)} mm` : "—"}</dd>
          </div>
          <div>
            <dt>Elements / DOFs</dt>
            <dd>36 / {run?.dofs ?? "—"}</dd>
          </div>
          <div>
            <dt>Relative residual</dt>
            <dd>{run ? run.residual.toExponential(2) : "—"}</dd>
          </div>
          <div>
            <dt>Iterations</dt>
            <dd>{run?.iterations ?? "—"}</dd>
          </div>
          <div>
            <dt>Compute time</dt>
            <dd>{run ? `${run.elapsed_ms.toFixed(1)} ms` : "—"}</dd>
          </div>
          <div>
            <dt>Max displacement</dt>
            <dd>{run ? `${run.max_displacement.toFixed(3)} mm` : "—"}</dd>
          </div>
        </dl>
        <p>
          Plate beam with four elastic screw supports. Whole-jaw stress,
          contact, fatigue, and hole concentrations are excluded.
        </p>
      </details>
      <div className="model-note">
        Engineering exploration
        <br />
        <span>
          Reference anatomy and reduced plate analysis. No clinical or
          regulatory sign-off.
        </span>
      </div>
    </aside>
  );
}
