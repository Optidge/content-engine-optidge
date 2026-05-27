"use client";

import { useState, useCallback } from "react";
import { parseFiles } from "@/lib/parseFiles";

export type UploadSlot = "semrushClient" | "semrushCompetitor" | "other";

type SlotConfig = {
  id: UploadSlot;
  icon: string;
  label: string;
  description: string;
  accept: string;
};

const SLOTS: SlotConfig[] = [
  {
    id: "semrushClient",
    icon: "🔍",
    label: "SEMrush — Client Data",
    description: "Client domain keywords, positions, traffic",
    accept: ".csv,.xlsx,.xls",
  },
  {
    id: "semrushCompetitor",
    icon: "⚔️",
    label: "SEMrush — Competitor Gap",
    description: "Keyword gap / competitor analysis export",
    accept: ".csv,.xlsx,.xls",
  },
  {
    id: "other",
    icon: "📎",
    label: "Other Supporting Data",
    description: "Any other relevant data — analytics, audits, etc.",
    accept: ".csv,.xlsx,.xls,.pdf",
  },
];

export type FileUploadState = {
  semrushClient: { files: File[]; text: string; errors: { fileName: string; error: string }[] };
  semrushCompetitor: { files: File[]; text: string; errors: { fileName: string; error: string }[] };
  other: { files: File[]; text: string; errors: { fileName: string; error: string }[] };
};

const emptySlot = (): FileUploadState["semrushClient"] => ({
  files: [],
  text: "",
  errors: [],
});

export const initialFileUploadState: FileUploadState = {
  semrushClient: emptySlot(),
  semrushCompetitor: emptySlot(),
  other: emptySlot(),
};

type Props = {
  state: FileUploadState;
  onChange: (state: FileUploadState) => void;
};

function Dropzone({
  slot,
  config,
  files,
  errors,
  onFilesChange,
}: {
  slot: UploadSlot;
  config: SlotConfig;
  files: File[];
  errors: { fileName: string; error: string }[];
  onFilesChange: (files: File[]) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputId = `file-${slot}`;

  return (
    <div
      className={`relative rounded-lg border border-dashed border-gray-300 bg-optidge-green-pale/30 p-4 transition-colors ${
        dragging ? "border-accent bg-optidge-green-soft/50" : "hover:border-accent/50"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const list = Array.from(e.dataTransfer.files);
        if (list.length) onFilesChange(list);
      }}
    >
      <label htmlFor={inputId} className="cursor-pointer">
        <span className="text-2xl">{config.icon}</span>
        <p className="mt-1 font-mono text-xs font-medium text-optidge-text">{config.label}</p>
        <p className="mt-0.5 text-xs text-optidge-text-muted">{config.description}</p>
        <input
          id={inputId}
          type="file"
          accept={config.accept}
          multiple
          className="sr-only"
          onChange={(e) => {
            const list = e.target.files ? Array.from(e.target.files) : [];
            if (list.length) onFilesChange(list);
            e.target.value = "";
          }}
        />
      </label>
      {files.length > 0 && (
        <ul className="mt-2 space-y-1">
          {files.map((f) => (
            <li key={f.name + f.size} className="flex items-center justify-between text-xs text-optidge-text-muted">
              <span className="truncate">{f.name}</span>
              <button
                type="button"
                onClick={() => onFilesChange(files.filter((x) => x !== f))}
                className="text-optidge-text-muted hover:text-red-600"
                aria-label={`Remove ${f.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      {errors.length > 0 && (
        <p className="mt-1 text-xs text-red-400">
          {errors.map((e) => `${e.fileName}: ${e.error}`).join("; ")}
        </p>
      )}
    </div>
  );
}

export function FileUpload({ state, onChange }: Props) {
  const handleFiles = useCallback(
    async (slot: UploadSlot, files: File[]) => {
      const current = state[slot];
      const nextFiles = files.length ? files : [];
      onChange({
        ...state,
        [slot]: { ...current, files: nextFiles, text: "", errors: [] },
      });
      if (nextFiles.length > 0) {
        const { text, errors } = await parseFiles(nextFiles);
        onChange({
          ...state,
          [slot]: { ...current, files: nextFiles, text, errors },
        });
      }
    },
    [state, onChange]
  );

  return (
    <section className="rounded-lg border border-gray-200 bg-optidge-green-pale/50 p-6 transition-colors hover:border-accent/40">
      <p className="section-label font-mono mb-4">04 — Data Upload</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SLOTS.map((config) => (
          <Dropzone
            key={config.id}
            slot={config.id}
            config={config}
            files={state[config.id].files}
            errors={state[config.id].errors}
            onFilesChange={(files) => handleFiles(config.id, files)}
          />
        ))}
      </div>
    </section>
  );
}
