import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

type NotifikasiRole = "admin" | "siswa" | "ortu" | "guru" | "instruktur";

type NotifikasiContent = {
  judul: string;
  pesan: string;
};

type NotifikasiLinks = Partial<Record<NotifikasiRole, string>>;

type NotifikasiRow = {
  pengguna_id: string;
  judul: string;
  pesan: string;
  tautan: string | null;
  dibaca: false;
};

function rowsFor(
  userIds: Iterable<string>,
  content: NotifikasiContent,
  tautan: string,
): NotifikasiRow[] {
  return Array.from(new Set(userIds)).map((penggunaId) => ({
    pengguna_id: penggunaId,
    judul: content.judul,
    pesan: content.pesan,
    tautan,
    dibaca: false,
  }));
}

async function insertRows(rows: NotifikasiRow[]) {
  if (!rows.length) return;

  try {
    const admin = createAdminClient();
    await admin.from("notifikasi").insert(rows);
  } catch {
    // Notifikasi tidak boleh menggagalkan alur utama.
  }
}

export async function notifyUsers(
  userIds: Iterable<string>,
  content: NotifikasiContent,
  tautan: string,
) {
  await insertRows(rowsFor(userIds, content, tautan));
}

export async function notifyAdmins(
  content: NotifikasiContent,
  tautan = "/admin",
) {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("pengguna")
      .select("id")
      .eq("peran", "admin")
      .eq("aktif", true);

    await insertRows(
      rowsFor(
        (data ?? []).map((user) => user.id),
        content,
        tautan,
      ),
    );
  } catch {
    // Notifikasi tidak boleh menggagalkan alur utama.
  }
}

export async function notifyPengajuan(
  pengajuanId: string,
  links: NotifikasiLinks,
  content: NotifikasiContent,
) {
  try {
    const admin = createAdminClient();
    const rows: NotifikasiRow[] = [];
    const wantsStudents = Boolean(links.siswa || links.ortu);
    const needsApplication = Boolean(
      links.guru || links.instruktur || wantsStudents,
    );
    const application = needsApplication
      ? (
          await admin
            .from("pengajuan_pkl")
            .select("guru_pembimbing_id, instruktur_id, pembimbing_id")
            .eq("id", pengajuanId)
            .maybeSingle()
        ).data
      : null;

    if (links.admin) {
      const { data } = await admin
        .from("pengguna")
        .select("id")
        .eq("peran", "admin")
        .eq("aktif", true);

      rows.push(
        ...rowsFor(
          (data ?? []).map((user) => user.id),
          content,
          links.admin,
        ),
      );
    }

    if (wantsStudents) {
      const { data: members } = await admin
        .from("pengajuan_anggota")
        .select("siswa_id, siswa:siswa_id(pengguna_id)")
        .eq("pengajuan_id", pengajuanId);

      const studentIds = (members ?? []).map((member) => member.siswa_id);

      if (links.siswa) {
        rows.push(
          ...rowsFor(
            (members ?? [])
              .map((member) => member.siswa?.pengguna_id)
              .filter((value): value is string => Boolean(value)),
            content,
            links.siswa,
          ),
        );
      }

      if (links.ortu && studentIds.length) {
        const { data: parents } = await admin
          .from("orang_tua_siswa")
          .select("pengguna_id")
          .in("siswa_id", studentIds);

        rows.push(
          ...rowsFor(
            (parents ?? []).map((parent) => parent.pengguna_id),
            content,
            links.ortu,
          ),
        );
      }
    }

    if (links.guru && application?.guru_pembimbing_id) {
      const { data: guru } = await admin
        .from("guru")
        .select("pengguna_id")
        .eq("id", application.guru_pembimbing_id)
        .maybeSingle();

      if (guru?.pengguna_id) {
        rows.push(...rowsFor([guru.pengguna_id], content, links.guru));
      }
    }

    if (links.instruktur) {
      const instructorIds = Array.from(
        new Set(
          [application?.instruktur_id, application?.pembimbing_id].filter(
            (value): value is string => Boolean(value),
          ),
        ),
      );

      if (instructorIds.length) {
        const { data: instructors } = await admin
          .from("instruktur")
          .select("pengguna_id")
          .in("id", instructorIds);

        rows.push(
          ...rowsFor(
            (instructors ?? []).map((instructor) => instructor.pengguna_id),
            content,
            links.instruktur,
          ),
        );
      }
    }

    await insertRows(rows);
  } catch {
    // Notifikasi tidak boleh menggagalkan alur utama.
  }
}
