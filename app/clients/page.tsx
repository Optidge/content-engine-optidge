"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClientCard } from "@/components/ClientCard";
import type { ClientRecord } from "@/types/db";

type ClientWithStats = ClientRecord & {
  generationsCount?: number;
  lastGenerationAt?: string | null;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => setClients(data.clients ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 rounded-lg border border-gray-200 bg-optidge-green-pale/50 p-6 transition-colors hover:border-accent/40">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-optidge-text">Clients</h1>
          <Link
            href="/clients/new"
            className="rounded bg-accent px-3 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Add Client
          </Link>
        </div>
      </div>
      {loading && <p className="text-sm text-optidge-text-muted">Loading clients...</p>}
      {!loading && clients.length === 0 && (
        <p className="text-sm text-optidge-text-muted">No clients yet. Create one to get started.</p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => (
          <ClientCard key={client.id} client={client} />
        ))}
      </div>
    </main>
  );
}
