import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

type Params = { params: { id: string } };

export async function GET(_: NextRequest, { params }: Params) {
  const { data, error } = await supabaseAdmin
    .from("clients")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ client: data });
}

export async function PUT(req: NextRequest, { params }: Params) {
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
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("clients")
    .update(payload)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ client: data });
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { error } = await supabaseAdmin.from("clients").delete().eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
