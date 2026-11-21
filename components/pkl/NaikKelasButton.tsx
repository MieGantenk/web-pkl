"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { promoteSiswaKelasAction } from "@/lib/actions/siswa";

const urutanKelas = [
  { dari: "X DKV", ke: "XI DKV" },
  { dari: "X RPL", ke: "XI RPL" },
  { dari: "XI DKV", ke: "XII DKV" },
  { dari: "XI RPL", ke: "XII RPL" },
] as const;

export function NaikKelasButton({
  counts,
}: {
  counts: Record<string, number>;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const groups = urutanKelas.map((item) => ({
    ...item,
    jumlah: counts[item.dari] ?? 0,
  }));
  const total = groups.reduce((jumlah, item) => jumlah + item.jumlah, 0);
  const jumlahXII = (counts["XII DKV"] ?? 0) + (counts["XII RPL"] ?? 0);

  function openDialog() {
    setError(null);
    dialogRef.current?.showModal();
  }

  function confirm() {
    startTransition(async () => {
      try {
        const result = await promoteSiswaKelasAction();

        if (!result.ok) {
          setError(result.message);
          return;
        }

        toast.success(
          result.updated
            ? `Kelas diperbarui: ${result.updated} siswa naik kelas.`
            : "Tidak ada siswa kelas X atau XI yang perlu dinaikkan.",
        );
        dialogRef.current?.close();

        if (window.location.search) {
          router.push("/admin/siswa");
        } else {
          router.refresh();
        }
      } catch {
        setError("Tidak dapat memperbarui kelas. Coba lagi.");
      }
    });
  }

  return (
    <>
      <Button
        variant="secondary"
        onClick={openDialog}
        className="w-full sm:w-auto"
      >
        <ArrowUpCircle className="size-4" strokeWidth={1.75} aria-hidden />
        Naik kelas
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby="naik-kelas-title"
        aria-describedby="naik-kelas-desc"
        onClose={() => setError(null)}
        className="app-dialog m-auto w-[calc(100vw-32px)] max-w-[480px] rounded-lg border border-border bg-surface p-6 text-ink shadow-md"
      >
        <h2 id="naik-kelas-title" className="text-xl font-semibold text-ink">
          Naikkan kelas semua siswa?
        </h2>
        <p
          id="naik-kelas-desc"
          className="mt-2 text-base leading-[26px] text-ink-soft"
        >
          Kelas X menjadi XI dan kelas XI menjadi XII untuk semua data siswa,
          termasuk akun nonaktif. Kelas XII tidak diubah. Tindakan ini tidak
          dapat dibatalkan.
        </p>

        <ul className="mt-4 space-y-2 rounded-sm border border-border bg-surface-muted px-3 py-3 text-sm">
          {groups.map((group) => (
            <li
              key={group.dari}
              className="flex items-center justify-between gap-3"
            >
              <span className="text-ink-soft">
                {group.dari} → {group.ke}
              </span>
              <span className="tabular-nums font-semibold text-ink">
                {group.jumlah}
              </span>
            </li>
          ))}
        </ul>

        {jumlahXII ? (
          <p className="mt-3 rounded-sm border border-warning-border bg-warning-bg px-3 py-2 text-[13px] leading-[18px] text-warning">
            Masih ada {jumlahXII} siswa kelas XII. Data mereka tidak diubah.
          </p>
        ) : null}

        {total === 0 ? (
          <p className="mt-3 text-[13px] leading-[18px] text-muted">
            Tidak ada siswa kelas X atau XI yang bisa dinaikkan.
          </p>
        ) : null}

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
            variant="primary"
            loading={pending}
            onClick={confirm}
            disabled={total === 0}
          >
            Naikkan kelas
          </Button>
        </div>
      </dialog>
    </>
  );
}
