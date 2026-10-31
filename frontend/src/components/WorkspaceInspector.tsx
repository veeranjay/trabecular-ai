"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ClipSettings, CameraBookmark } from "@/lib/inspection";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  Box,
  Check,
  CircleHelp,
  GitBranch,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import NumericInput from "@/components/NumericInput";
import SearchEvidence from "./SearchEvidence";
import IndependentCheck from "./IndependentCheck";
import {
  BenchmarkResult,
  Case,
  Geometry,
  isJaw,
  Job,
  JobResult,
  PlateParameters,
  Region,
  Revision,
  saveJSON,
  parametersEqual,
  Vec3,
} from "@/lib/workspace";
export type Stage = "prepare" | "design" | "analyze" | "compare" | "report";
export const format = (value: number | undefined | null, places = 2) =>
  value == null
    ? "—"
    : value.toLocaleString(undefined, { maximumFractionDigits: places });
export const title = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);
type Setting = [
  keyof Omit<PlateParameters, "load_case">,
  string,
  string,
  number,
  number,
  number,
];
const geometrySettings: Setting[] = [
  ["advancement", "Mandibular advancement", "mm", 2, 8, 0.5],
  ["thickness", "Plate thickness", "mm", 1, 3.5, 0.1],
  ["width", "Bridge width", "mm", 2, 6, 0.1],
  ["plate_shift", "Plate placement", "mm", -4, 4, 0.5],
];
const screwSettings: Setting[] = [
  ["offset", "Third screw superior shift", "mm", 0, 10, 0.5],
  ["screw_length", "Screw length", "mm", 4, 16, 0.5],
  ["screw_angle", "Screw trajectory", "°", -20, 20, 1],
];
const loadingSettings: Setting[] = [
  ["load", "Total bite load", "N", 100, 1000, 10],
  ["modulus", "Core bone modulus", "MPa", 450, 1900, 50],
  ["min_clearance", "Keep-out clearance", "mm", 2, 8, 0.5],
  ["min_sf", "Minimum yield margin", "×", 1.5, 4, 0.1],
];
export function JobState({ job }: { job: Job }) {
  return (
    <span
      className={`ws-status ${job.state === "failed" ? "bad" : job.state === "completed" ? "caution" : ""}`}
    >
      {job.state === "completed" && job.action === "solve"
        ? job.summary?.numerically_resolved
          ? "Unqualified"
          : "Unresolved"
        : title(job.state)}
    </span>
  );
}
function Parameter({
  setting,
  params,
  change,
}: {
  setting: Setting;
  params: PlateParameters;
  change: (key: keyof PlateParameters, value: number | string) => void;
}) {
  const [key, label, unit, min, max, step] = setting;
  return (
    <div className="ws-parameter">
      <div>
        <label htmlFor={`ws-${key}`}>{label}</label>
        <span>
          <NumericInput
            id={`ws-${key}`}
            label={label}
            value={params[key]}
            min={min}
            max={max}
            step={step}
            disabled={false}
            onChange={(value) => change(key, value)}
          />
          <small>{unit}</small>
        </span>
      </div>
      <input
        aria-label={`${label} slider`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={params[key]}
        onChange={(event) => change(key, Number(event.target.value))}
        style={
          {
            "--fill": `${((params[key] - min) / (max - min)) * 100}%`,
          } as React.CSSProperties
        }
      />
    </div>
  );
}
type Props = {
  stage: Stage;
  selectedCase?: Case;
  revision?: Revision;
  revisions: Revision[];
  geometry: Geometry | null;
  params: PlateParameters | null;
  regions: Region[];
  reviewed: boolean;
  importOrientation: Vec3;
  changeOrientation: (value: Vec3) => void;
  dirty: boolean;
  busy: string;
  selectedRegion: string | null;
  selectedJob?: Job;
  result: JobResult | null;
  stale: boolean;
  jobs: Job[];
  quality: string;
  bone: boolean;
  opacity: number;
  clip: ClipSettings;
  setClip: (value: ClipSettings) => void;
  amplification: number;
  setAmplification: (value: number) => void;
  fieldAvailable: boolean;
  comparisonId: string;
  comparisonLoading: boolean;
  bookmarks: CameraBookmark[];
  saveBookmark: (name: string) => void;
  restoreBookmark: (bookmark: CameraBookmark) => void;
  removeBookmark: (id: string) => void;
  setComparisonId: (value: string) => void;
  comparisonBones: boolean;
  setComparisonBones: (value: boolean) => void;
  comparisonResult: import("@/lib/workspace").JawResult | null;
  setStage: (stage: Stage) => void;
  setSelectedRegion: (id: string | null) => void;
  changeRegion: (
    id: string,
    key: "center" | "radius" | "vector" | "points",
    value: number | number[] | number[][] | null,
  ) => void;
  setReviewed: (value: boolean) => void;
  change: (key: keyof PlateParameters, value: number | string) => void;
  setQuality: (value: string) => void;
  setBone: (value: boolean) => void;
  setOpacity: (value: number) => void;
  save: (next?: Stage) => void;
  revert: () => void;
  previewCandidate: (params: PlateParameters) => void;
  applyWinner: () => void;
  upgradeFixation: () => void;
  run: (action: Job["action"]) => void;
  cancel: (job: Job) => void;
  viewJob: (job: Job) => void;
  exportPackage: () => void;
  exportPDF: () => void;
  exportFields: () => void;
  screenshot: () => void;
  close: () => void;
};
export default function WorkspaceInspector(p: Props) {
  const [bookmarkName, setBookmarkName] = useState("Inspection view");
  const liveChecks =
    !!p.geometry && !!p.params && parametersEqual(p.geometry.params, p.params);
  const checks = liveChecks ? p.geometry!.checks : p.revision?.geometry_checks;
  const comparisonRevision = p.revisions.find(
    (r) => r.id === p.comparisonId && r.case_id === p.selectedCase?.id,
  );
  const clipRange = useMemo(() => {
    const axis = Math.max(0, ["x", "y", "z"].indexOf(p.clip.axis));
    let min = Infinity,
      max = -Infinity;
    for (const part of p.geometry?.meshes || [])
      for (let i = axis; i < part.positions.length; i += 3) {
        min = Math.min(min, part.positions[i]);
        max = Math.max(max, part.positions[i]);
      }
    return Number.isFinite(min) ? [min, max] : [-100, 100];
  }, [p.geometry, p.clip.axis]);
  const annotation = p.regions.find((region) => region.id === p.selectedRegion);
  const jaw =
    isJaw(p.result) &&
    p.selectedJob?.action === "solve" &&
    p.selectedJob.state === "completed"
      ? p.result
      : null;
  return (
    <aside className="ws-inspector">
      <div className="ws-inspector-title">
        <div>
          <h2>
            {
              {
                prepare: "Prepare your case",
                design: "Shape the fixation",
                analyze: "Analysis & evidence",
                compare: "Compare revisions",
                report: "Reproducible evidence",
              }[p.stage]
            }
          </h2>
        </div>
        <button
          className="ws-icon mobile-close"
          aria-label="Close inspector"
          onClick={p.close}
        >
          <X size={17} />
        </button>
      </div>
      <div className="ws-inspector-body">
        {p.dirty && (
          <div className="ws-draft-actions">
            <span className="ws-small-text">Unsaved draft</span>
            <button
              className="ws-button"
              disabled={!!p.busy}
              onClick={p.revert}
            >
              Revert draft
            </button>
          </div>
        )}
        {p.stage === "prepare" && !p.selectedCase?.import_id && (
          <>
            <p className="ws-description">
              Review the anatomy and the regions that define its boundary
              conditions.
            </p>
            <div className="ws-source">
              <Box size={18} />
              <div>
                <strong>
                  Visible Human · {title(p.selectedCase?.anatomy_id || "male")}
                </strong>
                <span>CT-derived mandible · millimeters</span>
              </div>
            </div>
            <div className="ws-annotation-list">
              {p.regions.map((region) => (
                <button
                  key={region.id}
                  className={p.selectedRegion === region.id ? "selected" : ""}
                  onClick={() =>
                    p.setSelectedRegion(
                      p.selectedRegion === region.id ? null : region.id,
                    )
                  }
                >
                  <span className={`region-dot ${region.kind}`} />
                  <span>
                    {title(region.id.replaceAll("_", " "))}
                    <small>
                      {region.kind === "keep_out"
                        ? region.points
                          ? `Manual buffered path · ${region.points.length} ${region.points.length === 1 ? "point" : "points"}`
                          : region.source === "developer_reference"
                            ? "Developer keep-out proxy"
                            : "Manual keep-out sphere"
                        : `${region.kind} region`}
                    </small>
                  </span>
                  <ArrowRight size={14} />
                </button>
              ))}
            </div>
            {annotation && (
              <div className="ws-region-editor">
                <h3>{title(annotation.id.replaceAll("_", " "))}</h3>
                <p>
                  {annotation.points
                    ? "Click the bone to append path points. Edit coordinates below in millimeters."
                    : "Click the bone to move this region, or enter its reference coordinates."}
                </p>
                {!annotation.points && (
                  <div className="ws-coordinate-row">
                    {["X", "Y", "Z"].map((axis, i) => (
                      <label key={axis}>
                        {axis}
                        <NumericInput
                          label={`${annotation.id} ${axis}`}
                          value={annotation.center[i]}
                          min={-200}
                          max={200}
                          step={0.5}
                          disabled={false}
                          onChange={(value) =>
                            p.changeRegion(
                              annotation.id,
                              "center",
                              annotation.center.map((previous, j) =>
                                j === i ? value : previous,
                              ),
                            )
                          }
                        />
                      </label>
                    ))}
                  </div>
                )}
                {annotation.points && (
                  <div className="ws-path-points">
                    {annotation.points.map((point, index) => (
                      <div key={index}>
                        <span className="ws-small-text">Point {index + 1}</span>
                        <div className="ws-coordinate-row">
                          {["X", "Y", "Z"].map((axis, i) => (
                            <label key={axis}>
                              {axis}
                              <NumericInput
                                label={`${annotation.id} point ${index + 1} ${axis}`}
                                value={point[i]}
                                min={-200}
                                max={200}
                                step={0.5}
                                disabled={false}
                                onChange={(value) =>
                                  p.changeRegion(
                                    annotation.id,
                                    "points",
                                    annotation.points!.map((old, j) =>
                                      j === index
                                        ? old.map((v, k) =>
                                            k === i ? value : v,
                                          )
                                        : old,
                                    ),
                                  )
                                }
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {annotation.kind === "keep_out" && (
                  <div className="ws-path-actions">
                    <button
                      className="ws-button full"
                      onClick={() =>
                        p.changeRegion(
                          annotation.id,
                          "points",
                          annotation.points ? null : [annotation.center],
                        )
                      }
                    >
                      {annotation.points
                        ? "Use sphere instead"
                        : "Start keep-out path"}
                    </button>
                    {annotation.points && (
                      <button
                        className="ws-button full"
                        disabled={annotation.points.length >= 20}
                        onClick={() =>
                          p.changeRegion(annotation.id, "points", [
                            ...annotation.points!,
                            annotation.points![annotation.points!.length - 1],
                          ])
                        }
                      >
                        Add coordinate point
                      </button>
                    )}
                    {annotation.points && annotation.points.length > 1 && (
                      <button
                        className="ws-button full"
                        onClick={() =>
                          p.changeRegion(
                            annotation.id,
                            "points",
                            annotation.points!.slice(0, -1),
                          )
                        }
                      >
                        Remove last point
                      </button>
                    )}
                  </div>
                )}
                <label className="ws-inline-input">
                  {annotation.points ? "Path buffer" : "Radius"}{" "}
                  <span>
                    <NumericInput
                      label="Region radius"
                      value={annotation.radius}
                      min={0.5}
                      max={25}
                      step={0.5}
                      disabled={false}
                      onChange={(value) =>
                        p.changeRegion(annotation.id, "radius", value)
                      }
                    />{" "}
                    mm
                  </span>
                </label>
                {annotation.kind === "load" && (
                  <div className="ws-coordinate-row">
                    {["X", "Y", "Z"].map((axis, i) => (
                      <label key={axis}>
                        Force {axis}
                        <NumericInput
                          label={`Force direction ${axis}`}
                          value={(annotation.vector || [0, -1, 0])[i]}
                          min={-1}
                          max={1}
                          step={0.1}
                          disabled={false}
                          onChange={(value) =>
                            p.changeRegion(
                              annotation.id,
                              "vector",
                              (annotation.vector || [0, -1, 0]).map(
                                (previous, j) => (j === i ? value : previous),
                              ),
                            )
                          }
                        />
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="ws-note">
              <ShieldCheck size={17} />
              <p>
                Developer reference cuts and editable annotations. Manual paths
                require source review; the app does not infer patient nerves.
              </p>
            </div>
            <label className="ws-checkline">
              <input
                type="checkbox"
                checked={p.reviewed}
                onChange={(event) => p.setReviewed(event.target.checked)}
              />
              <span>
                I have reviewed the reference regions for this engineering run.
              </span>
            </label>
            <button
              className="ws-button full"
              disabled={!p.reviewed || !!p.busy}
              onClick={() => p.save("design")}
            >
              Continue to design <ArrowRight size={15} />
            </button>
          </>
        )}
        {p.stage === "prepare" && p.selectedCase?.import_id && (
          <>
            <p className="ws-description">
              Review source scale and orientation before saving this imported
              inspection case.
            </p>
            <div className="ws-source">
              <Box size={18} />
              <div>
                <strong>{p.selectedCase.name}</strong>
                <span>Imported STL · millimeters</span>
              </div>
            </div>
            <dl className="ws-evidence">
              <dt>Dimensions</dt>
              <dd>
                {p.selectedCase.import_metadata?.dimensions_mm
                  .map((value) => format(value, 1))
                  .join(" × ")}{" "}
                mm
              </dd>
              <dt>Triangles</dt>
              <dd>{format(p.selectedCase.import_metadata?.triangles, 0)}</dd>
              <dt>Surface</dt>
              <dd>
                {p.selectedCase.import_metadata?.geometry_quality.watertight
                  ? "Closed"
                  : "Open surface"}
              </dd>
            </dl>
            <h3>Orientation</h3>
            <div className="ws-coordinate-row">
              {["X", "Y", "Z"].map((axis, i) => (
                <label key={axis}>
                  {axis} rotation · °
                  <NumericInput
                    label={`Import ${axis} rotation`}
                    min={-180}
                    max={180}
                    step={90}
                    value={p.importOrientation[i]}
                    disabled={false}
                    onChange={(value) =>
                      p.changeOrientation(
                        p.importOrientation.map((old, j) =>
                          i === j ? value : old,
                        ) as Vec3,
                      )
                    }
                  />
                </label>
              ))}
            </div>
            <div className="ws-note">
              <CircleHelp size={17} />
              <p>
                Inspection only. Analysis requires bone segmentation, hardware
                registration, support/load regions and keep-out annotations.
              </p>
            </div>
            <label className="ws-checkline">
              <input
                type="checkbox"
                checked={p.reviewed}
                onChange={(event) => p.setReviewed(event.target.checked)}
              />
              <span>I have reviewed the source units and orientation.</span>
            </label>
            <button
              className="ws-button full"
              disabled={!p.reviewed || !!p.busy}
              onClick={() => p.save("report")}
            >
              Save inspection <ArrowRight size={15} />
            </button>
          </>
        )}
        {p.stage === "design" && p.selectedCase?.import_id && (
          <div className="ws-empty">
            <Box size={28} />
            <h3>Preparation required.</h3>
            <p>
              This imported surface needs segmentation and fixation registration
              before design or mechanical analysis.
            </p>
            <button
              className="ws-button full"
              onClick={() => p.setStage("prepare")}
            >
              Review import
            </button>
          </div>
        )}
        {p.stage === "design" && p.params && !p.selectedCase?.import_id && (
          <>
            {(p.revision?.cad_version || 3) < 5 ? (
              <div className="ws-note">
                <GitBranch size={17} />
                <div>
                  <p>
                    Use the latest contoured plates and explicit locking
                    attachments.
                  </p>
                  <button
                    className="ws-button full"
                    disabled={!!p.busy}
                    onClick={p.upgradeFixation}
                  >
                    Use contoured fixation
                  </button>
                </div>
              </div>
            ) : (
              null
            )}
            <h3>Geometry</h3>
            {geometrySettings.map((setting) => (
              <Parameter
                key={setting[0]}
                setting={setting}
                params={p.params!}
                change={p.change}
              />
            ))}
            <details open>
              <summary>Locking screws</summary>
              {screwSettings.map((setting) => (
                <Parameter
                  key={setting[0]}
                  setting={setting}
                  params={p.params!}
                  change={p.change}
                />
              ))}
            </details>
            <details>
              <summary>Loads & constraints</summary>
              <label className="ws-select-label">
                Load scenario
                <select
                  value={p.params.load_case}
                  onChange={(event) =>
                    p.change("load_case", event.target.value)
                  }
                >
                  <option value="bilateral">Bilateral</option>
                  <option value="left">Left unilateral</option>
                  <option value="right">Right unilateral</option>
                </select>
              </label>
              {loadingSettings.map((setting) => (
                <Parameter
                  key={setting[0]}
                  setting={setting}
                  params={p.params!}
                  change={p.change}
                />
              ))}
            </details>
            {p.revision && (
              <div className="ws-checks">
                <h3>
                  {p.dirty
                    ? liveChecks
                      ? "Draft geometry checks"
                      : "Updating geometry checks"
                    : "Saved geometry checks"}
                </h3>
                {[
                  [
                    checks?.clearance_pass,
                    "Keep-out clearance",
                    p.dirty && !liveChecks
                      ? "Updating…"
                      : `${format(checks?.min_clearance_mm)} mm`,
                  ],
                  [
                    checks?.hole_spacing_pass,
                    "Hole spacing",
                    p.dirty && !liveChecks
                      ? "Updating…"
                      : `${format(checks?.min_hole_spacing_mm)} mm`,
                  ],
                  [
                    checks?.engagement_pass,
                    "Bone engagement proxy",
                    p.dirty && !liveChecks
                      ? "Updating…"
                      : `${format(checks?.min_bone_engagement_proxy_mm)} mm`,
                  ],
                ].map(([pass, label, value]) => (
                  <div key={String(label)}>
                    <span
                      className={
                        p.dirty && !liveChecks ? "" : pass ? "good" : "bad"
                      }
                    >
                      {p.dirty && !liveChecks ? (
                        <CircleHelp size={14} />
                      ) : pass ? (
                        <Check size={14} />
                      ) : (
                        <X size={14} />
                      )}
                    </span>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            )}
            <button
              className="ws-button full"
              disabled={!!p.busy || !p.dirty}
              onClick={() => p.save()}
            >
              <Save size={15} />
              Update saved geometry
            </button>
          </>
        )}
        {p.stage === "analyze" && (
          <>
            <label className="ws-select-label">
              Mesh quality
              <select
                value={p.quality}
                onChange={(event) => p.setQuality(event.target.value)}
              >
                <option value="preview">Preview</option>
                <option value="standard">Standard</option>
                <option value="refined">Refined</option>
              </select>
            </label>
            {p.selectedJob && p.selectedJob.state !== "completed" && (
              <div className="ws-active-job">
                <div>
                  <strong>
                    {title(
                      p.selectedJob.action.replace(
                        "benchmark3d",
                        "calculation check",
                      ),
                    )}
                  </strong>
                  <JobState job={p.selectedJob} />
                </div>
                <p>{p.selectedJob.error || p.selectedJob.stage}</p>
                {["running", "queued"].includes(p.selectedJob.state) && (
                  <>
                    <progress value={p.selectedJob.progress} max={1} />
                    <button
                      className="ws-button full"
                      onClick={() => p.cancel(p.selectedJob!)}
                    >
                      Cancel job
                    </button>
                  </>
                )}
              </div>
            )}
            {jaw ? (
              <>
                {p.stale && (
                  <p className="ws-note-text">
                    Out of date for the current inputs. Field display is paused.
                  </p>
                )}
                <div className="ws-result-metric">
                  <span>Peak titanium stress</span>
                  <strong>
                    {format(jaw.peak_titanium_stress_mpa, 1)}
                    <small> MPa</small>
                  </strong>
                  <p title="The reported stress is not smoothed for display">
                    {jaw.stress_recovery
                      ? "Unsmoothed quadrature maximum"
                      : "Unsmoothed cell maximum"}
                  </p>
                </div>
                <div className="ws-metric-pair">
                  <div>
                    <span>Yield margin</span>
                    <strong
                      className={
                        jaw.safety_factor >= (p.params?.min_sf || 1.8)
                          ? ""
                          : "bad"
                      }
                    >
                      {format(jaw.safety_factor)}×
                    </strong>
                  </div>
                  <div>
                    <span>Displacement</span>
                    <strong>
                      {format(jaw.max_displacement_mm)}
                      <small> mm</small>
                    </strong>
                  </div>
                </div>
                <details className="ws-interpretation">
                  <summary>How to interpret this result</summary>
                  <CircleHelp size={17} />
                  <p>
                    {jaw.numerically_resolved
                      ? "Equilibrium converged. Mesh accuracy and anatomical/attachment assumptions still need review."
                      : "The solve did not converge. This field is not a resolved prediction."}
                  </p>
                </details>
                {jaw.peak_titanium_stress_mpa > 880 && (
                  <p className="ws-note-text">
                    The assumed titanium yield limit is exceeded. This linear
                    calculation does not model the response after yielding.
                  </p>
                )}
                <details>
                  <summary>Numerical evidence</summary>
                  <dl className="ws-evidence">
                    <dt>Relative residual</dt>
                    <dd>{jaw.relative_residual.toExponential(2)}</dd>
                    <dt>Force imbalance</dt>
                    <dd>{format(jaw.force_balance_error * 100, 4)}%</dd>
                    <dt>Moment imbalance</dt>
                    <dd>{format(jaw.moment_balance_error * 100, 4)}%</dd>
                    <dt>
                      {jaw.model === "jaw-exact-tet-v4"
                        ? "Bone tie error"
                        : "Bond slip"}
                    </dt>
                    <dd>{format(jaw.max_bond_slip_mm, 4)} mm</dd>
                    {jaw.max_locking_slip_mm != null && (
                      <>
                        <dt>
                          {jaw.model === "jaw-exact-tet-v4"
                            ? "Head tie error"
                            : "Locking head slip"}
                        </dt>
                        <dd>{format(jaw.max_locking_slip_mm, 4)} mm</dd>
                      </>
                    )}
                    <dt>Model</dt>
                    <dd>{jaw.model}</dd>
                    <dt>Iterations</dt>
                    <dd>{format(jaw.iterations, 0)}</dd>
                    <dt>Volume elements</dt>
                    <dd>{format(jaw.tetrahedra, 0)}</dd>
                    <dt>Device solve</dt>
                    <dd>{format(jaw.solve_seconds)} s</dd>
                  </dl>
                </details>
                <details>
                  <summary>Assumptions & open gates</summary>
                  {jaw.assumptions.map((text) => (
                    <p className="ws-small-text" key={text}>
                      {text}
                    </p>
                  ))}
                  {jaw.unresolved_gates.map((text) => (
                    <p className="ws-small-text caution" key={text}>
                      {text}
                    </p>
                  ))}
                </details>
                {p.selectedJob && (
                  <IndependentCheck
                    key={p.selectedJob.id}
                    jobId={p.selectedJob.id}
                    revisionLabel={
                      p.revisions.find(
                        (r) => r.id === p.selectedJob?.revision_id,
                      )?.label || "Saved run"
                    }
                  />
                )}
              </>
            ) : p.result &&
              p.selectedJob?.state === "completed" &&
              "independent_reference" in p.result ? (
              <>
                <div className="ws-result-metric">
                  <span>3D calculation checks</span>
                  <strong>
                    {(p.result as BenchmarkResult).passed
                      ? "Checks passed"
                      : "Checks failed"}
                  </strong>
                </div>
                <p className="ws-description">
                  {p.result.thin_plate_check
                    ? "Independent assembly, CPU/GPU agreement and thin-plate method checks. Jaw qualification remains separate."
                    : "Independent assembly and CPU/GPU agreement for the rectangular benchmark. Jaw qualification remains separate."}
                </p>
                {p.result.refinement.map((row) => (
                  <div className="ws-line-item" key={row.resolution.join()}>
                    <span>{row.resolution.join(" × ")}</span>
                    <strong>{format(row.deflection_error_pct)}% error</strong>
                  </div>
                ))}
                {p.result.thin_plate_check && (
                  <>
                    <h3>1.5 mm plate bending</h3>
                    {p.result.thin_plate_check.series.map((row) => (
                      <div className="ws-line-item" key={row.resolution.join()}>
                        <span>{row.thickness_layers} layers · quadratic</span>
                        <strong>{format(row.error_pct)}% error</strong>
                      </div>
                    ))}
                    <p className="ws-small-text">
                      Last refinement change:{" "}
                      {format(
                        p.result.thin_plate_check.last_deflection_change_pct,
                        3,
                      )}
                      %. This checks the method, not the fitted jaw mesh.
                    </p>
                  </>
                )}
              </>
            ) : p.result && "candidates" in p.result ? (
              <SearchEvidence
                result={p.result}
                busy={!!p.busy}
                preview={p.previewCandidate}
                apply={p.applyWinner}
              />
            ) : !p.selectedJob || p.selectedJob.state === "completed" ? (
              <div className="ws-empty">
                <Activity size={28} />
                <h3>Evidence starts with a run.</h3>
                <p>
                  Review the regions, save a design, and run the real 3D model
                  on your GPU.
                </p>
              </div>
            ) : null}
            {!p.selectedCase?.import_id && (
              <>
                <button
                  className="ws-button full"
                  disabled={!!p.busy || !p.reviewed || !p.revision}
                  onClick={() => p.run("optimize")}
                >
                  <SlidersHorizontal size={15} />
                  Search fixation designs
                </button>
                <p className="ws-small-text">
                  Bounded dimension/placement search, mesh refinement and nine
                  load/material cases. Long local calculation; cancel anytime.
                </p>
              </>
            )}
            <details>
              <summary>Calculation checks</summary>
              <p className="ws-small-text">
                3D cantilever, independent assembly and CPU/GPU comparisons. No
                cloud credits used.
              </p>
              <button
                className="ws-button full"
                disabled={!!p.busy}
                onClick={() => p.run("benchmark3d")}
              >
                Run calculation checks
              </button>
              <Link className="ws-text-link" href="/reduced-model">
                Open reduced beam diagnostics <ArrowRight size={13} />
              </Link>
            </details>
          </>
        )}
        {p.stage === "compare" && (
          <>
            <label className="ws-select-label">
              Overlay a saved revision
              <select
                aria-label="Comparison revision"
                value={p.comparisonId}
                onChange={(e) => p.setComparisonId(e.target.value)}
              >
                <option value="">No overlay</option>
                {p.revisions
                  .filter(
                    (r) =>
                      r.case_id === p.selectedCase?.id &&
                      r.id !== p.revision?.id,
                  )
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
              </select>
            </label>
            {comparisonRevision && (
              <>
                {p.comparisonLoading && (
                  <p role="status" className="ws-small-text">
                    Loading saved geometry and evidence…
                  </p>
                )}
                <p className="ws-description">
                  Solid: {p.dirty ? "current draft" : p.revision?.label}. Blue
                  wireframe: {comparisonRevision.label}. Stress and displacement
                  use the same physical display scale when both fields are
                  available.
                </p>
                <label className="ws-checkline">
                  <input
                    type="checkbox"
                    checked={p.comparisonBones}
                    onChange={(e) => p.setComparisonBones(e.target.checked)}
                  />
                  Include comparison bone surfaces
                </label>
                <div className="ws-compare-values">
                  <div>
                    <span>Input</span>
                    <span>Current</span>
                    <span>Saved</span>
                  </div>
                  {[
                    [
                      "Thickness",
                      p.params?.thickness,
                      comparisonRevision.params.thickness,
                      "mm",
                    ],
                    [
                      "Width",
                      p.params?.width,
                      comparisonRevision.params.width,
                      "mm",
                    ],
                    [
                      "Advancement",
                      p.params?.advancement,
                      comparisonRevision.params.advancement,
                      "mm",
                    ],
                    [
                      "Load",
                      p.params?.load,
                      comparisonRevision.params.load,
                      "N",
                    ],
                    [
                      "Core modulus",
                      p.params?.modulus,
                      comparisonRevision.params.modulus,
                      "MPa",
                    ],
                  ].map(([label, current, saved, unit]) => (
                    <div key={String(label)}>
                      <span>{label}</span>
                      <strong>
                        {format(current as number)} {unit}
                      </strong>
                      <strong>
                        {format(saved as number)} {unit}
                      </strong>
                    </div>
                  ))}
                  <div>
                    <span>Ti stress</span>
                    <strong>
                      {jaw && !p.stale
                        ? format(jaw.peak_titanium_stress_mpa, 0) + " MPa"
                        : "Not computed"}
                    </strong>
                    <strong>
                      {p.comparisonResult
                        ? format(
                            p.comparisonResult.peak_titanium_stress_mpa,
                            0,
                          ) + " MPa"
                        : p.comparisonLoading
                          ? "Loading…"
                          : "Not computed"}
                    </strong>
                  </div>
                </div>
                {jaw &&
                  p.comparisonResult &&
                  jaw.model !== p.comparisonResult.model && (
                    <p className="ws-note-text">
                      The solver formulations differ. These results are not a
                      controlled design comparison.
                    </p>
                  )}
                <p className="ws-small-text">
                  {p.comparisonLoading
                    ? "Loading saved evidence…"
                    : p.comparisonResult?.model ||
                      "No analysis for the saved overlay"}{" "}
                  · model qualification outstanding.
                </p>
              </>
            )}
            <p className="ws-description">
              Reopen the exact revision and inputs behind each result. Current
              jaw results remain unqualified.
            </p>
            {p.jobs
              .filter(
                (job) => job.action === "solve" && job.state === "completed",
              )
              .filter(
                (job, index, all) =>
                  all.findIndex(
                    (item) => item.revision_id === job.revision_id,
                  ) === index,
              )
              .map((job) => (
                <button
                  className="ws-compare-card"
                  key={job.id}
                  onClick={() => p.viewJob(job)}
                >
                  <div>
                    <GitBranch size={15} />
                    <strong>
                      {
                        p.revisions.find((item) => item.id === job.revision_id)
                          ?.label
                      }
                    </strong>
                    <ArrowRight size={15} />
                  </div>
                  <span>
                    {format(job.summary?.peak_titanium_stress_mpa, 1)} MPa ·{" "}
                    {format(job.input.params.thickness)} mm plate
                  </span>
                  <JobState job={job} />
                </button>
              ))}
            {!p.jobs.some(
              (job) => job.action === "solve" && job.state === "completed",
            ) && (
              <div className="ws-empty">
                <GitBranch size={28} />
                <h3>No completed designs yet.</h3>
                <p>Completed runs stay linked to their saved revisions.</p>
              </div>
            )}
          </>
        )}
        {p.stage === "report" && (
          <>
            <p className="ws-description">
              Export saved geometry, inputs, source attribution and computed
              evidence together.
            </p>
            <div className="ws-source">
              <Box size={20} />
              <div>
                <strong>
                  {p.selectedCase?.import_id
                    ? "Inspection surface"
                    : "Named assembly"}
                </strong>
                <span>
                  {p.selectedCase?.import_id
                    ? "Imported geometry, orientation and source manifest"
                    : "Three bone segments, two plates, eight screws"}
                </span>
              </div>
            </div>
            <button
              className="ws-primary full"
              disabled={!!p.busy || !p.revision || p.dirty}
              onClick={p.exportPackage}
            >
              <ArrowDownToLine size={16} />
              Download evidence package
            </button>
            <button
              className="ws-button full"
              disabled={!!p.busy || !p.revision || p.dirty}
              onClick={p.exportPDF}
            >
              Download PDF report
            </button>
            {isJaw(p.result) && p.result.field_artifact && (
              <button
                className="ws-button full"
                disabled={!!p.busy || p.dirty}
                onClick={p.exportFields}
              >
                Download full volume fields
              </button>
            )}
            {p.dirty && (
              <p className="ws-note-text">
                Save current edits before exporting.
              </p>
            )}
            <button
              className="ws-button full"
              disabled={!p.result || p.selectedJob?.state !== "completed"}
              onClick={() =>
                saveJSON("trabecular-analysis.json", {
                  job: p.selectedJob,
                  result: p.result,
                })
              }
            >
              Download selected result JSON
            </button>
            <button className="ws-button full" onClick={p.screenshot}>
              Save viewport image
            </button>
            <div className="ws-note">
              <CircleHelp size={17} />
              <p>
                Named assembly components are not a fabrication-ready solid.
                Numerical evidence retains its qualification state.
              </p>
            </div>
            <details open>
              <summary>Source & provenance</summary>
              <p className="ws-small-text">
                {p.selectedCase?.import_id
                  ? "User-supplied STL. Original source hash and unit conversion retained."
                  : "Visible Human CT surface · CC BY 4.0. Developer-defined osteotomy and registrations."}
              </p>
              {!!p.geometry?.anatomy.source_url && (
                <a
                  className="ws-text-link"
                  href={p.geometry?.anatomy.source_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  View source dataset <ArrowRight size={13} />
                </a>
              )}
              <p className="ws-small-text mono">{p.revision?.geometry_hash}</p>
            </details>
          </>
        )}
        <details className="ws-display-options">
          <summary>Display options</summary>
          <label className="ws-checkline">
            <input
              type="checkbox"
              checked={p.bone}
              onChange={(event) => p.setBone(event.target.checked)}
            />
            Show bone surfaces
          </label>
          <label className="ws-select-label">
            Bone opacity
            <input
              aria-label="Bone opacity"
              type="range"
              min={0.1}
              max={1}
              step={0.1}
              value={p.opacity}
              onChange={(event) => p.setOpacity(Number(event.target.value))}
            />
          </label>
          <h3>Section inspection</h3>
          <label className="ws-select-label">
            Clip axis
            <select
              aria-label="Clip axis"
              value={p.clip.axis}
              onChange={(e) =>
                p.setClip({
                  axis: e.target.value as ClipSettings["axis"],
                  position: 0,
                  flipped: false,
                })
              }
            >
              <option value="off">No clipping</option>
              <option value="x">
                {p.selectedCase?.import_id ? "X plane" : "X · sagittal"}
              </option>
              <option value="y">
                {p.selectedCase?.import_id ? "Y plane" : "Y · horizontal"}
              </option>
              <option value="z">
                {p.selectedCase?.import_id ? "Z plane" : "Z · coronal"}
              </option>
            </select>
          </label>
          {p.clip.axis !== "off" && (
            <>
              <label className="ws-inline-input">
                Section position
                <span>
                  <NumericInput
                    label="Section position"
                    value={p.clip.position}
                    min={clipRange[0]}
                    max={clipRange[1]}
                    step={0.5}
                    disabled={false}
                    onChange={(value) =>
                      p.setClip({ ...p.clip, position: value })
                    }
                  />{" "}
                  mm
                </span>
              </label>
              <input
                type="range"
                aria-label="Section position slider"
                min={clipRange[0]}
                max={clipRange[1]}
                step={0.5}
                value={p.clip.position}
                onChange={(e) =>
                  p.setClip({ ...p.clip, position: Number(e.target.value) })
                }
              />
              <label className="ws-checkline">
                <input
                  type="checkbox"
                  checked={p.clip.flipped}
                  onChange={(e) =>
                    p.setClip({ ...p.clip, flipped: e.target.checked })
                  }
                />
                Reverse cut direction
              </label>
              <p className="ws-small-text">
                The outline is the actual surface/plane intersection. Internal
                tissue structure is not reconstructed.
              </p>
            </>
          )}
          <h3>Deformation display</h3>
          <label className="ws-inline-input">
            Amplification
            <span>
              <NumericInput
                label="Deformation amplification"
                value={p.amplification}
                min={0}
                max={20}
                step={0.5}
                disabled={!p.fieldAvailable}
                onChange={p.setAmplification}
              />{" "}
              ×
            </span>
          </label>
          <p className="ws-small-text">
            Select Displacement in the viewport. Shape amplification affects
            display only; colors and measurements retain physical units.
          </p>
          <h3>Camera bookmarks</h3>
          <label className="ws-select-label">
            View name
            <input
              aria-label="Camera bookmark name"
              maxLength={60}
              value={bookmarkName}
              onChange={(e) => setBookmarkName(e.target.value)}
            />
          </label>
          <button
            className="ws-button full"
            disabled={!!p.busy}
            onClick={() => p.saveBookmark(bookmarkName)}
          >
            Save camera bookmark
          </button>
          <div className="ws-camera-bookmarks">
            {p.bookmarks.map((bookmark) => (
              <div key={bookmark.id}>
                <button
                  className="ws-button"
                  onClick={() => p.restoreBookmark(bookmark)}
                >
                  {bookmark.name}
                </button>
                <button
                  className="ws-icon"
                  aria-label={`Remove camera bookmark ${bookmark.name}`}
                  onClick={() => p.removeBookmark(bookmark.id)}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </details>
      </div>
      <footer className="ws-inspector-footer">
        <span className="dot caution" />
        Engineering reference · model unqualified
      </footer>
    </aside>
  );
}
