import { cache } from "react";
import { connection } from "next/server";

import { jakartaToday } from "@/lib/date";
import type { StatusJurnal, StatusPengajuan, StatusTugas } from "@/lib/status";
import { createClient } from "@/lib/supabase/server";

const ACTIVE_STATUSES: StatusPengajuan[] = [
  "diterima",
  "keberangkatan_terbit",
  "berlangsung",
  "penarikan_terbit",
];

export type GuruContext = {
  id: string;
  nip: string | null;
  nuptk: string | null;
  jabatan: string | null;
  jurusan: { nama: string } | null;
};

export type GuruStudent = {
  id: string;
  nama: string;
  nis: string;
  kelas: string | null;
  telepon: string | null;
  jurusan: { nama: string } | null;
  pengajuanId: string;
  pengajuanStatus: StatusPengajuan;
  perusahaan: { nama: string; kota: string | null } | null;
  periode: { nama: string } | null;
  tanggalMulai: string | null;
  tanggalSelesai: string | null;
  jurnal: {
    total: number;
    menunggu: number;
    terverifikasi: number;
    revisi: number;
  };
  mutabaah: { terisi: number; totalHari: number };
};

export type GuruJournalSummary = {
  id: string;
  pengajuanId: string | null;
  siswaId: string;
  tanggal: string;
  waktuMulai: string | null;
  waktuSelesai: string | null;
  kegiatan: string;
  status: StatusJurnal;
};

type GuruStudentsBase = {
  students: GuruStudent[];
  journals: GuruJournalSummary[];
  applicationIds: string[];
  formNama: string | null;
};

export type GuruTask = {
  id: string;
  judul: string;
  deskripsi: string | null;
  deadline: string | null;
  createdAt: string;
  status: StatusTugas;
  catatan: string | null;
  selesaiPada: string | null;
};

function startOfWeek(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;

  date.setUTCDate(date.getUTCDate() + diff);

  return date.toISOString().slice(0, 10);
}

export const getGuruContext = cache(
  async (penggunaId: string): Promise<GuruContext | null> => {
    await connection();

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("guru")
      .select("id, nip, nuptk, jabatan, jurusan:jurusan_id(nama)")
      .eq("pengguna_id", penggunaId)
      .maybeSingle();

    if (error) {
      throw new Error("Gagal memuat data guru.");
    }

    return data;
  },
);

const getGuruStudentsBase = cache(
  async (guruId: string): Promise<GuruStudentsBase> => {
    await connection();

    const supabase = await createClient();
    const today = jakartaToday();

    const { data: applications, error: applicationsError } = await supabase
      .from("pengajuan_pkl")
      .select(
        "id, status, tanggal_mulai, tanggal_selesai, perusahaan:perusahaan_id(nama, kota), periode:periode_id(nama)",
      )
      .eq("guru_pembimbing_id", guruId)
      .in("status", ACTIVE_STATUSES)
      .order("created_at", { ascending: false });

    if (applicationsError) {
      throw new Error("Gagal memuat pengajuan siswa bimbingan.");
    }

    const applicationIds = (applications ?? []).map((item) => item.id);

    if (!applicationIds.length) {
      return {
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
          "id, pengajuan_id, siswa_id, tanggal, waktu_mulai, waktu_selesai, kegiatan, status",
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
      throw new Error("Gagal memuat data siswa bimbingan.");
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
      (applications ?? []).map((application) => [application.id, application]),
    );
    const journalsByStudent = new Map<string, GuruJournalSummary[]>();

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
        status: journal.status,
      });
      journalsByStudent.set(journal.siswa_id, list);
    }

    const students: GuruStudent[] = [];
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
      const verified = journals.filter(
        (journal) =>
          journal.status === "terverifikasi_guru" ||
          journal.status === "terverifikasi_instruktur",
      ).length;

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
          menunggu: journals.filter((journal) => journal.status === "menunggu")
            .length,
          terverifikasi: verified,
          revisi: journals.filter((journal) => journal.status === "revisi")
            .length,
        },
        mutabaah: {
          terisi: mutabaahByStudent.get(siswa.id) ?? 0,
          totalHari: 7,
        },
      });
    }

    return {
      students,
      journals: journalRows.map((journal) => ({
        id: journal.id,
        pengajuanId: journal.pengajuan_id,
        siswaId: journal.siswa_id,
        tanggal: journal.tanggal,
        waktuMulai: journal.waktu_mulai,
        waktuSelesai: journal.waktu_selesai,
        kegiatan: journal.kegiatan,
        status: journal.status,
      })),
      applicationIds,
      formNama: form?.nama ?? null,
    };
  },
);

