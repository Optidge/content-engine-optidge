import { NextRequest, NextResponse } from "next/server";
import { getGoogleAccessToken } from "@/lib/googleToken";
import { mapGoogleApiError } from "@/lib/googleApiErrors";

type DriveFile = {
  id: string;
  name: string;
  modifiedTime: string;
  owners?: { emailAddress?: string; displayName?: string }[];
};

export async function GET(req: NextRequest) {
  const auth = await getGoogleAccessToken();
  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error, code: auth.code },
      { status: auth.status }
    );
  }

  const search = req.nextUrl.searchParams.get("search")?.trim() ?? "";
  let q = "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false";
  if (search) {
    const escaped = search.replace(/'/g, "''");
    q += ` and name contains '${escaped}'`;
  }

  const params = new URLSearchParams({
    q,
    fields: "files(id,name,modifiedTime,owners)",
    orderBy: "modifiedTime desc",
    pageSize: "20",
  });

  try {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
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

    const data = (await res.json()) as { files?: DriveFile[] };
    const sheets = (data.files ?? []).map((file) => ({
      id: file.id,
      name: file.name,
      modifiedTime: file.modifiedTime,
      owner: file.owners?.[0]?.emailAddress ?? file.owners?.[0]?.displayName ?? "",
    }));

    return NextResponse.json({ sheets });
  } catch (e) {
    console.error("[Sheets list] Error:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Request failed" },
      { status: 500 }
    );
  }
}
