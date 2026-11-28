"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { deleteAccountAction } from "@/lib/actions/account";

const accountListPaths = {
  siswa: "/admin/siswa",
  guru: "/admin/guru",
  instruktur: "/admin/instruktur",
  ortu: "/admin/orang-tua",
} as const;

export function AccountDeleteButton({
  penggunaId,
  nama,
  username,
}: {
  penggunaId: string;
  nama: string;
  username: string;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const canDelete = confirmation === username;

  function openDialog() {
    setConfirmation("");
    setError(null);
    dialogRef.current?.showModal();
  }

  function confirmDelete() {
    if (!canDelete) return;

    startTransition(async () => {
      try {
        const result = await deleteAccountAction(penggunaId);

        if (!result.ok) {
          setError(result.message);
          return;
        }

        dialogRef.current?.close();
        if (result.warning) {
          toast.warning(result.warning);
        } else {
          toast.success("Akun dan data terkait berhasil dihapus.");
        }
        router.replace(accountListPaths[result.role]);
      } catch {
        setError("Penghapusan akun belum berhasil. Periksa koneksi lalu coba lagi.");
      }
    });
  }

  return (
    <>
      <Button
        variant="danger"
        className="w-full"
        onClick={openDialog}
        aria-haspopup="dialog"
      >
        <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
        Hapus akun permanen
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby="hapus-akun-title"
        aria-describedby="hapus-akun-desc"
        onClose={() => {
          setConfirmation("");
          setError(null);
        }}
        onCancel={(event) => {
          if (pending) event.preventDefault();
        }}
        className="app-dialog m-auto w-[calc(100vw-32px)] max-w-[440px] rounded-lg border border-border bg-surface p-6 text-ink shadow-md"
      >
        <h2 id="hapus-akun-title" className="text-xl font-semibold text-ink">
          Hapus akun {nama}?
        </h2>
        <p
          id="hapus-akun-desc"
          className="mt-2 text-sm leading-[22px] text-ink-soft"
        >
          Akun dan data yang terhubung melalui relasi hapus-berantai akan
          dihapus permanen. Jika riwayat masih dipakai data lain, penghapusan
          akan ditolak; gunakan nonaktifkan akun untuk mempertahankan data.
        </p>

        <div className="mt-4">
          <Field
            label="Ketik username akun untuk melanjutkan"
            htmlFor="konfirmasi-hapus-akun"
            hint={`Masukkan ${username} persis seperti yang tertulis.`}
          >
            <Input
              id="konfirmasi-hapus-akun"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              aria-describedby="konfirmasi-hapus-akun-hint"
              autoComplete="off"
              disabled={pending}
            />
          </Field>
        </div>

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
            variant="danger"
            loading={pending}
            disabled={!canDelete}
            onClick={confirmDelete}
          >
            Hapus permanen
          </Button>
        </div>
      </dialog>
    </>
  );
}
