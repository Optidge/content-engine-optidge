"use client";

import { useRouter } from "next/navigation";
import { ClientForm } from "@/components/ClientForm";

export default function NewClientPage() {
  const router = useRouter();

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 rounded-lg border border-gray-200 bg-optidge-green-pale/50 p-6 transition-colors hover:border-accent/40">
        <h1 className="text-2xl font-semibold text-optidge-text">Add Client</h1>
      </div>
      <ClientForm
        onSave={async (payload) => {
          const res = await fetch("/api/clients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Save failed");
          router.push(`/clients/${data.client.id}`);
        }}
      />
    </main>
  );
}
