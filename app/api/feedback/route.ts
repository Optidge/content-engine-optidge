import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const clientId = String(body.clientId ?? "").trim();
  const topicTitle = String(body.topicTitle ?? "").trim();
  const feedback = String(body.feedback ?? "").trim();

  if (!clientId || !topicTitle || (feedback !== "liked" && feedback !== "disliked")) {
    return NextResponse.json(
      { error: "clientId, topicTitle, and valid feedback are required" },
      { status: 400 }
    );
  }

  const session = await getServerSession(authOptions);
  const feedbackBy = session?.user?.email ?? "unknown";
  const generationId = String(body.generationId ?? "").trim() || null;

  if (generationId) {
    const { error: deleteError } = await supabaseAdmin
      .from("topic_feedback")
      .delete()
      .eq("generation_id", generationId)
      .eq("topic_title", topicTitle);
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
  }

  const payload = {
    client_id: clientId,
    generation_id: generationId,
    topic_title: topicTitle,
    pillar: String(body.pillar ?? "").trim() || null,
    content_type: String(body.contentType ?? "").trim() || null,
    target_keywords: Array.isArray(body.targetKeywords) ? body.targetKeywords : [],
    rationale: String(body.rationale ?? "").trim() || null,
    feedback: feedback as "liked" | "disliked",
    feedback_by: feedbackBy,
  };

  const { data, error } = await supabaseAdmin
    .from("topic_feedback")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ feedback: data }, { status: 201 });
}
