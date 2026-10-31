"use client";
import { useEffect, useRef } from "react";
import { Download, FileText, Printer, X } from "lucide-react";
import { Anatomy, Benchmark, Cohort, download, Run } from "@/lib/engine";
export default function Vv40Modal({
  run,
  anatomy,
  cohort,
  benchmark,
  onClose,
  onBenchmark,
  busy,
}: {
  run: Run;
  anatomy: Anatomy;
  cohort: Cohort | null;
  benchmark: Benchmark | null;
  onClose: () => void;
  onBenchmark: () => void;
  busy: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  const packageData = () => ({
    version: 1,
    exported_at: new Date().toISOString(),
    run,
    anatomy,
    cohort,
    benchmark,
    limitations: run.assumptions,
  });
  return (
    <dialog
      ref={dialog}
      className="report-dialog glass"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
      aria-labelledby="report-title"
    >
      <div className="report-toolbar">
        <div>
          <FileText size={18} />
          <span>Analysis package</span>
        </div>
        <button
          className="icon-button"
          aria-label="Close report"
          onClick={onClose}
        >
          <X size={19} />
        </button>
      </div>
      <article className="report-content">
        <span className="eyebrow">TRABECULAR / ENGINEERING EXPLORATION</span>
        <h1 id="report-title">Plate analysis report</h1>
        <p className="report-subtitle">
          Run {run.id.slice(0, 8)} · {new Date(run.created_at).toLocaleString()}
          <br />
          Model {run.model} · {run.method}
        </p>
        <section>
          <h2>01 / Design & loading</h2>
          <div className="report-grid">
            {[
              ["Thickness", `${run.params.thickness.toFixed(2)} mm`],
              ["Bridge width", `${run.params.width.toFixed(1)} mm`],
              ["Screw shift", `${run.params.offset.toFixed(1)} mm`],
              ["Bilateral load", `${run.params.load} N`],
              ["Bone modulus", `${run.params.modulus} MPa`],
              ["Geometry", anatomy.name],
            ].map(([name, value]) => (
              <div key={name}>
                <span>{name}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2>02 / Computed results</h2>
          <div className="report-grid">
            {[
              ["Peak equivalent stress", `${run.peak_stress.toFixed(2)} MPa`],
              [
                "Safety factor",
                `${run.safety_factor.toFixed(3)}× / required ${run.params.min_sf}×`,
              ],
              [
                "Nerve clearance",
                `${run.clearance.toFixed(3)} mm / required ${run.params.min_clearance} mm`,
              ],
              [
                "Constraint result",
                run.passed ? "Both constraints met" : "Review required",
              ],
              ["Relative residual", run.residual.toExponential(3)],
              ["Compute time", `${run.elapsed_ms.toFixed(2)} ms`],
            ].map(([name, value]) => (
              <div key={name}>
                <span>{name}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>
        <section>
          <div className="panel-heading">
            <h2>03 / Calculation verification</h2>
            {!benchmark && (
              <button
                className="secondary-button"
                disabled={busy}
                onClick={onBenchmark}
              >
                {busy ? "Computing…" : "Run beam benchmark"}
              </button>
            )}
          </div>
          {benchmark ? (
            <>
              <p>
                {benchmark.name}: analytical tip deflection{" "}
                {benchmark.analytical_deflection.toFixed(8)} mm.
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Elements</th>
                    <th>Computed deflection</th>
                    <th>Error</th>
                    <th>Residual</th>
                  </tr>
                </thead>
                <tbody>
                  {benchmark.rows.map((row) => (
                    <tr key={row.elements}>
                      <td>{row.elements}</td>
                      <td>{row.tip_deflection.toFixed(8)} mm</td>
                      <td>{row.error_pct.toExponential(2)}%</td>
                      <td>{row.residual.toExponential(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p>{benchmark.note}</p>
            </>
          ) : (
            <p>
              No benchmark has been run in this session. No convergence or
              accuracy evidence is claimed.
            </p>
          )}
        </section>
        {cohort && (
          <section>
            <h2>04 / Stiffness sweep</h2>
            <p>
              {cohort.passed} of {cohort.total} scenarios meet their recorded
              constraints. Maximum stress {cohort.max_stress.toFixed(2)} MPa;
              minimum safety factor {cohort.min_sf.toFixed(3)}×.
            </p>
            <p>{cohort.description}</p>
          </section>
        )}
        <section>
          <h2>Model scope & limitations</h2>
          <ul>
            {run.assumptions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>
            Supports exploratory engineering comparisons. This package does not
            establish ASME V&amp;V 40 credibility, device safety, or regulatory
            compliance.
          </p>
        </section>
        <section className="report-source">
          <h2>Anatomy provenance</h2>
          <p>
            {anatomy.authors} · {anatomy.license}
            <br />
            <a href={anatomy.source_url} target="_blank" rel="noreferrer">
              Visible Human 3D Models
            </a>{" "}
            ·{" "}
            <a href={anatomy.source_paper} target="_blank" rel="noreferrer">
              Andreassen et al. (2023)
            </a>
            <br />
            {anatomy.dataset_doi}
            <br />
            Source SHA-256: {anatomy.source_sha256}
          </p>
        </section>
      </article>
      <div className="report-actions">
        <span>Includes inputs, method, results, and limitations.</span>
        <button
          className="secondary-button"
          onClick={() =>
            download(
              `trabecular-analysis-${run.id.slice(0, 8)}.json`,
              JSON.stringify(packageData(), null, 2),
            )
          }
        >
          <Download size={15} />
          Download JSON
        </button>
        <button className="primary-button" onClick={() => window.print()}>
          <Printer size={15} />
          Print / Save PDF
        </button>
      </div>
    </dialog>
  );
}
