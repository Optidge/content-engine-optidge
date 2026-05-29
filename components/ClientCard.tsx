import Link from "next/link";
import type { ClientRecord } from "@/types/db";

type ClientWithStats = ClientRecord & {
  generationsCount?: number;
  lastGenerationAt?: string | null;
};

export function ClientCard({ client }: { client: ClientWithStats }) {
  return (
    <Link
      href={`/clients/${client.id}`}
      className="block rounded-lg border border-gray-200 bg-optidge-green-pale/50 p-4 transition-colors hover:border-accent/40"
    >
      <h3 className="text-lg font-semibold text-optidge-text">{client.name}</h3>
      <p className="mt-1 text-sm text-optidge-text-muted">{client.url || "No URL set"}</p>
      <div className="mt-3 text-xs text-optidge-text-muted">
        <p>Pillars: {(client.pillars ?? []).length}</p>
        <p>Generations: {client.generationsCount ?? 0}</p>
        <p>
          Last generation:{" "}
          {client.lastGenerationAt ? new Date(client.lastGenerationAt).toLocaleDateString() : "Never"}
        </p>
      </div>
    </Link>
  );
}
