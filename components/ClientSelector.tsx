"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ClientRecord } from "@/types/db";

type Props = {
  selectedClientId: string | null;
  refreshToken?: number;
  onSelectClient: (clientId: string | null, mode: "profile" | "quick") => void;
};

export function ClientSelector({ selectedClientId, refreshToken = 0, onSelectClient }: Props) {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setClients(data.clients ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Request failed"))
      .finally(() => setLoading(false));
  }, [refreshToken]);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) ?? null,
    [clients, selectedClientId]
  );

  const displayValue = selectedClient
    ? selectedClient.name
    : "Quick Mode (one-off)";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.url ?? "").toLowerCase().includes(q)
    );
  }, [clients, query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectQuickMode() {
    onSelectClient(null, "quick");
    setQuery("");
    setOpen(false);
  }

  function selectClient(clientId: string) {
    onSelectClient(clientId, "profile");
    setQuery("");
    setOpen(false);
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-optidge-green-pale/50 p-6 transition-colors hover:border-accent/40">
      <p className="section-label mb-3 font-mono">00 — Select Client</p>
      <div ref={containerRef} className="relative max-w-md">
        <label className="mb-1.5 block font-mono text-xs text-optidge-text-muted">Client</label>
        <div className="relative">
          <input
            type="text"
            autoComplete="off"
            value={open ? query : displayValue}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!open) setOpen(true);
            }}
            onFocus={() => {
              setOpen(true);
              setQuery("");
            }}
            placeholder="Search clients or use Quick Mode…"
            className="w-full rounded border border-gray-200 bg-white px-3 py-2 pr-8 text-sm text-optidge-text outline-none focus:border-accent focus:ring-1 focus:ring-accent/50"
          />
          <span
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
            aria-hidden
          >
            {open ? "▲" : "▼"}
          </span>
        </div>
        {open && (
          <ul
            className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded border border-gray-200 bg-white py-1 shadow-lg"
            role="listbox"
          >
            <li
              role="option"
              aria-selected={!selectedClientId}
              onClick={selectQuickMode}
              className={`cursor-pointer px-3 py-2 text-sm hover:bg-optidge-green-pale ${
                !selectedClientId ? "bg-optidge-green-soft text-optidge-text" : "text-optidge-text-muted"
              }`}
            >
              Quick Mode (one-off)
            </li>
            {loading && (
              <li className="px-3 py-2 text-sm text-optidge-text-muted">Loading clients…</li>
            )}
            {error && clients.length === 0 && (
              <li className="px-3 py-2 text-sm text-red-600">
                Could not load clients. Check Supabase in `.env.local`.
              </li>
            )}
            {!loading && filtered.length === 0 && clients.length > 0 && (
              <li className="px-3 py-2 text-sm text-optidge-text-muted">No clients match</li>
            )}
            {filtered.map((client) => (
              <li
                key={client.id}
                role="option"
                aria-selected={selectedClientId === client.id}
                onClick={() => selectClient(client.id)}
                className={`cursor-pointer px-3 py-2 hover:bg-optidge-green-pale ${
                  selectedClientId === client.id ? "bg-optidge-green-soft" : ""
                }`}
              >
                <p className="text-sm font-medium text-optidge-text">{client.name}</p>
                {client.url && (
                  <p className="text-xs text-optidge-text-muted">{client.url}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {selectedClient?.url && !open && (
        <p className="mt-1 text-xs text-optidge-text-muted">{selectedClient.url}</p>
      )}
      {!selectedClientId && !open && (
        <p className="mt-2 text-xs text-optidge-text-muted">
          Quick Mode requires a website URL. If the URL matches an existing client profile, that
          profile will be used automatically.
        </p>
      )}
    </section>
  );
}
