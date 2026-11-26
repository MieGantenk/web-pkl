import { cache } from "react";
import { connection } from "next/server";

import { jakartaToday } from "@/lib/date";
import type {
  KehadiranJurnal,
  StatusJurnal,
  StatusPengajuan,
} from "@/lib/status";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ACTIVE_STATUSES: StatusPengajuan[] = [
  "diterima",
  "keberangkatan_terbit",
  "berlangsung",
  "penarikan_terbit",
];

export type InstrukturAssignment = {
  id: string;
  peran: "instruktur" | "pembimbing";
  jabatan: string | null;
  telepon: string | null;
  aktif: boolean;
  perusahaan: {
    id: string;
    nama: string;
    kota: string | null;
    aktif: boolean;
  } | null;
};

export type InstrukturContext = {
  assignments: InstrukturAssignment[];
  activeAssignmentIds: string[];
  companies: Array<{ id: string; nama: string; kota: string | null }>;
};

export type InstrukturStudent = {
  id: string;
  nama: string;
  nis: string;
  kelas: string | null;
  telepon: string | null;
  jurusan: { nama: string } | null;
  pengajuanId: string;
  pengajuanStatus: StatusPengajuan;
  perusahaan: { id: string; nama: string; kota: string | null } | null;
  periode: { nama: string } | null;
  tanggalMulai: string | null;
  tanggalSelesai: string | null;
  jurnal: {
    total: number;
    siapVerifikasi: number;
    menungguGuru: number;
    terverifikasi: number;
    revisi: number;
  };
  pendingJournalId: string | null;
  mutabaah: { terisi: number; totalHari: number };
};

export type InstrukturJournalSummary = {
  id: string;
  pengajuanId: string | null;
  siswaId: string;
  tanggal: string;
  waktuMulai: string | null;
  waktuSelesai: string | null;
  kegiatan: string;
  kehadiran: KehadiranJurnal;
  status: StatusJurnal;
};

type InstrukturStudentsBase = {
  context: InstrukturContext;
  students: InstrukturStudent[];
  journals: InstrukturJournalSummary[];
  applicationIds: string[];
  formNama: string | null;
};

function startOfWeek(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;

  date.setUTCDate(date.getUTCDate() + diff);

  return date.toISOString().slice(0, 10);
}

export const getInstrukturContext = cache(
  async (penggunaId: string): Promise<InstrukturContext> => {
    await connection();

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("instruktur")
      .select(
        "id, peran, jabatan, telepon, aktif, perusahaan:perusahaan_id(id, nama, kota, aktif)",
      )
      .eq("pengguna_id", penggunaId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error("Gagal memuat penugasan instruktur.");
    }

    const assignments = (data ?? []) as InstrukturAssignment[];
    const activeAssignments = assignments.filter(
      (assignment) => assignment.aktif && assignment.perusahaan?.aktif,
    );
    const companies = Array.from(
      new Map(
        activeAssignments
          .filter(
            (assignment): assignment is InstrukturAssignment & {
              perusahaan: NonNullable<InstrukturAssignment["perusahaan"]>;
            } => Boolean(assignment.perusahaan),
          )
          .map((assignment) => [
            assignment.perusahaan.id,
            {
              id: assignment.perusahaan.id,
              nama: assignment.perusahaan.nama,
              kota: assignment.perusahaan.kota,
            },
          ]),
      ).values(),
    );

    return {
      assignments,
      activeAssignmentIds: activeAssignments.map((assignment) => assignment.id),
      companies,
    };
  },
);

