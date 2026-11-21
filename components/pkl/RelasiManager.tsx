"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Trash2, UserPlus, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { EmptyState } from "@/components/pkl/EmptyState";
import { HubunganBadge } from "@/components/pkl/StatusBadge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import {
  linkOrangTuaAction,
  unlinkOrangTuaAction,
  updateHubunganOrangTuaAction,
} from "@/lib/actions/orang-tua";
import type { RelasiAnak } from "@/lib/data/admin-orang-tua";
import type { SiswaOption } from "@/lib/data/master";
import { relasiSchema, type RelasiInput } from "@/lib/validators/orang-tua";

export function RelasiManager({
  penggunaId,
  namaOrangTua,
  anak,
  siswaOptions,
}: {
  penggunaId: string;
  namaOrangTua: string;
  anak: RelasiAnak[];
  siswaOptions: SiswaOption[];
}) {
  const router = useRouter();
  const addDialogRef = useRef<HTMLDialogElement>(null);
  const unlinkDialogRef = useRef<HTMLDialogElement>(null);
  const [editing, setEditing] = useState<RelasiAnak | null>(null);
  const [deleting, setDeleting] = useState<RelasiAnak | null>(null);
  const [unlinkError, setUnlinkError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const activeStudents = siswaOptions.filter((siswa) => siswa.aktif);
  const availableStudents = activeStudents.filter(
    (siswa) => !anak.some((relasi) => relasi.siswa?.id === siswa.id),
  );

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RelasiInput>({
    resolver: zodResolver(relasiSchema),
    defaultValues: {
      siswa_id: "",
      hubungan: "wali",
    },
  });
  function submit() {
    void handleSubmit(onSubmit)();
  }

  async function onSubmit(values: RelasiInput) {
    try {
      const result = editing
        ? await updateHubunganOrangTuaAction(
            editing.id,
            penggunaId,
            values.hubungan,
          )
        : await linkOrangTuaAction(penggunaId, values);

      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [field, message] of Object.entries(
            result.fieldErrors,
          )) {
            setError(field as keyof RelasiInput, {
              type: "server",
              message,
            });
          }
        }

        toast.error(result.message);
        return;
      }

      toast.success(
        editing ? "Hubungan anak diperbarui." : "Hubungan anak ditambahkan.",
      );
      addDialogRef.current?.close();
      router.refresh();
    } catch {
      toast.error("Tidak dapat menyimpan hubungan. Coba lagi.");
    }
  }

  function openAdd() {
    setEditing(null);
    reset({ siswa_id: "", hubungan: "wali" });
    addDialogRef.current?.showModal();
  }

  function openEdit(relasi: RelasiAnak) {
    setEditing(relasi);
    reset({
      siswa_id: relasi.siswa?.id ?? "",
      hubungan: relasi.hubungan,
    });
    addDialogRef.current?.showModal();
  }

  function openUnlink(relasi: RelasiAnak) {
    setDeleting(relasi);
    setUnlinkError(null);
    unlinkDialogRef.current?.showModal();
  }

  function confirmUnlink() {
    if (!deleting) return;

    setPendingId(deleting.id);
    startTransition(async () => {
      try {
        const result = await unlinkOrangTuaAction(deleting.id, penggunaId);

        if (!result.ok) {
          setUnlinkError(result.message);
          return;
        }

        toast.success("Hubungan anak dihapus.");
        unlinkDialogRef.current?.close();
        router.refresh();
      } catch {
        setUnlinkError("Tidak dapat menghapus hubungan. Coba lagi.");
      } finally {
        setPendingId(null);
      }
    });
  }

  const describedBy = (field: keyof RelasiInput, id: string) =>
    errors[field] ? `${id}-error` : undefined;

  return (
    <section className="rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink">Anak terhubung</h2>
          <p className="mt-1 text-sm leading-[22px] text-muted">
            {anak.length} anak terhubung. Satu orang tua bisa memiliki
            beberapa anak.
          </p>
        </div>

        <Button
          variant="secondary"
          size="md"
          onClick={openAdd}
          disabled={!availableStudents.length}
          className="w-full sm:w-auto"
        >
          <UserPlus className="size-4" strokeWidth={1.75} aria-hidden />
          Hubungkan anak
        </Button>
      </div>

      {!availableStudents.length ? (
        <p className="mt-3 rounded-sm border border-warning-border bg-warning-bg px-3 py-2 text-sm leading-[22px] text-warning">
          {activeStudents.length
            ? "Semua siswa aktif sudah terhubung dengan orang tua ini."
            : "Belum ada siswa aktif. Tambahkan siswa terlebih dahulu di halaman Data siswa."}
        </p>
      ) : null}

      {anak.length ? (
        <ul className="mt-5 divide-y divide-border border-t border-border">
          {anak.map((relasi) => (
            <li
              key={relasi.id}
              className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-base font-medium leading-6 text-ink">
                  {relasi.siswa?.nama ?? "Siswa tidak ditemukan"}
                </p>
                <p className="mt-0.5 text-[13px] leading-[18px] text-muted tabular-nums">
                  NIS {relasi.siswa?.nis ?? "—"}
                  {relasi.siswa?.kelas ? ` · ${relasi.siswa.kelas}` : ""}
                  {relasi.siswa?.periode
                    ? ` · ${relasi.siswa.periode.nama}`
                    : ""}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <HubunganBadge hubungan={relasi.hubungan} />
                  {relasi.siswa && !relasi.siswa.aktif ? (
                    <span className="text-[12px] leading-4 text-muted">
                      Siswa nonaktif
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-11 px-3"
                  onClick={() => openEdit(relasi)}
                >
                  <Pencil className="size-4" strokeWidth={1.75} aria-hidden />
                  Ubah
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-11 px-3 text-danger hover:bg-danger-bg"
                  onClick={() => openUnlink(relasi)}
                >
                  <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
                  Hapus
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-5 border-t border-border pt-5">
          <EmptyState
            icon={Users}
            title="Belum ada anak terhubung"
            description="Hubungkan akun orang tua ke siswa agar dapat melihat jurnal dan mutaba'ah."
          />
        </div>
      )}

      <dialog
        ref={addDialogRef}
        aria-labelledby="relasi-title"
        aria-describedby="relasi-desc"
        onClose={() => {
          setEditing(null);
          reset({ siswa_id: "", hubungan: "wali" });
        }}
        className="app-dialog m-auto w-[calc(100vw-32px)] max-w-[480px] rounded-lg border border-border bg-surface p-6 text-ink shadow-md"
      >
        <h2 id="relasi-title" className="text-xl font-semibold text-ink">
          {editing ? "Ubah hubungan" : "Hubungkan anak"}
        </h2>
        <p
          id="relasi-desc"
          className="mt-2 text-sm leading-[22px] text-ink-soft"
        >
          {editing
            ? "Perbarui hubungan orang tua dengan anak ini."
            : `Pilih siswa yang merupakan anak dari ${namaOrangTua}.`}
        </p>

        <form
          onSubmit={(event) => event.preventDefault()}
          noValidate
          className="mt-5 space-y-4"
        >
          {editing ? (
            <div>
              <p className="text-[13px] font-medium leading-[18px] text-ink">
                Siswa
              </p>
              <p className="mt-1.5 flex min-h-11 items-center rounded-sm border border-border bg-surface-muted px-3 text-base text-ink-soft">
                {editing.siswa?.nama ?? "Siswa tidak ditemukan"}
              </p>
              <input type="hidden" {...register("siswa_id")} />
            </div>
          ) : (
            <Field
              label="Siswa"
              htmlFor="relasi_siswa"
              required
              error={errors.siswa_id?.message}
            >
              <Select
                id="relasi_siswa"
                aria-invalid={errors.siswa_id ? true : undefined}
                aria-describedby={describedBy("siswa_id", "relasi_siswa")}
                {...register("siswa_id")}
              >
                <option value="">Pilih siswa</option>
                {availableStudents.map((siswa) => (
                  <option key={siswa.id} value={siswa.id}>
                    {siswa.nama} · {siswa.nis}
                    {siswa.kelas ? ` · ${siswa.kelas}` : ""}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field
            label="Hubungan"
            htmlFor="relasi_hubungan"
            required
            error={errors.hubungan?.message}
          >
            <Select
              id="relasi_hubungan"
              aria-invalid={errors.hubungan ? true : undefined}
              aria-describedby={describedBy("hubungan", "relasi_hubungan")}
              {...register("hubungan")}
            >
              <option value="ayah">Ayah</option>
              <option value="ibu">Ibu</option>
              <option value="wali">Wali</option>
            </Select>
          </Field>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              onClick={() => addDialogRef.current?.close()}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="button" onClick={submit} loading={isSubmitting}>
              {editing ? "Simpan perubahan" : "Hubungkan"}
            </Button>
          </div>
        </form>
      </dialog>

      <dialog
        ref={unlinkDialogRef}
        aria-labelledby="unlink-title"
        aria-describedby="unlink-desc"
        onClose={() => {
          setDeleting(null);
          setUnlinkError(null);
        }}
        className="app-dialog m-auto w-[calc(100vw-32px)] max-w-[440px] rounded-lg border border-border bg-surface p-6 text-ink shadow-md"
      >
        <h2 id="unlink-title" className="text-xl font-semibold text-ink">
          Hapus hubungan?
        </h2>
        <p
          id="unlink-desc"
          className="mt-2 text-base leading-[26px] text-ink-soft"
        >
          Hubungan dengan {deleting?.siswa?.nama ?? "siswa ini"} akan dihapus.
          Orang tua tidak akan bisa melihat data anak ini lagi.
        </p>

        {unlinkError ? (
          <p
            role="alert"
            className="mt-3 rounded-sm border border-danger-border bg-danger-bg px-3 py-2 text-sm leading-[22px] text-danger"
          >
            {unlinkError}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            onClick={() => unlinkDialogRef.current?.close()}
            disabled={pending}
          >
            Batal
          </Button>
          <Button
            variant="danger"
            loading={pending && pendingId === deleting?.id}
            onClick={confirmUnlink}
          >
            Hapus hubungan
          </Button>
        </div>
      </dialog>
    </section>
  );
}
