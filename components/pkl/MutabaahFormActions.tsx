"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  archiveFormAction,
  createFormVersionAction,
} from "@/lib/actions/admin-mutabaah";

export function MutabaahFormActions({
  formId,
  formName,
  status,
}: {
  formId: string;
  formName: string;
  status: "draft" | "aktif" | "arsip";
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState<"version" | "archive" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createVersion() {
    setPending("version");

    try {
      const result = await createFormVersionAction(formId);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success("Versi baru dibuat.");
      router.push(`/admin/mutabaah/pertanyaan?form=${result.id}`);
    } catch {
      toast.error("Versi baru belum dapat dibuat. Coba lagi.");
    } finally {
      setPending(null);
    }
  }

  async function archive() {
    setError(null);
    setPending("archive");

    try {
      const result = await archiveFormAction(formId);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      toast.success("Form diarsipkan.");
      dialogRef.current?.close();
      router.refresh();
    } catch {
      setError("Form belum dapat diarsipkan. Coba lagi.");
    } finally {
      setPending(null);
    }
  }

  if (status === "draft") return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={pending === "version"}
          disabled={pending !== null}
          onClick={() => void createVersion()}
        >
          <Copy className="size-4" strokeWidth={1.75} aria-hidden />
          Buat versi baru
        </Button>

        {status === "aktif" ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending !== null}
            className="text-danger hover:bg-danger-bg hover:text-danger"
            onClick={() => {
              setError(null);
              dialogRef.current?.showModal();
            }}
          >
            <Archive className="size-4" strokeWidth={1.75} aria-hidden />
            Arsipkan
          </Button>
        ) : null}
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="arsip-form-title"
        aria-describedby="arsip-form-desc"
        onClose={() => setError(null)}
        className="app-dialog m-auto w-[calc(100vw-32px)] max-w-[440px] rounded-lg border border-border bg-surface p-6 text-ink shadow-md"
      >
        <h2 id="arsip-form-title" className="text-xl font-semibold text-ink">
          Arsipkan form?
        </h2>
        <p
          id="arsip-form-desc"
          className="mt-2 text-base leading-[26px] text-ink-soft"
        >
          Form &quot;{formName}&quot; akan diarsipkan dan tidak lagi menjadi
          form aktif. Siswa tidak bisa mengisi form ini setelah diarsipkan.
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
            disabled={pending === "archive"}
          >
            Batal
          </Button>
          <Button
            variant="danger"
            loading={pending === "archive"}
            onClick={() => void archive()}
          >
            Arsipkan
          </Button>
        </div>
      </dialog>
    </>
  );
}
