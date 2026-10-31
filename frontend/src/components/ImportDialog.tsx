"use client";
import { useState } from "react";
import { Upload, X } from "lucide-react";
export default function ImportDialog({
  busy,
  upload,
  close,
}: {
  busy: boolean;
  upload: (file: File, units: string) => Promise<boolean>;
  close: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [units, setUnits] = useState("");
  const [error, setError] = useState("");
  return (
    <div
      className="ws-modal-backdrop"
      onClick={() => {
        if (!busy) close();
      }}
    >
      <section
        className="ws-modal glass"
        role="dialog"
        aria-modal="true"
        aria-label="Import STL"
        onClick={(event) => event.stopPropagation()}
      >
        <div>
          <h2>Start with your anatomy.</h2>
          <button
            className="ws-icon"
            aria-label="Close import"
            disabled={busy}
            onClick={close}
          >
            <X size={18} />
          </button>
        </div>
        <p>
          Import an STL for private surface inspection. Review its scale and
          orientation, then save the case. Mechanical analysis requires a
          prepared, registered fixation case.
        </p>
        <label className="ws-file-input">
          STL surface
          <input
            type="file"
            accept=".stl"
            disabled={busy}
            onChange={(event) => {
              const selected = event.target.files?.[0] || null;
              setFile(selected);
              setError(
                selected && selected.size > 20 * 1024 * 1024
                  ? "Choose an STL up to 20 MB."
                  : "",
              );
            }}
          />
        </label>
        <label className="ws-select-label">
          Source units
          <select
            aria-label="STL source units"
            value={units}
            disabled={busy}
            onChange={(event) => setUnits(event.target.value)}
          >
            <option value="">Choose the original units</option>
            <option value="mm">Millimeters (mm)</option>
            <option value="cm">Centimeters (cm)</option>
            <option value="m">Meters (m)</option>
          </select>
        </label>
        <p className="ws-small-text">
          Up to 20 MB / 500,000 triangles. Open surfaces can be inspected but
          remain unready for analysis.
        </p>
        {error && <p className="ws-error">{error}</p>}
        <button
          className="ws-primary full"
          disabled={busy || !file || !units || !!error}
          onClick={async () => {
            if (file && (await upload(file, units))) close();
          }}
        >
          <Upload size={16} />
          {busy ? "Importing surface…" : "Import for inspection"}
        </button>
      </section>
    </div>
  );
}
