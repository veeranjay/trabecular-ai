"use client";
import { useState } from "react";
import ImportDialog from "./ImportDialog";
import StudyEvidence from "./StudyEvidence";
import {
  Activity,
  ArrowRight,
  Box,
  FlaskConical,
  Play,
  Plus,
  X,
} from "lucide-react";
import { Case, Job, JobResult, WorkspaceState } from "@/lib/workspace";
import { JobState, title } from "./WorkspaceInspector";
export type Area = "workspace" | "cases" | "studies" | "runs" | "lab";
export default function WorkspaceOverview({
  area,
  data,
  busy,
  reviewed,
  result,
  selectedJob,
  openCase,
  create,
  runStudy,
  viewJob,
  cancel,
  uploadImport,
}: {
  area: Area;
  data: WorkspaceState | null;
  busy: string;
  reviewed: boolean;
  result: JobResult | null;
  selectedJob?: Job;
  openCase: (item: Case) => void;
  create: (anatomy: string) => void;
  runStudy: () => void;
  viewJob: (job: Job) => void;
  cancel: (job: Job) => void;
  uploadImport: (file: File, units: string) => Promise<boolean>;
}) {
  const [importOpen, setImportOpen] = useState(false);
  return (
    <main className="ws-overview">
      <div className="ws-overview-heading">
        <div>
          <span className="ws-eyebrow">Your workspace</span>
          <h1>
            {area === "cases"
              ? "Every design starts with a case."
              : area === "studies"
                ? "Explore the uncertainty."
                : "A traceable path to every result."}
          </h1>
          <p>
            {area === "cases"
              ? "Real reference anatomy. Versioned geometry. Your saved work."
              : area === "studies"
                ? "Two anatomies, three load scenarios, three bone moduli. Eighteen calculations."
                : "Queued, completed and failed calculations remain part of the evidence."}
          </p>
        </div>
        {area === "cases" && (
          <div className="ws-overview-actions">
            <button
              className="ws-button"
              disabled={!!busy}
              onClick={() => setImportOpen(true)}
            >
              Import STL
            </button>
            <button
              className="ws-primary"
              disabled={!!busy}
              onClick={() => create("female")}
            >
              <Plus size={15} />
              New reference case
            </button>
          </div>
        )}
      </div>
      {area === "cases" ? (
        <>
          <div className="ws-case-grid">
            {data?.cases.map((item) => (
              <button
                className="ws-case-card"
                key={item.id}
                onClick={() => openCase(item)}
              >
                <span className="ws-eyebrow">
                  {item.import_id
                    ? "Imported STL"
                    : `${title(item.anatomy_id)} reference`}
                </span>
                <Box size={44} strokeWidth={0.8} />
                <h2>{item.name}</h2>
                <p>
                  {
                    data.revisions.filter((rev) => rev.case_id === item.id)
                      .length
                  }{" "}
                  saved revisions ·{" "}
                  {
                    data.jobs.filter(
                      (job) =>
                        job.case_id === item.id && job.state === "completed",
                    ).length
                  }{" "}
                  completed jobs
                </p>
                <span>
                  Open case <ArrowRight size={15} />
                </span>
              </button>
            ))}
          </div>
          <h2 className="ws-section-heading">Reference library</h2>
          <div className="ws-library">
            {["male", "female"].map((anatomy) => (
              <div key={anatomy}>
                <div>
                  <strong>Visible Human · {title(anatomy)}</strong>
                  <p>
                    Distinct CT anatomy · prepared split reference · CC BY 4.0
                  </p>
                </div>
                <button
                  className="ws-button"
                  disabled={!!busy}
                  onClick={() => create(anatomy)}
                >
                  <Plus size={15} />
                  Use reference
                </button>
              </div>
            ))}
          </div>
        </>
      ) : area === "studies" ? (
        <>
          <div className="ws-study-intro">
            <FlaskConical size={34} />
            <div>
              <h2>Cross-anatomy envelope</h2>
              <p>
                Shared plate thickness and width, with each anatomy’s reviewed
                placement and registrations. Local jobs run one at a time.
              </p>
            </div>
            <button
              className="ws-primary"
              disabled={!!busy || !reviewed}
              onClick={runStudy}
            >
              <Play size={14} />
              Queue 18 scenarios
            </button>
          </div>
          {data?.jobs
            .filter((job) => job.action === "study")
            .map((job) => (
              <button
                className="ws-list-job"
                key={job.id}
                onClick={() => viewJob(job)}
              >
                <FlaskConical size={17} />
                <span>
                  18-scenario study<small>{job.stage}</small>
                </span>
                <JobState job={job} />
              </button>
            ))}
          {result &&
            "scenarios" in result &&
            selectedJob?.action === "study" && (
              <StudyEvidence result={result} job={selectedJob} />
            )}
          {selectedJob?.action === "study" &&
            ["queued", "running"].includes(selectedJob.state) && (
              <div className="ws-study-intro">
                <div>
                  <strong>{selectedJob.stage}</strong>
                  <p>
                    Computed scenario evidence is saved after each calculation.
                  </p>
                </div>
                <button
                  className="ws-button"
                  onClick={() => cancel(selectedJob)}
                >
                  Cancel study
                </button>
              </div>
            )}
        </>
      ) : (
        <div className="ws-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Analysis</th>
                <th>Case / revision</th>
                <th>State</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data?.jobs.map((job) => (
                <tr key={job.id}>
                  <td>
                    {title(
                      job.action.replace("benchmark3d", "3D calculation check"),
                    )}
                    <small>{job.stage}</small>
                  </td>
                  <td>
                    {data.cases.find((item) => item.id === job.case_id)?.name}
                    <small>
                      {
                        data.revisions.find(
                          (item) => item.id === job.revision_id,
                        )?.label
                      }
                    </small>
                  </td>
                  <td>
                    <JobState job={job} />
                  </td>
                  <td>{new Date(job.created_at).toLocaleString()}</td>
                  <td>
                    <button className="ws-button" onClick={() => viewJob(job)}>
                      Open <ArrowRight size={14} />
                    </button>
                    {["queued", "running"].includes(job.state) && (
                      <button
                        className="ws-icon"
                        aria-label="Cancel job"
                        onClick={() => cancel(job)}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data?.jobs.length === 0 && (
            <div className="ws-empty">
              <Activity size={30} />
              <h3>Your first run will appear here.</h3>
            </div>
          )}
        </div>
      )}
      {importOpen && (
        <ImportDialog
          busy={!!busy}
          upload={uploadImport}
          close={() => setImportOpen(false)}
        />
      )}
    </main>
  );
}
