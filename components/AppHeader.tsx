"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export function AppHeader() {
  const { data: session } = useSession();

  return (
    <header className="border-b border-gray-200 bg-optidge-green-pale/50 px-6 py-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-mono text-lg font-medium tracking-tight text-optidge-text">
            ContentEngine
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/" className="text-optidge-text-muted hover:text-accent">
              Generate
            </Link>
            <Link href="/clients" className="text-optidge-text-muted hover:text-accent">
              Clients
            </Link>
          </nav>
        </div>
        <p className="text-xs text-optidge-text-muted">{session?.user?.email ?? "Not signed in"}</p>
      </div>
    </header>
  );
}
