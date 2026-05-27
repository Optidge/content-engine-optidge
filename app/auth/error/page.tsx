"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const ERROR_MESSAGES: Record<string, string> = {
  Configuration:
    "Server misconfiguration. Check GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and NEXTAUTH_SECRET in .env.local, then restart npm run dev.",
  AccessDenied:
    "Google sign-in was denied. If the app is in Testing mode, add your Gmail as a test user in Google Cloud → OAuth consent screen.",
  Verification:
    "Google could not verify the sign-in request. Check authorized redirect URIs in Google Cloud (see docs/OAUTH-LOCAL-SETUP.md).",
  OAuthSignin: "Could not start Google sign-in. Restart the dev server and try again.",
  OAuthCallback:
    "Google redirected back but the callback failed. Usually a redirect URI mismatch — add http://localhost:3000/api/auth/callback/google in Google Cloud.",
  OAuthCreateAccount: "Could not create account from Google profile.",
  Callback: "Callback error — confirm NEXTAUTH_URL matches the URL in your browser (http://localhost:3000, not 127.0.0.1).",
  OAuthAccountNotLinked:
    "This email is already linked to another sign-in method. Use the same Google account you used before.",
  SessionRequired: "You must sign in first.",
  Default: "An unknown sign-in error occurred.",
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") ?? "Default";
  const message = ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default;

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-xl font-medium text-optidge-text">Google sign-in failed</h1>
      <p className="mt-2 text-sm text-red-600">
        Error code: <span className="font-mono">{error}</span>
      </p>
      <p className="mt-4 text-sm text-optidge-text">{message}</p>
      <Link
        href="/"
        className="mt-6 inline-block rounded bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Back to ContentEngine
      </Link>
    </main>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-optidge-text-muted">Loading…</p>}>
      <AuthErrorContent />
    </Suspense>
  );
}