const getInstrukturStudentsBase = cache(
  async (penggunaId: string): Promise<InstrukturStudentsBase> => {
    await connection();

    const supabase = await createClient();
    const today = jakartaToday();
    const context = await getInstrukturContext(penggunaId);
    const assignmentIds = context.activeAssignmentIds;

    if (!assignmentIds.length) {
      return {
        context,
        students: [],
        journals: [],
        applicationIds: [],
        formNama: null,
      };
    }

    const applicationSelect =
      "id, status, tanggal_mulai, tanggal_selesai, created_at, perusahaan:perusahaan_id(id, nama, kota), periode:periode_id(nama)";

    const [asVerifikator, asPembimbing] = await Promise.all([
      supabase
        .from("pengajuan_pkl")
        .select(applicationSelect)
        .in("instruktur_id", assignmentIds)
        .in("status", ACTIVE_STATUSES)
        .order("created_at", { ascending: false }),
      supabase
        .from("pengajuan_pkl")
        .select(applicationSelect)
        .in("pembimbing_id", assignmentIds)
        .in("status", ACTIVE_STATUSES)
        .order("created_at", { ascending: false }),
    ]);

    if (asVerifikator.error || asPembimbing.error) {
      throw new Error("Gagal memuat penempatan siswa perusahaan.");
    }

    const applications = Array.from(
      new Map(
        [...(asVerifikator.data ?? []), ...(asPembimbing.data ?? [])].map(
          (application) => [application.id, application],
        ),
      ).values(),
    );
    const applicationIds = applications.map((application) => application.id);

    if (!applicationIds.length) {
      return {
        context,
        students: [],
        journals: [],
        applicationIds: [],
        formNama: null,
      };
    }

    const [membersRes, journalsRes, periodRes] = await Promise.all([
      supabase
        .from("pengajuan_anggota")
        .select(
          "pengajuan_id, siswa_id, siswa:siswa_id(id, nis, kelas, telepon, pengguna:pengguna_id(nama_lengkap), jurusan:jurusan_id(nama))",
        )
        .in("pengajuan_id", applicationIds),
      supabase
        .from("jurnal")
        .select(
          "id, pengajuan_id, siswa_id, tanggal, waktu_mulai, waktu_selesai, kegiatan, kehadiran, status",
        )
        .in("pengajuan_id", applicationIds)
        .order("tanggal", { ascending: false }),
      supabase
        .from("periode_pkl")
        .select("id, nama")
        .eq("aktif", true)
        .maybeSingle(),
    ]);

    if (membersRes.error || journalsRes.error || periodRes.error) {
      throw new Error("Gagal memuat data siswa perusahaan.");
    }

    const members = membersRes.data ?? [];
    const journalRows = journalsRes.data ?? [];
    const studentIds = Array.from(
      new Set(members.map((member) => member.siswa_id)),
    );

    let formQuery = supabase
      .from("mutabaah_form")
      .select("id, nama")
      .eq("status", "aktif");

    if (periodRes.data) {
      formQuery = formQuery.eq("periode_id", periodRes.data.id);
    }

    const { data: form, error: formError } = await formQuery
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (formError) {
      throw new Error("Gagal memuat form mutaba'ah.");
    }

    let mutabaahByStudent = new Map<string, number>();

    if (form && studentIds.length) {
      const { data: entries, error: entriesError } = await supabase
        .from("mutabaah_harian")
        .select("siswa_id, tanggal")
        .eq("form_id", form.id)
        .in("siswa_id", studentIds)
        .gte("tanggal", startOfWeek(today))
        .lte("tanggal", today);

      if (entriesError) {
        throw new Error("Gagal memuat progres mutaba'ah.");
      }

      const datesByStudent = new Map<string, Set<string>>();

      for (const entry of entries ?? []) {
        const dates = datesByStudent.get(entry.siswa_id) ?? new Set<string>();
        dates.add(entry.tanggal);
        datesByStudent.set(entry.siswa_id, dates);
      }

      mutabaahByStudent = new Map(
        Array.from(datesByStudent.entries()).map(([studentId, dates]) => [
          studentId,
          dates.size,
        ]),
      );
    }

    const applicationById = new Map(
      applications.map((application) => [application.id, application]),
    );
    const journalsByStudent = new Map<string, InstrukturJournalSummary[]>();

    for (const journal of journalRows) {
      const list = journalsByStudent.get(journal.siswa_id) ?? [];
      list.push({
        id: journal.id,
        pengajuanId: journal.pengajuan_id,
        siswaId: journal.siswa_id,
        tanggal: journal.tanggal,
        waktuMulai: journal.waktu_mulai,
        waktuSelesai: journal.waktu_selesai,
        kegiatan: journal.kegiatan,
        kehadiran: journal.kehadiran,
        status: journal.status,
      });
      journalsByStudent.set(journal.siswa_id, list);
    }

    const students: InstrukturStudent[] = [];
    const seenStudents = new Set<string>();

    for (const member of members) {
      const siswa = member.siswa;

      if (!siswa || seenStudents.has(siswa.id)) {
        continue;
      }

      const application = applicationById.get(member.pengajuan_id);

      if (!application) {
        continue;
      }

      const journals = journalsByStudent.get(siswa.id) ?? [];
      const readyJournal = journals.find(
        (journal) => journal.status === "terverifikasi_guru",
      );

      seenStudents.add(siswa.id);
      students.push({
        id: siswa.id,
        nama: siswa.pengguna?.nama_lengkap ?? "Siswa",
        nis: siswa.nis,
        kelas: siswa.kelas,
        telepon: siswa.telepon,
        jurusan: siswa.jurusan,
        pengajuanId: application.id,
        pengajuanStatus: application.status,
        perusahaan: application.perusahaan,
        periode: application.periode,
        tanggalMulai: application.tanggal_mulai,
        tanggalSelesai: application.tanggal_selesai,
        jurnal: {
          total: journals.length,
          siapVerifikasi: journals.filter(
            (journal) => journal.status === "terverifikasi_guru",
          ).length,
          menungguGuru: journals.filter(
            (journal) => journal.status === "menunggu",
          ).length,
          terverifikasi: journals.filter(
            (journal) => journal.status === "terverifikasi_instruktur",
          ).length,
          revisi: journals.filter((journal) => journal.status === "revisi")
            .length,
        },
        pendingJournalId: readyJournal?.id ?? null,
        mutabaah: {
          terisi: mutabaahByStudent.get(siswa.id) ?? 0,
          totalHari: 7,
        },
      });
    }

    return {
      context,
      students,
      journals: journalRows.map((journal) => ({
        id: journal.id,
        pengajuanId: journal.pengajuan_id,
        siswaId: journal.siswa_id,
        tanggal: journal.tanggal,
        waktuMulai: journal.waktu_mulai,
        waktuSelesai: journal.waktu_selesai,
        kegiatan: journal.kegiatan,
        kehadiran: journal.kehadiran,
        status: journal.status,
      })),
      applicationIds,
      formNama: form?.nama ?? null,
    };
  },
);

