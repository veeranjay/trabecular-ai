"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  Box,
  ChevronRight,
  CircleHelp,
  FlaskConical,
  FolderOpen,
  LoaderCircle,
  Maximize2,
  Minimize2,
  PanelRightClose,
  PanelRightOpen,
  Play,
  Save,
  Settings2,
  ScanLine,
  ShieldCheck,
  X,
} from "lucide-react";
import CaseViewport, { CaseViewportHandle } from "./CaseViewport";
import WorkspaceInspector, { format, Stage } from "./WorkspaceInspector";
import WorkspaceOverview, { Area } from "./WorkspaceOverview";
import DeepgramDock from "./DeepgramDock";
import WorkspaceEvidence from "./WorkspaceEvidence";
import ImplicitLab from "./ImplicitLab";
import { auth } from "@/lib/auth";
import {
  api,
  Case,
  Geometry,
  isJaw,
  Job,
  JobResult,
  parametersEqual,
  PlateParameters,
  Region,
  Revision,
  setAccessToken,
  WorkspaceError,
  WorkspaceState,
  exportCase,
  importSTL,
  Vec3,
  exportReport,
  exportVolumeFields,
} from "@/lib/workspace";
import "@/app/workspace.css";
import { ClipSettings, CameraBookmark } from "@/lib/inspection";

