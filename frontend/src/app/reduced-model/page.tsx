"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import NumericInput from "@/components/NumericInput";
import ModelInfo from "@/components/ModelInfo";
import {
  Activity,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Box,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Crosshair,
  History,
  Layers3,
  LoaderCircle,
  Plus,
  RotateCcw,
  Scan,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import Viewport3D, { ViewportHandle } from "@/components/Viewport3D";
import TelemetryPanel from "@/components/TelemetryPanel";
import VoiceHud from "@/components/VoiceHud";
import CohortTab from "@/components/CohortTab";
import Vv40Modal from "@/components/Vv40Modal";
import {
  Anatomy,
  Benchmark,
  CameraView,
  Cohort,
  defaults,
  download,
  engine,
  Optimization,
  Parameters,
  Run,
  sameParameters,
} from "@/lib/engine";

type Tab = "design" | "cohort" | "history";
type Setting = {
  key: keyof Parameters;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
};
const designSettings: Setting[] = [
  {
    key: "thickness",
    label: "Strut thickness",
    unit: "mm",
    min: 1,
    max: 3.5,
    step: 0.1,
  },
  {
    key: "width",
    label: "Bridge width",
    unit: "mm",
    min: 2,
    max: 6,
    step: 0.1,
  },
  {
    key: "offset",
    label: "Screw 3 superior shift",
    unit: "mm",
    min: 0,
    max: 10,
    step: 0.5,
  },
];
const loadSettings: Setting[] = [
  {
    key: "load",
    label: "Bilateral bite load",
    unit: "N",
    min: 100,
    max: 1000,
    step: 10,
  },
  {
    key: "modulus",
    label: "Bone support modulus",
    unit: "MPa",
    min: 450,
    max: 1900,
    step: 50,
  },
];
function ParameterControl({
  setting,
  params,
  onChange,
  disabled,
}: {
  setting: Setting;
  params: Parameters;
  onChange: (key: keyof Parameters, value: number) => void;
  disabled: boolean;
}) {
  const value = params[setting.key];
  return (
    <div className="parameter">
      <label htmlFor={setting.key}>{setting.label}</label>
      <div className="parameter-row">
        <input
          aria-label={setting.label}
          type="range"
          id={setting.key}
          min={setting.min}
          max={setting.max}
          step={setting.step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(setting.key, Number(e.target.value))}
          style={
            {
              "--fill": `${((value - setting.min) / (setting.max - setting.min)) * 100}%`,
            } as React.CSSProperties
          }
        />
        <span>
          <NumericInput
            label={`${setting.label} value`}
            min={setting.min}
            max={setting.max}
            step={setting.step}
            value={value}
            disabled={disabled}
            onChange={(next) => onChange(setting.key, next)}
          />
          <small>{setting.unit}</small>
        </span>
      </div>
    </div>
  );
}
export default function Home() {
  const [tab, setTab] = useState<Tab>("design");
  const [params, setParams] = useState<Parameters>(defaults);
  const [anatomy, setAnatomy] = useState<Anatomy | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [optimization, setOptimization] = useState<Optimization | null>(null);
  const [benchmark, setBenchmark] = useState<Benchmark | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [report, setReport] = useState(false);
  const [info, setInfo] = useState(false);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);
  const [view, setView] = useState<{ name: CameraView; tick: number }>({
    name: "perspective",
    tick: 0,
  });
  const [heatmap, setHeatmap] = useState(false);
  const [bone, setBone] = useState(true);
  const [hardware, setHardware] = useState(true);
  const [nerve, setNerve] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const viewport = useRef<ViewportHandle>(null);
  const inFlight = useRef(false);
  const mounted = useRef(true);
  const current = runs.find((r) => r.id === activeId) ?? null;
  const stale = current ? !sameParameters(params, current.params) : false;
  // Cohort changes only the sampled modulus, so compare its retained design using the current modulus.
  const sweepStale = cohort
    ? !sameParameters(params, {
        ...cohort.samples[0].params,
        modulus: params.modulus,
      })
    : false;
  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    fetch("/assets/anatomy.json", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("Anatomy metadata is unavailable.");
        return r.json();
      })
      .then((data) => setAnatomy(data))
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    const timer = setTimeout(() => {
      try {
        const raw = localStorage.getItem("trabecular-workspace-v2");
        if (raw) {
          const data = JSON.parse(raw);
          const valid =
            data.params &&
            Object.keys(defaults).every(
              (k) =>
                typeof data.params[k] === "number" &&
                Number.isFinite(data.params[k]),
            );
          if (valid) setParams({ ...defaults, ...data.params });
          if (Array.isArray(data.runs)) {
            const history = data.runs.filter(
              (r: Run) =>
                r.model === "plate-beam-v1" &&
                typeof r.plate_length_mm === "number" &&
                r.params &&
                Array.isArray(r.stress) &&
                typeof r.id === "string",
            );
            setRuns(history.slice(0, 12));
            setActiveId(data.activeId ?? null);
          }
        }
      } catch {
        setNotice(
          "Saved workspace could not be restored. Starting a clean session.",
        );
      }
      setReady(true);
    }, 0);
    return () => {
      mounted.current = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          "trabecular-workspace-v2",
          JSON.stringify({ params, runs, activeId }),
        );
        setSaved(true);
      } catch {
        setSaved(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [ready, params, runs, activeId]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 6000);
    return () => clearTimeout(timer);
  }, [notice]);
  const focus = useCallback(
    (name: CameraView) => setView((v) => ({ name, tick: v.tick + 1 })),
    [],
  );
  const change = (key: keyof Parameters, value: number) => {
    setParams((p) => ({ ...p, [key]: value }));
    setSaved(false);
    setError("");
  };
  const addRun = (run: Run) => {
    setRuns((previous) =>
      [run, ...previous.filter((r) => r.id !== run.id)].slice(0, 12),
    );
    setActiveId(run.id);
  };
  const perform = async <T,>(name: string, action: string): Promise<T> => {
    if (inFlight.current) throw new Error("An analysis is already running.");
    inFlight.current = true;
    setBusy(name);
    setError("");
    try {
      return await engine<T>(action, params);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Analysis failed.";
      if (mounted.current) setError(message);
      throw e;
    } finally {
      inFlight.current = false;
      if (mounted.current) setBusy(null);
    }
  };
  const solve = async () => {
    const run = await perform<Run>("Analyzing plate…", "solve");
    addRun(run);
    setHeatmap(true);
    setNotice("Analysis complete. Results reflect the current design.");
    return run;
  };
  const optimize = async () => {
    const result = await perform<Optimization>(
      "Searching plate designs…",
      "optimize",
    );
    setOptimization(result);
    if (result.winner) {
      setParams(result.winner.params);
      addRun(result.winner);
      setHeatmap(true);
      setNotice(
        `Evaluated ${result.evaluated} designs. Applied the lowest-area design meeting both constraints.`,
      );
      focus("plate");
    } else setError(result.reason || "No feasible design found.");
    return result;
  };
  const sweep = async () => {
    const result = await perform<Cohort>("Computing 10 scenarios…", "cohort");
    setCohort(result);
    setTab("cohort");
    return result;
  };
  const runBenchmark = async () => {
    const result = await perform<Benchmark>(
      "Checking beam assembly…",
      "benchmark",
    );
    setBenchmark(result);
    return result;
  };
  const safe = (action: () => Promise<unknown>) => {
    void action().catch(() => {});
  };
  const selectRun = (run: Run) => {
    setParams(run.params);
    setActiveId(run.id);
    setTab("design");
    setHeatmap(true);
    setSaved(false);
  };
  const onCommand = async (text: string): Promise<string> => {
    const command = text.toLowerCase();
    if (/sweep|cohort|envelope/.test(command)) {
      const result = await sweep();
      return `${result.passed} of ${result.total} stiffness scenarios meet both constraints. Worst-case plate stress is ${result.max_stress.toFixed(1)} MPa.`;
    }
    if (/optimi|remediat|fix plate/.test(command)) {
      const result = await optimize();
      return result.winner
        ? `Selected a ${result.winner.params.thickness.toFixed(1)} mm plate. Safety factor ${result.winner.safety_factor.toFixed(2)}, geometric clearance ${result.winner.clearance.toFixed(2)} mm.`
        : result.reason || "No feasible design found.";
    }
    if (/run analysis|analy[sz]e|solve|verif/.test(command)) {
      const result = await solve();
      return `Computed peak stress ${result.peak_stress.toFixed(1)} MPa and safety factor ${result.safety_factor.toFixed(2)}. ${result.passed ? "Both constraints are met." : "The design needs review."}`;
    }
    if (/nerve|clearance/.test(command)) {
      focus("nerve");
      return current && !stale
        ? `Geometric clearance is ${current.clearance.toFixed(2)} mm. The required clearance is ${params.min_clearance} mm.`
        : "Focused the registered nerve zone. Run analysis to calculate clearance.";
    }
    if (/inspect|results|stress|status/.test(command)) {
      focus("plate");
      return current && !stale
        ? `Peak plate stress ${current.peak_stress.toFixed(1)} MPa; safety factor ${current.safety_factor.toFixed(2)}; nerve clearance ${current.clearance.toFixed(2)} mm.`
        : "No current analysis. Use Run analysis to calculate this design.";
    }
    if (/reset camera|overview/.test(command)) {
      focus("perspective");
      return "Camera reset to the anatomy overview.";
    }
    if (/benchmark/.test(command)) {
      const result = await runBenchmark();
      return `Beam assembly verified against analytical tip deflection ${result.analytical_deflection.toFixed(6)} mm. This does not validate whole-jaw predictions.`;
    }
    return "Supported commands: run analysis, inspect results, optimize plate, show nerve, run sweep, reset camera, and benchmark.";
  };
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Trabecular workspace">
          <span className="brand-mark">
            <i />
            <i />
            <i />
          </span>
          <strong>
            trabecular<span>®</span>
          </strong>
        </Link>
        <span className="header-divider" />
        <div className="project-breadcrumb">
          <span>Workspace</span>
          <ChevronRight size={13} />
          <strong>Mandibular fixation</strong>
          <span className="project-tag">MVP</span>
        </div>
        <div className="header-actions">
          <span className="save-status">
            <i />
            {saved ? "Saved on this device" : "Local workspace"}
          </span>
          <button
            className="secondary-button"
            disabled={!current || !!busy}
            onClick={() => setReport(true)}
          >
            <ArrowDownToLine size={14} />
            <span>Export report</span>
          </button>
          <button
            className="avatar"
            title="Workspace information"
            aria-label="Workspace information"
            onClick={() => setInfo(true)}
          >
            T
          </button>
        </div>
      </header>
      <div className="workspace-bar">
        <div className="workspace-title">
          <span className="case-icon">
            <Box size={20} />
          </span>
          <div>
            <h1>
              Mandible / Case 01 <ChevronDown size={13} />
            </h1>
            <p>
              6 mm bridge scenario <b>·</b> Ti-6Al-4V fixation plate
            </p>
          </div>
        </div>
        <nav className="tabs" aria-label="Workspace views">
          {(
            [
              {
                key: "design",
                label: "Design workspace",
                icon: <Scan size={15} />,
              },
              {
                key: "cohort",
                label: "Stiffness sweep",
                icon: <Activity size={15} />,
              },
              {
                key: "history",
                label: "Run history",
                icon: <History size={15} />,
              },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              className={tab === item.key ? "selected" : ""}
              aria-current={tab === item.key ? "page" : undefined}
              onClick={() => setTab(item.key)}
            >
              {item.icon}
              {item.label}
              {item.key === "history" && runs.length > 0 && (
                <small>{runs.length}</small>
              )}
            </button>
          ))}
        </nav>
        <button
          aria-label="Model and sources"
          className="help-button"
          onClick={() => setInfo(true)}
        >
          <CircleHelp size={16} />
          <span>Model & sources</span>
        </button>
      </div>
      <main className="main-area">
        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <button aria-label="Dismiss error" onClick={() => setError("")}>
              <X size={15} />
            </button>
          </div>
        )}
        {tab === "design" ? (
          <div className="design-workspace">
            <aside className="design-panel glass">
              <div className="design-scroll">
                <div className="panel-heading">
                  <span className="eyebrow">CASE SETUP</span>
                  <span className="tiny-tag">01</span>
                </div>
                <div className="anatomy-card">
                  <span className="anatomy-icon">
                    <Layers3 size={20} />
                  </span>
                  <div>
                    <strong>Reference mandible</strong>
                    <span>
                      CT surface <b>·</b> millimeters
                    </span>
                  </div>
                  <Check size={14} className="green-text" />
                </div>
                <div className="control-section">
                  <h2>
                    <SlidersHorizontal size={15} />
                    Plate design
                    <button
                      className="icon-button"
                      aria-label="Reset plate parameters"
                      title="Reset plate parameters"
                      disabled={!!busy}
                      onClick={() => {
                        setParams((p) => ({
                          ...p,
                          thickness: defaults.thickness,
                          width: defaults.width,
                          offset: defaults.offset,
                        }));
                        setOptimization(null);
                      }}
                    >
                      <RotateCcw size={13} />
                    </button>
                  </h2>
                  {designSettings.map((setting) => (
                    <ParameterControl
                      key={setting.key}
                      setting={setting}
                      params={params}
                      onChange={change}
                      disabled={!!busy}
                    />
                  ))}
                </div>
                <div className="control-section">
                  <h2>
                    <Settings2 size={15} />
                    Loading & material
                  </h2>
                  {loadSettings.map((setting) => (
                    <ParameterControl
                      key={setting.key}
                      setting={setting}
                      params={params}
                      onChange={change}
                      disabled={!!busy}
                    />
                  ))}
                </div>
                <div className="control-section">
                  <h2>
                    <Crosshair size={15} />
                    Design constraints
                  </h2>
                  <div className="constraint-row">
                    <label htmlFor="min-sf">Min. safety factor</label>
                    <span>
                      <NumericInput
                        id="min-sf"
                        label="Minimum safety factor"
                        min={1.5}
                        max={4}
                        step={0.1}
                        value={params.min_sf}
                        disabled={!!busy}
                        onChange={(value) => change("min_sf", value)}
                      />
                      ×
                    </span>
                  </div>
                  <div className="constraint-row">
                    <label htmlFor="clearance">Nerve clearance</label>
                    <span>
                      <NumericInput
                        id="clearance"
                        label="Minimum nerve clearance"
                        min={2}
                        max={8}
                        step={0.5}
                        value={params.min_clearance}
                        disabled={!!busy}
                        onChange={(value) => change("min_clearance", value)}
                      />
                      mm
                    </span>
                  </div>
                </div>
              </div>
              <div className="design-actions">
                <button
                  className="primary-button"
                  disabled={!!busy || !ready || !anatomy}
                  onClick={() => safe(solve)}
                >
                  {busy ? (
                    <LoaderCircle size={16} className="spin" />
                  ) : (
                    <Plus size={16} />
                  )}{" "}
                  {busy || "Run analysis"} {!busy && <ArrowRight size={15} />}
                </button>
                <button
                  className="optimize-button"
                  disabled={!!busy || !ready || !anatomy}
                  onClick={() => safe(optimize)}
                >
                  <Sparkles size={15} />
                  Optimize plate
                  <ArrowUpRight size={14} />
                </button>
                <p>
                  Numerical plate analysis <b>·</b> CPU
                </p>
              </div>
            </aside>
            <section className="viewer-panel glass">
              <div className="viewer-toolbar">
                <div className="view-segments">
                  <button
                    className={!heatmap ? "selected" : ""}
                    onClick={() => setHeatmap(false)}
                  >
                    Anatomy
                  </button>
                  <button
                    className={heatmap ? "selected" : ""}
                    disabled={!current || stale}
                    title={
                      !current
                        ? "Run an analysis to enable stress view"
                        : stale
                          ? "Analyze the current design to update stress"
                          : ""
                    }
                    onClick={() => setHeatmap(true)}
                  >
                    Plate stress
                  </button>
                </div>
                {runs.length > 1 && (
                  <label className="run-picker">
                    <span className="sr-only">Compare recorded designs</span>
                    <select
                      aria-label="Compare recorded designs"
                      value={activeId ?? ""}
                      disabled={!!busy}
                      onChange={(event) => {
                        const selected = runs.find(
                          (run) => run.id === event.target.value,
                        );
                        if (selected) selectRun(selected);
                      }}
                    >
                      {runs.map((run, index) => (
                        <option key={run.id} value={run.id}>
                          {index === 0
                            ? "Latest"
                            : "Run " + (runs.length - index)}{" "}
                          · {run.params.thickness.toFixed(1)} mm ·{" "}
                          {run.passed ? "met" : "review"}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <div className="camera-presets">
                  {(
                    [
                      { name: "perspective", label: "3D" },
                      { name: "front", label: "Front" },
                      { name: "left", label: "Left" },
                      { name: "top", label: "Top" },
                    ] as const
                  ).map((p) => (
                    <button
                      key={p.name}
                      aria-pressed={view.name === p.name}
                      className={view.name === p.name ? "selected" : ""}
                      onClick={() => focus(p.name)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              {anatomy ? (
                <Viewport3D
                  ref={viewport}
                  anatomy={anatomy}
                  params={params}
                  run={stale ? null : current}
                  view={view}
                  heatmap={heatmap}
                  bone={bone}
                  hardware={hardware}
                  nerve={nerve}
                  wireframe={wireframe}
                  opacity={opacity}
                  onView={focus}
                />
              ) : (
                <div className="viewport-message">
                  {error ? "Anatomy unavailable" : "Preparing anatomy…"}
                </div>
              )}
              <div className="layer-toolbar">
                <div className="layer-controls">
                  <span>
                    <Layers3 size={14} />
                    Layers
                  </span>
                  {[
                    { label: "Bone", value: bone, set: setBone },
                    { label: "Plate", value: hardware, set: setHardware },
                    { label: "Nerve zone", value: nerve, set: setNerve },
                    { label: "Wireframe", value: wireframe, set: setWireframe },
                  ].map((layer) => (
                    <button
                      key={layer.label}
                      aria-pressed={layer.value}
                      className={layer.value ? "enabled" : ""}
                      onClick={() => layer.set(!layer.value)}
                    >
                      <i />
                      {layer.label}
                    </button>
                  ))}
                </div>
                <label className="opacity-control">
                  Opacity{" "}
                  <input
                    aria-label="Bone opacity"
                    type="range"
                    min={0.15}
                    max={1}
                    step={0.05}
                    value={opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                  />
                </label>
                <button
                  className="icon-button"
                  title="Export current plate and screws as STL"
                  aria-label="Export current plate STL"
                  disabled={!anatomy}
                  onClick={() => viewport.current?.exportPlate()}
                >
                  <ArrowDownToLine size={15} />
                </button>
              </div>
            </section>
            <TelemetryPanel
              run={current}
              stale={stale}
              params={params}
              onFocus={focus}
            />
          </div>
        ) : tab === "cohort" ? (
          <CohortTab
            cohort={cohort}
            busy={!!busy}
            stale={sweepStale}
            onRun={() => safe(sweep)}
          />
        ) : (
          <section className="history-workspace">
            <div className="section-title">
              <div>
                <span className="eyebrow">DESIGN ITERATIONS</span>
                <h1>
                  Every run. <span>Traceable.</span>
                </h1>
                <p>Computed inputs and results, saved on this device.</p>
              </div>
              <button
                className="secondary-button"
                disabled={!runs.length}
                onClick={() =>
                  download(
                    "trabecular-run-history.json",
                    JSON.stringify(runs, null, 2),
                  )
                }
              >
                <ArrowDownToLine size={15} />
                Export history
              </button>
            </div>
            {runs.length ? (
              <div className="glass history-table">
                <table>
                  <thead>
                    <tr>
                      <th>Run</th>
                      <th>Plate</th>
                      <th>Load</th>
                      <th>Peak stress</th>
                      <th>Safety factor</th>
                      <th>Clearance</th>
                      <th>Constraints</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map((r, i) => (
                      <tr key={r.id}>
                        <td>
                          <strong>{r.id.slice(0, 8)}</strong>
                          <small>
                            {new Date(r.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            {i === 0 ? "· latest" : ""}
                          </small>
                        </td>
                        <td>
                          {r.params.thickness.toFixed(1)} ×{" "}
                          {r.params.width.toFixed(1)} mm
                        </td>
                        <td>{r.params.load} N</td>
                        <td>{r.peak_stress.toFixed(1)} MPa</td>
                        <td>{r.safety_factor.toFixed(2)}×</td>
                        <td>{r.clearance.toFixed(2)} mm</td>
                        <td>
                          <span
                            className={`tiny-tag ${r.passed ? "green" : "red"}`}
                          >
                            {r.passed ? "Met" : "Review"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="secondary-button"
                            disabled={!!busy}
                            onClick={() => selectRun(r)}
                          >
                            Load design
                            <ArrowUpRight size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state glass">
                <Clock3 size={36} />
                <h2>A clean starting point</h2>
                <p>
                  Run your first analysis or optimize the plate. Each completed
                  design will appear here.
                </p>
                <button
                  className="secondary-button"
                  onClick={() => setTab("design")}
                >
                  <ArrowLeft size={14} />
                  Back to workspace
                </button>
              </div>
            )}
            {optimization && (
              <p className="study-note">
                Last optimization evaluated {optimization.evaluated} discrete
                designs. Objective: minimum rectangular section area meeting the
                two specified constraints.
              </p>
            )}
          </section>
        )}
      </main>
      <VoiceHud onCommand={onCommand} busy={!!busy} />
      <footer className="statusbar">
        <span>
          <i />
          Local analysis engine <b>/</b> CPU beam finite elements
        </span>
        <span>
          Intact reference anatomy <b>·</b> Reduced plate model <b>·</b> v0.2
        </span>
      </footer>
      {notice && (
        <div className="toast glass" role="status">
          <Check size={16} />
          {notice}
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={14} />
          </button>
        </div>
      )}
      {report && current && anatomy && (
        <Vv40Modal
          run={current}
          anatomy={anatomy}
          cohort={cohort && !sweepStale ? cohort : null}
          benchmark={benchmark}
          onClose={() => setReport(false)}
          onBenchmark={() => safe(runBenchmark)}
          busy={!!busy}
        />
      )}
      {info && (
        <ModelInfo
          busy={busy}
          onClose={() => setInfo(false)}
          onBenchmark={() =>
            safe(async () => {
              await runBenchmark();
              setNotice(
                "Analytical benchmark complete. Open a run report to review the measured values.",
              );
            })
          }
        />
      )}
    </div>
  );
}
