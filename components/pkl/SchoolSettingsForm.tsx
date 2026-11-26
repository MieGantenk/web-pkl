"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  useForm,
  type FieldPath,
} from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateSchoolSettingsAction } from "@/lib/actions/school-settings";
import { compressImage } from "@/lib/image-compression";
import {
  jenisSuratLabel,
  jenisSuratList,
  type JenisSurat,
} from "@/lib/status";
import { settingsSchema, type SettingsInput } from "@/lib/validators/settings";

type SettingsInitial = {
  nama_sekolah: string;
  alamat: string;
  telepon: string | null;
  email: string | null;
  website: string | null;
  kepala_sekolah: string | null;
  nip_kepala: string | null;
  akreditasi: string | null;
  format_nomor_surat: string;
};

type SchoolSettingsFormProps = {
  initial: SettingsInitial;
  penomoran: Array<{ jenis: JenisSurat; urutan_terakhir: number }>;
  assets: {
    logoUrl: string | null;
    kopUrl: string | null;
    footerUrl: string | null;
  };
  year: number;
};

const card =
  "rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6";

type TextFieldProps = React.ComponentProps<typeof Input> & {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  containerClassName?: string;
};

function TextField({
  label,
  error,
  hint,
  required,
  containerClassName,
  id,
  name,
  ...props
}: TextFieldProps) {
  const fieldId = id ?? name;
  const describedBy =
    [error ? `${fieldId}-error` : null, hint ? `${fieldId}-hint` : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className={containerClassName}>
      <label
        htmlFor={fieldId}
        className="block text-[13px] font-medium leading-[18px] text-ink"
      >
        {label} {required ? <span className="text-danger">*</span> : null}
      </label>
      <Input
        id={fieldId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="mt-1.5"
        {...props}
      />
      {error ? (
        <p
          id={`${fieldId}-error`}
          className="mt-1.5 text-xs leading-4 text-danger"
        >
          {error}
        </p>
      ) : hint ? (
        <p
          id={`${fieldId}-hint`}
          className="mt-1.5 text-xs leading-4 text-muted"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type TextareaFieldProps = React.ComponentProps<typeof Textarea> & {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  containerClassName?: string;
};

function TextareaField({
  label,
  error,
  hint,
  required,
  containerClassName,
  id,
  name,
  ...props
}: TextareaFieldProps) {
  const fieldId = id ?? name;
  const describedBy =
    [error ? `${fieldId}-error` : null, hint ? `${fieldId}-hint` : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className={containerClassName}>
      <label
        htmlFor={fieldId}
        className="block text-[13px] font-medium leading-[18px] text-ink"
      >
        {label} {required ? <span className="text-danger">*</span> : null}
      </label>
      <Textarea
        id={fieldId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="mt-1.5"
        {...props}
      />
      {error ? (
        <p
          id={`${fieldId}-error`}
          className="mt-1.5 text-xs leading-4 text-danger"
        >
          {error}
        </p>
      ) : hint ? (
        <p
          id={`${fieldId}-hint`}
          className="mt-1.5 text-xs leading-4 text-muted"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function AssetField({
  label,
  description,
  currentUrl,
  name,
}: {
  label: string;
  description: string;
  currentUrl: string | null;
  name: "logo" | "kop" | "footer";
}) {
  return (
    <div className="rounded-sm border border-border bg-surface-muted/50 p-3">
      <p className="text-[13px] font-semibold leading-[18px] text-ink">
        {label}
      </p>

      <div className="mt-2 flex min-h-24 items-center justify-center rounded-sm border border-dashed border-border bg-surface p-2">
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentUrl}
            alt={`${label} saat ini`}
            className="max-h-20 w-auto object-contain"
          />
        ) : (
          <p className="text-xs text-muted">Belum diunggah</p>
        )}
      </div>

      <input
        name={name}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="mt-3 block w-full text-sm text-ink-soft file:mr-3 file:rounded-sm file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
      />
      <p className="mt-1.5 text-xs leading-4 text-muted">{description}</p>
    </div>
  );
}

export function SchoolSettingsForm({
  initial,
  penomoran,
  assets,
  year,
}: SchoolSettingsFormProps) {
  const router = useRouter();

  const penomoranDefaults = Object.fromEntries(
    jenisSuratList.map((jenis) => [
      jenis,
      penomoran.find((item) => item.jenis === jenis)?.urutan_terakhir ?? 0,
    ]),
  ) as Record<JenisSurat, number>;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      nama_sekolah: initial.nama_sekolah,
      alamat: initial.alamat,
      telepon: initial.telepon ?? "",
      email: initial.email ?? "",
      website: initial.website ?? "",
      kepala_sekolah: initial.kepala_sekolah ?? "",
      nip_kepala: initial.nip_kepala ?? "",
      akreditasi: initial.akreditasi ?? "",
      format_nomor_surat: initial.format_nomor_surat,
      penomoran: penomoranDefaults,
    },
  });

  async function onSubmit(
    values: SettingsInput,
    event?: React.BaseSyntheticEvent,
  ) {
    const form = event?.target as HTMLFormElement | undefined;
    const formData = form ? new FormData(form) : new FormData();

    formData.set("nama_sekolah", values.nama_sekolah);
    formData.set("alamat", values.alamat);
    formData.set("telepon", values.telepon ?? "");
    formData.set("email", values.email ?? "");
    formData.set("website", values.website ?? "");
    formData.set("kepala_sekolah", values.kepala_sekolah ?? "");
    formData.set("nip_kepala", values.nip_kepala ?? "");
    formData.set("akreditasi", values.akreditasi ?? "");
    formData.set("format_nomor_surat", values.format_nomor_surat);
    formData.set("penomoran", JSON.stringify(values.penomoran));

    try {
      for (const name of ["logo", "kop", "footer"] as const) {
        const entry = formData.get(name);

        if (entry instanceof File && entry.size > 0) {
          formData.set(
            name,
            await compressImage(entry, {
              maxSizeMB: 2,
              maxWidthOrHeight: 2400,
            }),
          );
        }
      }
    } catch {
      toast.error(
        "Gambar belum dapat diproses. Pilih gambar lain lalu coba lagi.",
      );
      return;
    }

    const result = await updateSchoolSettingsAction(formData);

    if (!result.ok) {
      for (const [field, messages] of Object.entries(
        result.fieldErrors ?? {},
      )) {
        if (field === "form") continue;

        setError(field as FieldPath<SettingsInput>, {
          message: messages[0] ?? "Nilai tidak valid.",
        });
      }

      toast.error(result.message);
      return;
    }

    toast.success(result.message);

    form
      ?.querySelectorAll<HTMLInputElement>('input[type="file"]')
      .forEach((input) => {
        input.value = "";
      });

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <section className={card}>
        <div>
          <h2 className="text-xl font-semibold text-ink">Profil sekolah</h2>
          <p className="mt-1 text-sm text-muted">
            Dipakai di kop, footer, dan surat resmi sekolah.
          </p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <TextField
            label="Nama sekolah"
            required
            maxLength={200}
            containerClassName="sm:col-span-2"
            error={errors.nama_sekolah?.message}
            {...register("nama_sekolah")}
          />

          <TextareaField
            label="Alamat"
            required
            maxLength={2000}
            rows={3}
            placeholder="Alamat lengkap sekolah"
            containerClassName="sm:col-span-2"
            error={errors.alamat?.message}
            {...register("alamat")}
          />

          <TextField
            label="Telepon"
            type="tel"
            inputMode="tel"
            maxLength={30}
            placeholder="0812..."
            error={errors.telepon?.message}
            {...register("telepon")}
          />

          <TextField
            label="Email"
            type="email"
            maxLength={255}
            placeholder="sekolah@example.sch.id"
            error={errors.email?.message}
            {...register("email")}
          />

          <TextField
            label="Website"
            type="url"
            inputMode="url"
            maxLength={255}
            placeholder="https://..."
            error={errors.website?.message}
            {...register("website")}
          />

          <TextField
            label="Kepala sekolah"
            maxLength={150}
            placeholder="Nama kepala sekolah"
            error={errors.kepala_sekolah?.message}
            {...register("kepala_sekolah")}
          />

          <TextField
            label="NIP kepala sekolah"
            maxLength={30}
            placeholder="NIP/NIY"
            error={errors.nip_kepala?.message}
            {...register("nip_kepala")}
          />

          <TextField
            label="Akreditasi"
            maxLength={100}
            placeholder="Contoh: A (Unggul)"
            hint="Wajib diisi sebelum surat diterbitkan."
            error={errors.akreditasi?.message}
            {...register("akreditasi")}
          />
        </div>
      </section>

      <section className={card}>
        <div>
          <h2 className="text-xl font-semibold text-ink">Identitas surat</h2>
          <p className="mt-1 text-sm text-muted">
            Logo, kop, dan footer dipakai pada pratinjau dan cetak surat.
          </p>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <AssetField
            label="Logo"
            description="PNG, JPG, atau WebP. Maksimal 2 MB."
            currentUrl={assets.logoUrl}
            name="logo"
          />
          <AssetField
            label="Kop surat"
            description="Gambar header surat. Maksimal 2 MB."
            currentUrl={assets.kopUrl}
            name="kop"
          />
          <AssetField
            label="Footer surat"
            description="Gambar footer surat. Maksimal 2 MB."
            currentUrl={assets.footerUrl}
            name="footer"
          />
        </div>

        <div className="mt-5">
          <TextField
            label="Format nomor surat"
            required
            maxLength={200}
            placeholder="{nomor}/{kode}/{tahun}"
            hint="Gunakan placeholder {nomor}, {kode}, dan {tahun}."
            error={errors.format_nomor_surat?.message}
            {...register("format_nomor_surat")}
          />
        </div>
      </section>

      <section className={card}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-ink">
              Penomoran surat
            </h2>
            <p className="mt-1 text-sm text-muted">
              Nomor terakhir yang sudah terpakai per jenis surat.
            </p>
          </div>
          <span className="rounded-full border border-border bg-surface-muted px-2.5 py-1 text-xs font-semibold text-ink-soft tabular-nums">
            Tahun {year}
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[13px] text-muted">
                <th className="pb-2 font-medium">Jenis surat</th>
                <th className="pb-2 font-medium">Nomor terakhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {jenisSuratList.map((jenis) => (
                <tr key={jenis}>
                  <td className="py-2.5 pr-4 text-ink">
                    {jenisSuratLabel[jenis]}
                  </td>
                  <td className="py-2">
                    <Input
                      type="number"
                      min={0}
                      max={999999}
                      inputMode="numeric"
                      aria-label={`Nomor terakhir ${jenisSuratLabel[jenis]}`}
                      className="h-10 w-32 tabular-nums"
                      {...register(
                        `penomoran.${jenis}` as FieldPath<SettingsInput>,
                        { valueAsNumber: true },
                      )}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs leading-4 text-muted">
          Jangan turunkan angka di bawah nomor surat yang sudah terbit. Perubahan
          berlaku untuk surat berikutnya.
        </p>
        {errors.penomoran ? (
          <p className="mt-2 text-xs leading-4 text-danger">
            Periksa kembali nomor surat.
          </p>
        ) : null}
      </section>

      <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <p className="text-[13px] leading-[18px] text-muted">
          Perubahan berlaku untuk surat dan penomoran berikutnya.
        </p>
        <Button
          type="submit"
          loading={isSubmitting}
          className="w-full sm:w-auto"
        >
          Simpan pengaturan
        </Button>
      </div>
    </form>
  );
}
