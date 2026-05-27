import type { JWT } from "next-auth/jwt";

type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  error?: string;
  error_description?: string;
};

/**
 * Exchange a refresh token for a new Google access token (NextAuth JWT callback).
 */
export async function refreshGoogleAccessToken(token: JWT): Promise<JWT> {
  const refreshToken = token.refreshToken as string | undefined;
  if (!refreshToken) {
    console.error("[NextAuth] No refresh token — user must reconnect Google");
    return { ...token, error: "RefreshAccessTokenError" };
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId?.trim() || !clientSecret?.trim()) {
    console.error("[NextAuth] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing");
    return { ...token, error: "RefreshAccessTokenError" };
  }

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    const data = (await res.json()) as GoogleTokenResponse;

    if (!res.ok) {
      console.error("[NextAuth] Token refresh failed:", data.error, data.error_description);
      return { ...token, error: "RefreshAccessTokenError" };
    }

    if (!data.access_token) {
      return { ...token, error: "RefreshAccessTokenError" };
    }

    return {
      ...token,
      accessToken: data.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
      refreshToken: data.refresh_token ?? refreshToken,
      error: undefined,
    };
  } catch (e) {
    console.error("[NextAuth] Token refresh error:", e instanceof Error ? e.message : e);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}
