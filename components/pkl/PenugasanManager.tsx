"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ban, Building2, Check, Pencil, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { EmptyState } from "@/components/pkl/EmptyState";
import {
  AktifBadge,
  PeranInstrukturBadge,
} from "@/components/pkl/StatusBadge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  savePenugasanAction,
  setPenugasanAktifAction,
} from "@/lib/actions/instruktur";
import type { PenugasanItem } from "@/lib/data/admin-instruktur";
import type { PerusahaanOption } from "@/lib/data/master";
import {
  penugasanSchema,
  type PenugasanInput,
} from "@/lib/validators/instruktur";

export function PenugasanManager({
  penggunaId,
  penugasan,
  perusahaanOptions,
}: {
  penggunaId: string;
  penugasan: PenugasanItem[];
  perusahaanOptions: PerusahaanOption[];
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [editing, setEditing] = useState<PenugasanItem | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const activePerusahaan = perusahaanOptions.filter(
    (perusahaan) => perusahaan.aktif,
  );
  const activeCount = penugasan.filter((item) => item.aktif).length;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PenugasanInput>({
    resolver: zodResolver(penugasanSchema),
    defaultValues: {
      perusahaan_id: "",
      peran: "instruktur",
      jabatan: "",
      telepon: "",
    },
  });
  function submit() {
    void handleSubmit(onSubmit)();
  }

  function openAdd() {
    setEditing(null);
    reset({
      perusahaan_id: activePerusahaan[0]?.id ?? "",
      peran: "instruktur",
      jabatan: "",
      telepon: "",
    });
    dialogRef.current?.showModal();
  }

  function openEdit(item: PenugasanItem) {
    setEditing(item);
    reset({
      perusahaan_id: item.perusahaan?.id ?? "",
      peran: item.peran,
      jabatan: item.jabatan ?? "",
      telepon: item.telepon ?? "",
    });
    dialogRef.current?.showModal();
  }

  async function onSubmit(values: PenugasanInput) {
    try {
      const result = await savePenugasanAction(
        penggunaId,
        editing?.id ?? null,
        values,
      );

      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [field, message] of Object.entries(
            result.fieldErrors,
          )) {
            setError(field as keyof PenugasanInput, {
              type: "server",
              message,
            });
          }
        }

        toast.error(result.message);
        return;
      }

      toast.success(
        editing ? "Penugasan diperbarui." : "Penugasan ditambahkan.",
      );
      dialogRef.current?.close();
      router.refresh();
    } catch {
      toast.error("Tidak dapat menyimpan penugasan. Coba lagi.");
    }
  }

  function toggle(item: PenugasanItem) {
    setPendingId(item.id);
    startTransition(async () => {
      try {
        const result = await setPenugasanAktifAction({
          id: item.id,
          aktif: !item.aktif,
        });

        if (!result.ok) {
          toast.error(result.message);
          return;
        }

        toast.success(
          item.aktif ? "Penugasan dinonaktifkan." : "Penugasan diaktifkan.",
        );
        router.refresh();
      } catch {
        toast.error("Tidak dapat mengubah status penugasan. Coba lagi.");
      } finally {
        setPendingId(null);
      }
    });
  }

  const describedBy = (
    field: keyof PenugasanInput,
    id: string,
    hint?: string,
  ) =>
    errors[field]
      ? `${id}-error`
      : hint
        ? `${id}-hint`
        : undefined;

  return (
    <section className="rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink">
            Penugasan perusahaan
          </h2>
          <p className="mt-1 text-sm leading-[22px] text-muted">
            {activeCount} aktif dari {penugasan.length} penugasan. Satu
            instruktur bisa bertugas di beberapa perusahaan.
          </p>
        </div>

        <Button
          variant="secondary"
          size="md"
          onClick={openAdd}
          disabled={!activePerusahaan.length}
          className="w-full sm:w-auto"
        >
          <Plus className="size-4" strokeWidth={1.75} aria-hidden />
          Tambah perusahaan
        </Button>
      </div>

      {!activePerusahaan.length ? (
        <p className="mt-3 rounded-sm border border-warning-border bg-warning-bg px-3 py-2 text-sm leading-[22px] text-warning">
          Belum ada perusahaan aktif. Aktifkan perusahaan terlebih dahulu di
          halaman Data perusahaan.
        </p>
      ) : null}

      {penugasan.length ? (
        <ul className="mt-5 divide-y divide-border border-t border-border">
          {penugasan.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-base font-medium leading-6 text-ink">
                  {item.perusahaan?.nama ?? "Perusahaan tidak ditemukan"}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <PeranInstrukturBadge peran={item.peran} />
                  <AktifBadge aktif={item.aktif} />
                </div>
                {item.jabatan || item.telepon ? (
                  <p className="mt-2 text-sm leading-[22px] text-ink-soft">
                    {[item.jabatan, item.telepon].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
                {item.perusahaan && !item.perusahaan.aktif ? (
                  <p className="mt-1 text-[12px] leading-4 text-muted">
                    Perusahaan sedang nonaktif.
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-11 px-3"
                  onClick={() => openEdit(item)}
                >
                  <Pencil className="size-4" strokeWidth={1.75} aria-hidden />
                  Ubah
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-11 px-3"
                  loading={pending && pendingId === item.id}
                  onClick={() => toggle(item)}
                >
                  {item.aktif ? (
                    <Ban className="size-4" strokeWidth={1.75} aria-hidden />
                  ) : (
                    <Check className="size-4" strokeWidth={1.75} aria-hidden />
                  )}
                  {item.aktif ? "Nonaktifkan" : "Aktifkan"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-5 border-t border-border pt-5">
          <EmptyState
            icon={Building2}
            title="Belum ada penugasan"
            description="Tambahkan perusahaan tempat instruktur ini bertugas."
          />
        </div>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby="penugasan-title"
        aria-describedby="penugasan-desc"
        onClose={() => {
          setEditing(null);
          reset();
        }}
        className="app-dialog m-auto w-[calc(100vw-32px)] max-w-[480px] rounded-lg border border-border bg-surface p-6 text-ink shadow-md"
      >
        <h2 id="penugasan-title" className="text-xl font-semibold text-ink">
          {editing ? "Ubah penugasan" : "Tambah penugasan"}
        </h2>
        <p
          id="penugasan-desc"
          className="mt-2 text-sm leading-[22px] text-ink-soft"
        >
          {editing
            ? "Perbarui peran atau kontak untuk perusahaan ini."
            : "Hubungkan instruktur ke satu perusahaan."}
        </p>

        <form
          onSubmit={(event) => event.preventDefault()}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              event.target instanceof HTMLInputElement
            ) {
              event.preventDefault();
              submit();
            }
          }}
          noValidate
          className="mt-5 space-y-4"
        >
          {editing ? (
            <div>
              <p className="text-[13px] font-medium leading-[18px] text-ink">
                Perusahaan
              </p>
              <p className="mt-1.5 flex min-h-11 items-center rounded-sm border border-border bg-surface-muted px-3 text-base text-ink-soft">
                {editing.perusahaan?.nama ?? "—"}
              </p>
              <input type="hidden" {...register("perusahaan_id")} />
            </div>
          ) : (
            <Field
              label="Perusahaan"
              htmlFor="penugasan_perusahaan"
              required
              error={errors.perusahaan_id?.message}
            >
              <Select
                id="penugasan_perusahaan"
                aria-invalid={errors.perusahaan_id ? true : undefined}
                aria-describedby={describedBy(
                  "perusahaan_id",
                  "penugasan_perusahaan",
                )}
                {...register("perusahaan_id")}
              >
                <option value="">Pilih perusahaan</option>
                {activePerusahaan.map((perusahaan) => (
                  <option key={perusahaan.id} value={perusahaan.id}>
                    {perusahaan.nama}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field
            label="Peran"
            htmlFor="penugasan_peran"
            required
            error={errors.peran?.message}
          >
            <Select
              id="penugasan_peran"
              aria-invalid={errors.peran ? true : undefined}
              aria-describedby={describedBy("peran", "penugasan_peran")}
              {...register("peran")}
            >
              <option value="instruktur">Instruktur</option>
              <option value="pembimbing">Pembimbing lapangan</option>
            </Select>
          </Field>

          <Field
            label="Jabatan"
            htmlFor="penugasan_jabatan"
            hint="Opsional. Contoh: Supervisor Produksi."
            error={errors.jabatan?.message}
          >
            <Input
              id="penugasan_jabatan"
              aria-invalid={errors.jabatan ? true : undefined}
              aria-describedby={describedBy(
                "jabatan",
                "penugasan_jabatan",
                "Opsional. Contoh: Supervisor Produksi.",
              )}
              {...register("jabatan")}
            />
          </Field>

          <Field
            label="Telepon di perusahaan"
            htmlFor="penugasan_telepon"
            hint="Opsional."
            error={errors.telepon?.message}
          >
            <Input
              id="penugasan_telepon"
              type="tel"
              aria-invalid={errors.telepon ? true : undefined}
              aria-describedby={describedBy(
                "telepon",
                "penugasan_telepon",
                "Opsional.",
              )}
              {...register("telepon")}
            />
          </Field>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              onClick={() => dialogRef.current?.close()}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={submit}
              loading={isSubmitting}
            >
              {editing ? "Simpan perubahan" : "Tambah penugasan"}
            </Button>
          </div>
        </form>
      </dialog>
    </section>
  );
}
