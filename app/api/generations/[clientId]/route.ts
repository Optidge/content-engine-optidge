import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

type Params = { params: { clientId: string } };

export async function GET(_: NextRequest, { params }: Params) {
  const { data, error } = await supabaseAdmin
    .from("generations")
    .select("*")
    .eq("client_id", params.clientId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const generationIds = (data ?? []).map((g) => g.id);
  let feedbackRows: { generation_id: string; feedback: "liked" | "disliked" }[] = [];
  if (generationIds.length > 0) {
    const { data: feedbackData } = await supabaseAdmin
      .from("topic_feedback")
      .select("generation_id,feedback")
      .in("generation_id", generationIds);
    feedbackRows = (feedbackData ?? []).filter((row) => Boolean(row.generation_id));
  }

  const feedbackCountByGeneration: Record<string, { liked: number; disliked: number }> = {};
  for (const row of feedbackRows) {
    const key = row.generation_id;
    if (!feedbackCountByGeneration[key]) {
      feedbackCountByGeneration[key] = { liked: 0, disliked: 0 };
    }
    if (row.feedback === "liked") feedbackCountByGeneration[key].liked += 1;
    if (row.feedback === "disliked") feedbackCountByGeneration[key].disliked += 1;
  }

  const generations = (data ?? []).map((generation) => ({
    ...generation,
    feedback: feedbackCountByGeneration[generation.id] ?? { liked: 0, disliked: 0 },
  }));

  return NextResponse.json({ generations });
}
