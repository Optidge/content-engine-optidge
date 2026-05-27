import { NextRequest, NextResponse } from "next/server";
import { getGoogleAccessToken } from "@/lib/googleToken";
import { mapGoogleApiError } from "@/lib/googleApiErrors";

export async function GET(req: NextRequest) {
  const auth = await getGoogleAccessToken();
  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error, code: auth.code },
      { status: auth.status }
    );
  }

  const spreadsheetId = req.nextUrl.searchParams.get("spreadsheetId")?.trim();
  if (!spreadsheetId) {
    return NextResponse.json({ error: "spreadsheetId is required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=sheets.properties`,
      { headers: { Authorization: `Bearer ${auth.token}` } }
    );

    if (!res.ok) {
      const errText = await res.text();
      const mapped = mapGoogleApiError(res.status, errText);
      return NextResponse.json(
        { error: mapped.message, code: mapped.code },
        { status: res.status }
      );
    }

    const data = (await res.json()) as {
      sheets?: { properties?: { title?: string; sheetId?: number } }[];
    };

    const tabs = (data.sheets ?? [])
      .map((sheet) => sheet.properties)
      .filter((p): p is { title: string; sheetId: number } =>
        Boolean(p?.title && p.sheetId != null)
      )
      .map((p) => ({
        title: p.title!,
        sheetId: p.sheetId!,
      }));

    return NextResponse.json({ tabs });
  } catch (e) {
    console.error("[Sheets tabs] Error:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Request failed" },
      { status: 500 }
    );
  }
}
