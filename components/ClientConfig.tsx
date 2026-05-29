"use client";

import { useState, useCallback, KeyboardEvent } from "react";

export type ClientConfigState = {
  clientName: string;
  clientUrl: string;
  /** E-commerce vs service/non-ecommerce — affects content type suggestions (e.g. Collection Page). */
  clientType: "ecommerce" | "non-ecommerce";
  pillars: string[];
};

type Props = {
  value: ClientConfigState;
  onChange: (value: ClientConfigState) => void;
  readOnly?: boolean;
};

export function ClientConfig({ value, onChange, readOnly = false }: Props) {
  const [pillarInput, setPillarInput] = useState("");

  const addPillar = useCallback(
    (pillar: string) => {
      const trimmed = pillar.trim();
      if (readOnly || !trimmed || value.pillars.includes(trimmed)) return;
      onChange({ ...value, pillars: [...value.pillars, trimmed] });
      setPillarInput("");
    },
    [value, onChange]
  );

  const removePillar = useCallback(
    (index: number) => {
      onChange({
        ...value,
        pillars: value.pillars.filter((_, i) => i !== index),
      });
    },
    [readOnly, value, onChange]
  );

  const onPillarKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addPillar(pillarInput);
    }
  };

  return (
    <section className="rounded-lg border border-gray-200 bg-optidge-green-pale/50 p-6 transition-colors hover:border-accent/40">
      <p className="section-label font-mono mb-4">01 — Client Configuration</p>
      <div className="mb-4">
        <label className="mb-1.5 block font-mono text-xs text-optidge-text-muted">
          Client type
        </label>
        <div className="flex gap-0 rounded border border-gray-200 bg-gray-100 p-0.5">
          <button
            type="button"
            onClick={() => onChange({ ...value, clientType: "non-ecommerce" })}
            disabled={readOnly}
            className={`flex-1 rounded px-3 py-2 font-mono text-sm transition-colors ${
              value.clientType === "non-ecommerce"
                ? "bg-white text-accent shadow-sm"
                : "text-optidge-text-muted hover:text-optidge-text"
            }`}
          >
            Non-ecommerce
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...value, clientType: "ecommerce" })}
            disabled={readOnly}
            className={`flex-1 rounded px-3 py-2 font-mono text-sm transition-colors ${
              value.clientType === "ecommerce"
                ? "bg-white text-accent shadow-sm"
                : "text-optidge-text-muted hover:text-optidge-text"
            }`}
          >
            E-commerce
          </button>
        </div>
        <p className="mt-1 text-xs text-optidge-text-muted">
          E-commerce clients get Collection Page suggestions for commercial intent where relevant.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block font-mono text-xs text-optidge-text-muted">
            Client Name <span className="text-accent">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Acme Corp"
            value={value.clientName}
            onChange={(e) => onChange({ ...value, clientName: e.target.value })}
            readOnly={readOnly}
            className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-optidge-text placeholder-gray-400 outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/50"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-xs text-optidge-text-muted">
            Website URL
          </label>
          <input
            type="text"
            placeholder="e.g. acmecorp.com"
            value={value.clientUrl}
            onChange={(e) => onChange({ ...value, clientUrl: e.target.value })}
            readOnly={readOnly}
            className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-optidge-text placeholder-gray-400 outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/50"
          />
        </div>
      </div>
      <div className="mt-4">
        <label className="mb-1.5 block font-mono text-xs text-optidge-text-muted">
          Service Pillars
        </label>
        <input
          type="text"
          placeholder="Type a pillar and press Enter"
          value={pillarInput}
          onChange={(e) => setPillarInput(e.target.value)}
          onKeyDown={onPillarKeyDown}
          readOnly={readOnly}
          className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-optidge-text placeholder-gray-400 outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/50"
        />
        {value.pillars.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {value.pillars.map((p, i) => (
              <span
                key={p}
                className="inline-flex items-center gap-1 rounded bg-optidge-green-soft px-2 py-1 font-mono text-sm text-optidge-text"
              >
                {p}
                <button
                  type="button"
                  onClick={() => removePillar(i)}
                  disabled={readOnly}
                  className="text-optidge-text-muted hover:text-optidge-text"
                  aria-label={`Remove ${p}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
