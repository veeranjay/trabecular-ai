"use client";
import { useState } from "react";
import { StudyResult, Job, saveJSON, exportStudyCSV } from "@/lib/workspace";
import { format, title } from "./WorkspaceInspector";

const colors: Record<string, string> = {
  bilateral: "#d5ff76",
  left: "#89bdf6",
  right: "#d6a1f6",
};
export default function StudyEvidence({
  result,
  job,
}: {
  result: StudyResult;
  job: Job;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [anatomyFilter, setAnatomyFilter] = useState("all");
  const [loadFilter, setLoadFilter] = useState("all");
  const visible = result.scenarios.filter(
    (s) =>
      (anatomyFilter === "all" || s.anatomy_id === anatomyFilter) &&
      (loadFilter === "all" || s.load_case === loadFilter),
  );
  const allComputed = result.scenarios.filter(
    (s) =>
      s.state === "completed" &&
      Number.isFinite(s.result?.peak_titanium_stress_mpa),
  );
  const computed = allComputed.filter((s) => visible.includes(s));
  const maximum = Math.max(
    1,
    ...allComputed.map((s) => s.result!.peak_titanium_stress_mpa),
  );
  const row = selected == null ? null : result.scenarios[selected];
  const governing = result.governing?.peak_titanium_stress_mpa;
  const source = (value: string | undefined) =>
    value ? value.slice(0, 8) : "Earlier study";
  return (
    <section className="ws-study-evidence" aria-label="Study evidence">
      <p className="ws-description">{result.scope}</p>
      <div className="ws-study-stats">
        {[
          ["Computed", allComputed.length],
          [
            "Failed",
            result.scenarios.filter((s) => s.state === "failed").length,
          ],
          ["Resolved", result.resolved],
          ["Qualified", result.qualified],
        ].map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>
              {value ?? 0}
              <small> / {result.total}</small>
            </strong>
          </div>
        ))}
      </div>
      {computed.length > 0 && (
        <div className="ws-study-plot">
          <div>
            <h2>Titanium stress across the envelope</h2>
            <p>
              Unsmoothed maximum · MPa. Circle: male reference. Square: female
              reference.
            </p>
          </div>
          <div className="ws-study-legend">
            {Object.entries(colors).map(([name, color]) => (
              <span key={name}>
                <i style={{ background: color }} />
                {title(name)}
              </span>
            ))}
          </div>
          <svg
            viewBox="0 0 760 310"
            role="img"
            aria-label="Computed titanium stress against core bone modulus"
          >
            {[0, 0.25, 0.5, 0.75, 1].map((t) => (
              <g key={t}>
                <line
                  x1="75"
                  x2="715"
                  y1={250 - 215 * t}
                  y2={250 - 215 * t}
                  stroke="currentColor"
                  opacity=".12"
                />
                <text
                  x="62"
                  y={254 - 215 * t}
                  textAnchor="end"
                  fill="currentColor"
                  fontSize="11"
                >
                  {format(maximum * t, 0)}
                </text>
              </g>
            ))}
            {[500, 1200, 1800].map((modulus) => (
              <text
                key={modulus}
                x={100 + ((modulus - 500) / 1300) * 580}
                y="275"
                textAnchor="middle"
                fill="currentColor"
                fontSize="12"
              >
                {modulus}
              </text>
            ))}
            <text
              x="390"
              y="302"
              textAnchor="middle"
              fill="currentColor"
              fontSize="12"
            >
              Core bone modulus · MPa
            </text>
            {computed.map((s, i) => {
              const x = 100 + ((s.modulus - 500) / 1300) * 580,
                y = 250 - (s.result!.peak_titanium_stress_mpa / maximum) * 215;
              const description = `${title(s.anatomy_id)}, ${s.load_case}, ${s.modulus} MPa: ${format(s.result!.peak_titanium_stress_mpa)} MPa titanium stress`;
              return (
                <g
                  key={s.id || i}
                  fill={colors[s.load_case] || "#d5ff76"}
                  stroke="#171b1c"
                  strokeWidth="1.5"
                >
                  {s.anatomy_id === "female" ? (
                    <rect x={x - 5} y={y - 5} width="10" height="10">
                      <title>{description}</title>
                    </rect>
                  ) : (
                    <circle cx={x} cy={y} r="5">
                      <title>{description}</title>
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>
          {governing && (
            <p>
              Governing titanium stress:{" "}
              <strong>{format(governing.value)} MPa</strong> · scenario{" "}
              {source(governing.scenario_id)}. Qualification remains separate
              from equilibrium convergence.
            </p>
          )}
        </div>
      )}
      <div className="ws-study-filters">
        <label>
          Anatomy
          <select
            aria-label="Study anatomy filter"
            value={anatomyFilter}
            onChange={(e) => setAnatomyFilter(e.target.value)}
          >
            <option value="all">Both references</option>
            <option value="male">Male reference</option>
            <option value="female">Female reference</option>
          </select>
        </label>
        <label>
          Loading
          <select
            aria-label="Study load filter"
            value={loadFilter}
            onChange={(e) => setLoadFilter(e.target.value)}
          >
            <option value="all">All load cases</option>
            <option value="bilateral">Bilateral</option>
            <option value="left">Left unilateral</option>
            <option value="right">Right unilateral</option>
          </select>
        </label>
        <span>
          {visible.length} of {result.scenarios.length} scenarios
        </span>
      </div>
      <div className="ws-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Scenario / source</th>
              <th>Anatomy</th>
              <th>Load case</th>
              <th>Core modulus</th>
              <th>Ti stress</th>
              <th>State</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visible.map((s) => {
              const i = result.scenarios.indexOf(s);
              return (
                <tr
                  key={s.id || i}
                  className={
                    s.id === governing?.scenario_id ? "ws-governing" : undefined
                  }
                >
                  <td>
                    {source(s.id)}
                    <small>Revision {source(s.revision_id)}</small>
                  </td>
                  <td>{title(s.anatomy_id)}</td>
                  <td>{s.load_case}</td>
                  <td>{s.modulus} MPa</td>
                  <td>
                    {s.result
                      ? `${format(s.result.peak_titanium_stress_mpa)} MPa`
                      : "—"}
                  </td>
                  <td>
                    {s.state === "completed"
                      ? s.result?.numerically_resolved
                        ? "Unqualified"
                        : "Unresolved"
                      : s.state === "running" &&
                          ["cancelled", "failed"].includes(job.state)
                        ? "Interrupted"
                        : s.state === "pending" &&
                            ["cancelled", "failed"].includes(job.state)
                          ? "Not run"
                          : title(s.state.replaceAll("_", " "))}
                  </td>
                  <td>
                    <button
                      className="ws-button"
                      aria-label={`Inspect scenario ${i + 1}`}
                      onClick={() => setSelected(selected === i ? null : i)}
                    >
                      Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {row && (
        <div className="ws-study-detail">
          <h3>
            Scenario {source(row.id)} · {title(row.anatomy_id)} /{" "}
            {row.load_case}
          </h3>
          <p>
            Source case {source(row.case_id)} · revision{" "}
            {source(row.revision_id)}
          </p>
          {row.error && <p role="alert">{row.error}</p>}
          {row.result && (
            <dl>
              <dt>True relative residual</dt>
              <dd>{row.result.relative_residual?.toExponential(3)}</dd>
              <dt>Maximum displacement</dt>
              <dd>{format(row.result.max_displacement_mm)} mm</dd>
              <dt>Maximum bond slip</dt>
              <dd>{format(row.result.max_bond_slip_mm, 4)} mm</dd>
              <dt>Yield margin</dt>
              <dd>{format(row.result.safety_factor, 4)}×</dd>
            </dl>
          )}
          <button
            className="ws-button"
            onClick={() =>
              saveJSON(`trabecular-scenario-${source(row.id)}.json`, row)
            }
          >
            Download scenario evidence
          </button>
        </div>
      )}
      <div className="ws-overview-actions">
        <button
          className="ws-button"
          onClick={() => saveJSON("trabecular-study.json", result)}
        >
          Export study JSON
        </button>
        <button
          className="ws-button"
          onClick={() =>
            exportStudyCSV(job.id).catch((e) => setError(e.message))
          }
        >
          Export CSV
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
