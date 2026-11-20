"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Users, UserRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/pkl/StatusBadge";
import {
  addAnggotaAction,
  removeAnggotaAction,
} from "@/lib/actions/pengajuan";
import type { PengajuanMember } from "@/lib/data/siswa-pengajuan";
import {
  anggotaPengajuanSchema,
  type AnggotaPengajuanInput,
} from "@/lib/validators/pengajuan";

export function AnggotaKelompok({
  pengajuanId,
  anggota,
  canManage,
}: {
  pengajuanId: string;
  anggota: PengajuanMember[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AnggotaPengajuanInput>({
    resolver: zodResolver(anggotaPengajuanSchema),
    defaultValues: { nis: "" },
  });
  const submit = handleSubmit(onSubmit);

  async function onSubmit(values: AnggotaPengajuanInput) {
    try {
      const result = await addAnggotaAction(pengajuanId, values);

      if (!result.ok) {
        if (result.fieldErrors?.nis) {
          setError("nis", { type: "server", message: result.fieldErrors.nis });
        }
        toast.error(result.message);
        return;
      }

      toast.success("Anggota kelompok ditambahkan.");
      reset({ nis: "" });
      router.refresh();
    } catch {
      toast.error("Tidak dapat menambahkan anggota. Coba lagi.");
    }
  }

  function remove(member: PengajuanMember) {
    setRemovingId(member.siswaId);
    startTransition(async () => {
      try {
        const result = await removeAnggotaAction(pengajuanId, member.siswaId);

        if (!result.ok) {
          toast.error(result.message);
          return;
        }

        toast.success("Anggota kelompok dihapus.");
        setConfirmingId(null);
        router.refresh();
      } catch {
        toast.error("Tidak dapat menghapus anggota. Coba lagi.");
      } finally {
        setRemovingId(null);
      }
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ink">Anggota kelompok</h2>
          <p className="mt-1 text-sm leading-[22px] text-muted">
            {anggota.length} siswa dalam pengajuan ini.
          </p>
        </div>
        <Users className="size-5 text-brand-600" strokeWidth={1.75} aria-hidden />
      </div>

      <ul className="mt-4 divide-y divide-border border-t border-border">
        {anggota.map((member) => (
          <li
            key={member.id}
            className="flex flex-col gap-2 py-3 first:pt-3 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">
                {member.nama}
                {member.isCurrent ? " (Anda)" : ""}
              </p>
              <p className="mt-0.5 text-[13px] leading-[18px] text-muted tabular-nums">
                {member.nis}
                {member.kelas ? ` · ${member.kelas}` : ""}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <StatusBadge
                label={member.peran === "ketua" ? "Ketua" : "Anggota"}
                tone="neutral"
                icon={member.peran === "ketua" ? Users : UserRound}
              />

              {canManage && member.peran !== "ketua" ? (
                confirmingId === member.siswaId ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-11 px-3"
                      onClick={() => setConfirmingId(null)}
                      disabled={pending && removingId === member.siswaId}
                    >
                      Batal
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      className="h-11 px-3"
                      loading={pending && removingId === member.siswaId}
                      onClick={() => remove(member)}
                    >
                      Hapus anggota
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-11 px-3 text-danger hover:bg-danger-bg"
                    onClick={() => setConfirmingId(member.siswaId)}
                  >
                    Hapus
                  </Button>
                )
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {canManage ? (
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
          className="mt-4 border-t border-border pt-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Field
                label="Tambah anggota"
                htmlFor="nis"
                hint="Masukkan NIS siswa yang belum punya pengajuan aktif."
                error={errors.nis?.message}
              >
                <Input
                  id="nis"
                  inputMode="numeric"
                  autoComplete="off"
                  aria-invalid={errors.nis ? true : undefined}
                  aria-describedby={
                    errors.nis ? "nis-error" : "nis-hint"
                  }
                  {...register("nis")}
                />
              </Field>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={submit}
              loading={isSubmitting}
              className="w-full sm:w-auto"
            >
              Tambah
            </Button>
          </div>
        </form>
      ) : (
        <p className="mt-4 border-t border-border pt-4 text-[13px] leading-[18px] text-muted">
          Hanya ketua kelompok yang dapat mengubah anggota selama pengajuan
          masih draft.
        </p>
      )}
    </div>
  );
}
