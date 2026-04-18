"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function ProofUploader({
  winnerId,
  hasProof,
}: {
  winnerId: string;
  hasProof: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <div className="space-y-2">
      <label className="block text-xs uppercase tracking-wider text-muted-foreground">
        Upload screenshot proof of your scores
      </label>
      <input
        type="file"
        accept="image/*"
        disabled={pending}
        onChange={(e) => {
          const file = e.currentTarget.files?.[0];
          if (!file) return;
          setError(null);
          start(async () => {
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch(`/api/winners/${winnerId}/proof`, {
              method: "POST",
              body: fd,
            });
            const json = await res.json();
            if (!res.ok) setError(json.error ?? "Upload failed");
            else router.refresh();
          });
        }}
        className="block w-full text-sm"
      />
      {hasProof && !pending && !error && (
        <p className="text-xs text-muted-foreground">
          Proof uploaded — waiting for admin review.
        </p>
      )}
      {pending && <p className="text-xs text-muted-foreground">Uploading…</p>}
      {error && <p className="text-xs text-accent">{error}</p>}
    </div>
  );
}
