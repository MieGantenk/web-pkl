"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { VerifyJurnalResult } from "@/lib/validators/verifikasi-jurnal";

type VerificationAction = (input: unknown) => Promise<VerifyJurnalResult>;

export function VerificationPanel({
  jurnalId,
  canVerify,
  existingNote,
  unavailableMessage,
  action,
}: {
  jurnalId: string;
  canVerify: boolean;
  existingNote: string | null;
  unavailableMessage: string;
  action: VerificationAction;
}) {
  const router = useRouter();
  const [catatan, setCatatan] = useState(existingNote ?? "");
  const [submittingAction, setSubmittingAction] = useState<
    "diterima" | "revisi" | null
  >(null);

  async function submit(status: "diterima" | "revisi") {
    if (status === "revisi" && !catatan.trim()) {
      toast.error("Catatan wajib diisi saat meminta revisi.");
      return;
    }

    setSubmittingAction(status);

    try {
      const result = await action({
        jurnalId,
        status,
        catatan,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    } finally {
      setSubmittingAction(null);
    }
  }

  if (!canVerify) {
    return (
      <div className="rounded-sm border border-success-border bg-success-bg px-3 py-2.5 text-sm leading-[22px] text-success">
        {unavailableMessage}
      </div>
    );
  }

  return (
    <div>
      {existingNote ? (
        <div className="mb-4 rounded-sm border border-border bg-surface-muted px-3 py-2.5 text-sm leading-[22px] text-ink-soft">
          <span className="font-semibold text-ink">Catatan sebelumnya:</span>{" "}
          {existingNote}
        </div>
      ) : null}

      <label
        htmlFor={`catatan-${jurnalId}`}
        className="block text-[13px] font-medium leading-[18px] text-ink"
      >
        Catatan verifikasi
      </label>
      <Textarea
        id={`catatan-${jurnalId}`}
        value={catatan}
        onChange={(event) => setCatatan(event.target.value)}
        maxLength={1000}
        rows={3}
        placeholder="Tulis catatan untuk siswa. Wajib diisi jika meminta revisi."
        className="mt-1.5"
      />
      <p className="mt-1.5 text-xs leading-4 text-muted">
        Catatan revisi akan dibaca siswa sebelum memperbaiki jurnal.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={() => void submit("revisi")}
          loading={submittingAction === "revisi"}
          disabled={submittingAction !== null}
        >
          Minta revisi
        </Button>
        <Button
          type="button"
          onClick={() => void submit("diterima")}
          loading={submittingAction === "diterima"}
          disabled={submittingAction !== null}
        >
          Setujui jurnal
        </Button>
      </div>
    </div>
  );
}
