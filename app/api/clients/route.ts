import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("clients")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const clientIds = (data ?? []).map((client) => client.id);
  let generationCounts: Record<string, number> = {};
  let lastGenerationAt: Record<string, string | null> = {};

  if (clientIds.length > 0) {
    const { data: generations } = await supabaseAdmin
      .from("generations")
      .select("client_id,created_at")
      .in("client_id", clientIds)
      .order("created_at", { ascending: false });

    for (const row of generations ?? []) {
      generationCounts[row.client_id] = (generationCounts[row.client_id] ?? 0) + 1;
      if (!lastGenerationAt[row.client_id]) {
        lastGenerationAt[row.client_id] = row.created_at;
      }
    }
  }

  const clients = (data ?? []).map((client) => ({
    ...client,
    generationsCount: generationCounts[client.id] ?? 0,
    lastGenerationAt: lastGenerationAt[client.id] ?? null,
  }));

  return NextResponse.json({ clients });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Client name is required" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const createdBy = session?.user?.email ?? "unknown";

  const payload = {
    name,
    url: String(body.url ?? "").trim() || null,
    pillars: Array.isArray(body.pillars) ? body.pillars : [],
    gsc_property: String(body.gsc_property ?? "").trim() || null,
    google_sheet_id: String(body.google_sheet_id ?? "").trim() || null,
    google_sheet_name: String(body.google_sheet_name ?? "").trim() || null,
    google_sheet_tabs: Array.isArray(body.google_sheet_tabs) ? body.google_sheet_tabs : [],
    brand_voice: String(body.brand_voice ?? "").trim() || null,
    additional_notes: String(body.additional_notes ?? "").trim() || null,
    created_by: createdBy,
  };

  const { data, error } = await supabaseAdmin
    .from("clients")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ client: data }, { status: 201 });
}
