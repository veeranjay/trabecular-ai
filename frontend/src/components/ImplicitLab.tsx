"use client";
import { useEffect, useState } from "react";
import { ArrowDownToLine, ArrowRight, Grid3X3, LoaderCircle, Pin, Play, ScanLine, X } from "lucide-react";
import { api, saveJSON } from "@/lib/workspace";
import { implicitDefaults, ImplicitParameters, ImplicitPreview, ImplicitResult, ImplicitRun } from "@/lib/implicit";
import ImplicitViewport from "./ImplicitViewport";

export default function ImplicitLab({ presentation }: { presentation: boolean }) {
  const [params, setParams] = useState<ImplicitParameters>(implicitDefaults);
  const [preview, setPreview] = useState<ImplicitPreview | null>(null);
  const [run, setRun] = useState<ImplicitRun | null>(null);
  const [history, setHistory] = useState<ImplicitRun[]>([]);
  const [baseline, setBaseline] = useState<ImplicitResult | null>(null);
  const [mode, setMode] = useState<"solid" | "distance" | "stress" | "displacement">("distance");
  const [showGrid, setShowGrid] = useState(true);
  const [amplification, setAmplification] = useState(10);
  const provider: ImplicitRun["provider"] = "local";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [evidence, setEvidence] = useState(false);
  const active = !!run && ["queued", "running"].includes(run.state);
  const result = run?.state === "completed" ? run.result || null : null;
  const matching = !!result && result.input_hash === preview?.input_hash;
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => api<ImplicitPreview>("implicit/preview", "POST", params, controller.signal).then(setPreview).catch(e => { if (!controller.signal.aborted) setError(e.message); }), 180);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [params]);
  useEffect(() => { api<{ runs: ImplicitRun[] }>("implicit/runs").then(data => setHistory(data.runs)).catch(e => setError(e.message)); }, []);
  useEffect(() => {
    if (!run || !active) return;
    let stopped = false;
    const timer = setInterval(() => api<ImplicitRun>(`implicit/runs/${run.id}`).then(next => {
      if (stopped) return;
      setRun(next);
      if (next.state === "completed" || next.state === "failed" || next.state === "cancelled") api<{ runs: ImplicitRun[] }>("implicit/runs").then(data => { if (!stopped) setHistory(data.runs); }).catch(() => {});
    }).catch(e => { if (!stopped) setError(e.message); }), 1200);
    return () => { stopped = true; clearInterval(timer); };
  }, [run?.id, active]); // eslint-disable-line react-hooks/exhaustive-deps
  async function start() {
    setBusy(true); setError("");
    try { setRun(await api<ImplicitRun>("implicit/runs", "POST", { params, provider })); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not queue the calculation."); }
    finally { setBusy(false); }
  }
  async function openHistory(id: string) {
    try { const next = await api<ImplicitRun>(`implicit/runs/${id}`); setParams(next.params); setRun(next); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not open the experiment."); }
  }
  return <main className={`implicit-lab ${presentation ? "presenting" : ""}`}>
    <section className="implicit-stage">
      <div className="implicit-title"><span className="ws-eyebrow">Implicit Lab</span><h1>Shapes change.<br /><span>Physics follows.</span></h1><p>Inspect the geometry. Reveal the grid. Calculate the response.</p></div>
      <ImplicitViewport preview={preview} result={matching ? result : null} baseline={baseline} mode={!matching && ["stress", "displacement"].includes(mode) ? "solid" : mode} showGrid={showGrid} amplification={amplification} />
      <div className="implicit-view-controls glass">
        {([['solid','Geometry'],['distance','Distance field'],['stress','Stress'],['displacement','Deformation']] as const).map(([key, label]) => <button key={key} aria-pressed={mode === key} disabled={!matching && (key === "stress" || key === "displacement")} onClick={() => setMode(key)}>{label}</button>)}
        <button title="Show background integration cells" aria-label="Show background integration cells" aria-pressed={showGrid} onClick={() => setShowGrid(!showGrid)}><Grid3X3 size={16} /></button>
      </div>
      <div className="implicit-caption"><ScanLine size={15} /><span>Thin-plate method specimen</span><button onClick={() => setEvidence(!evidence)}>Model & evidence <ArrowRight size={13} /></button></div>
      {mode === "distance" && <div className="implicit-distance-key"><span>Inside</span><i /><span>Outside</span><small>Sampled implicit field · mm</small></div>}
      {matching && mode === "stress" && <div className="implicit-distance-key"><span>0</span><i className="stress" /><span>{result!.peak_stress_mpa.toFixed(1)} MPa</span><small>Quadrature maximum; interpolated surface display</small></div>}
      {matching && mode === "displacement" && <label className="implicit-amplification glass">Deformation ×{amplification}<input aria-label="Deformation amplification" type="range" min={0} max={50} value={amplification} onChange={e => setAmplification(Number(e.target.value))} /></label>}
      {baseline && <button className="implicit-baseline glass" onClick={() => setBaseline(null)}><Pin size={13} />Baseline overlay · {baseline.params.thickness} mm<X size={12} /></button>}
    </section>
    {!presentation && <aside className="implicit-inspector">
      <div className="implicit-inspector-heading"><h2>Make a change.</h2><p>One geometry definition. A real immersed calculation.</p></div>
      <div className="implicit-parameters">
        {([['thickness','Thickness','mm',.8,3.5,.1],['width','Width','mm',5,12,.25],['hole_radius','Hole radius','mm',0,1.8,.1],['force','End load','N',.1,50,.5]] as const).map(([key,label,unit,min,max,step]) => <label key={key} className="implicit-parameter"><span>{label}<strong>{params[key].toFixed(key === "force" ? 1 : 2)} <small>{unit}</small></strong></span><input aria-label={label} type="range" min={min} max={max} step={step} value={params[key]} onChange={e => setParams({ ...params, [key]: Number(e.target.value) })} /></label>)}
      </div>
      <div className="implicit-selects"><label>Grid resolution<select value={params.resolution} onChange={e => setParams({ ...params, resolution: Number(e.target.value) })}><option value={12}>12 · method check</option><option value={16}>16 · coarse</option><option value={24}>24 · preview</option><option value={32}>32 · finer</option></select></label><label>Compute<select value={provider} disabled aria-label="Local compute selected"><option value="local">Native GPU</option></select></label></div>
      <button className="ws-primary implicit-run-button" disabled={busy || active || !preview} onClick={start}>{active || busy ? <LoaderCircle size={16} className="spin" /> : <Play size={15} fill="currentColor" />}{active ? run?.stage || "Calculating" : "Calculate response"}</button>
      {active && <button className="ws-button full" onClick={async () => { try { setRun(await api<ImplicitRun>(`implicit/runs/${run!.id}/cancel`, "POST")); } catch (e) { setError(e instanceof Error ? e.message : "Cancellation failed."); } }}>Cancel calculation</button>}
      {error || run?.error ? <p className="ws-error" role="alert">{error || run?.error}</p> : null}
      {matching && <div className="implicit-results"><div><span>Tip displacement</span><strong>{result!.tip_deflection_mm.toFixed(4)}<small> mm</small></strong>{baseline && <small>Baseline {baseline.tip_deflection_mm.toFixed(4)} mm</small>}</div><div className="implicit-result-pair"><div><span>Peak stress</span><strong>{result!.peak_stress_mpa.toFixed(1)}<small> MPa</small></strong></div><div><span>Calculation</span><strong>{result!.elapsed_seconds.toFixed(1)}<small> s</small></strong></div></div><button className="ws-button full" onClick={() => setBaseline(result)}><Pin size={14} />Pin as baseline</button><button className="ws-button full" onClick={() => saveJSON(`trabecular-implicit-${run!.id}.json`, run)}><ArrowDownToLine size={14} />Export experiment</button></div>}
      {result && !matching && <p className="ws-small-text">Inputs changed. Calculate to compare this design.</p>}
      <details><summary>Method settings</summary><label className="ws-select-label">Specimen<select value={params.hole_radius === 0 ? "solid" : "perforated"} onChange={e => setParams({ ...params, hole_radius: e.target.value === "solid" ? 0 : 1.2 })}><option value="perforated">Four-hole plate</option><option value="solid">Solid analytical benchmark</option></select></label><label className="ws-select-label">Cut integration<select value={params.subdivisions} onChange={e => setParams({ ...params, subdivisions: Number(e.target.value) })}><option value={1}>3³ Gauss points / cut cell</option><option value={2}>2³ subcells × 3³ Gauss points</option><option value={3}>3³ subcells × 3³ Gauss points</option></select></label><p className="ws-small-text">Runs use local compute. Modal is disabled pending payment verification; no automatic cloud fallback.</p></details>
      {!!history.length && <details><summary>Saved experiments ({history.length})</summary>{history.slice(0, 12).map(item => <button key={item.id} className="implicit-history" onClick={() => openHistory(item.id)}><span>{item.params.thickness.toFixed(1)} mm · {item.params.resolution} cells</span><span>{item.state}</span></button>)}</details>}
    </aside>}
    {evidence && <section className="implicit-evidence glass" role="dialog" aria-label="Implicit method evidence"><button className="ws-icon" aria-label="Close implicit evidence" onClick={() => setEvidence(false)}><X size={17} /></button><h2>Geometry is only the beginning.</h2><p className="ws-description">SDF-cut integration on a quadratic background grid. No tetrahedral meshing or exterior material stiffness.</p>{matching && <dl className="ws-evidence"><dt>Device</dt><dd>{result!.device}</dd><dt>Residual</dt><dd>{result!.relative_residual.toExponential(2)}</dd><dt>Force imbalance</dt><dd>{(result!.force_balance_error * 100).toPrecision(3)}%</dd><dt>Affine energy error</dt><dd>{result!.affine_energy_relative_error.toExponential(2)}</dd><dt>Geometry volume error</dt><dd>{result!.volume_error_pct.toFixed(3)}%</dd><dt>DOFs</dt><dd>{result!.dofs.toLocaleString()}</dd>{result!.deflection_error_pct != null && <><dt>Analytical deflection error</dt><dd>{result!.deflection_error_pct.toFixed(3)}%</dd></>}</dl>}<p className="ws-small-text">Controlled specimen, not a jaw or clinical prediction. Full resolution, integration, stabilization, independent comparison and physical applicability checks remain separate.</p><p className="ws-small-text">Changing thickness or holes changes actual geometry and integration. The distance slice is a CPU geometry preview; compute devices are identified on calculated results.</p></section>}
  </main>;
}
