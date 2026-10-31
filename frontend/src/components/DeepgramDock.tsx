"use client";
import { useEffect, useRef, useState } from "react";
import { AgentMicrophone, AgentPlayer, AgentSession } from "@deepgram/agents";
import { ChevronDown, Mic, MicOff, PhoneOff, Sparkles, X } from "lucide-react";
import { api, Job, Region, Revision } from "@/lib/workspace";
export type ToolResponse = {
  revision?: Revision;
  job?: Job;
  focus_region?: Region;
  proposal?: { id: string; changes: Record<string, unknown> };
  message?: string;
};
type Props = {
  configured: boolean;
  caseId: string;
  revisionId: string;
  geometryHash: string;
  dirty: boolean;
  jobs: Job[];
  onTool: (response: ToolResponse) => void;
};
const tools = [
  {
    name: "inspect_results",
    description: "Read real saved results and current geometry checks.",
    properties: {},
  },
  {
    name: "focus_region",
    description:
      "Focus a registered region, for example nerve_left or condyle_right.",
    properties: { region_id: { type: "string" } },
  },
  {
    name: "propose_parameters",
    description:
      "Preview a parameter change without applying it. Numeric keys include thickness, width, offset, advancement, plate_shift, screw_length, screw_angle, load, modulus, min_clearance, min_sf. load_case is bilateral, left or right.",
    properties: {
      changes: {
        type: "object",
        properties: {
          ...Object.fromEntries(
            [
              "thickness",
              "width",
              "offset",
              "advancement",
              "plate_shift",
              "screw_length",
              "screw_angle",
              "load",
              "modulus",
              "min_clearance",
              "min_sf",
            ].map((name) => [name, { type: "number" }]),
          ),
          load_case: { type: "string", enum: ["bilateral", "left", "right"] },
        },
      },
    },
  },
  {
    name: "apply_parameters",
    description:
      "Apply a known proposal only after the user explicitly says to apply it.",
    properties: { proposal_id: { type: "string" } },
  },
  {
    name: "run_analysis",
    description: "Queue real local 3D analysis after an explicit user request.",
    properties: {},
  },
  {
    name: "optimize_plate",
    description:
      "Queue a bounded local section/placement search with refinement and nine-scenario verification. Only when explicitly requested; no verified winner is assumed.",
    properties: {},
  },
  {
    name: "run_study",
    description:
      "Queue eighteen local 3D scenarios across two anatomies. Only when explicitly requested.",
    properties: {},
  },
  {
    name: "cancel_job",
    description: "Cancel a queued or running job in this case and revision.",
    properties: { job_id: { type: "string" } },
  },
];
export default function DeepgramDock(props: Props) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("Disconnected");
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    [],
  );
  const [proposal, setProposal] = useState<ToolResponse["proposal"]>();
  const active = useRef<{
    session: AgentSession;
    microphone: AgentMicrophone;
    player: AgentPlayer;
    frame: number;
    caseId: string;
    revisionId: string;
  } | null>(null);
  const wantsMuted = useRef(false);
  const context = useRef(props);
  context.current = props;
  const callResponses = useRef(new Map<string, string>());
  const trackedJobs = useRef(
    new Map<string, { caseId: string; revisionId: string }>(),
  );
  const announcedJobs = useRef(new Set<string>());
  useEffect(() => {
    const runtime = active.current;
    if (!runtime || runtime.session.state !== "connected") return;
    for (const job of props.jobs) {
      const source = trackedJobs.current.get(job.id);
      if (
        !source ||
        announcedJobs.current.has(job.id) ||
        source.caseId !== props.caseId ||
        source.revisionId !== props.revisionId ||
        runtime.caseId !== props.caseId ||
        runtime.revisionId !== props.revisionId
      )
        continue;
      if (!["completed", "cancelled", "failed"].includes(job.state)) continue;
      const message =
        job.state === "completed"
          ? job.action === "solve"
            ? "Your local analysis has finished. Model qualification is still outstanding. Open the analysis evidence to review the computed result."
            : "Your local calculation has finished. Open its evidence to review the completed and failed checks."
          : job.state === "cancelled"
            ? "Your local calculation was cancelled. Its saved inputs and any partial evidence remain available."
            : "Your local calculation failed. Open the run details for the error and retained evidence.";
      runtime.session.updatePrompt(
        `${prompt()} Latest observed job: ${JSON.stringify({ id: job.id, state: job.state, action: job.action, summary: job.summary })}`,
      );
      runtime.session.injectAgentMessage(message);
      announcedJobs.current.add(job.id);
      queueMicrotask(() =>
        setMessages((previous) => [
          ...previous.slice(-39),
          { role: "system", content: message },
        ]),
      );
    }
  }, [props.jobs, props.caseId, props.revisionId, status]);
  function disconnect() {
    const rt = active.current;
    if (rt) {
      cancelAnimationFrame(rt.frame);
      rt.microphone.stop();
      rt.session.disconnect();
      rt.player.dispose();
      active.current = null;
    }
    setStatus("Disconnected");
    setVolume(0);
  }
  useEffect(
    () => () => {
      const rt = active.current;
      if (rt) {
        cancelAnimationFrame(rt.frame);
        rt.microphone.stop();
        rt.session.disconnect();
        rt.player.dispose();
      }
    },
    [],
  );
  useEffect(() => {
    const rt = active.current;
    if (!rt) return;
    if (rt.caseId !== props.caseId || rt.revisionId !== props.revisionId) {
      cancelAnimationFrame(rt.frame);
      rt.microphone.stop();
      rt.session.disconnect();
      rt.player.dispose();
      active.current = null;
      queueMicrotask(() => {
        setStatus("Disconnected");
        setVolume(0);
        setError(
          "The case or revision changed. Reconnect voice to use the new design.",
        );
        setProposal(undefined);
      });
    } else rt.session.updatePrompt(prompt());
  }, [props.caseId, props.revisionId, props.geometryHash, props.dirty]);
  function prompt() {
    const c = context.current;
    return `You are Trabecular's engineering voice assistant. Context case ${c.caseId}, revision ${c.revisionId}. Saved geometry hash ${c.geometryHash}. Unsaved edits: ${c.dirty}. Explain computed evidence plainly. Never invent results or say a design is clinically safe or validated. The jaw model is experimental and unqualified even if equilibrium converges. Call inspect_results before answering quantitative questions. Propose parameter edits first; apply only on an explicit user instruction. Never start compute unless explicitly requested. Jobs return acknowledgements, not immediate results. If edits are unsaved, ask the user to save before tools. Do not use the old reduced beam estimate as a 3D result. Stay concise.`;
  }
  async function connect() {
    if (!props.configured) {
      setError(
        "Add DEEPGRAM_API_KEY to backend/.env and restart the analysis service.",
      );
      return;
    }
    setError("");
    setStatus("Connecting");
    setOpen(true);
    const player = new AgentPlayer();
    const session = new AgentSession({
      auth: {
        tokenFactory: async () =>
          (await api<{ access_token: string }>("voice/token", "POST"))
            .access_token,
      },
      agent: {
        listen: {
          provider: { type: "deepgram", version: "v1", model: "nova-3" },
        },
        think: {
          provider: { type: "open_ai", model: "gpt-4o-mini" },
          prompt: prompt(),
          functions: tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            client_side: true,
            parameters: {
              type: "object",
              properties: tool.properties,
              required: Object.keys(tool.properties),
            },
          })),
        },
        speak: { provider: { type: "deepgram", model: "aura-2-thalia-en" } },
      },
      reconnect: { enabled: true, maxAttempts: 2, maxDelay: 3000 },
      audio: {
        input: { encoding: "linear16", sampleRate: 16000 },
        output: { encoding: "linear16", sampleRate: 24000 },
      },
      tags: ["trabecular-local-development"],
    });
    const microphone = new AgentMicrophone((data) => session.sendAudio(data));
    const runtime = {
      session,
      microphone,
      player,
      frame: 0,
      caseId: props.caseId,
      revisionId: props.revisionId,
    };
    active.current = runtime;
    session.on("settings-applied", () => {
      if (!wantsMuted.current) microphone.unmute();
      setStatus("Listening");
    });
    session.on("connecting", () => setStatus("Connecting"));
    session.on("reconnecting", () => {
      microphone.mute();
      setStatus("Reconnecting");
    });
    session.on("conversation-text", (message) =>
      setMessages((previous) => [
        ...previous.slice(-39),
        { role: message.role, content: message.content },
      ]),
    );
    session.on("audio", (data) => player.queue(data));
    session.on("user-started-speaking", () => {
      player.interrupt();
      setStatus("Listening");
    });
    session.on("agent-thinking", () => setStatus("Thinking"));
    session.on("agent-started-speaking", () => setStatus("Speaking"));
    session.on("agent-audio-done", () => setStatus("Listening"));
    session.on("disconnected", () => {
      microphone.stop();
      setStatus("Disconnected");
    });
    const failed = (message: string) => {
      setError(message);
      microphone.stop();
      session.disconnect();
      player.interrupt();
      setStatus("Failed");
    };
    session.on("sdk-error", (error) => failed(error.message));
    session.on("error", () =>
      failed(
        "Deepgram rejected the voice session. Check the key permissions and model settings.",
      ),
    );
    session.on("injection-refused", () =>
      setError(
        "The completion update is shown here; Deepgram could not speak it during this turn.",
      ),
    );
    session.on("function-call-request", async (message) => {
      for (const call of message.functions) {
        if (!call.client_side) continue;
        const cached = callResponses.current.get(call.id);
        if (cached) {
          session.sendFunctionCallResponse(call.id, call.name, cached);
          continue;
        }
        try {
          const c = context.current;
          if (
            active.current !== runtime ||
            runtime.caseId !== c.caseId ||
            runtime.revisionId !== c.revisionId
          )
            throw new Error(
              "The voice session belongs to an older design. Reconnect before using a tool.",
            );
          if (c.dirty)
            throw new Error(
              "Save the current edits before running a voice tool.",
            );
          const response = await api<ToolResponse>("voice/tools", "POST", {
            name: call.name,
            call_id: call.id,
            case_id: c.caseId,
            revision_id: c.revisionId,
            arguments: {
              ...JSON.parse(call.arguments || "{}"),
              geometry_hash: c.geometryHash,
            },
          });
          const content = JSON.stringify(response);
          if (response.job)
            trackedJobs.current.set(response.job.id, {
              caseId: c.caseId,
              revisionId: c.revisionId,
            });
          callResponses.current.set(call.id, content);
          session.sendFunctionCallResponse(call.id, call.name, content);
          if (
            context.current.caseId === c.caseId &&
            context.current.revisionId === c.revisionId
          ) {
            if (response.proposal) setProposal(response.proposal);
            context.current.onTool(response);
          }
        } catch (error) {
          session.sendFunctionCallResponse(
            call.id,
            call.name,
            JSON.stringify({
              error:
                error instanceof Error ? error.message : "The tool failed.",
            }),
          );
        }
      }
    });
    try {
      await microphone.start();
      microphone.mute();
      await session.connect();
      microphone.unmute();
      wantsMuted.current = false;
      setMuted(false);
      const tick = () => {
        setVolume(
          Math.max(microphone.getInputVolume(), player.getOutputVolume()),
        );
        runtime.frame = requestAnimationFrame(tick);
      };
      tick();
    } catch (error) {
      failed(
        error instanceof Error ? error.message : "Voice could not connect.",
      );
    }
  }
  return (
    <div className={`ws-assistant glass ${open ? "open" : ""}`}>
      <button
        className="ws-assistant-heading"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="ws-assistant-orb">
          <Sparkles size={16} />
        </span>
        <span>
          <strong>Engineering co-pilot</strong>
          <small>
            {status === "Disconnected"
              ? props.configured
                ? "Deepgram · disconnected"
                : "Deepgram · setup needed"
              : status}
          </small>
        </span>
        <ChevronDown size={15} />
      </button>
      {open && (
        <div className="ws-assistant-body">
          <div className="ws-conversation">
            {messages.length === 0 ? (
              <p>
                Ask about a result, explore a design change, or start a local
                calculation.
              </p>
            ) : (
              messages.map((message, i) => (
                <p key={i}>
                  <strong>
                    {message.role === "user"
                      ? "You"
                      : message.role === "system"
                        ? "Job update"
                        : "Co-pilot"}
                  </strong>
                  {message.content}
                </p>
              ))
            )}
          </div>
          {proposal && (
            <div className="ws-proposal">
              <strong>Proposed edit</strong>
              <p>
                {Object.entries(proposal.changes)
                  .map(
                    ([key, value]) => `${key.replaceAll("_", " ")}: ${value}`,
                  )
                  .join(", ")}
              </p>
              <button
                className="ws-button"
                disabled={props.dirty}
                onClick={async () => {
                  try {
                    const response = await api<ToolResponse>(
                      "voice/tools",
                      "POST",
                      {
                        name: "apply_parameters",
                        call_id: crypto.randomUUID(),
                        case_id: props.caseId,
                        revision_id: props.revisionId,
                        arguments: {
                          proposal_id: proposal.id,
                          geometry_hash: props.geometryHash,
                        },
                      },
                    );
                    props.onTool(response);
                    setProposal(undefined);
                  } catch (error) {
                    setError(String(error));
                  }
                }}
              >
                Apply edit
              </button>
              <button
                className="ws-icon"
                aria-label="Dismiss proposed edit"
                onClick={() => setProposal(undefined)}
              >
                <X size={13} />
              </button>
            </div>
          )}
          {error && (
            <p className="ws-error" role="alert">
              {error}
            </p>
          )}
          <div className="ws-assistant-controls">
            <div className="ws-audio-level" aria-label="Live audio level">
              <span style={{ width: `${Math.min(100, volume * 160)}%` }} />
            </div>
            {["Disconnected", "Failed"].includes(status) ? (
              <button className="ws-button" onClick={connect}>
                <Mic size={14} />
                Connect voice
              </button>
            ) : (
              <>
                <button
                  className="ws-icon"
                  aria-label={muted ? "Unmute microphone" : "Mute microphone"}
                  onClick={() => {
                    if (muted) active.current?.microphone.unmute();
                    else active.current?.microphone.mute();
                    wantsMuted.current = !muted;
                    setMuted(!muted);
                  }}
                >
                  {muted ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
                <button
                  className="ws-icon"
                  aria-label="Disconnect voice"
                  onClick={disconnect}
                >
                  <PhoneOff size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
