"use client";
import { useEffect, useRef } from "react";
import { ShieldCheck, X } from "lucide-react";
import { JawResult, Revision } from "@/lib/workspace";

export default function WorkspaceEvidence({ revision, result, stale, dirty, close }: {
  revision?: Revision; result: JawResult | null; stale: boolean; dirty: boolean; close: () => void;
}) {
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => previous?.focus();
  }, []);
  return <div className="ws-modal-backdrop" onClick={close}>
    <section ref={panel} className="ws-modal ws-evidence-drawer glass" role="dialog" aria-modal="true" aria-labelledby="evidence-title" onClick={e => e.stopPropagation()}
      onKeyDown={e => {
        if (e.key === "Escape") close();
        if (e.key === "Tab") { e.preventDefault(); panel.current?.querySelector<HTMLButtonElement>("button")?.focus(); }
      }}>
      <div><ShieldCheck size={20} /><button className="ws-icon" aria-label="Close evidence" onClick={close}><X size={18} /></button></div>
      <h2 id="evidence-title">Behind this result.</h2>
      <p className="ws-description">The calculation, its assumptions, and what still needs checking.</p>
      <dl className="ws-evidence">
        <dt>Revision</dt><dd>{revision?.label || "No revision"}</dd>
        <dt>Method</dt><dd>{result?.model || "Tetrahedral reference · not run"}</dd>
        <dt>Current inputs</dt><dd>{dirty || stale ? "Changed since saved evidence" : "Saved revision"}</dd>
        <dt>Numerical solution</dt><dd>{result ? result.numerically_resolved ? "Equilibrium resolved" : "Unresolved" : "Not calculated"}</dd>
        <dt>Model qualification</dt><dd>{result?.qualified ? "See declared protocol" : "Not established"}</dd>
        <dt>Clinical validation</dt><dd>Not established</dd>
      </dl>
      {result && <>
        <h3>Numerical evidence</h3>
        <dl className="ws-evidence"><dt>Relative residual</dt><dd>{result.relative_residual.toExponential(2)}</dd><dt>Force imbalance</dt><dd>{(result.force_balance_error * 100).toPrecision(3)}%</dd><dt>Calculation time</dt><dd>{result.elapsed_seconds.toFixed(1)} s</dd></dl>
      </>}
      <h3>Model scope</h3>
      {(result?.assumptions || ["Static, small-strain engineering exploration on prepared reference anatomy.", "Developer registrations and a synthetic cortical proxy; no clinical nerve inference.", "Tetrahedral analysis is the reference/checker. The immersed route is developed separately in Implicit Lab."]).map(text => <p className="ws-small-text" key={text}>{text}</p>)}
      {!!result?.unresolved_gates.length && <><h3>Open checks</h3>{result.unresolved_gates.map(text => <p className="ws-small-text" key={text}>{text}</p>)}</>}
      {result && result.peak_titanium_stress_mpa > 880 && <p className="ws-note-text">The assumed yield threshold is exceeded. Linear elasticity does not predict post-yield behavior.</p>}
    </section>
  </div>;
}
