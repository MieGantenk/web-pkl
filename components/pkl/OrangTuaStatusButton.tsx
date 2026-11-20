"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { setOrangTuaAktifAction } from "@/lib/actions/orang-tua";
import { cn } from "@/lib/utils";

export function OrangTuaStatusButton({
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
        const result = await setOrangTuaAktifAction({ id, aktif: !aktif });

        if (!result.ok) {
          setError(result.message);
          return;
        }

        toast.success(
          aktif ? "Akun orang tua dinonaktifkan." : "Akun orang tua diaktifkan.",
        );
        dialogRef.current?.close();
        router.refresh();
      } catch {
        setError("Tidak dapat mengubah status akun. Coba lagi.");
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
        {aktif ? "Nonaktifkan akun" : "Aktifkan akun"}
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby="status-orang-tua-title"
        aria-describedby="status-orang-tua-desc"
        onClose={() => setError(null)}
        className="app-dialog m-auto w-[calc(100vw-32px)] max-w-[440px] rounded-lg border border-border bg-surface p-6 text-ink shadow-md"
      >
        <h2
          id="status-orang-tua-title"
          className="text-xl font-semibold text-ink"
        >
          {aktif ? "Nonaktifkan akun?" : "Aktifkan akun?"}
        </h2>
        <p
          id="status-orang-tua-desc"
          className="mt-2 text-base leading-[26px] text-ink-soft"
        >
          {aktif
            ? `${nama} tidak akan bisa masuk. Data relasi anak tetap tersimpan.`
            : `${nama} akan bisa masuk kembali dengan akun yang sama.`}
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
