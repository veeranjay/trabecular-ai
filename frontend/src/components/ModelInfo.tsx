"use client";
import { useEffect, useRef } from "react";
import { ArrowUpRight, X } from "lucide-react";

export default function ModelInfo({
  busy,
  onClose,
  onBenchmark,
}: {
  busy: string | null;
  onClose: () => void;
  onBenchmark: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="info-panel glass"
      aria-labelledby="info-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === dialog.current) onClose();
      }}
    >
      <div className="panel-heading">
        <span className="eyebrow">MODEL & SOURCES</span>
        <button
          className="icon-button"
          aria-label="Close model information"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      <h2 id="info-title">Know what you’re reviewing.</h2>
      <p>
        The viewport uses a real CT-derived mandible from the Visible Human
        dataset. The plate and nerve zone are manually registered examples. The
        reference jaw is intact.
      </p>
      <h3>What is computed</h3>
      <p>
        A 36-element titanium plate beam with four elastic bone supports. Load,
        section dimensions, and support stiffness change the assembled system.
        Screw clearance is measured against the displayed sphere.
      </p>
      <h3>Reduced-model scope</h3>
      <p>
        This diagnostics page keeps the original reduced beam estimate separate
        from the experimental 3D FEM workspace. Open the main workspace for
        prepared split anatomy, GPU calculations and the Deepgram connection.
        Patient nerve tracing and clinical validation are not provided.
      </p>
      <h3>Anatomy attribution</h3>
      <p>
        Alavi &amp; Asseln (2026), Visible Human 3D Models. CC BY 4.0. Derived
        from Andreassen et al. (2023).
      </p>
      <div className="info-links">
        <a
          href="https://huggingface.co/datasets/BoneHub/visible-human-3d-models"
          target="_blank"
          rel="noreferrer"
        >
          Dataset
          <ArrowUpRight size={14} />
        </a>
        <a
          href="https://doi.org/10.1038/s41597-022-01905-2"
          target="_blank"
          rel="noreferrer"
        >
          Source paper
          <ArrowUpRight size={14} />
        </a>
      </div>
      <button
        className="secondary-button"
        disabled={!!busy}
        onClick={onBenchmark}
      >
        {busy || "Run calculation benchmark"}
      </button>
    </dialog>
  );
}
