"use client";
import { useState } from "react";
import { ArrowDownToLine, Play, ScatterChart } from "lucide-react";
import { Cohort, downloadCSV } from "@/lib/engine";
export default function CohortTab({
  cohort,
  busy,
  stale,
  onRun,
}: {
  cohort: Cohort | null;
  busy: boolean;
  stale: boolean;
  onRun: () => void;
}) {
  const [selected, setSelected] = useState(0);
  const samples = cohort?.samples ?? [];
  const maxY = Math.max(600, ...samples.map((s) => s.peak_stress)) * 1.12;
  const x = (modulus: number) => 70 + ((modulus - 450) / 1450) * 650;
  const y = (stress: number) => 300 - (stress / maxY) * 245;
  const sample = samples[selected] ?? samples[0];
  return (
    <section className="cohort-workspace">
      <div className="section-title">
        <div>
          <span className="eyebrow">PARAMETER STUDY</span>
          <h1>
            Stiffness envelope<span>.</span>
          </h1>
          <p>One plate design. Ten bone-support stiffness scenarios.</p>
        </div>
        <button className="primary-button" disabled={busy} onClick={onRun}>
          <Play size={15} />
          {busy
            ? "Computing…"
            : cohort
              ? "Run sweep again"
              : "Run stiffness sweep"}
        </button>
      </div>
      {stale && cohort && (
        <div className="inline-warning">
          The design has changed. Run a new sweep for the current parameters.
        </div>
      )}
      {cohort ? (
        <>
          <div className="cohort-stats">
            <div className="glass">
              <span>Scenarios meeting constraints</span>
              <strong>
                {cohort.passed}
                <small> / {cohort.total}</small>
              </strong>
            </div>
            <div className="glass">
              <span>Worst-case stress</span>
              <strong>
                {cohort.max_stress.toFixed(1)}
                <small> MPa</small>
              </strong>
            </div>
            <div className="glass">
              <span>Minimum safety factor</span>
              <strong>
                {cohort.min_sf.toFixed(2)}
                <small>×</small>
              </strong>
            </div>
            <div className="glass">
              <span>Support stiffness range</span>
              <strong>
                450–1,900<small> MPa</small>
              </strong>
            </div>
          </div>
          <div className="cohort-content">
            <div className="glass scatter-panel">
              <div className="panel-heading">
                <h3>Stress response</h3>
                <span className="tiny-tag">
                  {cohort.total} computed scenarios
                </span>
              </div>
              <svg
                viewBox="0 0 780 350"
                role="img"
                aria-label="Bone modulus versus computed plate stress"
              >
                {[0, 1, 2, 3, 4].map((i) => (
                  <g key={i}>
                    <line
                      x1="70"
                      x2="720"
                      y1={300 - i * 61.25}
                      y2={300 - i * 61.25}
                      stroke="#262a2b"
                      strokeDasharray="3 6"
                    />
                    <text
                      x="57"
                      y={304 - i * 61.25}
                      textAnchor="end"
                      fill="#81878b"
                      fontSize="10"
                    >
                      {Math.round((i * maxY) / 4)}
                    </text>
                  </g>
                ))}
                {[450, 800, 1200, 1600, 1900].map((e) => (
                  <text
                    key={e}
                    x={x(e)}
                    y="323"
                    textAnchor="middle"
                    fill="#81878b"
                    fontSize="10"
                  >
                    {e}
                  </text>
                ))}
                <text x="70" y="25" fill="#a8aeb1" fontSize="11">
                  Plate equivalent stress (MPa)
                </text>
                <text
                  x="395"
                  y="345"
                  fill="#a8aeb1"
                  fontSize="11"
                  textAnchor="middle"
                >
                  Bone support modulus (MPa)
                </text>
                <line
                  x1="70"
                  x2="720"
                  y1={y(880 / samples[0].params.min_sf)}
                  y2={y(880 / samples[0].params.min_sf)}
                  stroke="#dda96b"
                  strokeDasharray="5 5"
                />
                <text
                  x="716"
                  y={y(880 / samples[0].params.min_sf) - 8}
                  fill="#dda96b"
                  fontSize="10"
                  textAnchor="end"
                >
                  Stress limit
                </text>
                <polyline
                  points={samples
                    .map((s) => `${x(s.params.modulus)},${y(s.peak_stress)}`)
                    .join(" ")}
                  fill="none"
                  stroke="#c2e9a0"
                  strokeWidth="2"
                  opacity=".6"
                />
                {samples.map((s, i) => (
                  <g
                    key={s.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Select scenario ${i + 1}`}
                    onClick={() => setSelected(i)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setSelected(i);
                    }}
                    className="scatter-point"
                  >
                    <circle
                      cx={x(s.params.modulus)}
                      cy={y(s.peak_stress)}
                      r={i === selected ? 12 : 8}
                      fill={i === selected ? "#c2e9a022" : "transparent"}
                    />
                    <circle
                      cx={x(s.params.modulus)}
                      cy={y(s.peak_stress)}
                      r={i === selected ? 5 : 4}
                      fill={s.passed ? "#c2e9a0" : "#ef8c83"}
                      stroke="#0b0e0e"
                      strokeWidth="2"
                    />
                  </g>
                ))}
              </svg>
              <div className="selected-scenario">
                <span>Scenario {selected + 1}</span>
                <strong>{sample?.params.modulus.toFixed(0)} MPa</strong>
                <span>{sample?.peak_stress.toFixed(1)} MPa peak</span>
                <span>{sample?.safety_factor.toFixed(2)}× safety factor</span>
              </div>
            </div>
            <div className="glass scenario-table">
              <div className="panel-heading">
                <h3>Computed scenarios</h3>
                <button
                  className="icon-button"
                  aria-label="Download sweep CSV"
                  title="Download sweep CSV"
                  onClick={() => downloadCSV(cohort)}
                >
                  <ArrowDownToLine size={16} />
                </button>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Scenario / E</th>
                      <th>Stress</th>
                      <th>SF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {samples.map((s, i) => (
                      <tr
                        key={s.id}
                        className={i === selected ? "selected" : ""}
                      >
                        <td>
                          <button onClick={() => setSelected(i)}>
                            <strong>{String(i + 1).padStart(2, "0")}</strong>{" "}
                            {s.params.modulus.toFixed(0)} MPa
                          </button>
                        </td>
                        <td>{s.peak_stress.toFixed(1)}</td>
                        <td className={s.passed ? "green-text" : "red-text"}>
                          {s.safety_factor.toFixed(2)}×
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <p className="study-note">
            This sweep varies the supports of one reduced plate model. It is not
            a population of distinct mandibles or evidence of 510(k) compliance.
          </p>
        </>
      ) : (
        <div className="empty-state glass">
          <ScatterChart size={40} />
          <h2>Explore the stiffness range</h2>
          <p>
            Run the current design across ten values from 450 to 1,900 MPa.
            Every point is computed by the same finite-element model.
          </p>
          <span>Current design and load are held constant.</span>
        </div>
      )}
    </section>
  );
}
