"use client";

import type { Topic } from "@/types/api";

export type FilterState = {
  pillar: string;
  priority: string;
  contentType: string;
  funnelStage: string;
  difficulty: string;
  sortBy: "priority" | "pillar" | "contentType";
};

type Props = {
  topics: Topic[];
  filter: FilterState;
  onFilterChange: (f: FilterState) => void;
};

const PRIORITIES = ["High", "Medium", "Low"];
const FUNNEL_STAGES = ["Awareness", "Consideration", "Decision"];
const DIFFICULTIES = ["Low", "Medium", "High"];
const SORT_OPTIONS: { value: FilterState["sortBy"]; label: string }[] = [
  { value: "priority", label: "Priority" },
  { value: "pillar", label: "Pillar" },
  { value: "contentType", label: "Content type" },
];

export function TopicFilters({ topics, filter, onFilterChange }: Props) {
  const pillars = Array.from(
    new Set(topics.map((t) => t.pillar).filter(Boolean))
  ).sort();
  const contentTypes = Array.from(
    new Set(topics.map((t) => t.contentType).filter(Boolean))
  ).sort();
  const funnelStages = Array.from(
    new Set(
      topics
        .map((t) => t.funnelStage)
        .filter((s): s is string => Boolean(s))
    )
  ).sort();
  const difficulties = Array.from(
    new Set(
      topics
        .map((t) => t.estimatedDifficulty)
        .filter((d): d is string => Boolean(d))
    )
  ).sort();

  const selectClass =
    "rounded border border-gray-200 bg-white px-2 py-1.5 text-sm text-optidge-text outline-none focus:border-accent";

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-optidge-text-muted">Pillar</span>
        <select
          value={filter.pillar}
          onChange={(e) => onFilterChange({ ...filter, pillar: e.target.value })}
          className={selectClass}
        >
          <option value="">All</option>
          {pillars.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-optidge-text-muted">Priority</span>
        <select
          value={filter.priority}
          onChange={(e) => onFilterChange({ ...filter, priority: e.target.value })}
          className={selectClass}
        >
          <option value="">All</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-optidge-text-muted">Content type</span>
        <select
          value={filter.contentType}
          onChange={(e) => onFilterChange({ ...filter, contentType: e.target.value })}
          className={selectClass}
        >
          <option value="">All</option>
          {contentTypes.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-optidge-text-muted">Funnel</span>
        <select
          value={filter.funnelStage}
          onChange={(e) => onFilterChange({ ...filter, funnelStage: e.target.value })}
          className={selectClass}
        >
          <option value="">All</option>
          {(funnelStages.length > 0 ? funnelStages : FUNNEL_STAGES).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-optidge-text-muted">Difficulty</span>
        <select
          value={filter.difficulty}
          onChange={(e) => onFilterChange({ ...filter, difficulty: e.target.value })}
          className={selectClass}
        >
          <option value="">All</option>
          {(difficulties.length > 0 ? difficulties : DIFFICULTIES).map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-optidge-text-muted">Sort by</span>
        <select
          value={filter.sortBy}
          onChange={(e) =>
            onFilterChange({
              ...filter,
              sortBy: e.target.value as FilterState["sortBy"],
            })
          }
          className={selectClass}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

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

export function filterAndSortTopics(
  topics: Topic[],
  filter: FilterState
): Topic[] {
  let result = [...topics];
  if (filter.pillar) {
    result = result.filter((t) => t.pillar === filter.pillar);
  }
  if (filter.priority) {
    result = result.filter((t) => t.priority === filter.priority);
  }
  if (filter.contentType) {
    result = result.filter((t) => t.contentType === filter.contentType);
  }
  if (filter.funnelStage) {
    result = result.filter(
      (t) => normalizeFunnelStage(t.funnelStage) === filter.funnelStage
    );
  }
  if (filter.difficulty) {
    result = result.filter(
      (t) => normalizeDifficulty(t.estimatedDifficulty) === filter.difficulty
    );
  }
  const order = { High: 0, Medium: 1, Low: 2 };
  switch (filter.sortBy) {
    case "priority":
      result.sort(
        (a, b) =>
          (order[a.priority] ?? 2) - (order[b.priority] ?? 2) ||
          a.title.localeCompare(b.title)
      );
      break;
    case "pillar":
      result.sort(
        (a, b) =>
          a.pillar.localeCompare(b.pillar) || a.title.localeCompare(b.title)
      );
      break;
    case "contentType":
      result.sort(
        (a, b) =>
          a.contentType.localeCompare(b.contentType) ||
          a.title.localeCompare(b.title)
      );
      break;
  }
  return result;
}
