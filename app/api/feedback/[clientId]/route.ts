import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

type Params = { params: { clientId: string } };

export async function GET(_: NextRequest, { params }: Params) {
  const { data, error } = await supabaseAdmin
    .from("topic_feedback")
    .select("*")
    .eq("client_id", params.clientId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const liked = (data ?? [])
    .filter((entry) => entry.feedback === "liked")
    .map((entry) => ({
      topicTitle: entry.topic_title,
      pillar: entry.pillar,
      rationale: entry.rationale,
      feedbackDate: entry.created_at,
    }));
  const disliked = (data ?? [])
    .filter((entry) => entry.feedback === "disliked")
    .map((entry) => ({
      topicTitle: entry.topic_title,
      pillar: entry.pillar,
      rationale: entry.rationale,
      feedbackDate: entry.created_at,
    }));

  return NextResponse.json({ liked, disliked });
}
