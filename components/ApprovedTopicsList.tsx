"use client";

import { useEffect, useState } from "react";

type ApprovedTopic = {
  topicTitle: string;
  pillar: string | null;
  rationale: string | null;
  feedbackDate: string;
};

type Props = {
  clientId: string;
  refreshKey?: number;
};

export function ApprovedTopicsList({ clientId, refreshKey = 0 }: Props) {
  const [topics, setTopics] = useState<ApprovedTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/feedback/${clientId}`)
      .then((r) => r.json())
      .then((data) => setTopics(data.liked ?? []))
      .catch(() => setTopics([]))
      .finally(() => setLoading(false));
  }, [clientId, refreshKey]);

  return (
    <section className="rounded-lg border border-gray-200 bg-optidge-green-pale/50 p-6 transition-colors hover:border-accent/40">
      <p className="section-label mb-3 font-mono">Approved topics</p>
      {loading && <p className="text-sm text-optidge-text-muted">Loading…</p>}
      {!loading && topics.length === 0 && (
        <p className="text-sm text-optidge-text-muted">
          No approved topics saved yet. Generate topics, rate them, and use Save review on the
          results page.
        </p>
      )}
      <ul className="space-y-2">
        {topics.map((topic) => (
          <li
            key={`${topic.topicTitle}-${topic.feedbackDate}`}
            className="rounded border border-green-200 bg-green-50/50 px-3 py-2"
          >
            <p className="font-medium text-optidge-text">{topic.topicTitle}</p>
            <p className="text-xs text-optidge-text-muted">
              {topic.pillar ?? "—"} · saved {new Date(topic.feedbackDate).toLocaleDateString()}
            </p>
            {topic.rationale && (
              <p className="mt-1 text-sm text-optidge-text-muted line-clamp-2">{topic.rationale}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
