"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { setPerusahaanAktifAction } from "@/lib/actions/perusahaan";
import { cn } from "@/lib/utils";

export function PerusahaanStatusButton({
  id,
  aktif,
  nama,
}: {
  id: string;
  aktif: boolean;
  nama: string;
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
        const result = await setPerusahaanAktifAction({ id, aktif: !aktif });

        if (!result.ok) {
          setError(result.message);
          return;
        }

        toast.success(
          aktif ? "Perusahaan dinonaktifkan." : "Perusahaan diaktifkan.",
        );
        dialogRef.current?.close();
        router.refresh();
      } catch {
        setError("Tidak dapat mengubah status perusahaan. Coba lagi.");
      }
    });
  }

  return (
    <>
      <Button
        variant="secondary"
        onClick={openDialog}
        className={cn(
          "w-full",
          aktif &&
            "text-danger hover:border-danger-border hover:bg-danger-bg",
        )}
      >
        {aktif ? (
          <Ban className="size-4" strokeWidth={1.75} aria-hidden />
        ) : (
          <Check className="size-4" strokeWidth={1.75} aria-hidden />
        )}
        {aktif ? "Nonaktifkan perusahaan" : "Aktifkan perusahaan"}
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby="status-perusahaan-title"
        aria-describedby="status-perusahaan-desc"
        onClose={() => setError(null)}
        className="app-dialog m-auto w-[calc(100vw-32px)] max-w-[440px] rounded-lg border border-border bg-surface p-6 text-ink shadow-md"
      >
        <h2
          id="status-perusahaan-title"
          className="text-xl font-semibold text-ink"
        >
          {aktif ? "Nonaktifkan perusahaan?" : "Aktifkan perusahaan?"}
        </h2>
        <p
          id="status-perusahaan-desc"
          className="mt-2 text-base leading-[26px] text-ink-soft"
        >
          {aktif
            ? `${nama} tidak akan muncul di pilihan tempat PKL siswa. Data pengajuan dan instruktur tetap tersimpan.`
            : `${nama} akan muncul kembali sebagai pilihan tempat PKL siswa.`}
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
          <Button
            variant={aktif ? "danger" : "primary"}
            loading={pending}
            onClick={confirm}
          >
            {aktif ? "Nonaktifkan" : "Aktifkan"}
          </Button>
        </div>
      </dialog>
    </>
  );
}
