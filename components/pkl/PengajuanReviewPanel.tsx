"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { reviewPengajuanAction } from "@/lib/actions/admin-pengajuan";

export function PengajuanReviewPanel({
  pengajuanId,
  dokumenId,
  jenis,
}: {
  pengajuanId: string;
  dokumenId: string;
  jenis: "izin" | "balasan";
}) {
  const router = useRouter();
  const [catatan, setCatatan] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "setujui" | "revisi" | "tolak" | null
  >(null);

  async function submit(action: "setujui" | "revisi" | "tolak") {
    if ((action === "revisi" || action === "tolak") && !catatan.trim()) {
      setFieldError("Catatan wajib diisi untuk revisi atau penolakan.");
      return;
    }

    setFieldError(null);
    setPendingAction(action);

    try {
      const result = await reviewPengajuanAction({
        pengajuan_id: pengajuanId,
        dokumen_id: dokumenId,
        jenis,
        action,
        catatan,
      });

      if (!result.ok) {
        setFieldError(result.fieldErrors?.catatan ?? null);
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    } catch {
      toast.error("Tidak dapat menyimpan keputusan. Coba lagi.");
    } finally {
      setPendingAction(null);
    }
  }

  const busy = pendingAction !== null;

  return (
    <div className="mt-4 border-t border-border pt-4">
      <h3 className="text-base font-semibold text-ink">Tinjau dokumen</h3>
      <p className="mt-1 text-sm leading-[22px] text-muted">
        Periksa berkas sebelum menyetujui atau meminta revisi.
      </p>

      <div className="mt-4">
        <label
          htmlFor={`catatan-pengajuan-${dokumenId}`}
          className="block text-[13px] font-medium leading-[18px] text-ink"
        >
          Catatan untuk siswa
        </label>
        <Textarea
          id={`catatan-pengajuan-${dokumenId}`}
          value={catatan}
          onChange={(event) => {
            setCatatan(event.target.value);
            if (fieldError) setFieldError(null);
          }}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={
            fieldError
              ? `catatan-pengajuan-${dokumenId}-error`
              : `catatan-pengajuan-${dokumenId}-hint`
          }
          className="mt-1.5 min-h-[100px]"
          placeholder={
            jenis === "izin"
              ? "Contoh: scan kurang jelas, mohon unggah ulang."
              : "Contoh: surat balasan tidak mencantumkan tanggal mulai."
          }
        />
        {fieldError ? (
          <p
            id={`catatan-pengajuan-${dokumenId}-error`}
            className="mt-1.5 text-xs leading-4 text-danger"
          >
            {fieldError}
          </p>
        ) : (
          <p
            id={`catatan-pengajuan-${dokumenId}-hint`}
            className="mt-1.5 text-xs leading-4 text-muted"
          >
            Wajib diisi jika meminta revisi atau menolak pengajuan.
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          onClick={() => submit("setujui")}
          loading={pendingAction === "setujui"}
          disabled={busy}
        >
          {jenis === "izin" ? "Setujui izin" : "Setujui balasan"}
        </Button>
        <Button
          variant="secondary"
          onClick={() => submit("revisi")}
          loading={pendingAction === "revisi"}
          disabled={busy}
        >
          Minta revisi
        </Button>
        {jenis === "balasan" ? (
          <Button
            variant="danger"
            onClick={() => submit("tolak")}
            loading={pendingAction === "tolak"}
            disabled={busy}
          >
            Tolak pengajuan
          </Button>
        ) : null}
      </div>
    </div>
  );
}
