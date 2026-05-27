import { NextRequest, NextResponse } from "next/server";
import { getGoogleAccessToken } from "@/lib/googleToken";
import { mapGoogleApiError } from "@/lib/googleApiErrors";
import {
  formatSheetsForAI,
  parseTabRows,
  sheetRangeForTab,
  type SheetsDataResult,
} from "@/lib/formatSheetsData";

export async function POST(req: NextRequest) {
  const auth = await getGoogleAccessToken();
  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error, code: auth.code },
      { status: auth.status }
    );
  }

  let body: { spreadsheetId?: string; tabNames?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { spreadsheetId, tabNames } = body;
  if (!spreadsheetId?.trim()) {
    return NextResponse.json({ error: "spreadsheetId is required" }, { status: 400 });
  }
  if (!Array.isArray(tabNames) || tabNames.length === 0) {
    return NextResponse.json({ error: "At least one tab name is required" }, { status: 400 });
  }

  const ranges = tabNames.map(sheetRangeForTab);
  const params = new URLSearchParams();
  for (const range of ranges) {
    params.append("ranges", range);
  }
  params.set("majorDimension", "ROWS");

  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchGet?${params.toString()}`,
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

    const payload = (await res.json()) as {
      valueRanges?: { range?: string; values?: unknown[][] }[];
    };

    const data: SheetsDataResult = {};
    const valueRanges = payload.valueRanges ?? [];

    tabNames.forEach((tabName, index) => {
      const values = valueRanges[index]?.values ?? [];
      data[tabName] = parseTabRows(tabName, values);
    });

    const totalRows = Object.values(data).reduce((sum, tab) => sum + tab.rowCount, 0);
    if (totalRows === 0) {
      return NextResponse.json(
        {
          error: "Selected tabs appear to be empty — try selecting different tabs",
          code: "EMPTY_TABS",
        },
        { status: 400 }
      );
    }

    const formatted = formatSheetsForAI(data);

    console.log("[Sheets data] Pulled successfully", {
      spreadsheetId,
      tabCount: tabNames.length,
      totalRows,
      formattedLength: formatted.length,
    });

    return NextResponse.json({ data, formatted, totalRows });
  } catch (e) {
    console.error("[Sheets data] Error:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Request failed" },
      { status: 500 }
    );
  }
}
