"use client";

import { useState, useCallback, useEffect } from "react";
import { ClientConfig, type ClientConfigState } from "@/components/ClientConfig";
import { GSCConnect } from "@/components/GSCConnect";
import { SheetsConnect } from "@/components/SheetsConnect";
import {
  FileUpload,
  initialFileUploadState,
  type FileUploadState,
} from "@/components/FileUpload";
import { GenerateButton } from "@/components/GenerateButton";
import { ResultsSummary } from "@/components/ResultsSummary";
import { TopicCard } from "@/components/TopicCard";
import { ClientSelector } from "@/components/ClientSelector";
import { FeedbackSummary } from "@/components/FeedbackSummary";
import { SaveTopicReview } from "@/components/SaveTopicReview";
import {
  TopicFilters,
  filterAndSortTopics,
  type FilterState,
} from "@/components/TopicFilters";
import { ExportButton } from "@/components/ExportButton";
import type { GenerateResponse } from "@/types/api";
import type { ClientRecord } from "@/types/db";
import type { FeedbackValue } from "@/components/FeedbackButtons";

const initialFilterState: FilterState = {
  pillar: "",
  priority: "",
  contentType: "",
  funnelStage: "",
  difficulty: "",
  sortBy: "priority",
};

export default function ContentEnginePage() {
  const [view, setView] = useState<"config" | "results">("config");
  const [mode, setMode] = useState<"profile" | "quick">("quick");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);
  const [clientConfig, setClientConfig] = useState<ClientConfigState>({
    clientName: "",
    clientUrl: "",
    clientType: "non-ecommerce",
    pillars: [],
  });
  const [gscData, setGscData] = useState("");
  const [pastCalendarsData, setPastCalendarsData] = useState("");
  const [fileUpload, setFileUpload] = useState<FileUploadState>(initialFileUploadState);
  const [additionalContext, setAdditionalContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [feedbackByTitle, setFeedbackByTitle] = useState<Record<string, FeedbackValue>>({});
  const [filter, setFilter] = useState<FilterState>(initialFilterState);
  const [clientListRefresh, setClientListRefresh] = useState(0);
  const preselectedSheetTabs = selectedClient?.google_sheet_tabs ?? undefined;

  useEffect(() => {
    if (!selectedClientId) {
      setSelectedClient(null);
      return;
    }
    fetch(`/api/clients/${selectedClientId}`)
      .then((r) => r.json())
      .then((data) => {
        const client = data.client as ClientRecord | undefined;
        if (!client) return;
        setSelectedClient(client);
        setClientConfig({
          clientName: client.name ?? "",
          clientUrl: client.url ?? "",
          clientType: "non-ecommerce",
          pillars: client.pillars ?? [],
        });
        if (client.additional_notes) {
          setAdditionalContext((prev) => (prev.trim() ? prev : client.additional_notes!));
        }
      })
      .catch(() => setSelectedClient(null));
  }, [selectedClientId]);

  const hasGsc = gscData.length > 0;
  const hasCalendarData = pastCalendarsData.length > 0;
  const hasAnyFile =
    fileUpload.semrushClient.files.length > 0 ||
    fileUpload.semrushCompetitor.files.length > 0 ||
    fileUpload.other.files.length > 0;
  const hasDataSource = hasGsc || hasCalendarData || hasAnyFile;
  const hasClientName = clientConfig.clientName.trim().length > 0;
  const hasClientUrl = clientConfig.clientUrl.trim().length > 0;
  const hasPillar = clientConfig.pillars.length > 0;
  const canGenerate = hasClientName && hasClientUrl && hasPillar && hasDataSource;

  const missingRequirements: string[] = [];
  if (!hasClientName) missingRequirements.push("client name");
  if (!hasClientUrl) missingRequirements.push("client website URL");
  if (!hasPillar) missingRequirements.push("at least one service pillar");
  if (!hasDataSource) {
    missingRequirements.push("GSC data, a content calendar (Google Sheet), or at least one uploaded file");
  }

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    try {
      let activeClientId = selectedClientId;
      let activeClientName = clientConfig.clientName.trim();
      let activeClientUrl = clientConfig.clientUrl.trim();
      let activePillars = clientConfig.pillars;
      let activeBrandVoice = selectedClient?.brand_voice ?? undefined;

      if (!activeClientId) {
        const resolveRes = await fetch("/api/clients/resolve-by-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: activeClientName,
            url: activeClientUrl,
            pillars: activePillars,
          }),
        });
        const resolveData = await resolveRes.json();
        if (!resolveRes.ok) {
          setError(resolveData.error || "Failed to resolve client profile");
          return;
        }

        const client = resolveData.client as ClientRecord;
        activeClientId = client.id;
        activeClientName = client.name;
        activeClientUrl = client.url ?? activeClientUrl;
        activePillars = client.pillars ?? [];
        activeBrandVoice = client.brand_voice ?? undefined;

        setSelectedClientId(client.id);
        setSelectedClient(client);
        setMode("profile");
        setClientConfig({
          clientName: client.name,
          clientUrl: client.url ?? "",
          clientType: clientConfig.clientType,
          pillars: client.pillars ?? [],
        });
        if (resolveData.created) {
          setClientListRefresh((n) => n + 1);
        }
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: activeClientId ?? undefined,
          clientName: activeClientName,
          clientUrl: activeClientUrl,
          clientType: clientConfig.clientType,
          pillars: activePillars,
          brandVoice: activeBrandVoice,
          gscData: gscData || undefined,
          semrushClientData: fileUpload.semrushClient.text || undefined,
          semrushCompetitorData: fileUpload.semrushCompetitor.text || undefined,
          pastCalendars: pastCalendarsData || undefined,
          otherData: fileUpload.other.text || undefined,
          additionalContext: additionalContext.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Request failed");
        return;
      }
      const generationResult = data as GenerateResponse;
      setResult(generationResult);
      setView("results");
      setFeedbackByTitle({});

      if (activeClientId) {
        const sources: string[] = [];
        if (gscData) sources.push("GSC");
        if (fileUpload.semrushClient.text) sources.push("SEMrush Client");
        if (fileUpload.semrushCompetitor.text) sources.push("SEMrush Competitor");
        if (pastCalendarsData) sources.push("Google Sheets Calendar");
        if (fileUpload.other.text) sources.push("Other");

        const saveRes = await fetch("/api/generations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: activeClientId,
            topicCount: generationResult.topics.length,
            dataSourcesUsed: sources,
            aiSummary: generationResult.dataSummary,
            topics: generationResult.topics,
          }),
        });
        const saveData = await saveRes.json();
        if (saveRes.ok) {
          setGenerationId(saveData.generation?.id ?? null);
        }
      } else {
        setGenerationId(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [
    canGenerate,
    clientConfig,
    selectedClientId,
    selectedClient,
    gscData,
    pastCalendarsData,
    fileUpload,
    additionalContext,
  ]);

  const topics = result?.topics ?? [];
  const filteredTopics = filterAndSortTopics(topics, filter);
  const likedCount = Object.values(feedbackByTitle).filter((v) => v === "liked").length;
  const dislikedCount = Object.values(feedbackByTitle).filter((v) => v === "disliked").length;
  const pendingCount = Math.max(0, topics.length - likedCount - dislikedCount);

  const highCount = topics.filter((t) => t.priority === "High").length;
  const mediumCount = topics.filter((t) => t.priority === "Medium").length;
  const lowCount = topics.filter((t) => t.priority === "Low").length;
  const typeCounts = topics.reduce<Record<string, number>>((acc, t) => {
    const c = t.contentType || "Other";
    acc[c] = (acc[c] ?? 0) + 1;
    return acc;
  }, {});

  return (
      <main className="mx-auto max-w-4xl px-6 py-8">
          {view === "config" && (
            <>
              <ClientSelector
                selectedClientId={selectedClientId}
                refreshToken={clientListRefresh}
                onSelectClient={(clientId, nextMode) => {
                  setMode(nextMode);
                  setSelectedClientId(clientId);
                  if (nextMode === "quick") {
                    setSelectedClient(null);
                    setClientConfig({ clientName: "", clientUrl: "", clientType: "non-ecommerce", pillars: [] });
                    setAdditionalContext("");
                  }
                }}
              />
              <div className="mt-6">
                <ClientConfig
                  value={clientConfig}
                  onChange={setClientConfig}
                  readOnly={mode === "profile"}
                />
              </div>
              <div className="mt-6">
                <GSCConnect
                  key={`gsc-${selectedClientId ?? mode}`}
                  onDataLoaded={setGscData}
                  initialProperty={selectedClient?.gsc_property ?? ""}
                />
              </div>
              <div className="mt-6">
                <SheetsConnect
                  key={`sheets-${selectedClientId ?? mode}`}
                  clientName={clientConfig.clientName}
                  onDataLoaded={setPastCalendarsData}
                  initialSheetId={selectedClient?.google_sheet_id ?? ""}
                  initialSheetName={selectedClient?.google_sheet_name ?? ""}
                  initialTabNames={preselectedSheetTabs}
                />
              </div>
              <div className="mt-6">
                <FileUpload state={fileUpload} onChange={setFileUpload} />
              </div>
              <div className="mt-6">
                <section className="rounded-lg border border-gray-200 bg-optidge-green-pale/50 p-6 transition-colors hover:border-accent/40">
                  <p className="section-label font-mono mb-4">
                    05 — Additional Context (Optional)
                  </p>
                  {selectedClient?.brand_voice && (
                    <div className="mb-3 rounded border border-gray-200 bg-white p-3">
                      <p className="font-mono text-xs text-optidge-text-muted">Brand Voice (from profile)</p>
                      <p className="mt-1 text-sm text-optidge-text">{selectedClient.brand_voice}</p>
                    </div>
                  )}
                  <textarea
                    placeholder="Any additional notes — upcoming campaigns, seasonal focus, topics to avoid, specific goals for next month, target audience details..."
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    rows={4}
                    className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-optidge-text placeholder-gray-400 outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/50"
                  />
                </section>
              </div>
              {error && (
                <div className="mt-4 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                  <span className="ml-2 inline-flex gap-2">
                    <button
                      type="button"
                      onClick={handleGenerate}
                      className="underline hover:no-underline"
                    >
                      Retry
                    </button>
                    <button
                      type="button"
                      onClick={() => setError(null)}
                      className="underline hover:no-underline"
                    >
                      Dismiss
                    </button>
                  </span>
                </div>
              )}
              <GenerateButton
                disabled={!canGenerate}
                loading={loading}
                missingRequirements={missingRequirements}
                onGenerate={handleGenerate}
              />
            </>
          )}

          {view === "results" && result && (
            <>
              <ResultsSummary dataSummary={result.dataSummary} />
              {selectedClientId && (
                <>
                  <FeedbackSummary liked={likedCount} disliked={dislikedCount} pending={pendingCount} />
                  <SaveTopicReview
                    clientId={selectedClientId}
                    generationId={generationId}
                    topics={topics}
                    feedbackByTitle={feedbackByTitle}
                  />
                </>
              )}
              <div className="mt-6 flex flex-wrap gap-4 rounded-lg border border-gray-200 bg-optidge-green-pale/30 p-4">
                <div className="text-green-700">
                  <span className="font-mono text-xs text-optidge-text-muted">High</span>{" "}
                  {highCount}
                </div>
                <div className="text-amber-700">
                  <span className="font-mono text-xs text-optidge-text-muted">Medium</span>{" "}
                  {mediumCount}
                </div>
                <div className="text-optidge-text-muted">
                  <span className="font-mono text-xs text-optidge-text-muted">Low</span>{" "}
                  {lowCount}
                </div>
                <div className="text-accent font-medium">
                  <span className="font-mono text-xs text-optidge-text-muted">Total</span>{" "}
                  {topics.length}
                </div>
                {Object.entries(typeCounts).map(([type, count]) => (
                  <div key={type} className="text-optidge-text">
                    <span className="font-mono text-xs text-optidge-text-muted">{type}</span>{" "}
                    {count}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <TopicFilters
                  topics={topics}
                  filter={filter}
                  onFilterChange={setFilter}
                />
                <ExportButton topics={filteredTopics} />
              </div>
              <ul className="mt-6 space-y-3">
                {filteredTopics.map((topic, i) => (
                  <li key={topic.title + i}>
                    <TopicCard
                      topic={topic}
                      index={i}
                      feedbackEnabled={Boolean(selectedClientId)}
                      feedback={feedbackByTitle[topic.title] ?? null}
                      onFeedbackChanged={(value) =>
                        setFeedbackByTitle((prev) => ({ ...prev, [topic.title]: value }))
                      }
                    />
                  </li>
                ))}
              </ul>
            </>
          )}

          {view === "results" && !result && (
            <p className="text-optidge-text-muted">No results to show.</p>
          )}
      </main>
  );
}
