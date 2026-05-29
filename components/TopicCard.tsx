"use client";

import { useState } from "react";
import type { Topic } from "@/types/api";
import { FeedbackButtons, type FeedbackValue } from "@/components/FeedbackButtons";

type Props = {
  topic: Topic;
  index: number;
  feedback?: FeedbackValue;
  feedbackEnabled?: boolean;
  onFeedbackChanged?: (value: FeedbackValue) => void;
};

const priorityColors = {
  High: "text-green-700 border-green-300 bg-green-50",
  Medium: "text-amber-700 border-amber-300 bg-amber-50",
  Low: "text-optidge-text-muted border-gray-300 bg-gray-100",
};

const funnelStageColors: Record<string, string> = {
  Awareness: "border-slate-300 bg-slate-100 text-slate-700",
  Consideration: "border-amber-300 bg-amber-50 text-amber-800",
  Decision: "border-green-300 bg-green-50 text-green-700",
};

const difficultyColors: Record<string, string> = {
  Low: "border-green-300 bg-green-50 text-green-700",
  Medium: "border-amber-300 bg-amber-50 text-amber-800",
  High: "border-red-300 bg-red-50 text-red-700",
};

function normalizeFunnelStage(stage?: string): string {
  if (!stage) return "";
  const lower = stage.toLowerCase();
  if (lower.startsWith("aware")) return "Awareness";
  if (lower.startsWith("consider")) return "Consideration";
  if (lower.startsWith("decision")) return "Decision";
  return stage;
}

function normalizeDifficulty(difficulty?: string): string {
  if (!difficulty) return "";
  const lower = difficulty.toLowerCase();
  if (lower.startsWith("low")) return "Low";
  if (lower.startsWith("high")) return "High";
  if (lower.startsWith("med")) return "Medium";
  return difficulty;
}

export function TopicCard({
  topic,
  index,
  feedback = null,
  feedbackEnabled = false,
  onFeedbackChanged,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const priorityClass = priorityColors[topic.priority] ?? priorityColors.Low;
  const funnelStage = normalizeFunnelStage(topic.funnelStage);
  const difficulty = normalizeDifficulty(topic.estimatedDifficulty);
  const funnelClass =
    funnelStageColors[funnelStage] ?? "border-gray-200 bg-gray-50 text-optidge-text-muted";
  const difficultyClass =
    difficultyColors[difficulty] ?? "border-gray-200 bg-gray-50 text-optidge-text-muted";

  return (
    <article
      className="rounded-lg border border-gray-200 bg-optidge-green-pale/30 transition-all hover:border-accent/40"
      style={{
        animation: `fadeUp 0.4s ease-out ${index * 0.05}s both`,
      }}
    >
      <div className="p-4">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-start gap-3 text-left"
        >
          <span
            className="mt-1 shrink-0 text-optidge-text-muted transition-transform"
            aria-hidden
          >
            {expanded ? "▼" : "▶"}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-optidge-green-soft px-2 py-0.5 font-mono text-xs text-optidge-text">
                {topic.pillar}
              </span>
              <span
                className={`rounded border px-2 py-0.5 font-mono text-xs ${priorityClass}`}
              >
                {topic.priority}
              </span>
              <span className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 font-mono text-xs text-optidge-text-muted">
                {topic.searchIntent}
              </span>
              {funnelStage && (
                <span
                  className={`rounded border px-2 py-0.5 font-mono text-xs ${funnelClass}`}
                >
                  {funnelStage}
                </span>
              )}
              <span className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 font-mono text-xs text-optidge-text-muted">
                {topic.contentType}
              </span>
              {topic.optimizationOpportunity && (
                <span className="rounded border border-accent bg-optidge-green-soft px-2 py-0.5 font-mono text-xs text-accent">
                  Optimization
                </span>
              )}
            </div>
            <h3 className="mt-2 font-semibold text-optidge-text">{topic.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-optidge-text-muted">{topic.rationale}</p>
          </div>
        </button>
        {feedbackEnabled && (
          <div className="mt-3 pl-8">
            <FeedbackButtons value={feedback} onChanged={(next) => onFeedbackChanged?.(next)} />
          </div>
        )}
      </div>
      {expanded && (
        <div className="border-t border-gray-200 px-4 pb-4 pt-2 pl-12">
          {topic.priorityReason && (
            <p className="mb-3 text-sm italic text-optidge-text-muted">{topic.priorityReason}</p>
          )}
          <div className="space-y-3 text-sm">
            {topic.targetKeywords?.length > 0 && (
              <div>
                <span className="font-mono text-xs text-optidge-text-muted">Target keywords</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {topic.targetKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-optidge-text"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {topic.estimatedImpact && (
              <div>
                <span className="font-mono text-xs text-optidge-text-muted">Estimated impact</span>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <p className="text-optidge-text">{topic.estimatedImpact}</p>
                  {difficulty && (
                    <span
                      className={`rounded border px-2 py-0.5 font-mono text-xs ${difficultyClass}`}
                    >
                      {difficulty} difficulty
                    </span>
                  )}
                </div>
              </div>
            )}
            {!topic.estimatedImpact && difficulty && (
              <div>
                <span className="font-mono text-xs text-optidge-text-muted">Difficulty</span>
                <span
                  className={`ml-2 inline-block rounded border px-2 py-0.5 font-mono text-xs ${difficultyClass}`}
                >
                  {difficulty}
                </span>
              </div>
            )}
            {topic.internalLinkingOpportunity && (
              <div>
                <span className="font-mono text-xs text-optidge-text-muted">Internal linking</span>
                <p className="mt-0.5 text-optidge-text">{topic.internalLinkingOpportunity}</p>
              </div>
            )}
            {topic.suggestedAngle && (
              <div>
                <span className="font-mono text-xs text-optidge-text-muted">Suggested angle</span>
                <p className="mt-0.5 text-optidge-text">{topic.suggestedAngle}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
