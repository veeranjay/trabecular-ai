"use client";
import { SearchResult, PlateParameters, saveJSON } from "@/lib/workspace";
import { format, title } from "./WorkspaceInspector";
export default function SearchEvidence({
  result,
  busy,
  preview,
  apply,
}: {
  result: SearchResult;
  busy: boolean;
  preview: (params: PlateParameters) => void;
  apply: () => void;
}) {
  return (
    <div className="ws-search-evidence">
      <h3>Design search</h3>
      <p className="ws-description">{result.reason}</p>
      <p className="ws-small-text">{result.scope}</p>
      {result.winner && (
        <div className="ws-note">
          <div>
            <strong>Verified candidate</strong>
            <p>
              Nine load/material scenarios on this anatomy. Applying saves a new
              revision with its original registrations.
            </p>
            <button className="ws-button full" disabled={busy} onClick={apply}>
              Apply verified design
            </button>
          </div>
        </div>
      )}
      {(
        [
          ["Coarse screening", result.candidates],
          ["Mesh refinement", result.refinement || []],
          ["Nine-case envelope", result.envelope || []],
        ] as const
      ).map(([label, rows]) => (
        <section key={label}>
          <h3>
            {label} <small>· {rows.length} retained</small>
          </h3>
          {rows.map((row, i) => (
            <details key={row.id || i} className="ws-search-candidate">
              <summary>
                {i + 1}. {format(row.params.thickness)} ×{" "}
                {format(row.params.width)} mm{" "}
                <span>{title(row.state.replaceAll("_", " "))}</span>
              </summary>
              <dl className="ws-evidence">
                <dt>Placement / trajectory</dt>
                <dd>
                  {format(row.params.offset)} mm /{" "}
                  {format(row.params.screw_angle)}°
                </dd>
                <dt>Load case / core</dt>
                <dd>
                  {title(row.params.load_case)} /{" "}
                  {format(row.params.modulus, 0)} MPa
                </dd>
                <dt>Quality</dt>
                <dd>{row.quality || "preview"}</dd>
                <dt>Total titanium</dt>
                <dd>
                  {row.volume_mm3 != null
                    ? format(row.volume_mm3, 1) + " mm³"
                    : "—"}
                </dd>
                <dt>Keep-out clearance</dt>
                <dd>
                  {row.checks?.min_clearance_mm != null
                    ? format(row.checks.min_clearance_mm) + " mm"
                    : "—"}
                </dd>
                <dt>Clearance check</dt>
                <dd>
                  {row.checks
                    ? row.checks.clearance_pass
                      ? "Pass"
                      : "Fail"
                    : "Not checked"}
                </dd>
                <dt>Hole spacing check</dt>
                <dd>
                  {row.checks
                    ? row.checks.hole_spacing_pass
                      ? "Pass"
                      : "Fail"
                    : "Not checked"}
                </dd>
                <dt>Bone engagement proxy</dt>
                <dd>
                  {row.checks
                    ? row.checks.engagement_pass
                      ? "Pass"
                      : "Fail"
                    : "Not checked"}
                </dd>
                <dt>Ti stress</dt>
                <dd>
                  {row.result
                    ? format(row.result.peak_titanium_stress_mpa, 1) + " MPa"
                    : "Not computed"}
                </dd>
                <dt>Yield margin</dt>
                <dd>
                  {row.result ? format(row.result.safety_factor, 3) + "×" : "—"}
                </dd>
                <dt>Qualification</dt>
                <dd>
                  {row.result
                    ? row.result.qualified
                      ? "Qualified for declared scope"
                      : "Outstanding"
                    : "Not computed"}
                </dd>
              </dl>
              {row.error && <p className="ws-note-text">{row.error}</p>}
              {row.refinement_change && (
                <p className="ws-small-text">
                  Stress refinement change{" "}
                  {format(row.refinement_change.peak_titanium_stress_mpa * 100)}
                  % · displacement{" "}
                  {format(row.refinement_change.max_displacement_mm * 100)}%
                </p>
              )}
              <button
                className="ws-button full"
                disabled={busy}
                onClick={() => preview(row.params)}
              >
                Preview candidate geometry
              </button>
              <button
                className="ws-button full"
                onClick={() =>
                  saveJSON(`trabecular-candidate-${row.id || i}.json`, row)
                }
              >
                Download candidate evidence
              </button>
            </details>
          ))}
        </section>
      ))}
      {result.geometry_screen_scope && (
        <p className="ws-small-text">{result.geometry_screen_scope}</p>
      )}
      <button
        className="ws-button full"
        onClick={() => saveJSON("trabecular-design-search.json", result)}
      >
        Download search evidence
      </button>
    </div>
  );
}