export type InstrukturDashboardData = {
  today: string;
  context: InstrukturContext;
  students: InstrukturStudent[];
  studentCount: number;
  journals: Array<InstrukturJournalSummary & { nama: string }>;
  pending: number;
};

export const getInstrukturDashboard = cache(
  async (penggunaId: string): Promise<InstrukturDashboardData> => {
    await connection();

    const base = await getInstrukturStudentsBase(penggunaId);
    const studentById = new Map(
      base.students.map((student) => [student.id, student]),
    );
    const journals = base.journals.slice(0, 5).map((journal) => ({
      ...journal,
      nama: studentById.get(journal.siswaId)?.nama ?? "Siswa",
    }));

    return {
      today: jakartaToday(),
      context: base.context,
      students: base.students.slice(0, 5),
      studentCount: base.students.length,
      journals,
      pending: base.journals.filter(
        (journal) => journal.status === "terverifikasi_guru",
      ).length,
    };
  },
);

export const getInstrukturStudents = cache(
  async (
    penggunaId: string,
  ): Promise<{ context: InstrukturContext; students: InstrukturStudent[] }> => {
    await connection();

    const base = await getInstrukturStudentsBase(penggunaId);

    return { context: base.context, students: base.students };
  },
);

export type InstrukturVerificationData = {
  today: string;
  context: InstrukturContext;
  journals: Array<
    InstrukturJournalSummary & {
      nama: string;
      nis: string | null;
      kelas: string | null;
      perusahaan: string | null;
    }
  >;
  pending: number;
  total: number;
  counts: Record<StatusJurnal, number>;
  selected: (InstrukturJournalSummary & {
    nama: string;
    nis: string | null;
    kelas: string | null;
    perusahaan: string | null;
    deskripsi: string | null;
    fotoUrl: string | null;
    guruVerification: {
      status: "menunggu" | "diterima" | "revisi" | "ditolak";
      catatan: string | null;
    } | null;
    instrukturVerification: {
      status: "menunggu" | "diterima" | "revisi" | "ditolak";
      catatan: string | null;
    } | null;
    canVerify: boolean;
    unavailableMessage: string;
  }) | null;
};

