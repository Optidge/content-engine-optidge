import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

type FeedbackItem = {
  topicTitle: string;
  pillar?: string;
  contentType?: string;
  targetKeywords?: string[];
  rationale?: string;
  feedback: "liked" | "disliked";
};

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const clientId = String(body.clientId ?? "").trim();
  const generationId = String(body.generationId ?? "").trim();
  const items = Array.isArray(body.items) ? (body.items as FeedbackItem[]) : [];

  if (!clientId || !generationId) {
    return NextResponse.json(
      { error: "clientId and generationId are required" },
      { status: 400 }
    );
  }

  const session = await getServerSession(authOptions);
  const feedbackBy = session?.user?.email ?? "unknown";

  const validItems = items.filter(
    (item) =>
      item &&
      typeof item.topicTitle === "string" &&
      item.topicTitle.trim() &&
      (item.feedback === "liked" || item.feedback === "disliked")
  );

  const { error: deleteError } = await supabaseAdmin
    .from("topic_feedback")
    .delete()
    .eq("generation_id", generationId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (validItems.length > 0) {
    const rows = validItems.map((item) => ({
      client_id: clientId,
      generation_id: generationId,
      topic_title: item.topicTitle.trim(),
      pillar: String(item.pillar ?? "").trim() || null,
      content_type: String(item.contentType ?? "").trim() || null,
      target_keywords: Array.isArray(item.targetKeywords) ? item.targetKeywords : [],
      rationale: String(item.rationale ?? "").trim() || null,
      feedback: item.feedback,
      feedback_by: feedbackBy,
    }));

    const { error: insertError } = await supabaseAdmin.from("topic_feedback").insert(rows);
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  const likedCount = validItems.filter((i) => i.feedback === "liked").length;
  const dislikedCount = validItems.filter((i) => i.feedback === "disliked").length;

  const { error: generationError } = await supabaseAdmin
    .from("generations")
    .update({ status: likedCount > 0 || dislikedCount > 0 ? "reviewed" : "completed" })
    .eq("id", generationId);

  if (generationError) {
    return NextResponse.json({ error: generationError.message }, { status: 500 });
  }

  return NextResponse.json({
    saved: validItems.length,
    liked: likedCount,
    disliked: dislikedCount,
  });
}