export type GuruDashboardData = {
  today: string;
  context: GuruContext | null;
  students: GuruStudent[];
  studentCount: number;
  journals: Array<GuruJournalSummary & { nama: string }>;
  pending: number;
  tugasAktif: number;
  suratTugas: {
    id: string;
    nomor: string | null;
    tanggalTerbit: string | null;
    status: "draft" | "terbit" | "dibatalkan";
  } | null;
};

export const getGuruDashboard = cache(
  async (penggunaId: string): Promise<GuruDashboardData> => {
    await connection();

    const supabase = await createClient();
    const today = jakartaToday();
    const context = await getGuruContext(penggunaId);

    if (!context) {
      return {
        today,
        context: null,
        students: [],
        studentCount: 0,
        journals: [],
        pending: 0,
        tugasAktif: 0,
        suratTugas: null,
      };
    }

    const base = await getGuruStudentsBase(context.id);
    const studentById = new Map(
      base.students.map((student) => [student.id, student]),
    );
    const journals = base.journals.slice(0, 5).map((journal) => ({
      ...journal,
      nama: studentById.get(journal.siswaId)?.nama ?? "Siswa",
    }));

    let tugasAktif = 0;
    let suratTugas: GuruDashboardData["suratTugas"] = null;

    if (base.applicationIds.length) {
      const [tasksRes, suratRes] = await Promise.all([
        supabase
          .from("tugas")
          .select("id", { count: "exact", head: true })
          .in("pengajuan_id", base.applicationIds)
          .gte("deadline", today),
        supabase
          .from("surat")
          .select("id, nomor, tanggal_terbit, status")
          .in("pengajuan_id", base.applicationIds)
          .eq("jenis", "tugas_monitoring")
          .order("tanggal_terbit", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (tasksRes.error || suratRes.error) {
        throw new Error("Gagal memuat ringkasan guru.");
      }

      tugasAktif = tasksRes.count ?? 0;

      if (suratRes.data) {
        suratTugas = {
          id: suratRes.data.id,
          nomor: suratRes.data.nomor,
          tanggalTerbit: suratRes.data.tanggal_terbit,
          status: suratRes.data.status,
        };
      }
    }

    return {
      today,
      context,
      students: base.students.slice(0, 5),
      studentCount: base.students.length,
      journals,
      pending: base.journals.filter(
        (journal) => journal.status === "menunggu",
      ).length,
      tugasAktif,
      suratTugas,
    };
  },
);

export const getGuruStudents = cache(
  async (
    penggunaId: string,
  ): Promise<{ context: GuruContext | null; students: GuruStudent[] }> => {
    await connection();

    const context = await getGuruContext(penggunaId);

    if (!context) {
      return { context: null, students: [] };
    }

    const base = await getGuruStudentsBase(context.id);

    return { context, students: base.students };
  },
);

export type GuruStudentDetail = {
  context: GuruContext;
  student: GuruStudent;
  profile: {
    alamat: string | null;
    namaOrangTua: string | null;
    teleponOrangTua: string | null;
    tempatLahir: string | null;
    tanggalLahir: string | null;
  } | null;
  instrukturNama: string | null;
  pembimbingNama: string | null;
  journals: Array<{
    id: string;
    tanggal: string;
    waktuMulai: string | null;
    waktuSelesai: string | null;
    kegiatan: string;
    deskripsi: string | null;
    status: StatusJurnal;
    fotoUrl: string | null;
  }>;
  tasks: GuruTask[];
};

export const getGuruStudentDetail = cache(
  async (
    penggunaId: string,
    siswaId: string,
  ): Promise<GuruStudentDetail | null> => {
    await connection();

    const supabase = await createClient();
    const context = await getGuruContext(penggunaId);
    const today = jakartaToday();

    if (!context) {
      return null;
    }

    const base = await getGuruStudentsBase(context.id);
    const student = base.students.find((item) => item.id === siswaId);

    if (!student) {
      return null;
    }

    const [profileRes, journalsRes, tasksRes, placementRes] = await Promise.all([
      supabase
        .from("siswa")
        .select(
          "alamat, nama_orangtua, telepon_orangtua, tempat_lahir, tanggal_lahir",
        )
        .eq("id", siswaId)
        .maybeSingle(),
      supabase
        .from("jurnal")
        .select(
          "id, tanggal, waktu_mulai, waktu_selesai, kegiatan, deskripsi, status, foto_path",
        )
        .eq("siswa_id", siswaId)
        .eq("pengajuan_id", student.pengajuanId)
        .order("tanggal", { ascending: false })
        .limit(10),
      supabase
        .from("tugas")
        .select("id, judul, deskripsi, deadline, created_at")
        .eq("pengajuan_id", student.pengajuanId)
        .order("created_at", { ascending: false }),
      supabase
        .from("pengajuan_pkl")
        .select("instruktur_id, pembimbing_id")
        .eq("id", student.pengajuanId)
        .maybeSingle(),
    ]);

    if (
      profileRes.error ||
      journalsRes.error ||
      tasksRes.error ||
      placementRes.error
    ) {
      throw new Error("Gagal memuat detail siswa.");
    }

    const instructorIds = Array.from(
      new Set(
        [placementRes.data?.instruktur_id, placementRes.data?.pembimbing_id].filter(
          (value): value is string => Boolean(value),
        ),
      ),
    );
    const instructorNameById = new Map<string, string>();

    if (instructorIds.length) {
      const { data: instructors, error: instructorError } = await supabase
        .from("instruktur")
        .select("id, pengguna:pengguna_id(nama_lengkap)")
        .in("id", instructorIds);

      if (instructorError) {
        throw new Error("Gagal memuat data instruktur.");
      }

      for (const instructor of instructors ?? []) {
        instructorNameById.set(
          instructor.id,
          instructor.pengguna?.nama_lengkap ?? "Tanpa nama",
        );
      }
    }

    const journalRows = await Promise.all(
      (journalsRes.data ?? []).map(async (journal) => {
        let fotoUrl: string | null = null;

        if (journal.foto_path) {
          const { data } = await supabase.storage
            .from("jurnal")
            .createSignedUrl(journal.foto_path, 60 * 60);
          fotoUrl = data?.signedUrl ?? null;
        }

        return {
          id: journal.id,
          tanggal: journal.tanggal,
          waktuMulai: journal.waktu_mulai,
          waktuSelesai: journal.waktu_selesai,
          kegiatan: journal.kegiatan,
          deskripsi: journal.deskripsi,
          status: journal.status,
          fotoUrl,
        };
      }),
    );

    const taskIds = (tasksRes.data ?? []).map((task) => task.id);
    let taskStatusById = new Map<
      string,
      {
        status: StatusTugas;
        catatan: string | null;
        selesai_pada: string | null;
      }
    >();

    if (taskIds.length) {
      const { data: taskRows, error } = await supabase
        .from("tugas_siswa")
        .select("tugas_id, status, catatan, selesai_pada")
        .eq("siswa_id", siswaId)
        .in("tugas_id", taskIds);

      if (error) {
        throw new Error("Gagal memuat progres tugas.");
      }

      taskStatusById = new Map(
        (taskRows ?? []).map((row) => [
          row.tugas_id,
          {
            status: row.status,
            catatan: row.catatan,
            selesai_pada: row.selesai_pada,
          },
        ]),
      );
    }

    const tasks: GuruTask[] = (tasksRes.data ?? []).map((task) => {
      const taskStatus = taskStatusById.get(task.id);
      const rawStatus = taskStatus?.status ?? "belum";
      const status: StatusTugas =
        rawStatus === "belum" && task.deadline && task.deadline < today
          ? "terlambat"
          : rawStatus;

      return {
        id: task.id,
        judul: task.judul,
        deskripsi: task.deskripsi,
        deadline: task.deadline,
        createdAt: task.created_at,
        status,
        catatan: taskStatus?.catatan ?? null,
        selesaiPada: taskStatus?.selesai_pada ?? null,
      };
    });

    return {
      context,
      student,
      profile: profileRes.data
        ? {
            alamat: profileRes.data.alamat,
            namaOrangTua: profileRes.data.nama_orangtua,
            teleponOrangTua: profileRes.data.telepon_orangtua,
            tempatLahir: profileRes.data.tempat_lahir,
            tanggalLahir: profileRes.data.tanggal_lahir,
          }
        : null,
      instrukturNama: placementRes.data?.instruktur_id
        ? (instructorNameById.get(placementRes.data.instruktur_id) ??
          "Tanpa nama")
        : null,
      pembimbingNama: placementRes.data?.pembimbing_id
        ? (instructorNameById.get(placementRes.data.pembimbing_id) ??
          "Tanpa nama")
        : null,
      journals: journalRows,
      tasks,
    };
  },
);

export type GuruVerificationData = {
  today: string;
  context: GuruContext | null;
  journals: Array<
    GuruJournalSummary & {
      nama: string;
      nis: string | null;
      kelas: string | null;
      perusahaan: string | null;
    }
  >;
  pending: number;
  total: number;
  counts: Record<StatusJurnal, number>;
  selected: (GuruJournalSummary & {
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
    hasInstrukturVerification: boolean;
    canVerify: boolean;
  }) | null;
};

export const getGuruVerificationQueue = cache(
  async (
    penggunaId: string,
    options: {
      jurnalId?: string;
      q?: string;
      status?: StatusJurnal | "";
    } = {},
  ): Promise<GuruVerificationData> => {
    await connection();

    const supabase = await createClient();
    const today = jakartaToday();
    const context = await getGuruContext(penggunaId);
    const counts: Record<StatusJurnal, number> = {
      menunggu: 0,
      terverifikasi_guru: 0,
      terverifikasi_instruktur: 0,
      revisi: 0,
    };

    if (!context) {
      return {
        today,
        context: null,
        journals: [],
        pending: 0,
        total: 0,
        counts,
        selected: null,
      };
    }

    const base = await getGuruStudentsBase(context.id);
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
        const priority = (status: StatusJurnal) =>
          status === "menunggu" ? 0 : status === "revisi" ? 1 : 2;

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
      journals.find((journal) => journal.status === "menunggu") ??
      journals[0] ??
      null;

    let selected: GuruVerificationData["selected"] = null;

    if (selectedSummary) {
      const [journalRes, verificationsRes] = await Promise.all([
        supabase
          .from("jurnal")
          .select(
            "id, tanggal, waktu_mulai, waktu_selesai, kegiatan, deskripsi, status, foto_path",
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
        const hasInstrukturVerification =
          verificationsRes.data?.some(
            (item) => item.peran === "instruktur",
          ) ?? false;

        selected = {
          ...selectedSummary,
          tanggal: journal.tanggal,
          waktuMulai: journal.waktu_mulai,
          waktuSelesai: journal.waktu_selesai,
          kegiatan: journal.kegiatan,
          status: journal.status,
          deskripsi: journal.deskripsi,
          fotoUrl,
          guruVerification,
          hasInstrukturVerification,
          canVerify:
            !hasInstrukturVerification &&
            journal.status !== "terverifikasi_instruktur",
        };
      }
    }

    return {
      today,
      context,
      journals,
      pending: counts.menunggu,
      total: allJournals.length,
      counts,
      selected,
    };
  },
);
