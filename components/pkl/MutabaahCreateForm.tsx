"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createFormAction } from "@/lib/actions/admin-mutabaah";
import type { AdminMutabaahPeriod } from "@/lib/data/admin-mutabaah";

export function MutabaahCreateForm({
  periods,
  activePeriodId,
}: {
  periods: AdminMutabaahPeriod[];
  activePeriodId: string | null;
}) {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [periodeId, setPeriodeId] = useState(activePeriodId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setError(null);

    if (!nama.trim()) {
      setError("Nama form wajib diisi.");
      return;
    }

    if (!periodeId) {
      setError("Pilih periode PKL.");
      return;
    }

    setSaving(true);

    try {
      const result = await createFormAction({
        nama,
        deskripsi,
        periode_id: periodeId,
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      toast.success("Draft form mutaba'ah dibuat.");
      router.push(`/admin/mutabaah/pertanyaan?form=${result.id}`);
    } catch {
      setError("Form belum dapat dibuat. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      className="rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6"
    >
      <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] text-ink">
        Form baru
      </h2>
      <p className="mt-1 text-sm text-muted">
        Buat form baru berstatus draft, lalu tambahkan pertanyaan.
      </p>

      <div className="mt-5 space-y-5">
        <Field label="Nama form" htmlFor="form-nama" required>
          <Input
            id="form-nama"
            value={nama}
            maxLength={150}
            placeholder="Contoh: Mutaba'ah Harian"
            onChange={(event) => setNama(event.target.value)}
          />
        </Field>

        <Field
          label="Deskripsi"
          htmlFor="form-deskripsi"
          hint="Opsional. Jelaskan tujuan form ini."
        >
          <Textarea
            id="form-deskripsi"
            rows={3}
            value={deskripsi}
            maxLength={2000}
            onChange={(event) => setDeskripsi(event.target.value)}
          />
        </Field>

        <Field label="Periode PKL" htmlFor="form-periode" required>
          <Select
            id="form-periode"
            value={periodeId}
            onChange={(event) => setPeriodeId(event.target.value)}
          >
            <option value="">Pilih periode</option>
            {periods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.nama}
                {period.aktif ? " · aktif" : ""}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-sm border border-danger-border bg-danger-bg px-3 py-2 text-sm leading-[22px] text-danger"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Link
          href="/admin/mutabaah/pertanyaan"
          prefetch={false}
          className={buttonVariants({ variant: "secondary" })}
        >
          Batal
        </Link>
        <Button type="submit" loading={saving}>
          Buat draft
        </Button>
      </div>
    </form>
  );
}
