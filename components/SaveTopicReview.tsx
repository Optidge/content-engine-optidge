"use client";

import { useEffect, useState } from "react";
import type { Topic } from "@/types/api";
import type { FeedbackValue } from "@/components/FeedbackButtons";

type Props = {
  clientId: string;
  generationId: string | null;
  topics: Topic[];
  feedbackByTitle: Record<string, FeedbackValue>;
  onSaved?: () => void;
};

export function SaveTopicReview({
  clientId,
  generationId,
  topics,
  feedbackByTitle,
  onSaved,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSaved(false);
  }, [feedbackByTitle]);

  const likedCount = Object.values(feedbackByTitle).filter((v) => v === "liked").length;
  const dislikedCount = Object.values(feedbackByTitle).filter((v) => v === "disliked").length;
  const ratedCount = likedCount + dislikedCount;

  async function handleSave() {
    if (!generationId || ratedCount === 0) return;
    setSaving(true);
    setError(null);
    try {
      const topicByTitle = new Map(topics.map((t) => [t.title, t]));
      const items = Object.entries(feedbackByTitle)
        .filter((entry): entry is [string, "liked" | "disliked"] => {
          const value = entry[1];
          return value === "liked" || value === "disliked";
        })
        .map(([title, feedback]) => {
          const topic = topicByTitle.get(title);
          return {
            topicTitle: title,
            pillar: topic?.pillar,
            contentType: topic?.contentType,
            targetKeywords: topic?.targetKeywords,
            rationale: topic?.rationale,
            feedback,
          };
        });

      const res = await fetch("/api/feedback/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, generationId, items }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save review");
        setSaved(false);
        return;
      }
      setSaved(true);
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save review");
      setSaved(false);
    } finally {
      setSaving(false);
    }
  }

  if (!generationId) {
    return (
      <p className="mt-3 text-sm text-optidge-text-muted">
        Preparing generation record… You can rate topics once it is ready.
      </p>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-accent/30 bg-white p-4">
      <p className="text-sm text-optidge-text">
        Save your review so approved topics are stored on this client profile and used in future
        generations.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={saving || ratedCount === 0}
          onClick={() => {
            setSaved(false);
            void handleSave();
          }}
          className="rounded bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Saving…"
            : `Save review (${likedCount} approved${dislikedCount > 0 ? `, ${dislikedCount} rejected` : ""})`}
        </button>
        {saved && !error && (
          <span className="text-sm text-green-700">
            Saved — {likedCount} approved topic{likedCount === 1 ? "" : "s"} stored for this client.
          </span>
        )}
        {ratedCount === 0 && (
          <span className="text-sm text-optidge-text-muted">
            Rate topics with 👍 or 👎, then save.
          </span>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
