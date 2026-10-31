"use client";
import { useState } from "react";
import { api, saveJSON } from "@/lib/workspace";

type Audit = {
  passed: boolean;
  scope: string;
  source_job_id: string;
  field_sha256: string;
  checks: Record<string, boolean>;
  metrics: Record<string, number>;
};

export default function IndependentCheck({
  jobId,
  revisionLabel,
}: {
  jobId: string;
  revisionLabel: string;
}) {
  const [report, setReport] = useState<Audit | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  async function check() {
    setChecking(true);
    setError("");
    try {
      setReport(await api<Audit>(`jobs/${jobId}/verification`, "POST"));
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "The saved calculation could not be checked.",
      );
    } finally {
      setChecking(false);
    }
  }
  return (
    <details>
      <summary>Independent calculation check</summary>
      <p className="ws-small-text">
        Rebuilds forces, stresses and energy from this saved run with a separate
        calculation. Draft changes are excluded. Mesh refinement and attachment
        stability require separate checks.
      </p>
      <button className="ws-button full" disabled={checking} onClick={check}>
        {checking ? "Checking saved calculation…" : "Verify saved calculation"}
      </button>
      {error && (
        <p role="alert" className="ws-note-text">
          {error}
        </p>
      )}
      {report && (
        <>
          <p
            className={report.passed ? "ws-small-text" : "ws-note-text"}
            role="status"
          >
            {revisionLabel}:{" "}
            {report.passed
              ? "saved calculation checks passed."
              : "saved calculation checks failed."}
          </p>
          <dl className="ws-evidence">
            {[
              ["Free-node force error", "free_force_relative_residual"],
              ["Force balance", "force_balance_error"],
              ["Moment balance", "moment_balance_error"],
              ["Energy / work", "energy_work_relative_error"],
              ["Stress agreement", "stress_relative_difference"],
            ].map(([label, key]) => (
              <div style={{ display: "contents" }} key={key}>
                <dt>{label}</dt>
                <dd>
                  {report.checks[key] ? "Pass" : "Fail"} ·{" "}
                  {report.metrics[key].toExponential(2)}
                </dd>
              </div>
            ))}
          </dl>
          <p className="ws-small-text">{report.scope}</p>
          <button
            className="ws-button full"
            onClick={() =>
              saveJSON(`trabecular-calculation-check-${jobId}.json`, report)
            }
          >
            Download calculation check
          </button>
        </>
      )}
    </details>
  );
}
