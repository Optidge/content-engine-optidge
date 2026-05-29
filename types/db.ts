export type ClientRecord = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  url: string | null;
  pillars: string[] | null;
  gsc_property: string | null;
  google_sheet_id: string | null;
  google_sheet_name: string | null;
  google_sheet_tabs: string[] | null;
  brand_voice: string | null;
  additional_notes: string | null;
  created_by: string | null;
};

export type GenerationRecord = {
  id: string;
  created_at: string;
  client_id: string;
  generated_by: string | null;
  topic_count: number | null;
  data_sources_used: string[] | null;
  ai_summary: unknown;
  topics: unknown;
  status: string | null;
};

export type TopicFeedbackRecord = {
  id: string;
  created_at: string;
  client_id: string;
  topic_title: string;
  pillar: string | null;
  content_type: string | null;
  target_keywords: string[] | null;
  rationale: string | null;
  feedback: "liked" | "disliked";
  feedback_by: string | null;
  generation_id: string | null;
};
