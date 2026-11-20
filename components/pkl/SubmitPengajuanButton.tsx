"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { submitPengajuanAction } from "@/lib/actions/pengajuan";

export function SubmitPengajuanButton({
  pengajuanId,
}: {
  pengajuanId: string;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openDialog() {
    setError(null);
    dialogRef.current?.showModal();
  }

  function confirm() {
    startTransition(async () => {
      try {
        const result = await submitPengajuanAction(pengajuanId);

        if (!result.ok) {
          setError(result.message);
          return;
        }

        toast.success("Pengajuan berhasil dikirim.");
        dialogRef.current?.close();
        router.refresh();
      } catch {
        setError("Tidak dapat mengirim pengajuan. Coba lagi.");
      }
    });
  }

  return (
    <>
      <Button onClick={openDialog}>
        <Send className="size-4" strokeWidth={1.75} aria-hidden />
        Kirim pengajuan
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby="kirim-pengajuan-title"
        aria-describedby="kirim-pengajuan-desc"
        onClose={() => setError(null)}
        className="app-dialog m-auto w-[calc(100vw-32px)] max-w-[440px] rounded-lg border border-border bg-surface p-6 text-ink shadow-md"
      >
        <h2
          id="kirim-pengajuan-title"
          className="text-xl font-semibold text-ink"
        >
          Kirim pengajuan?
        </h2>
        <p
          id="kirim-pengajuan-desc"
          className="mt-2 text-base leading-[26px] text-ink-soft"
        >
          Setelah dikirim, perusahaan, periode, dan anggota kelompok tidak
          dapat diubah. Sekolah akan meninjau pengajuan Anda.
        </p>

        {error ? (
          <p
            role="alert"
            className="mt-3 rounded-sm border border-danger-border bg-danger-bg px-3 py-2 text-sm leading-[22px] text-danger"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            onClick={() => dialogRef.current?.close()}
            disabled={pending}
          >
            Batal
          </Button>
          <Button loading={pending} onClick={confirm}>
            Kirim pengajuan
          </Button>
        </div>
      </dialog>
    </>
  );
}
