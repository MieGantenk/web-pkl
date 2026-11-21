"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
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
  approveDescription,
  action,
}: {
  jurnalId: string;
  canVerify: boolean;
  existingNote: string | null;
  unavailableMessage: string;
  approveDescription?: string;
  action: VerificationAction;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [catatan, setCatatan] = useState(existingNote ?? "");
  const [submittingAction, setSubmittingAction] = useState<
    "diterima" | "revisi" | null
  >(null);

  async function submit(status: "diterima" | "revisi") {
    if (status === "revisi" && !catatan.trim()) {
      toast.error("Catatan wajib diisi saat meminta revisi.");
      return false;
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
        return false;
      }

      toast.success(result.message);
      router.refresh();
      return true;
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
          onClick={() => dialogRef.current?.showModal()}
          disabled={submittingAction !== null}
        >
          Setujui jurnal
        </Button>
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="setujui-jurnal-title"
        aria-describedby="setujui-jurnal-desc"
        className="app-dialog m-auto w-[calc(100vw-32px)] max-w-[440px] rounded-lg border border-border bg-surface p-6 text-ink shadow-md"
      >
        <h2
          id="setujui-jurnal-title"
          className="text-xl font-semibold text-ink"
        >
          Setujui jurnal?
        </h2>
        <p
          id="setujui-jurnal-desc"
          className="mt-2 text-base leading-[26px] text-ink-soft"
        >
          {approveDescription ??
            "Jurnal akan disetujui dan statusnya diperbarui. Pastikan kegiatan dan foto sudah sesuai."}
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            onClick={() => dialogRef.current?.close()}
            disabled={submittingAction !== null}
          >
            Batal
          </Button>
          <Button
            onClick={async () => {
              if (await submit("diterima")) {
                dialogRef.current?.close();
              }
            }}
            loading={submittingAction === "diterima"}
          >
            Setujui
          </Button>
        </div>
      </dialog>
    </div>
  );
}
