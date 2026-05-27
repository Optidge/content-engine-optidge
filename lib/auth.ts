import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import { refreshGoogleAccessToken } from "@/lib/refreshGoogleAccessToken";

const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) {
    throw new Error(
      `NextAuth: ${name} is not set. Add it in Vercel → Settings → Environment Variables (and in Google Cloud for client ID/secret).`
    );
  }
  return value;
}

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === "development",
  providers: [
    GoogleProvider({
      clientId: requireEnv("GOOGLE_CLIENT_ID"),
      clientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            GSC_SCOPE,
            SHEETS_SCOPE,
            DRIVE_SCOPE,
          ].join(" "),
          access_type: "offline",
          prompt: "consent",
          include_granted_scopes: "true",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ account }) {
      if (!account?.access_token) {
        console.error("[NextAuth] Google sign-in succeeded but no access_token was returned");
        return false;
      }
      if (!account.refresh_token) {
        console.warn(
          "[NextAuth] No refresh_token from Google — revoke app access at myaccount.google.com/permissions and reconnect"
        );
      }
      return true;
    },
    async jwt({ token, account }): Promise<JWT> {
      if (account?.access_token) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token ?? token.refreshToken,
          expiresAt: account.expires_at,
          error: undefined,
        };
      }

      const expiresAt = token.expiresAt as number | undefined;
      if (expiresAt && Date.now() / 1000 < expiresAt - 60) {
        return token;
      }

      return refreshGoogleAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.error = token.error;
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/auth/error",
  },
  secret: requireEnv("NEXTAUTH_SECRET"),
};