export default function Workspace() {
  const [data, setData] = useState<WorkspaceState | null>(null);
  const [caseId, setCaseId] = useState("");
  const [revisionId, setRevisionId] = useState("");
  const [params, setParams] = useState<PlateParameters | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [reviewed, setReviewed] = useState(false);
  const [importOrientation, setImportOrientation] = useState<Vec3>([0, 0, 0]);
  const [geometry, setGeometry] = useState<Geometry | null>(null);
  const [area, setArea] = useState<Area>("workspace");
  const [stage, setStage] = useState<Stage>("prepare");
  const [jobId, setJobId] = useState("");
  const [loadedResult, setLoadedResult] = useState<{
    id: string;
    result: JobResult;
  } | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [inspector, setInspector] = useState(true);
  const [settings, setSettings] = useState(false);
  const [evidence, setEvidence] = useState(false);
  const [presentation, setPresentation] = useState(false);
  const [bone, setBone] = useState(true);
  const [opacity, setOpacity] = useState(1);
  const [clip, setClip] = useState<ClipSettings>({
    axis: "off",
    position: 0,
    flipped: false,
  });
  const [amplification, setAmplification] = useState(0);
  const [comparisonId, setComparisonId] = useState("");
  const [comparisonPending, setComparisonPending] = useState(false);
  const [cameraView, setCameraView] = useState("perspective");
  const [bookmarks, setBookmarks] = useState<CameraBookmark[]>([]);
  const [comparisonBones, setComparisonBones] = useState(false);
  const [comparison, setComparison] = useState<{
    id: string;
    geometry: Geometry;
    result: JobResult | null;
  } | null>(null);
  const [mode, setMode] = useState<"material" | "stress" | "displacement">(
    "material",
  );
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [quality, setQuality] = useState("preview");
  const [login, setLogin] = useState(false);
  const [email, setEmail] = useState("");
  const viewport = useRef<CaseViewportHandle>(null);
  const cache = useRef(new Map<string, JobResult>());
  const savedGeometry = useRef(new Map<string, Geometry>());
  const protectDraft = useRef(false);
  const selectedCase = data?.cases.find((item) => item.id === caseId);
  const revision = data?.revisions.find((item) => item.id === revisionId);
  const jobs = data?.jobs.filter((item) => item.case_id === caseId) || [];
  const selectedJob = jobs.find((item) => item.id === jobId);
  const result =
    loadedResult?.id === jobId &&
    (selectedJob?.state === "completed" ||
      selectedJob?.action === "study" ||
      selectedJob?.action === "optimize")
      ? loadedResult.result
      : null;
  const jaw = isJaw(result) ? result : null;
  const regionSignature = (items: Region[]) =>
    JSON.stringify(
      items.map((item) => ({
        id: item.id,
        kind: item.kind,
        center: item.center,
        radius: item.radius,
        vector: item.vector || null,
        points: item.points || null,
        source: item.source,
      })),
    );
  const preparationDirty =
    !!revision &&
    (regionSignature(regions) !== regionSignature(revision.regions) ||
      reviewed !== revision.preparation_reviewed ||
      JSON.stringify(importOrientation) !==
        JSON.stringify(revision.import_orientation || [0, 0, 0]));
  const dirty =
    !!params &&
    !!revision &&
    (!parametersEqual(params, revision.params) ||
      preparationDirty ||
      reviewed !== revision.preparation_reviewed);
  const stale =
    !!jaw && (jaw.geometry_hash !== revision?.geometry_hash || dirty);
  const matchingGeometry =
    geometry && params && parametersEqual(geometry.params, params)
      ? geometry
      : geometry?.geometry_hash === revision?.geometry_hash
        ? geometry
        : null;
  const activeJobs = jobs.filter((item) =>
    ["queued", "running"].includes(item.state),
  );
  const hasData = !!data;
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setEvidence(false);
        setSettings(false);
        setPresentation(false);
      }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);
  useEffect(() => {
    const compact = window.matchMedia("(max-width: 999px)");
    const syncInspector = () => setInspector(!compact.matches);
    queueMicrotask(syncInspector);
    compact.addEventListener("change", syncInspector);
    return () => compact.removeEventListener("change", syncInspector);
  }, []);
  const fail = useCallback((problem: unknown) => {
    if (problem instanceof WorkspaceError && problem.status === 401)
      setLogin(true);
    setError(
      problem instanceof Error
        ? problem.message
        : "Something went wrong. Please retry.",
    );
  }, []);
  const refresh = useCallback(async (bootstrap = false) => {
    const state = await api<WorkspaceState>(
      bootstrap ? "bootstrap" : "state",
      bootstrap ? "POST" : "GET",
    );
    setData(state);
    setLogin(false);
    return state;
  }, []);
  const openCase = useCallback(
    (item: Case, state: WorkspaceState, target?: Revision) => {
      const next =
        target ||
        state.revisions.find((value) => value.id === item.latest_revision_id);
      if (!next) return;
      protectDraft.current = !!target;
      let draft: {
        params: PlateParameters;
        regions: Region[];
        reviewed: boolean;
        importOrientation?: Vec3;
      } | null = null;
      if (!target) {
        try {
          const saved = JSON.parse(
            localStorage.getItem(`trabecular-draft:${next.id}`) || "null",
          );
          if (
            saved?.params &&
            Array.isArray(saved.regions) &&
            typeof saved.reviewed === "boolean"
          )
            draft = saved;
        } catch {}
      }
      setCaseId(item.id);
      setComparisonPending(false);
      setCameraView("perspective");
      try {
        const saved = JSON.parse(
          localStorage.getItem(`trabecular-cameras:${item.id}`) || "[]",
        );
        setBookmarks(
          Array.isArray(saved)
            ? saved
                .filter(
                  (v) =>
                    typeof v.name === "string" &&
                    typeof v.id === "string" &&
                    Array.isArray(v.position) &&
                    v.position.length === 3 &&
                    v.position.every(Number.isFinite) &&
                    Array.isArray(v.target) &&
                    v.target.length === 3 &&
                    v.target.every(Number.isFinite) &&
                    Number.isFinite(v.aspect) &&
                    v.aspect > 0,
                )
                .slice(0, 8)
            : [],
        );
      } catch {
        setBookmarks([]);
      }
      setComparisonId("");
      setComparison(null);
      setClip({ axis: "off", position: 0, flipped: false });
      setAmplification(0);
      setRevisionId(next.id);
      setParams(draft?.params || next.params);
      setImportOrientation(
        draft?.importOrientation ||
          (target ? next.import_orientation : item.import_orientation) || [
            0, 0, 0,
          ],
      );
      setRegions(draft?.regions || (target ? next.regions : item.regions));
      setReviewed(
        draft
          ? draft.reviewed
          : target
            ? next.preparation_reviewed
            : item.reviewed,
      );
      setJobId(
        state.jobs.find(
          (job) =>
            job.case_id === item.id &&
            job.revision_id === next.id &&
            job.action === "solve" &&
            ["completed", "running", "queued"].includes(job.state),
        )?.id || "",
      );
      setMode("material");
      setSelectedRegion(null);
      setArea("workspace");
      localStorage.setItem("trabecular-case", item.id);
    },
    [],
  );
  useEffect(() => {
    let alive = true;
    const initialize = async () => {
      if (auth) {
        const session = (await auth.auth.getSession()).data.session;
        setAccessToken(session?.access_token || null);
      }
      const state = await refresh(true);
      if (!alive) return;
      const preferred = localStorage.getItem("trabecular-case");
      const item =
        state.cases.find((value) => value.id === preferred) || state.cases[0];
      if (item) openCase(item, state);
    };
    initialize().catch(fail);
    const subscription = auth?.auth.onAuthStateChange((event, session) => {
      setAccessToken(session?.access_token || null);
      if (event === "SIGNED_IN")
        queueMicrotask(() => {
          refresh(true)
            .then((state) => {
              if (state.cases[0]) openCase(state.cases[0], state);
            })
            .catch(fail);
        });
      if (event === "SIGNED_OUT") {
        setLogin(true);
      }
    });
    return () => {
      alive = false;
      subscription?.data.subscription.unsubscribe();
    };
  }, [refresh, openCase, fail]);
  useEffect(() => {
    if (!hasData || login) return;
    const timer = setInterval(
      () => {
        refresh().catch(fail);
      },
      activeJobs.length ? 1500 : 8000,
    );
    return () => clearInterval(timer);
  }, [hasData, login, activeJobs.length, refresh, fail]);
  useEffect(() => {
    if (!caseId || !revisionId) return;
    const controller = new AbortController();
    api<Geometry>(
      `cases/${caseId}/revisions/${revisionId}/geometry`,
      "GET",
      undefined,
      controller.signal,
    )
      .then((value) => {
        savedGeometry.current.set(revisionId, value);
        setGeometry(value);
      })
      .catch((problem) => {
        if (problem.name !== "AbortError") fail(problem);
      });
    return () => controller.abort();
  }, [caseId, revisionId, fail]);
  useEffect(() => {
    if (!revisionId || !params) return;
    if (dirty) {
      protectDraft.current = false;
      localStorage.setItem(
        `trabecular-draft:${revisionId}`,
        JSON.stringify({ params, regions, reviewed, importOrientation }),
      );
    } else if (!protectDraft.current)
      localStorage.removeItem(`trabecular-draft:${revisionId}`);
  }, [revisionId, params, regions, reviewed, importOrientation, dirty]);
  const comparisonBelongs = !!data?.revisions.some(
    (r) => r.id === comparisonId && r.case_id === caseId,
  );
  const comparisonJobId = data?.jobs.find(
    (j) =>
      j.case_id === caseId &&
      j.revision_id === comparisonId &&
      j.action === "solve" &&
      j.state === "completed",
  )?.id;
  useEffect(() => {
    if (!caseId || !comparisonId || !comparisonBelongs) {
      queueMicrotask(() => setComparisonPending(false));
      return;
    }
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) setComparisonPending(true);
    });
    Promise.all([
      api<Geometry>(
        `cases/${caseId}/revisions/${comparisonId}/geometry`,
        "GET",
        undefined,
        controller.signal,
      ),
      comparisonJobId
        ? cache.current.has(comparisonJobId)
          ? Promise.resolve(cache.current.get(comparisonJobId)!)
          : api<JobResult>(
              `jobs/${comparisonJobId}/result`,
              "GET",
              undefined,
              controller.signal,
            )
        : Promise.resolve(null),
    ])
      .then(([geometry, result]) => {
        if (!controller.signal.aborted) {
          if (comparisonJobId && result)
            cache.current.set(comparisonJobId, result);
          setComparison({ id: comparisonId, geometry, result });
        }
      })
      .catch((problem) => {
        if (problem.name !== "AbortError") fail(problem);
      })
      .finally(() => {
        if (!controller.signal.aborted) setComparisonPending(false);
      });
    return () => controller.abort();
  }, [caseId, comparisonId, comparisonBelongs, comparisonJobId, fail]);
  useEffect(() => {
    if (!caseId || !params) return;
    if (!dirty) {
      const saved = savedGeometry.current.get(revisionId);
      if (saved) Promise.resolve(saved).then(setGeometry);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      api<Geometry>(
        `cases/${caseId}/preview`,
        "POST",
        {
          params,
          regions,
          import_orientation: importOrientation,
          cad_version: revision?.cad_version || 3,
        },
        controller.signal,
      )
        .then((value) => {
          if (!controller.signal.aborted) setGeometry(value);
        })
        .catch((problem) => {
          if (problem.name !== "AbortError") fail(problem);
        });
    }, 450);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    caseId,
    revisionId,
    revision?.cad_version,
    params,
    regions,
    importOrientation,
    dirty,
    fail,
  ]);
  const resultJobId = selectedJob?.id;
  const resultJobComplete = selectedJob?.state === "completed";
  const resultJobStudy =
    selectedJob?.action === "study" || selectedJob?.action === "optimize";
  const resultJobActive =
    selectedJob?.state === "queued" || selectedJob?.state === "running";
  const resultProgress = selectedJob?.progress;
  useEffect(() => {
    if (!resultJobId || (!resultJobComplete && !resultJobStudy)) return;
    const id = resultJobId;
    const partial = !resultJobComplete;
    let alive = true;
    const cached = cache.current.get(id);
    const loadEvidence = () =>
      (cached && !partial
        ? Promise.resolve(cached)
        : api<JobResult>(`jobs/${id}/result${partial ? "?partial=true" : ""}`)
      )
        .then((value) => {
          if (alive) {
            if (!partial) cache.current.set(id, value);
            setLoadedResult({ id, result: value });
          }
        })
        .catch((problem) => {
          if (!(
            partial &&
            problem instanceof WorkspaceError &&
            problem.status === 409
          ))
            fail(problem);
        });
    loadEvidence();
    const timer =
      partial && resultJobActive ? setInterval(loadEvidence, 3000) : undefined;
    return () => {
      alive = false;
      if (timer) clearInterval(timer);
    };
  }, [
    resultJobId,
    resultJobComplete,
    resultJobStudy,
    resultJobActive,
    resultProgress,
    fail,
  ]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  async function action(name: string, task: () => Promise<void>) {
    setBusy(name);
    setError("");
    try {
      await task();
    } catch (problem) {
      fail(problem);
    } finally {
      setBusy("");
    }
  }
  async function saveRevision(cadVersion?: 3 | 4 | 5) {
    if (!selectedCase || !params || !revision)
      throw new Error("Open a case first.");
    if (
      regionSignature(regions) !== regionSignature(selectedCase.regions) ||
      reviewed !== selectedCase.reviewed ||
      JSON.stringify(importOrientation) !==
        JSON.stringify(selectedCase.import_orientation || [0, 0, 0])
    )
      await api(`cases/${caseId}/preparation`, "PUT", {
        regions,
        reviewed,
        units: "mm",
        import_orientation: selectedCase.import_id ? importOrientation : null,
      });
    const next = await api<Revision>(`cases/${caseId}/revisions`, "POST", {
      params,
      parent_id: revisionId,
      cad_version: cadVersion || revision.cad_version || 3,
      label: `Revision ${(data?.revisions.filter((item) => item.case_id === caseId).length || 0) + 1}`,
    });
    localStorage.removeItem(`trabecular-draft:${revisionId}`);
    await refresh();
    setRevisionId(next.id);
    setNotice("Revision saved. Geometry and inputs are versioned together.");
    return next;
  }
  const save = (next?: Stage) => {
    action("save", async () => {
      if (dirty) await saveRevision();
      if (next) {
        setStage(next);
        setSelectedRegion(null);
      }
    });
  };
  const revertDraft = () => {
    if (!revision) return;
    protectDraft.current = false;
    localStorage.removeItem(`trabecular-draft:${revision.id}`);
    setParams(revision.params);
    setRegions(revision.regions);
    setReviewed(revision.preparation_reviewed);
    setImportOrientation(revision.import_orientation || [0, 0, 0]);
    setSelectedRegion(null);
    setNotice("Restored the saved revision and its matching evidence.");
  };
  async function run(kind: Job["action"]) {
    await action("queue", async () => {
      const saved = dirty ? await saveRevision() : revision;
      if (!saved) throw new Error("Open a prepared case first.");
      const job = await api<Job>("jobs", "POST", {
        action: kind,
        case_id: caseId,
        revision_id: saved.id,
        model: "gpu3d",
        quality,
      });
      setJobId(job.id);
      setStage("analyze");
      setArea(kind === "study" ? "studies" : "workspace");
      setMode("material");
      await refresh();
      setNotice(
        job.reused
          ? "Opened the matching saved job."
          : "Queued on your local GPU. No Modal credits used.",
      );
    });
  }
  const change = (key: keyof PlateParameters, value: number | string) =>
    setParams((previous) =>
      previous ? { ...previous, [key]: value } : previous,
    );
  function changeRegion(
    id: string,
    key: "center" | "radius" | "vector" | "points",
    value: number | number[] | number[][] | null,
  ) {
    setRegions((previous) =>
      previous.map((region) =>
        region.id === id
          ? ({
              ...region,
              [key]: value,
              ...(key === "points" && Array.isArray(value) && value.length
                ? {
                    center: [0, 1, 2].map(
                      (axis) =>
                        (value as Vec3[]).reduce((sum, p) => sum + p[axis], 0) /
                        value.length,
                    ) as Vec3,
                  }
                : {}),
              source: "manual",
            } as Region)
          : region,
      ),
    );
    setReviewed(false);
  }
  function pick(position: [number, number, number]) {
    const annotation = regions.find((item) => item.id === selectedRegion);
    if (!annotation || !params) return;
    if (annotation.kind !== "support") position[2] -= params.advancement;
    if (annotation.points) {
      if (annotation.points.length >= 20) {
        setNotice("A keep-out path supports up to 20 points.");
        return;
      }
      changeRegion(annotation.id, "points", [
        ...annotation.points,
        position.map((value) => Math.round(value * 100) / 100) as Vec3,
      ]);
      return;
    }
    changeRegion(
      annotation.id,
      "center",
      position.map((value) => Math.round(value * 100) / 100),
    );
  }
  const cancel = (job: Job) => {
    action("cancel", async () => {
      await api(`jobs/${job.id}/cancel`, "POST");
      await refresh();
    });
  };
  async function create(anatomy: string) {
    await action("create", async () => {
      const item = await api<Case>("cases", "POST", {
        name: `${anatomy === "male" ? "Male" : "Female"} reference · advancement`,
        anatomy_id: anatomy,
      });
      const state = await refresh();
      openCase(item, state);
      setStage("prepare");
    });
  }
  async function uploadImport(file: File, units: string) {
    setBusy("import");
    setError("");
    try {
      const item = await importSTL(file, units);
      const state = await refresh();
      openCase(item, state);
      setStage("prepare");
      return true;
    } catch (problem) {
      fail(problem);
      return false;
    } finally {
      setBusy("");
    }
  }
  function viewJob(job: Job) {
    if (!data) return;
    const item = data.cases.find((value) => value.id === job.case_id),
      rev = data.revisions.find((value) => value.id === job.revision_id);
    if (item && rev) {
      openCase(item, data, rev);
      setJobId(job.id);
      setStage("analyze");
      if (job.action === "study") setArea("studies");
    }
  }
  function navigateArea(next: Area) {
    setArea(next);
    if (next === "workspace" && selectedJob?.action !== "solve") {
      setJobId(
        jobs.find(
          (j) =>
            j.revision_id === revisionId &&
            j.action === "solve" &&
            j.state === "completed",
        )?.id || "",
      );
      setMode("material");
    }
  }
  function saveBookmark(name: string) {
    action("view", async () => {
      const title = name.trim().slice(0, 60);
      if (!title) throw new Error("Name this camera view first.");
      const pose = viewport.current?.captureView();
      if (!pose) throw new Error("Open the 3D case before saving a view.");
      const existing = bookmarks.find((b) => b.name === title);
      if (bookmarks.length >= 8 && !existing)
        throw new Error(
          "You can save eight camera views. Remove one before adding another.",
        );
      const next = [
        { ...pose, name: title, id: existing?.id || crypto.randomUUID() },
        ...bookmarks.filter((b) => b.id !== existing?.id),
      ];
      setBookmarks(next);
      localStorage.setItem(
        `trabecular-cameras:${caseId}`,
        JSON.stringify(next),
      );
      setNotice("Camera view saved on this device.");
    });
  }
  if (login)
    return (
      <div className="ws-auth">
        <div className="ws-brand">
          t<span>Trabecular</span>
        </div>
        <h1>Your engineering workspace.</h1>
        <p>Sign in to open private cases and analysis history.</p>
        {auth ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              action("sign-in", async () => {
                const response = await auth!.auth.signInWithOtp({
                  email,
                  options: { emailRedirectTo: window.location.origin },
                });
                if (response.error) throw response.error;
                setNotice("Check your email for the sign-in link.");
              });
            }}
          >
            <label>
              Email address
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
              />
            </label>
            <button className="ws-primary" disabled={!!busy}>
              Send sign-in link
            </button>
          </form>
        ) : (
          <p>
            Add Supabase URL and publishable configuration to
            frontend/.env.local, then restart the app.
          </p>
        )}
        {error && <p className="ws-error">{error}</p>}
        {notice && <p>{notice}</p>}
      </div>
    );
  return (
    <div className={`ws-app ${presentation ? "ws-presenting" : ""}`}>
      <nav className="ws-rail" aria-label="Main navigation">
        <button
          className="ws-logo"
          title="Trabecular workspace"
          onClick={() => navigateArea("workspace")}
        >
          t
        </button>
        <div>
          {(
            [
              ["cases", FolderOpen, "Cases"],
              ["workspace", Box, "Workspace"],
              ["lab", ScanLine, "Implicit Lab"],
              ["studies", FlaskConical, "Studies"],
              ["runs", Activity, "Runs"],
            ] as const
          ).map(([key, Icon, label]) => (
            <button
              key={key}
              className={area === key ? "active" : ""}
              title={label}
              aria-label={label}
              aria-current={area === key ? "page" : undefined}
              onClick={() => navigateArea(key)}
            >
              <Icon size={20} />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <button
          title="Services and setup"
          aria-label="Services and setup"
          onClick={() => setSettings(true)}
        >
          <Settings2 size={20} />
        </button>
      </nav>
      <div className="ws-shell">
        <header className="ws-header glass">
          <div className="ws-breadcrumb">
            <span>Workspace</span>
            <ChevronRight size={14} />
            <select
              aria-label="Active case"
              value={caseId}
              onChange={(event) => {
                const item = data?.cases.find(
                  (value) => value.id === event.target.value,
                );
                if (item && data) openCase(item, data);
              }}
            >
              {!data && <option>Opening workspace…</option>}
              {data?.cases.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="ws-header-actions">
            <span className="ws-save-state" title={dirty ? "Unsaved changes" : "Revision saved"}>
              <span className={dirty ? "dot caution" : "dot"} />
              {dirty ? "Unsaved" : ""}
            </span>
            <button
              className="ws-button ws-presentation-toggle"
              aria-pressed={presentation}
              onClick={() => setPresentation(!presentation)}
              title="Presentation view · Escape to exit"
            >
              {presentation ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              {presentation ? "Exit presentation" : "Present"}
            </button>
            <button
              className="ws-button ws-save"
              disabled={!!busy || !revision || !dirty}
              onClick={() => save()}
            >
              <Save size={15} />
              Save revision
            </button>
            <button
              className="ws-primary"
              disabled={
                !!busy || !revision || !reviewed || !!selectedCase?.import_id
              }
              title={
                selectedCase?.import_id
                  ? "This STL needs segmentation and fixation registration before analysis."
                  : !reviewed
                    ? "Review the annotations in Prepare first"
                    : "Run 3D analysis on your device"
              }
              onClick={() => run("solve")}
            >
              {busy === "queue" ? (
                <LoaderCircle size={15} className="spin" />
              ) : (
                <Play size={14} fill="currentColor" />
              )}
              Run analysis
            </button>
          </div>
        </header>
        {area === "workspace" ? (
          <>
            <div className="ws-stagebar">
              <div className="ws-stages">
                {(
                  [
                    "prepare",
                    "design",
                    "analyze",
                    "compare",
                    "report",
                  ] as Stage[]
                ).map((item) => (
                  <button
                    key={item}
                    className={stage === item ? "active" : ""}
                    aria-current={stage === item ? "step" : undefined}
                    onClick={() => {
                      setStage(item);
                      setInspector(true);
                      setSelectedRegion(null);
                    }}
                  >
                    {item === "report" ? "Evidence" : item.charAt(0).toUpperCase() + item.slice(1)}
                  </button>
                ))}
              </div>
              <button
                className="ws-icon"
                aria-label={inspector ? "Hide inspector" : "Show inspector"}
                onClick={() => setInspector(!inspector)}
              >
                {inspector ? (
                  <PanelRightClose size={18} />
                ) : (
                  <PanelRightOpen size={18} />
                )}
              </button>
            </div>
            <main
              className={`ws-workspace ${inspector && !presentation ? "inspector-open" : ""}`}
            >
              <section className="ws-scene">
                <div className="ws-canvas-title">
                  <span className="ws-eyebrow">
                    {revision?.label || "Opening case"}
                  </span>
                  <h1>{selectedCase?.import_id ? "Surface inspection" : "Design in context."}</h1>
                  <p>
                    {selectedCase?.import_id
                      ? "Imported surface · preparation required"
                      : params
                        ? `${format(params.advancement, 1)} mm advancement · bilateral fixation`
                        : "Loading prepared reference case"}
                  </p>
                </div>
                <div className="ws-viewbar glass">
                  <select
                    aria-label="Camera view"
                    value={cameraView}
                    onChange={(event) =>
                      viewport.current?.view(event.target.value)
                    }
                  >
                    <option value="perspective">Perspective</option>
                    <option value="front">Front</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                    <option value="top">Top</option>
                    <option value="custom" disabled>
                      Custom view
                    </option>
                  </select>
                  <span />
                  <select
                    aria-label="Display field"
                    value={mode}
                    disabled={!jaw || stale}
                    onChange={(event) => {
                      const next = event.target.value as typeof mode;
                      setMode(next);
                      if (next === "displacement" && amplification === 0)
                        setAmplification(1);
                    }}
                  >
                    <option value="material">Material</option>
                    <option value="stress">3D stress</option>
                    <option value="displacement">Displacement</option>
                  </select>
                </div>
                <CaseViewport
                  ref={viewport}
                  geometry={matchingGeometry}
                  result={jaw}
                  dirty={
                    stale || !selectedJob || selectedJob.state !== "completed"
                  }
                  mode={mode}
                  bone={bone}
                  regions={stage === "prepare"}
                  opacity={opacity}
                  clip={clip}
                  amplification={amplification}
                  comparison={
                    comparison?.id === comparisonId ? comparison.geometry : null
                  }
                  comparisonResult={
                    comparison?.id === comparisonId && isJaw(comparison.result)
                      ? comparison.result
                      : null
                  }
                  comparisonBones={comparisonBones}
                  selection={selectedRegion}
                  onPick={pick}
                  onCameraChanged={setCameraView}
                />
                <button className="ws-model-label glass" onClick={() => setEvidence(true)} title="Open model and calculation evidence">
                  <ShieldCheck size={14} />
                  {selectedCase?.import_id
                    ? "Imported STL · inspection only"
                    : dirty
                      ? matchingGeometry &&
                        params &&
                        parametersEqual(matchingGeometry.params, params)
                        ? "Unsaved design · draft geometry"
                        : "Updating draft geometry…"
                      : jaw && !stale
                        ? jaw.numerically_resolved
                          ? "Reference result · review required"
                          : "Calculation unresolved"
                        : "Reference model · not analyzed"}
                  <ChevronRight size={12} />
                </button>
                {activeJobs.length > 0 && (
                  <button
                    className="ws-job-toast glass"
                    onClick={() => viewJob(activeJobs[0])}
                  >
                    <LoaderCircle size={16} className="spin" />
                    <div>
                      <strong>{activeJobs[0].stage}</strong>
                      <span>{activeJobs.length} active local jobs</span>
                    </div>
                    <span>{Math.round(activeJobs[0].progress * 100)}%</span>
                  </button>
                )}
                {data?.capabilities.deepgram && !presentation && <DeepgramDock
                  jobs={jobs}
                  configured={data?.capabilities.deepgram || false}
                  caseId={caseId}
                  revisionId={revisionId}
                  geometryHash={revision?.geometry_hash || ""}
                  dirty={dirty}
                  onTool={(response) => {
                    if (response.revision) {
                      setRevisionId(response.revision.id);
                      setParams(response.revision.params);
                      setRegions(response.revision.regions);
                      setReviewed(response.revision.preparation_reviewed);
                      setImportOrientation(
                        response.revision.import_orientation || [0, 0, 0],
                      );
                      refresh().catch(fail);
                    }
                    if (response.job) {
                      setJobId(response.job.id);
                      setStage("analyze");
                      setArea(
                        response.job.action === "study"
                          ? "studies"
                          : "workspace",
                      );
                      refresh().catch(fail);
                    }
                    if (response.focus_region)
                      viewport.current?.focus(response.focus_region);
                  }}
                />}
              </section>
              {inspector && !presentation && (
                <WorkspaceInspector
                  stage={stage}
                  selectedCase={selectedCase}
                  revision={revision}
                  revisions={data?.revisions || []}
                  geometry={matchingGeometry}
                  params={params}
                  regions={regions}
                  reviewed={reviewed}
                  dirty={dirty}
                  busy={busy}
                  selectedRegion={selectedRegion}
                  selectedJob={selectedJob}
                  result={result}
                  stale={stale}
                  jobs={jobs}
                  quality={quality}
                  bone={bone}
                  opacity={opacity}
                  clip={clip}
                  setClip={setClip}
                  amplification={amplification}
                  setAmplification={setAmplification}
                  fieldAvailable={!!jaw && !stale}
                  comparisonId={comparisonId}
                  setComparisonId={setComparisonId}
                  comparisonBones={comparisonBones}
                  setComparisonBones={setComparisonBones}
                  comparisonLoading={comparisonPending}
                  bookmarks={bookmarks}
                  saveBookmark={saveBookmark}
                  restoreBookmark={(bookmark) =>
                    viewport.current?.restoreView(bookmark)
                  }
                  removeBookmark={(id) => {
                    const next = bookmarks.filter((b) => b.id !== id);
                    setBookmarks(next);
                    localStorage.setItem(
                      `trabecular-cameras:${caseId}`,
                      JSON.stringify(next),
                    );
                  }}
                  comparisonResult={
                    comparison?.id === comparisonId && isJaw(comparison.result)
                      ? comparison.result
                      : null
                  }
                  setStage={setStage}
                  setSelectedRegion={setSelectedRegion}
                  changeRegion={changeRegion}
                  setReviewed={setReviewed}
                  importOrientation={importOrientation}
                  changeOrientation={(value) => {
                    setImportOrientation(value);
                    setReviewed(false);
                  }}
                  change={change}
                  setQuality={setQuality}
                  setBone={setBone}
                  setOpacity={setOpacity}
                  save={save}
                  revert={revertDraft}
                  previewCandidate={(candidate) => {
                    setParams(candidate);
                    setStage("design");
                    setMode("material");
                    setNotice(
                      "Candidate geometry preview. Save a revision before running new analysis.",
                    );
                  }}
                  applyWinner={() =>
                    action("apply", async () => {
                      if (!selectedJob)
                        throw new Error("Choose a verified search result.");
                      const next = await api<Revision>(
                        `jobs/${selectedJob.id}/apply-winner`,
                        "POST",
                      );
                      setRevisionId(next.id);
                      setParams(next.params);
                      setRegions(next.regions);
                      setReviewed(next.preparation_reviewed);
                      setJobId("");
                      setMode("material");
                      await refresh();
                      setNotice(
                        "Verified design saved as a new revision. Run analysis for its field display.",
                      );
                    })
                  }
                  upgradeFixation={() =>
                    action("save", async () => {
                      await saveRevision(5);
                      setMode("material");
                      setNotice(
                        "Contoured fixation saved as a new revision. Run analysis for this geometry.",
                      );
                    })
                  }
                  run={run}
                  cancel={cancel}
                  viewJob={viewJob}
                  exportPackage={() =>
                    action("export", async () => {
                      await exportCase(caseId, revisionId);
                    })
                  }
                  exportPDF={() =>
                    action("pdf", async () => {
                      await exportReport(caseId, revisionId);
                    })
                  }
                  exportFields={() =>
                    action("fields", async () => {
                      if (selectedJob) await exportVolumeFields(selectedJob.id);
                    })
                  }
                  screenshot={() => viewport.current?.screenshot()}
                  close={() => setInspector(false)}
                />
              )}
            </main>
          </>
        ) : area === "lab" ? (
          <ImplicitLab presentation={presentation} />
        ) : (
          <WorkspaceOverview
            area={area}
            data={data}
            busy={busy}
            reviewed={reviewed && !selectedCase?.import_id}
            result={result}
            selectedJob={selectedJob}
            openCase={(item) => {
              if (data) openCase(item, data);
            }}
            create={create}
            uploadImport={uploadImport}
            runStudy={() => run("study")}
            viewJob={viewJob}
            cancel={cancel}
          />
        )}
      </div>
      {evidence && <WorkspaceEvidence revision={revision} result={jaw} stale={stale} dirty={dirty} close={() => setEvidence(false)} />}
      {(error || notice) && (
        <div
          className={`ws-toast glass ${error ? "error" : ""}`}
          role={error ? "alert" : "status"}
        >
          <span>{error || notice}</span>
          <button
            aria-label="Dismiss message"
            onClick={() => {
              setError("");
              setNotice("");
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {settings && (
        <div className="ws-modal-backdrop" onClick={() => setSettings(false)}>
          <section
            className="ws-modal glass"
            role="dialog"
            aria-modal="true"
            aria-label="Service status"
            onClick={(event) => event.stopPropagation()}
          >
            <div>
              <h2>Connected when you’re ready.</h2>
              <button
                className="ws-icon"
                aria-label="Close service status"
                onClick={() => setSettings(false)}
              >
                <X size={18} />
              </button>
            </div>
            <p>
              Service secrets stay on your device. Local development continues
              without cloud credentials.
            </p>
            {(["deepgram", "supabase", "modal"] as const).map((service) => (
              <div className="ws-service" key={service}>
                <strong>
                  {service.charAt(0).toUpperCase() + service.slice(1)}
                </strong>
                <span
                  className={`ws-status ${data?.capabilities[service] ? "" : "caution"}`}
                >
                  {data?.capabilities[service]
                    ? "Key configured"
                    : "Setup needed"}
                </span>
              </div>
            ))}
            <div className="ws-note">
              <ShieldCheck size={18} />
              <p>
                Modal execution is disabled. Local GPU work does not consume
                your $30 monthly cloud allowance.
              </p>
            </div>
            <p className="ws-small-text">
              Follow SERVICE_SETUP.md in the project root. Private keys go in
              backend/.env; public Supabase configuration goes in
              frontend/.env.local. Restart both services after editing.
            </p>
            <button
              className="ws-button full"
              onClick={() =>
                action("refresh", async () => {
                  await refresh();
                  setNotice(
                    "Service status refreshed. Restart services after editing environment files.",
                  );
                })
              }
            >
              Refresh status
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
