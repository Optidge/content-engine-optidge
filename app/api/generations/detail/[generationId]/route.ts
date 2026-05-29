import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

type Params = { params: { generationId: string } };

export async function GET(_: NextRequest, { params }: Params) {
  const { data: generation, error } = await supabaseAdmin
    .from("generations")
    .select("*")
    .eq("id", params.generationId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  const { data: feedback } = await supabaseAdmin
    .from("topic_feedback")
    .select("*")
    .eq("generation_id", params.generationId);

  return NextResponse.json({ generation, feedback: feedback ?? [] });
}
