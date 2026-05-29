"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ClientForm } from "@/components/ClientForm";
import { ApprovedTopicsList } from "@/components/ApprovedTopicsList";
import type { ClientRecord } from "@/types/db";

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [client, setClient] = useState<ClientRecord | null>(null);
  useEffect(() => {
    fetch(`/api/clients/${params.id}`)
      .then((r) => r.json())
      .then((data) => setClient(data.client ?? null));
  }, [params.id]);

  if (!client) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-8">
        <p className="text-sm text-optidge-text-muted">Loading client...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-8 space-y-6">
      <div className="rounded-lg border border-gray-200 bg-optidge-green-pale/50 p-6 transition-colors hover:border-accent/40">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-optidge-text">{client.name}</h1>
          <Link href="/" className="text-sm text-accent underline">
            Generate with this client
          </Link>
        </div>
      </div>
      <ClientForm
        initial={{
          name: client.name,
          url: client.url ?? "",
          pillars: client.pillars ?? [],
          gsc_property: client.gsc_property ?? "",
          google_sheet_id: client.google_sheet_id ?? "",
          google_sheet_name: client.google_sheet_name ?? "",
          google_sheet_tabs: client.google_sheet_tabs ?? [],
          brand_voice: client.brand_voice ?? "",
          additional_notes: client.additional_notes ?? "",
        }}
        onSave={async (payload) => {
          const res = await fetch(`/api/clients/${params.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Save failed");
          setClient(data.client);
        }}
        onDelete={async () => {
          const res = await fetch(`/api/clients/${params.id}`, { method: "DELETE" });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Delete failed");
          router.push("/clients");
        }}
      />
      <ApprovedTopicsList clientId={params.id} />
    </main>
  );
}
