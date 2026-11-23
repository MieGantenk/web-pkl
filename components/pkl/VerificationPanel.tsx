"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { VerificationStamp } from "@/components/pkl/VerificationStamp";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { VerifyJurnalResult } from "@/lib/validators/verifikasi-jurnal";

type VerificationAction = (input: unknown) => Promise<VerifyJurnalResult>;

export function VerificationPanel({
  jurnalId,
  canVerify,
  existingNote,
  unavailableMessage,
  unavailableTone = "success",
  approveDescription,
  verifierName,
  action,
}: {
  jurnalId: string;
  canVerify: boolean;
  existingNote: string | null;
  unavailableMessage: string;
  unavailableTone?: "success" | "warning" | "neutral";
  approveDescription?: string;
  verifierName: string;
  action: VerificationAction;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stampTimerRef = useRef<number | null>(null);
  const [catatan, setCatatan] = useState(existingNote ?? "");
  const [stampDate, setStampDate] = useState<string | null>(null);
  const [submittingAction, setSubmittingAction] = useState<
    "diterima" | "revisi" | null
  >(null);
  const busy = submittingAction !== null || stampDate !== null;

  useEffect(() => {
    return () => {
      if (stampTimerRef.current !== null) {
        window.clearTimeout(stampTimerRef.current);
      }
    };
  }, []);

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

      if (status === "diterima") {
        const tanggal = new Intl.DateTimeFormat("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }).format(new Date());

        setStampDate(tanggal);
        stampTimerRef.current = window.setTimeout(() => {
          setStampDate(null);
          toast.success(result.message);
          router.refresh();
        }, 380);
      } else {
        toast.success(result.message);
        router.refresh();
      }

      return true;
    } catch {
      toast.error("Tidak dapat menyimpan verifikasi. Coba lagi.");
      return false;
    } finally {
      setSubmittingAction(null);
    }
  }

  if (!canVerify) {
    const toneClass = {
      success: "border-success-border bg-success-bg text-success",
      warning: "border-warning-border bg-warning-bg text-warning",
      neutral: "border-border bg-surface-muted text-ink-soft",
    }[unavailableTone];

    return (
      <div
        className={cn(
          "rounded-sm border px-3 py-2.5 text-sm leading-[22px]",
          toneClass,
        )}
      >
        {unavailableMessage}
      </div>
    );
  }

  return (
    <div className="relative">
      {stampDate ? (
        <VerificationStamp
          tanggal={stampDate}
          verifierName={verifierName}
        />
      ) : null}

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
          disabled={busy}
        >
          Minta revisi
        </Button>
        <Button
          type="button"
          onClick={() => dialogRef.current?.showModal()}
          disabled={busy}
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
            disabled={busy}
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
            disabled={busy}
          >
            Setujui
          </Button>
        </div>
      </dialog>
    </div>
  );
}
