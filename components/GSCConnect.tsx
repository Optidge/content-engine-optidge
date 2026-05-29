"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

type GSCState = {
  siteUrl: string;
  periodA: { startDate: string; endDate: string };
  periodB: { startDate: string; endDate: string };
  rowLimit: number;
  formattedData: string | null;
  rowCount: number | null;
  periodALabel: string | null;
  periodBLabel: string | null;
  loading: boolean;
  error: string | null;
};

function getDefaultDates() {
  const now = new Date();
  const periodAEnd = new Date(now);
  periodAEnd.setDate(periodAEnd.getDate() - 1);
  const periodAStart = new Date(periodAEnd);
  periodAStart.setDate(periodAStart.getDate() - 27);
  const periodBEnd = new Date(periodAStart);
  periodBEnd.setDate(periodBEnd.getDate() - 1);
  const periodBStart = new Date(periodBEnd);
  periodBStart.setDate(periodBStart.getDate() - 27);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return {
    periodA: { startDate: fmt(periodAStart), endDate: fmt(periodAEnd) },
    periodB: { startDate: fmt(periodBStart), endDate: fmt(periodBEnd) },
  };
}

export type GSCConnectProps = {
  onDataLoaded: (formatted: string) => void;
  initialProperty?: string;
};

export function GSCConnect({ onDataLoaded, initialProperty = "" }: GSCConnectProps) {
  const { data: session, status } = useSession();
  const sessionExpired = session?.error === "RefreshAccessTokenError";

  const reconnectGoogle = async () => {
    await signOut({ redirect: false });
    await signIn("google", { callbackUrl: window.location.href });
  };
  const [properties, setProperties] = useState<string[]>([]);
  const [propsLoading, setPropsLoading] = useState(false);
  const [state, setState] = useState<GSCState>(() => ({
    siteUrl: "",
    ...getDefaultDates(),
    rowLimit: 500,
    formattedData: null,
    rowCount: null,
    periodALabel: null,
    periodBLabel: null,
    loading: false,
    error: null,
  }));

  useEffect(() => {
    if (status !== "authenticated") return;
    setPropsLoading(true);
    fetch("/api/gsc/properties")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProperties(data);
        else if (data.error) setState((s) => ({ ...s, error: data.error }));
      })
      .finally(() => setPropsLoading(false));
  }, [status]);

  useEffect(() => {
    const nextProperty = initialProperty.trim();
    if (!nextProperty) return;
    setState((prev) =>
      prev.siteUrl === nextProperty ? prev : { ...prev, siteUrl: nextProperty }
    );
  }, [initialProperty]);

  const pullData = useCallback(() => {
    if (!state.siteUrl) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetch("/api/gsc/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteUrl: state.siteUrl,
        periodA: state.periodA,
        periodB: state.periodB,
        rowLimit: state.rowLimit,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setState((s) => ({ ...s, loading: false, error: data.error }));
          return;
        }
        setState((s) => ({
          ...s,
          loading: false,
          formattedData: data.formatted,
          rowCount: data.rowCount,
          periodALabel: data.periodA,
          periodBLabel: data.periodB,
          error: null,
        }));
        if (data.formatted) onDataLoaded(data.formatted);
      })
      .catch((err) => {
        setState((s) => ({
          ...s,
          loading: false,
          error: err.message || "Request failed",
        }));
      });
  }, [state.siteUrl, state.periodA, state.periodB, state.rowLimit, onDataLoaded]);

  const [propertyOpen, setPropertyOpen] = useState(false);
  const [propertyQuery, setPropertyQuery] = useState("");
  const propertyRef = useRef<HTMLDivElement>(null);
  const filteredProperties = propertyQuery.trim()
    ? properties.filter((url) =>
        url.toLowerCase().includes(propertyQuery.toLowerCase())
      )
    : properties;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (propertyRef.current && !propertyRef.current.contains(e.target as Node)) {
        setPropertyOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === "loading" || status === "unauthenticated" || sessionExpired) {
    return (
      <section className="rounded-lg border border-gray-200 bg-optidge-green-pale/50 p-6 transition-colors hover:border-accent/40">
        <p className="section-label font-mono mb-4">02 — Google Search Console</p>
        {sessionExpired && (
          <p className="mb-2 text-sm text-amber-700">
            Your Google session expired. Reconnect to continue.
          </p>
        )}
        <button
          type="button"
          onClick={() => reconnectGoogle()}
          className="rounded bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
        >
          {sessionExpired ? "Reconnect Google Account" : "Connect Google Search Console"}
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-optidge-green-pale/50 p-6 transition-colors hover:border-accent/40">
      <p className="section-label font-mono mb-4">02 — Google Search Console</p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-optidge-text-muted">Connected as {session?.user?.email}</span>
        <button
          type="button"
          onClick={() => signOut()}
          className="text-xs text-optidge-text-muted underline hover:text-optidge-text"
        >
          Disconnect
        </button>
      </div>
      {propsLoading ? (
        <p className="mt-2 text-sm text-optidge-text-muted">Loading properties…</p>
      ) : (
        <div className="mt-4 space-y-4">
          <div ref={propertyRef} className="relative max-w-md">
            <label className="mb-1.5 block font-mono text-xs text-optidge-text-muted">
              Property
            </label>
            <div className="relative">
              <input
                type="text"
                value={propertyOpen ? propertyQuery : state.siteUrl}
                onChange={(e) => {
                  setPropertyQuery(e.target.value);
                  if (!propertyOpen) setPropertyOpen(true);
                }}
                onFocus={() => {
                  setPropertyOpen(true);
                  setPropertyQuery(state.siteUrl);
                }}
                placeholder="Type to search properties…"
                className="w-full rounded border border-gray-200 bg-white px-3 py-2 pr-8 text-optidge-text placeholder-gray-400 outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/50"
              />
              <span
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                aria-hidden
              >
                {propertyOpen ? "▲" : "▼"}
              </span>
            </div>
            {propertyOpen && (
              <ul
                className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded border border-gray-200 bg-white py-1 shadow-lg"
                role="listbox"
              >
                {filteredProperties.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-optidge-text-muted">
                    No properties match
                  </li>
                ) : (
                  filteredProperties.map((url) => (
                    <li
                      key={url}
                      role="option"
                      aria-selected={state.siteUrl === url}
                      onClick={() => {
                        setState((s) => ({ ...s, siteUrl: url }));
                        setPropertyQuery("");
                        setPropertyOpen(false);
                      }}
                      className={`cursor-pointer px-3 py-2 text-sm hover:bg-optidge-green-pale ${
                        state.siteUrl === url ? "bg-optidge-green-soft text-optidge-text" : "text-optidge-text"
                      }`}
                    >
                      {url}
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block font-mono text-xs text-optidge-text-muted">
                Period A
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={state.periodA.startDate}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      periodA: { ...s.periodA, startDate: e.target.value },
                    }))
                  }
                  className="flex-1 rounded border border-gray-200 bg-white px-2 py-1.5 text-sm text-optidge-text outline-none focus:border-accent"
                />
                <input
                  type="date"
                  value={state.periodA.endDate}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      periodA: { ...s.periodA, endDate: e.target.value },
                    }))
                  }
                  className="flex-1 rounded border border-gray-200 bg-white px-2 py-1.5 text-sm text-optidge-text outline-none focus:border-accent"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-xs text-optidge-text-muted">
                Period B
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={state.periodB.startDate}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      periodB: { ...s.periodB, startDate: e.target.value },
                    }))
                  }
                  className="flex-1 rounded border border-gray-200 bg-white px-2 py-1.5 text-sm text-optidge-text outline-none focus:border-accent"
                />
                <input
                  type="date"
                  value={state.periodB.endDate}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      periodB: { ...s.periodB, endDate: e.target.value },
                    }))
                  }
                  className="flex-1 rounded border border-gray-200 bg-white px-2 py-1.5 text-sm text-optidge-text outline-none focus:border-accent"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={pullData}
              disabled={!state.siteUrl || state.loading}
              className="rounded bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50 hover:opacity-90"
            >
              {state.loading ? "Pulling…" : "Pull Data"}
            </button>
            {state.formattedData != null && state.rowCount != null && (
              <span className="flex items-center gap-1.5 text-sm text-green-600">
                <span aria-hidden>✓</span> GSC data loaded — {state.rowCount} rows
              </span>
            )}
          </div>
          {state.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}
        </div>
      )}
    </section>
  );
}
