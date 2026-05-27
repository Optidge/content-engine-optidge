"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { parseFiles } from "@/lib/parseFiles";
import type { SheetTabData, SheetsDataResult } from "@/lib/formatSheetsData";

type SheetListItem = {
  id: string;
  name: string;
  modifiedTime: string;
  owner: string;
};

type TabItem = {
  title: string;
  sheetId: number;
};

type LoadedState = {
  sheet: SheetListItem;
  data: SheetsDataResult;
  formatted: string;
  totalRows: number;
};

const STORAGE_PREFIX = "content-engine-sheet-";

function storageKey(clientName: string) {
  return `${STORAGE_PREFIX}${clientName.trim().toLowerCase()}`;
}

function formatModified(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export type SheetsConnectProps = {
  onDataLoaded: (formatted: string) => void;
  clientName?: string;
};

export function SheetsConnect({ onDataLoaded, clientName = "" }: SheetsConnectProps) {
  const { data: session, status } = useSession();
  const [uiState, setUiState] = useState<"pick-sheet" | "pick-tabs" | "loaded">("pick-sheet");
  const [search, setSearch] = useState("");
  const [sheets, setSheets] = useState<SheetListItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [listErrorCode, setListErrorCode] = useState<string | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<SheetListItem | null>(null);
  const [tabs, setTabs] = useState<TabItem[]>([]);
  const [tabsLoading, setTabsLoading] = useState(false);
  const [selectedTabs, setSelectedTabs] = useState<Set<string>>(new Set());
  const [pullLoading, setPullLoading] = useState(false);
  const [loaded, setLoaded] = useState<LoadedState | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showFallbackUpload, setShowFallbackUpload] = useState(false);
  const [fallbackFiles, setFallbackFiles] = useState<File[]>([]);
  const [fallbackText, setFallbackText] = useState("");
  const [fallbackErrors, setFallbackErrors] = useState<{ fileName: string; error: string }[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reconnectGoogle = useCallback(async () => {
    await signOut({ redirect: false });
    await signIn("google", { callbackUrl: window.location.href });
  }, []);

  const fetchSheets = useCallback(async (query: string) => {
    setListLoading(true);
    setListError(null);
    setListErrorCode(null);
    try {
      const params = query.trim() ? `?search=${encodeURIComponent(query.trim())}` : "";
      const res = await fetch(`/api/sheets/list${params}`);
      const data = await res.json();
      if (!res.ok) {
        setListError(data.error || "Failed to load spreadsheets");
        setListErrorCode(data.code ?? null);
        setSheets([]);
        return;
      }
      setSheets(data.sheets ?? []);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Network error");
      setSheets([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (uiState !== "pick-sheet") return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSheets(search);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [status, search, uiState, fetchSheets]);

  useEffect(() => {
    if (status !== "authenticated" || uiState !== "pick-sheet" || selectedSheet) return;
    const key = clientName.trim() ? storageKey(clientName) : null;
    if (!key) return;

    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const saved = JSON.parse(raw) as SheetListItem;
      if (saved?.id && saved?.name) {
        setSelectedSheet(saved);
        setUiState("pick-tabs");
      }
    } catch {
      // ignore invalid storage
    }
  }, [status, clientName, uiState, selectedSheet]);

  const fetchTabs = useCallback(async (sheet: SheetListItem) => {
    setTabsLoading(true);
    setListError(null);
    setListErrorCode(null);
    try {
      const res = await fetch(
        `/api/sheets/tabs?spreadsheetId=${encodeURIComponent(sheet.id)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setListError(data.error || "Failed to load tabs");
        setListErrorCode(data.code ?? null);
        return;
      }
      setTabs(data.tabs ?? []);
      setSelectedTabs(new Set());
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Network error");
    } finally {
      setTabsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (uiState === "pick-tabs" && selectedSheet) {
      fetchTabs(selectedSheet);
    }
  }, [uiState, selectedSheet, fetchTabs]);

  const selectSheet = (sheet: SheetListItem) => {
    setSelectedSheet(sheet);
    setUiState("pick-tabs");
    setListError(null);
    setListErrorCode(null);

    if (clientName.trim()) {
      try {
        localStorage.setItem(storageKey(clientName), JSON.stringify(sheet));
      } catch {
        // ignore quota errors
      }
    }
  };

  const resetToPickSheet = () => {
    setUiState("pick-sheet");
    setSelectedSheet(null);
    setTabs([]);
    setSelectedTabs(new Set());
    setLoaded(null);
    setPreviewOpen(false);
    onDataLoaded("");
  };

  const allTabsSelected = tabs.length > 0 && selectedTabs.size === tabs.length;

  const toggleAllTabs = () => {
    if (allTabsSelected) {
      setSelectedTabs(new Set());
    } else {
      setSelectedTabs(new Set(tabs.map((t) => t.title)));
    }
  };

  const pullData = async () => {
    if (!selectedSheet || selectedTabs.size === 0) return;
    setPullLoading(true);
    setListError(null);
    setListErrorCode(null);
    try {
      const res = await fetch("/api/sheets/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spreadsheetId: selectedSheet.id,
          tabNames: Array.from(selectedTabs),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setListError(data.error || "Failed to pull sheet data");
        setListErrorCode(data.code ?? null);
        return;
      }

      const next: LoadedState = {
        sheet: selectedSheet,
        data: data.data,
        formatted: data.formatted,
        totalRows: data.totalRows,
      };
      setLoaded(next);
      setUiState("loaded");
      setShowFallbackUpload(false);
      setFallbackFiles([]);
      setFallbackText("");
      onDataLoaded(data.formatted);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Network error");
    } finally {
      setPullLoading(false);
    }
  };

  const handleFallbackFiles = async (files: File[]) => {
    setFallbackFiles(files);
    setFallbackErrors([]);
    if (files.length === 0) {
      setFallbackText("");
      onDataLoaded("");
      return;
    }
    const { text, errors } = await parseFiles(files);
    setFallbackText(text);
    setFallbackErrors(errors);
    if (text) {
      setLoaded(null);
      setUiState("pick-sheet");
      onDataLoaded(text);
    }
  };

  const previewRows = useMemo(() => {
    if (!loaded) return [];
    const rows: { tab: string; cells: string[] }[] = [];
    for (const [tabName, tab] of Object.entries(loaded.data)) {
      const header = tab.headers.length > 0 ? tab.headers : ["Column 1"];
      rows.push({ tab: tabName, cells: header });
      for (const row of tab.rows.slice(0, 10)) {
        const cells = header.map((_, i) => row[i] ?? "");
        rows.push({ tab: "", cells });
      }
      if (rows.length > 12) break;
    }
    return rows.slice(0, 12);
  }, [loaded]);

  const errorBlock = listError && (
    <div className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <p>{listError}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {(listErrorCode === "MISSING_SCOPES" ||
          listErrorCode === "SESSION_EXPIRED" ||
          listErrorCode === "UNAUTHORIZED") && (
          <button
            type="button"
            onClick={reconnectGoogle}
            className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
          >
            Reconnect Google Account
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            if (uiState === "pick-sheet") fetchSheets(search);
            else if (selectedSheet) fetchTabs(selectedSheet);
            else pullData();
          }}
          className="text-xs underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    </div>
  );

  const sessionExpired = session?.error === "RefreshAccessTokenError";

  if (status === "loading" || status === "unauthenticated" || sessionExpired) {
    return (
      <section className="rounded-lg border border-gray-200 bg-optidge-green-pale/50 p-6 transition-colors hover:border-accent/40">
        <p className="section-label font-mono mb-4">03 — Content Calendar</p>
        <div>
            <p className="font-medium text-optidge-text">Content Calendar</p>
            <p className="mt-1 text-sm text-optidge-text-muted">
              Connect a Google Sheet with your content calendar
            </p>
            {sessionExpired && (
              <p className="mt-2 text-sm text-amber-700">
                Your Google session expired. Reconnect to access Sheets and Search Console.
              </p>
            )}
            <button
              type="button"
              onClick={() => reconnectGoogle()}
              className="mt-4 rounded bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
            >
              {sessionExpired ? "Reconnect Google Account" : "Connect Google Account"}
            </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-optidge-green-pale/50 p-6 transition-colors hover:border-accent/40">
      <p className="section-label font-mono mb-4">03 — Content Calendar</p>
      <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-optidge-text">Content Calendar</p>
            {loaded && (
              <span className="rounded-full bg-accent/15 px-2 py-0.5 font-mono text-xs text-accent">
                {loaded.totalRows} rows
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-optidge-text-muted">
            Connect a Google Sheet with your content calendar
          </p>
          <p className="mt-1 text-xs text-optidge-text-muted">
            Signed in as {session?.user?.email}
            <button
              type="button"
              onClick={() => signOut()}
              className="ml-2 underline hover:text-optidge-text"
            >
              Disconnect
            </button>
          </p>

          {uiState === "pick-sheet" && !loaded && (
            <div className="mt-4">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search your Google Sheets…"
                className="w-full max-w-md rounded border border-gray-200 bg-white px-3 py-2 text-optidge-text placeholder-gray-400 outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/50"
              />
              {listLoading && (
                <p className="mt-2 text-sm text-optidge-text-muted">Loading spreadsheets…</p>
              )}
              {!listLoading && sheets.length > 0 && (
                <ul className="mt-3 max-h-64 overflow-auto rounded border border-gray-200 bg-white">
                  {sheets.map((sheet) => (
                    <li key={sheet.id}>
                      <button
                        type="button"
                        onClick={() => selectSheet(sheet)}
                        className="w-full border-b border-gray-100 px-3 py-3 text-left transition-colors last:border-b-0 hover:border-accent/40 hover:bg-optidge-green-pale/50"
                      >
                        <p className="font-medium text-optidge-text">{sheet.name}</p>
                        <p className="text-xs text-optidge-text-muted">
                          Modified {formatModified(sheet.modifiedTime)}
                          {sheet.owner ? ` · ${sheet.owner}` : ""}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {!listLoading && sheets.length === 0 && !listError && (
                <p className="mt-2 text-sm text-optidge-text-muted">No spreadsheets found</p>
              )}
            </div>
          )}

          {uiState === "pick-tabs" && selectedSheet && (
            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-optidge-text">{selectedSheet.name}</p>
                <button
                  type="button"
                  onClick={resetToPickSheet}
                  className="text-xs text-accent underline hover:no-underline"
                >
                  Change
                </button>
              </div>
              {tabsLoading ? (
                <p className="mt-2 text-sm text-optidge-text-muted">Loading tabs…</p>
              ) : (
                <>
                  {tabs.length > 0 && (
                    <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-optidge-text">
                      <input
                        type="checkbox"
                        checked={allTabsSelected}
                        onChange={toggleAllTabs}
                        className="rounded border-gray-300 text-accent focus:ring-accent"
                      />
                      Select all tabs
                    </label>
                  )}
                  <ul className="mt-2 space-y-2">
                    {tabs.map((tab) => (
                      <label
                        key={tab.sheetId}
                        className="flex cursor-pointer items-center gap-2 rounded border border-gray-200 bg-white px-3 py-2 text-sm text-optidge-text hover:border-accent/40"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTabs.has(tab.title)}
                          onChange={(e) => {
                            const next = new Set(selectedTabs);
                            if (e.target.checked) next.add(tab.title);
                            else next.delete(tab.title);
                            setSelectedTabs(next);
                          }}
                          className="rounded border-gray-300 text-accent focus:ring-accent"
                        />
                        {tab.title}
                      </label>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={pullData}
                    disabled={selectedTabs.size === 0 || pullLoading}
                    className="mt-4 rounded bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50 hover:opacity-90"
                  >
                    {pullLoading ? "Pulling…" : "Pull Data"}
                  </button>
                </>
              )}
            </div>
          )}

          {uiState === "loaded" && loaded && (
            <div className="mt-4 space-y-3">
              <p className="flex items-center gap-1.5 text-sm text-green-600">
                <span aria-hidden>✓</span>
                Content calendar loaded — {loaded.totalRows} rows from{" "}
                {Object.keys(loaded.data).length} tab
                {Object.keys(loaded.data).length === 1 ? "" : "s"}
              </p>
              <p className="text-xs text-optidge-text-muted">{loaded.sheet.name}</p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setPreviewOpen((v) => !v)}
                  className="text-sm text-accent underline hover:no-underline"
                >
                  {previewOpen ? "Hide preview" : "Preview"}
                </button>
                <button
                  type="button"
                  onClick={resetToPickSheet}
                  className="text-sm text-optidge-text-muted underline hover:text-optidge-text"
                >
                  Change Sheet
                </button>
              </div>
              {previewOpen && previewRows.length > 0 && (
                <div className="max-h-48 overflow-auto rounded border border-gray-200 bg-white p-2">
                  <table className="w-full text-left text-xs text-optidge-text">
                    <tbody>
                      {previewRows.map((row, i) => (
                        <tr
                          key={i}
                          className={row.tab ? "border-t border-gray-200 font-medium" : ""}
                        >
                          {row.tab ? (
                            <td colSpan={row.cells.length} className="py-1 pr-2">
                              {row.tab}
                            </td>
                          ) : (
                            row.cells.map((cell, j) => (
                              <td key={j} className="py-1 pr-2 text-optidge-text-muted">
                                {cell || "—"}
                              </td>
                            ))
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {errorBlock}

          <div className="mt-4 border-t border-gray-200 pt-3">
            {!showFallbackUpload ? (
              <button
                type="button"
                onClick={() => setShowFallbackUpload(true)}
                className="text-xs text-optidge-text-muted underline hover:text-optidge-text"
              >
                or upload a file instead
              </button>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 bg-optidge-green-pale/30 p-4">
                <p className="font-mono text-xs font-medium text-optidge-text">
                  Upload calendar file
                </p>
                <p className="mt-0.5 text-xs text-optidge-text-muted">
                  CSV, Excel, or PDF (PDF content is not extracted)
                </p>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.pdf"
                  multiple
                  className="mt-2 block w-full text-xs text-optidge-text-muted file:mr-2 file:rounded file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
                  onChange={(e) => {
                    const list = e.target.files ? Array.from(e.target.files) : [];
                    handleFallbackFiles(list);
                    e.target.value = "";
                  }}
                />
                {fallbackFiles.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {fallbackFiles.map((f) => (
                      <li key={f.name + f.size} className="text-xs text-optidge-text-muted">
                        {f.name}
                      </li>
                    ))}
                  </ul>
                )}
                {fallbackText && (
                  <p className="mt-2 text-xs text-green-600">File loaded for calendar data</p>
                )}
                {fallbackErrors.length > 0 && (
                  <p className="mt-1 text-xs text-red-600">
                    {fallbackErrors.map((e) => `${e.fileName}: ${e.error}`).join("; ")}
                  </p>
                )}
              </div>
            )}
          </div>
      </div>
    </section>
  );
}
