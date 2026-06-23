import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { normalizeClientUrl } from "@/lib/normalizeUrl";
import type { ClientRecord } from "@/types/db";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const name = String(body.name ?? "").trim();
    const url = String(body.url ?? "").trim();
    const pillars = Array.isArray(body.pillars) ? body.pillars.map(String) : [];

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: "Client name is required" }, { status: 400 });
    }

    const normalized = normalizeClientUrl(url);
    if (!normalized) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const { data: clients, error: fetchError } = await supabaseAdmin
      .from("clients")
      .select("*")
      .not("url", "is", null);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const matches = (clients ?? []).filter(
      (client) => normalizeClientUrl(client.url ?? "") === normalized
    );

    if (matches.length > 0) {
      // Duplicate URLs: prefer the most recently updated profile.
      matches.sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      return NextResponse.json({ client: matches[0] as ClientRecord, created: false });
    }

    const session = await getServerSession(authOptions);
    const createdBy = session?.user?.email ?? "unknown";

    const payload = {
      name,
      url,
      pillars,
      gsc_property: null,
      google_sheet_id: null,
      google_sheet_name: null,
      google_sheet_tabs: [],
      brand_voice: null,
      additional_notes: null,
      created_by: createdBy,
    };

    const { data, error: insertError } = await supabaseAdmin
      .from("clients")
      .insert(payload)
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ client: data as ClientRecord, created: true }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to resolve client";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
