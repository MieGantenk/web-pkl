"use client";

import { FilePlus2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { issueSuratAction } from "@/lib/actions/surat";
import type { JenisSurat } from "@/lib/status";

export function IssueSuratButton({
  pengajuanId,
  jenis,
}: {
  pengajuanId: string;
  jenis: JenisSurat;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function issue() {
    setLoading(true);

    try {
      const result = await issueSuratAction({ pengajuan_id: pengajuanId, jenis });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(`Surat ${result.nomor} diterbitkan.`);
      router.refresh();
    } catch {
      toast.error("Surat belum dapat diterbitkan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      loading={loading}
      onClick={() => void issue()}
    >
      <FilePlus2 className="size-4" strokeWidth={1.75} aria-hidden />
      Terbitkan surat
    </Button>
  );
}
