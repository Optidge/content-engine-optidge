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
  if (!clientId) {
    return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const fallbackGeneratedBy = String(body.generatedBy ?? "").trim();
  const generatedBy = session?.user?.email
    ? session.user.email
    : fallbackGeneratedBy || "unknown";

  const payload = {
    client_id: clientId,
    generated_by: generatedBy,
    topic_count: Number(body.topicCount ?? 0),
    data_sources_used: Array.isArray(body.dataSourcesUsed) ? body.dataSourcesUsed : [],
    ai_summary: body.aiSummary ?? {},
    topics: body.topics ?? [],
    status: String(body.status ?? "completed"),
  };

  const { data, error } = await supabaseAdmin
    .from("generations")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ generation: data }, { status: 201 });
}
