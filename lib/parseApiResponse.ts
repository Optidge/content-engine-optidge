export type ParsedApiResponse = {
  ok: boolean;
  status: number;
  data: Record<string, unknown>;
};

function formatNonJsonBody(status: number, text: string): string {
  const isTimeout =
    status === 504 ||
    /FUNCTION_INVOCATION_TIMEOUT|timed out|timeout/i.test(text);

  if (isTimeout) {
    return "The server timed out before finishing. Try again with less data, or wait a moment and retry.";
  }

  if (/An error occurred/i.test(text)) {
    return "The server returned an unexpected error (often a timeout or deployment issue). Check Vercel logs and retry.";
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return `Request failed (${status})`;
  }

  return trimmed.length > 240 ? `${trimmed.slice(0, 240)}…` : trimmed;
}

export async function parseApiResponse(res: Response): Promise<ParsedApiResponse> {
  const text = await res.text();

  if (!text) {
    return {
      ok: res.ok,
      status: res.status,
      data: res.ok ? {} : { error: `Request failed (${res.status})` },
    };
  }

  try {
    const data = JSON.parse(text) as Record<string, unknown>;
    return { ok: res.ok, status: res.status, data };
  } catch {
    return {
      ok: false,
      status: res.status,
      data: { error: formatNonJsonBody(res.status, text) },
    };
  }
}