export const getInstrukturVerificationQueue = cache(
  async (
    penggunaId: string,
    options: {
      jurnalId?: string;
      q?: string;
      status?: StatusJurnal | "";
    } = {},
  ): Promise<InstrukturVerificationData> => {
    await connection();

    const supabase = await createClient();
    const base = await getInstrukturStudentsBase(penggunaId);
    const counts: Record<StatusJurnal, number> = {
      menunggu: 0,
      terverifikasi_guru: 0,
      terverifikasi_instruktur: 0,
      revisi: 0,
    };
    const studentById = new Map(
      base.students.map((student) => [student.id, student]),
    );
    const allJournals = base.journals
      .map((journal) => {
        const student = studentById.get(journal.siswaId);

        return {
          ...journal,
          nama: student?.nama ?? "Siswa",
          nis: student?.nis ?? null,
          kelas: student?.kelas ?? null,
          perusahaan: student?.perusahaan?.nama ?? null,
        };
      })
      .sort((a, b) => {
        const priority = (status: StatusJurnal) => {
          if (status === "terverifikasi_guru") return 0;
          if (status === "revisi") return 1;
          if (status === "menunggu") return 2;
          return 3;
        };

        return (
          priority(a.status) - priority(b.status) ||
          b.tanggal.localeCompare(a.tanggal)
        );
      });

    for (const journal of allJournals) {
      counts[journal.status] += 1;
    }

    const term = (options.q ?? "").trim().toLowerCase();
    const journals = allJournals.filter((journal) => {
      const matchesStatus =
        !options.status || journal.status === options.status;
      const matchesQuery =
        !term ||
        journal.nama.toLowerCase().includes(term) ||
        (journal.nis ?? "").toLowerCase().includes(term) ||
        journal.kegiatan.toLowerCase().includes(term);

      return matchesStatus && matchesQuery;
    });

    const selectedSummary =
      journals.find((journal) => journal.id === options.jurnalId) ??
      journals.find((journal) => journal.status === "terverifikasi_guru") ??
      journals[0] ??
      null;

    let selected: InstrukturVerificationData["selected"] = null;

    if (selectedSummary) {
      const [journalRes, verificationsRes] = await Promise.all([
        supabase
          .from("jurnal")
          .select(
            "id, tanggal, waktu_mulai, waktu_selesai, kegiatan, kehadiran, deskripsi, status, foto_path",
          )
          .eq("id", selectedSummary.id)
          .maybeSingle(),
        supabase
          .from("verifikasi_jurnal")
          .select("peran, status, catatan")
          .eq("jurnal_id", selectedSummary.id),
      ]);

      if (journalRes.error || verificationsRes.error) {
        throw new Error("Gagal memuat detail jurnal.");
      }

      const journal = journalRes.data;

      if (journal) {
        let fotoUrl: string | null = null;

        if (journal.foto_path) {
          const { data } = await supabase.storage
            .from("jurnal")
            .createSignedUrl(journal.foto_path, 60 * 60);
          fotoUrl = data?.signedUrl ?? null;
        }

        const guruVerification =
          verificationsRes.data?.find((item) => item.peran === "guru") ?? null;
        const instrukturVerification =
          verificationsRes.data?.find(
            (item) => item.peran === "instruktur",
          ) ?? null;
        const alreadyFinal =
          journal.status === "terverifikasi_instruktur" ||
          instrukturVerification?.status === "diterima";
        const guruAccepted = guruVerification?.status === "diterima";
        const canVerify =
          journal.status === "terverifikasi_guru" &&
          guruAccepted &&
          !alreadyFinal;

        let unavailableMessage =
          "Jurnal ini tidak dapat diverifikasi saat ini.";

        if (alreadyFinal) {
          unavailableMessage =
            "Jurnal ini sudah diverifikasi instruktur. Verifikasi tidak bisa diubah lagi.";
        } else if (journal.status === "revisi") {
          unavailableMessage = "Jurnal sedang diperbaiki siswa.";
        } else if (journal.status === "menunggu") {
          unavailableMessage =
            "Jurnal masih menunggu verifikasi guru pembimbing.";
        } else if (!guruAccepted) {
          unavailableMessage =
            "Jurnal harus disetujui guru pembimbing terlebih dahulu.";
        }

        selected = {
          ...selectedSummary,
          tanggal: journal.tanggal,
          waktuMulai: journal.waktu_mulai,
          waktuSelesai: journal.waktu_selesai,
          kegiatan: journal.kegiatan,
          kehadiran: journal.kehadiran,
          status: journal.status,
          deskripsi: journal.deskripsi,
          fotoUrl,
          guruVerification,
          instrukturVerification,
          canVerify,
          unavailableMessage,
        };
      }
    }

    return {
      today: jakartaToday(),
      context: base.context,
      journals,
      pending: counts.terverifikasi_guru,
      total: allJournals.length,
      counts,
      selected,
    };
  },
);

export type InstrukturProfileData = {
  profile: {
    id: string;
    username: string;
    email: string;
    nama_lengkap: string;
    telepon: string | null;
    avatar_url: string | null;
    aktif: boolean;
  };
  assignments: InstrukturAssignment[];
};

export const getInstrukturProfile = cache(
  async (penggunaId: string): Promise<InstrukturProfileData> => {
    await connection();

    const context = await getInstrukturContext(penggunaId);
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("pengguna")
      .select("id, username, email, nama_lengkap, telepon, avatar_url, aktif")
      .eq("id", penggunaId)
      .maybeSingle();

    if (error || !data) {
      throw new Error("Gagal memuat profil instruktur.");
    }

    return { profile: data, assignments: context.assignments };
  },
);
