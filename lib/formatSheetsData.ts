export type SheetTabData = {
  headers: string[];
  rows: string[][];
  rowCount: number;
};

export type SheetsDataResult = Record<string, SheetTabData>;

function cellString(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function normalizeRows(rawRows: unknown[][]): string[][] {
  return rawRows.map((row) => row.map(cellString));
}

export function parseTabRows(tabName: string, rawRows: unknown[][]): SheetTabData {
  const rows = normalizeRows(rawRows);
  if (rows.length === 0) {
    return { headers: [], rows: [], rowCount: 0 };
  }

  const headers = rows[0];
  const dataRows = rows
    .slice(1)
    .filter((row) => row.some((cell) => cell.length > 0));

  return {
    headers,
    rows: dataRows,
    rowCount: dataRows.length,
  };
}

export function formatSheetsForAI(data: SheetsDataResult): string {
  const sections: string[] = [];

  for (const [tabName, tab] of Object.entries(data)) {
    sections.push(`=== Content Calendar: ${tabName} (${tab.rowCount} rows) ===`);

    if (tab.rowCount === 0) {
      sections.push("(no data rows)");
      sections.push("");
      continue;
    }

    const headerLine = tab.headers.length > 0 ? tab.headers.join(" | ") : "(no headers)";
    sections.push(headerLine);

    for (const row of tab.rows) {
      const padded = tab.headers.map((_, i) => row[i] ?? "");
      sections.push(padded.join(" | "));
    }

    sections.push("");
  }

  return sections.join("\n").trim();
}

/** Escape a tab name for Sheets API A1 notation: 'Tab Name' */
export function sheetRangeForTab(tabName: string): string {
  const escaped = tabName.replace(/'/g, "''");
  return `'${escaped}'`;
}
