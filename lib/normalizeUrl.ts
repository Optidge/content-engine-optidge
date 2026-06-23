/**
 * Normalize a client website URL for consistent lookup.
 * Strips protocol, www, trailing slashes; lowercases host + path.
 */
export function normalizeClientUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    let withProtocol = trimmed;
    if (!/^https?:\/\//i.test(withProtocol)) {
      withProtocol = `https://${withProtocol}`;
    }
    const parsed = new URL(withProtocol);
    let host = parsed.hostname.toLowerCase();
    if (host.startsWith("www.")) {
      host = host.slice(4);
    }
    const pathname = parsed.pathname.replace(/\/+$/, "");
    return `${host}${pathname}`.toLowerCase();
  } catch {
    return trimmed.toLowerCase().replace(/\/+$/, "");
  }
}
