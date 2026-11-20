"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { PenempatanEditor } from "@/lib/data/admin-penempatan";
import {
  startPklAction,
  updatePenempatanAction,
  type PenempatanActionResult,
} from "@/lib/actions/penempatan";
import {
  penempatanFormSchema,
  type PenempatanFormInput,
} from "@/lib/validators/penempatan";

function peranLabel(peran: "instruktur" | "pembimbing") {
  return peran === "instruktur" ? "Instruktur" : "Pembimbing";
}

export function PenempatanForm({ editor }: { editor: PenempatanEditor }) {
  const router = useRouter();
  const [pending, setPending] = useState<"save" | "start" | null>(null);
  const application = editor.application;
  const canStart =
    application.status === "diterima" ||
    application.status === "keberangkatan_terbit";
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PenempatanFormInput>({
    resolver: zodResolver(penempatanFormSchema),
    defaultValues: {
      pengajuan_id: application.id,
      guru_pembimbing_id: application.guru_pembimbing_id ?? "",
      instruktur_id: application.instruktur_id ?? "",
      pembimbing_id: application.pembimbing_id ?? "",
      tanggal_mulai: application.tanggal_mulai ?? "",
      tanggal_selesai: application.tanggal_selesai ?? "",
    },
  });

  function applyFieldErrors(result: PenempatanActionResult) {
    if (result.ok || !result.fieldErrors) {
      return;
    }

    for (const [field, message] of Object.entries(result.fieldErrors)) {
      setError(field as keyof PenempatanFormInput, {
        type: "server",
        message,
      });
    }
  }

  async function onSubmit(
    values: PenempatanFormInput,
    mode: "save" | "start",
  ) {
    setPending(mode);

    try {
      const update = await updatePenempatanAction(values);

      if (!update.ok) {
        applyFieldErrors(update);
        toast.error(update.message);
        return;
      }

      if (mode === "start") {
        const start = await startPklAction(values.pengajuan_id);

        if (!start.ok) {
          applyFieldErrors(start);
          toast.error(start.message);
          return;
        }

        toast.success(start.message);
      } else {
        toast.success(update.message);
      }

      router.refresh();
    } catch {
      toast.error("Tidak dapat menyimpan data. Periksa koneksi lalu coba lagi.");
    } finally {
      setPending(null);
    }
  }

  const save = handleSubmit((values) => onSubmit(values, "save"));
  const start = handleSubmit((values) => onSubmit(values, "start"));

  return (
    <form onSubmit={save} noValidate className="space-y-5">
      <div className="rounded-sm border border-border bg-surface-muted px-3 py-2.5 text-sm leading-[22px] text-ink-soft">
        <span className="font-semibold text-ink">
          {application.perusahaan?.nama ?? "Perusahaan"}
        </span>
        {application.periode?.nama ? ` · ${application.periode.nama}` : ""}
        <span className="mt-0.5 block text-[13px] text-muted">
          {application.students.map((student) => student.nama).join(", ") ||
            "Belum ada siswa"}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Guru pembimbing"
          htmlFor="guru_pembimbing_id"
          error={errors.guru_pembimbing_id?.message}
        >
          <Select
            id="guru_pembimbing_id"
            aria-invalid={errors.guru_pembimbing_id ? true : undefined}
            {...register("guru_pembimbing_id")}
          >
            <option value="">Belum ditetapkan</option>
            {editor.gurus.map((guru) => (
              <option key={guru.id} value={guru.id}>
                {guru.nama}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Instruktur verifikator"
          htmlFor="instruktur_id"
          hint="Instruktur perusahaan yang memverifikasi jurnal tahap 2."
          error={errors.instruktur_id?.message}
        >
          <Select
            id="instruktur_id"
            aria-invalid={errors.instruktur_id ? true : undefined}
            {...register("instruktur_id")}
          >
            <option value="">Belum ditetapkan</option>
            {editor.instrukturOptions.map((instruktur) => (
              <option key={instruktur.id} value={instruktur.id}>
                {instruktur.nama} · {peranLabel(instruktur.peran)}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Pembimbing lapangan"
          htmlFor="pembimbing_id"
          error={errors.pembimbing_id?.message}
        >
          <Select
            id="pembimbing_id"
            aria-invalid={errors.pembimbing_id ? true : undefined}
            {...register("pembimbing_id")}
          >
            <option value="">Belum ditetapkan</option>
            {editor.instrukturOptions.map((instruktur) => (
              <option key={instruktur.id} value={instruktur.id}>
                {instruktur.nama}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Mulai"
            htmlFor="tanggal_mulai"
            error={errors.tanggal_mulai?.message}
          >
            <Input
              id="tanggal_mulai"
              type="date"
              aria-invalid={errors.tanggal_mulai ? true : undefined}
              {...register("tanggal_mulai")}
            />
          </Field>
          <Field
            label="Selesai"
            htmlFor="tanggal_selesai"
            error={errors.tanggal_selesai?.message}
          >
            <Input
              id="tanggal_selesai"
              type="date"
              aria-invalid={errors.tanggal_selesai ? true : undefined}
              {...register("tanggal_selesai")}
            />
          </Field>
        </div>
      </div>

      {editor.instrukturOptions.length === 0 ? (
        <p className="text-[13px] leading-[18px] text-warning">
          Belum ada instruktur aktif di perusahaan ini. Tambahkan instruktur
          lewat menu Instruktur sebelum memulai PKL.
        </p>
      ) : null}

      <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button
          type="submit"
          variant="secondary"
          loading={pending === "save"}
          disabled={pending !== null}
          className="w-full sm:w-auto"
        >
          Simpan perubahan
        </Button>

        {canStart ? (
          <Button
            type="button"
            onClick={() => void start()}
            loading={pending === "start"}
            disabled={pending !== null}
            className="w-full sm:w-auto"
          >
            Simpan &amp; mulai PKL
          </Button>
        ) : null}
      </div>

      {application.status === "berlangsung" ? (
        <p className="text-[13px] leading-[18px] text-muted">
          PKL sudah berlangsung. Perubahan pembimbing dan tanggal tetap dapat
          disimpan.
        </p>
      ) : null}
    </form>
  );
}
