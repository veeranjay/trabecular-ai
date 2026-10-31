"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  AudioLines,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult:
    | ((event: {
        results: {
          [index: number]: { [index: number]: { transcript: string } };
        };
      }) => void)
    | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};
export default function VoiceHud({
  onCommand,
  busy,
}: {
  onCommand: (text: string) => Promise<string>;
  busy: boolean;
}) {
  const [text, setText] = useState("");
  const [response, setResponse] = useState(
    "Inspect results, optimize the plate, or run a stiffness sweep.",
  );
  const [listening, setListening] = useState(false);
  const [audio, setAudio] = useState(false);
  const [working, setWorking] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  const latest = useRef({ onCommand, audio });
  useEffect(() => {
    latest.current = { onCommand, audio };
  }, [onCommand, audio]);
  const execute = async (command: string) => {
    if (!command.trim() || busy || working) return;
    setText("");
    setWorking(true);
    try {
      const message = await latest.current.onCommand(command);
      setResponse(message);
      if (latest.current.audio && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(message));
      }
    } catch (error) {
      setResponse(
        error instanceof Error ? error.message : "Command failed. Try again.",
      );
    } finally {
      setWorking(false);
    }
  };
  useEffect(
    () => () => {
      recognition.current?.abort();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    },
    [],
  );
  const toggleMic = () => {
    if (listening) {
      recognition.current?.abort();
      return;
    }
    const Constructor =
      (window as SpeechWindow).SpeechRecognition ||
      (window as SpeechWindow).webkitSpeechRecognition;
    if (!Constructor) {
      setResponse(
        "Speech recognition is unavailable in this browser. Type a command below.",
      );
      return;
    }
    const r = new Constructor();
    r.lang = "en-US";
    r.continuous = false;
    r.interimResults = false;
    recognition.current = r;
    r.onresult = (e) => {
      setListening(false);
      void execute(e.results[0][0].transcript);
    };
    r.onerror = (e) => {
      setListening(false);
      setResponse(
        e.error === "not-allowed"
          ? "Microphone access was denied. You can still type commands."
          : `Speech recognition: ${e.error}. Try typing a command.`,
      );
    };
    r.onend = () => setListening(false);
    try {
      r.start();
      setListening(true);
    } catch {
      setResponse("Could not start the microphone. Try typing a command.");
    }
  };
  return (
    <section className="copilot glass" aria-label="Workspace command assistant">
      <div className="copilot-identity">
        <div className={`voice-symbol ${listening ? "listening" : ""}`}>
          <AudioLines size={21} />
        </div>
        <div>
          <strong>Workspace assistant</strong>
          <span>
            {listening ? "Listening…" : "Local commands"} <b>·</b> Bolna not
            connected
          </span>
        </div>
      </div>
      <div className="copilot-middle">
        <p aria-live="polite">{working ? "Running your command…" : response}</p>
        <div className="command-suggestions">
          {["Inspect results", "Optimize plate", "Run sweep"].map((command) => (
            <button
              key={command}
              disabled={busy || working}
              onClick={() => void execute(command)}
            >
              {command}
            </button>
          ))}
        </div>
      </div>
      <form
        className="command-input"
        onSubmit={(event) => {
          event.preventDefault();
          void execute(text);
        }}
      >
        <label className="sr-only" htmlFor="command">
          Workspace command
        </label>
        <input
          id="command"
          placeholder="Type a command…"
          value={text}
          onChange={(event) => setText(event.target.value)}
          disabled={busy || working}
        />
        <button
          type="button"
          aria-label={listening ? "Stop microphone" : "Start microphone"}
          className={listening ? "active" : ""}
          onClick={toggleMic}
          disabled={busy || working}
        >
          {listening ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
        <button
          type="submit"
          aria-label="Send command"
          disabled={busy || working || !text.trim()}
        >
          <ArrowUp size={17} />
        </button>
      </form>
      <button
        className="audio-toggle"
        title={audio ? "Mute spoken responses" : "Enable spoken responses"}
        aria-label={audio ? "Mute spoken responses" : "Enable spoken responses"}
        aria-pressed={audio}
        onClick={() => {
          setAudio(!audio);
          if (audio && "speechSynthesis" in window)
            window.speechSynthesis.cancel();
        }}
      >
        {audio ? <Volume2 size={16} /> : <VolumeX size={16} />}
      </button>
    </section>
  );
}
