"use client";

import { useEffect, useMemo, useState } from "react";

type ClientPayload = {
  name: string;
  url: string;
  pillars: string[];
  gsc_property: string;
  google_sheet_id: string;
  google_sheet_name: string;
  google_sheet_tabs: string[];
  brand_voice: string;
  additional_notes: string;
};

type SheetItem = { id: string; name: string; modifiedTime: string; owner: string };
type TabItem = { title: string; sheetId: number };

type Props = {
  initial?: Partial<ClientPayload>;
  onSave: (payload: ClientPayload) => Promise<void>;
  onDelete?: () => Promise<void>;
};

const emptyPayload: ClientPayload = {
  name: "",
  url: "",
  pillars: [],
  gsc_property: "",
  google_sheet_id: "",
  google_sheet_name: "",
  google_sheet_tabs: [],
  brand_voice: "",
  additional_notes: "",
};

export function ClientForm({ initial, onSave, onDelete }: Props) {
  const [form, setForm] = useState<ClientPayload>({ ...emptyPayload, ...initial });
  const [pillarInput, setPillarInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<string[]>([]);
  const [propertyOpen, setPropertyOpen] = useState(false);
  const [propertyQuery, setPropertyQuery] = useState("");

  const [sheetSearch, setSheetSearch] = useState("");
  const [sheets, setSheets] = useState<SheetItem[]>([]);
  const [tabs, setTabs] = useState<TabItem[]>([]);

  useEffect(() => {
    fetch("/api/gsc/properties")
      .then((r) => r.json())
      .then((data) => setProperties(Array.isArray(data) ? data : []))
      .catch(() => setProperties([]));
  }, []);

  useEffect(() => {
    const qs = sheetSearch.trim() ? `?search=${encodeURIComponent(sheetSearch.trim())}` : "";
    fetch(`/api/sheets/list${qs}`)
      .then((r) => r.json())
      .then((data) => setSheets(data.sheets ?? []))
      .catch(() => setSheets([]));
  }, [sheetSearch]);

  useEffect(() => {
    if (!form.google_sheet_id) {
      setTabs([]);
      return;
    }
    fetch(`/api/sheets/tabs?spreadsheetId=${encodeURIComponent(form.google_sheet_id)}`)
      .then((r) => r.json())
      .then((data) => setTabs(data.tabs ?? []))
      .catch(() => setTabs([]));
  }, [form.google_sheet_id]);

  const selectedTabs = useMemo(() => new Set(form.google_sheet_tabs), [form.google_sheet_tabs]);
  useEffect(() => {
    if (!initial) return;
    setForm({ ...emptyPayload, ...initial });
  }, [initial]);

  const filteredProperties = propertyQuery.trim()
    ? properties.filter((url) => url.toLowerCase().includes(propertyQuery.toLowerCase()))
    : properties;

  function addPillar() {
    const next = pillarInput.trim();
    if (!next || form.pillars.includes(next)) return;
    setForm((prev) => ({ ...prev, pillars: [...prev.pillars, next] }));
    setPillarInput("");
  }

  async function submit() {
    if (!form.name.trim()) {
      setError("Client name is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({ ...form, name: form.name.trim(), url: form.url.trim() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-optidge-green-pale/50 p-6 transition-colors hover:border-accent/40">
      <p className="section-label font-mono mb-4">Client Profile</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          placeholder="Client Name *"
          className="rounded border border-gray-200 bg-white px-3 py-2 text-sm text-optidge-text"
        />
        <input
          value={form.url}
          onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
          placeholder="Website URL"
          className="rounded border border-gray-200 bg-white px-3 py-2 text-sm text-optidge-text"
        />
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block font-mono text-xs text-optidge-text-muted">Service Pillars</label>
        <div className="flex gap-2">
          <input
            value={pillarInput}
            onChange={(e) => setPillarInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addPillar();
              }
            }}
            placeholder="Type a pillar and press Enter"
            className="flex-1 rounded border border-gray-200 bg-white px-3 py-2 text-sm text-optidge-text"
          />
          <button
            type="button"
            onClick={addPillar}
            className="rounded bg-accent px-3 py-2 text-xs font-medium text-white hover:opacity-90"
          >
            Add
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {form.pillars.map((pillar) => (
            <button
              key={pillar}
              type="button"
              onClick={() =>
                setForm((prev) => ({ ...prev, pillars: prev.pillars.filter((p) => p !== pillar) }))
              }
              className="rounded bg-white px-2 py-0.5 font-mono text-xs text-optidge-text"
            >
              {pillar} ×
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="relative">
          <input
            type="text"
            value={propertyOpen ? propertyQuery : form.gsc_property}
            onChange={(e) => {
              setPropertyQuery(e.target.value);
              if (!propertyOpen) setPropertyOpen(true);
            }}
            onFocus={() => {
              setPropertyOpen(true);
              setPropertyQuery(form.gsc_property);
            }}
            placeholder="Type to search properties..."
            className="w-full rounded border border-gray-200 bg-white px-3 py-2 pr-8 text-sm text-optidge-text outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/50"
          />
          <span
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
            aria-hidden
          >
            {propertyOpen ? "▲" : "▼"}
          </span>
          {propertyOpen && (
            <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded border border-gray-200 bg-white py-1 shadow-lg">
              {filteredProperties.length === 0 ? (
                <li className="px-3 py-2 text-sm text-optidge-text-muted">No properties match</li>
              ) : (
                filteredProperties.map((property) => (
                  <li
                    key={property}
                    onClick={() => {
                      setForm((prev) => ({ ...prev, gsc_property: property }));
                      setPropertyQuery("");
                      setPropertyOpen(false);
                    }}
                    className={`cursor-pointer px-3 py-2 text-sm hover:bg-optidge-green-pale ${
                      form.gsc_property === property
                        ? "bg-optidge-green-soft text-optidge-text"
                        : "text-optidge-text"
                    }`}
                  >
                    {property}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
        <input
          value={sheetSearch}
          onChange={(e) => setSheetSearch(e.target.value)}
          placeholder="Search Google Sheets"
          className="rounded border border-gray-200 bg-white px-3 py-2 text-sm text-optidge-text"
        />
      </div>

      {sheets.length > 0 && (
        <div className="mt-2 max-h-40 overflow-auto rounded border border-gray-200 bg-white">
          {sheets.map((sheet) => (
            <button
              key={sheet.id}
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  google_sheet_id: sheet.id,
                  google_sheet_name: sheet.name,
                  google_sheet_tabs: [],
                }))
              }
              className={`block w-full border-b border-gray-100 px-3 py-2 text-left text-sm text-optidge-text last:border-b-0 ${
                form.google_sheet_id === sheet.id ? "bg-optidge-green-soft/60" : "hover:bg-optidge-green-pale/40"
              }`}
            >
              {sheet.name}
            </button>
          ))}
        </div>
      )}

      {tabs.length > 0 && (
        <div className="mt-3">
          <p className="font-mono text-xs text-optidge-text-muted">Content Calendar Tabs</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <label
                key={tab.sheetId}
                className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-xs text-optidge-text"
              >
                <input
                  type="checkbox"
                  checked={selectedTabs.has(tab.title)}
                  onChange={(e) => {
                    setForm((prev) => {
                      const next = new Set(prev.google_sheet_tabs);
                      if (e.target.checked) next.add(tab.title);
                      else next.delete(tab.title);
                      return { ...prev, google_sheet_tabs: Array.from(next) };
                    });
                  }}
                />
                {tab.title}
              </label>
            ))}
          </div>
        </div>
      )}

      <textarea
        value={form.brand_voice}
        onChange={(e) => setForm((p) => ({ ...p, brand_voice: e.target.value }))}
        placeholder="Describe this client's brand voice, tone preferences, content guidelines..."
        rows={5}
        className="mt-4 w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm text-optidge-text"
      />
      <textarea
        value={form.additional_notes}
        onChange={(e) => setForm((p) => ({ ...p, additional_notes: e.target.value }))}
        placeholder="Any recurring context..."
        rows={4}
        className="mt-3 w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm text-optidge-text"
      />

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="rounded bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Client"}
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={() => {
              if (!window.confirm("Delete this client and all associated history/feedback?")) return;
              void onDelete();
            }}
            className="rounded border border-red-300 px-4 py-2 text-sm text-red-700"
          >
            Delete
          </button>
        )}
      </div>
    </section>
  );
}
