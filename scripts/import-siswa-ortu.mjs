/**
 * Import akun siswa dan orang tua dari berkas JSON.
 *
 * Berkas JSON berisi data yang sudah diperiksa manual. Script ini tidak
 * menebak nama: semua nama diambil apa adanya dari berkas sumber.
 *
 * Contoh:
 *   node scripts/import-siswa-ortu.mjs \
 *     --file ~/Downloads/pkl-import.json \
 *     --out ~/Downloads/pkl-akun.csv
 *
 *   node scripts/import-siswa-ortu.mjs \
 *     --file ~/Downloads/pkl-import.json \
 *     --out ~/Downloads/pkl-akun.csv \
 *     --execute
 *
 * Tanpa --execute, script hanya membaca database dan menampilkan rencana.
 * Dengan --execute, akun dibuat di Supabase yang terhubung.
 *
 * Catatan: akun yang sudah ada tidak dibuat ulang dan kata sandinya tidak
 * diubah. Script aman dijalankan ulang; kredensial hanya ditulis untuk akun
 * baru pada eksekusi tersebut.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghijkmnopqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%&*+-?";
const ALL = UPPER + LOWER + DIGITS + SYMBOLS;

function loadEnv() {
  const candidates = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", ".env.local"),
  ];
  const envPath = candidates.find((candidate) => fs.existsSync(candidate));

  if (!envPath) {
    throw new Error("Berkas .env.local tidak ditemukan.");
  }

  const text = fs.readFileSync(envPath, "utf8");

  for (const line of text.split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/);
    if (!match) continue;

    const [, key, raw] = match;
    const value = raw.replace(/^["']|["']$/g, "");
    process.env[key] ??= value;
  }
}

function parseArgs(argv) {
  const args = { execute: false, force: false, limit: null, file: null, out: null };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--execute") {
      args.execute = true;
    } else if (arg === "--force") {
      args.force = true;
    } else if (arg === "--file") {
      args.file = argv[++index];
    } else if (arg === "--out") {
      args.out = argv[++index];
    } else if (arg === "--limit") {
      args.limit = Number.parseInt(argv[++index] ?? "", 10);
    } else if (arg === "--help" || arg === "-h") {
      console.log(
        [
          "Pemakaian:",
          "  node scripts/import-siswa-ortu.mjs --file data.json [--out hasil.csv] [--execute] [--force] [--limit N]",
          "",
          "--file     Berkas JSON hasil pemeriksaan daftar siswa.",
          "--out      Berkas CSV kredensial akun baru. Wajib saat --execute.",
          "--execute  Benar-benar membuat akun. Tanpa ini hanya pratinjau.",
          "--force    Izinkan menimpa berkas CSV yang sudah ada.",
          "--limit    Batasi jumlah siswa untuk uji coba.",
        ].join("\n"),
      );
      process.exit(0);
    } else {
      throw new Error(`Argumen tidak dikenal: ${arg}`);
    }
  }

  if (!args.file) {
    throw new Error("Wajib memakai --file.");
  }

  if (args.execute && !args.out) {
    throw new Error("--out wajib dipakai saat --execute agar kredensial tersimpan.");
  }

  if (args.limit !== null && (!Number.isFinite(args.limit) || args.limit < 1)) {
    throw new Error("--limit harus berupa angka positif.");
  }

  return args;
}

function randomIndex(max) {
  return crypto.randomInt(0, max);
}

function pick(chars) {
  return chars[randomIndex(chars.length)];
}

function generatePassword(length = 12) {
  const chars = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SYMBOLS)];

  while (chars.length < length) {
    chars.push(pick(ALL));
  }

  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swap = randomIndex(index + 1);
    [chars[index], chars[swap]] = [chars[swap], chars[index]];
  }

  // Hindari karakter awal yang dibaca Excel sebagai rumus (+, -, =, @).
  if ("+-=@".includes(chars[0])) {
    const safe = UPPER + LOWER + DIGITS;
    const swap = chars.findIndex((char) => safe.includes(char));
    [chars[0], chars[swap]] = [chars[swap], chars[0]];
  }

  return chars.join("");
}

function nullable(value) {
  const text = typeof value === "string" ? value.trim() : "";
  return text && text !== "-" ? text : null;
}

function cleanName(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isPlaceholder(value) {
  return ["", "-", "ayah", "ibu", "wali"].includes(value.toLowerCase());
}

function normalizeKey(value) {
  return cleanName(value).toLowerCase().replace(/\s+/g, " ");
}

function normalizePhone(value) {
  return nullable(value)?.replace(/[^\d+]/g, "") ?? null;
}

function emailLocal(value) {
  return cleanName(value)
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function studentUsername(student) {
  return cleanName(student.nis);
}

function studentEmail(student) {
  return `${emailLocal(student.nis)}@siswa.pkl.local`;
}

function parentUsername(hubungan, nis) {
  return `${hubungan}.${emailLocal(nis)}`;
}

function parentEmail(hubungan, nis) {
  return `${parentUsername(hubungan, nis)}@ortu.pkl.local`;
}

function csvCell(value) {
  const text = value == null ? "" : String(value);

  return `"${text.replace(/"/g, '""')}"`;
}

function writeCsv(file, rows) {
  const header = [
    "peran",
    "nama_lengkap",
    "username",
    "email",
    "password",
    "nis",
    "kelas",
    "hubungan",
    "nama_siswa",
    "status",
    "catatan",
  ];
  const lines = [
    header.map(csvCell).join(","),
    ...rows.map((row) => header.map((key) => csvCell(row[key])).join(",")),
  ];

  fs.writeFileSync(file, `${lines.join("\n")}\n`, "utf8");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(fn, label) {
  let lastError = null;

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const result = await fn();

    if (!result.error) {
      return result;
    }

    lastError = result.error;
    const message = result.error.message?.toLowerCase() ?? "";
    const retryable =
      result.error.status === 429 ||
      message.includes("rate limit") ||
      message.includes("timeout");

    if (!retryable) {
      break;
    }

    await sleep(1200 * attempt);
  }

  throw new Error(`${label}: ${lastError?.message ?? "gagal"}`);
}

function must(result, label) {
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }

  return result.data;
}

loadEnv();

const args = parseArgs(process.argv.slice(2));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi.",
  );
}

const payload = JSON.parse(fs.readFileSync(args.file, "utf8"));
const allStudents = Array.isArray(payload.students)
  ? payload.students
  : Array.isArray(payload)
    ? payload
    : [];

if (!allStudents.length) {
  throw new Error("Berkas tidak berisi daftar students.");
}

const students = args.limit
  ? allStudents.slice(0, args.limit)
  : allStudents;

if (args.execute && fs.existsSync(args.out) && !args.force) {
  throw new Error(
    `Berkas ${args.out} sudah ada. Gunakan --force untuk menimpa.`,
  );
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function listAuthUsers() {
  const users = [];
  let page = 1;

  while (true) {
    const result = await withRetry(
      () => admin.auth.admin.listUsers({ page, perPage: 1000 }),
      "Gagal memuat akun Auth",
    );
    const batch = result.data?.users ?? [];
    users.push(...batch);

    if (batch.length < 1000) {
      break;
    }

    page += 1;
  }

  return users;
}

const [penggunaRows, siswaRows, relasiRows, jurusanRows, authUsers] =
  await Promise.all([
    admin
      .from("pengguna")
      .select("id, username, email, nama_lengkap, telepon, peran"),
    admin.from("siswa").select("id, pengguna_id, nis"),
    admin.from("orang_tua_siswa").select("pengguna_id, siswa_id, hubungan"),
    admin.from("jurusan").select("id, nama, kode"),
    listAuthUsers(),
  ]);

const pengguna = must(penggunaRows, "Gagal memuat pengguna");
const siswaRowsData = must(siswaRows, "Gagal memuat siswa");
const relasi = must(relasiRows, "Gagal memuat relasi orang tua");
const jurusan = must(jurusanRows, "Gagal memuat jurusan");

const penggunaByUsername = new Map(
  (pengguna ?? []).map((row) => [row.username.toLowerCase(), row]),
);
const siswaByNis = new Map((siswaRowsData ?? []).map((row) => [row.nis, row]));
const authByEmail = new Map(
  (authUsers ?? [])
    .filter((user) => user.email)
    .map((user) => [user.email.toLowerCase(), user]),
);
const relasiSet = new Set(
  (relasi ?? []).map((row) => `${row.pengguna_id}|${row.siswa_id}`),
);
const jurusanByKode = new Map(
  (jurusan ?? [])
    .filter((row) => row.kode)
    .map((row) => [row.kode.toUpperCase(), row]),
);

const parentByKey = new Map();
const parentByNamePhone = new Map();
const credentials = [];
const errors = [];
const stats = {
  studentCreated: 0,
  studentExisting: 0,
  parentCreated: 0,
  parentExisting: 0,
  relationCreated: 0,
  relationExisting: 0,
};

function parentKeys(parent, student) {
  const hubungan = parent.hubungan;
  const nama = normalizeKey(parent.nama);
  const phone = normalizePhone(parent.telepon ?? student.telepon) ?? "";
  const nik = nullable(parent.nik);
  const keys = [];

  if (nik) {
    keys.push(`${hubungan}|nik:${nik}`);
  }

  keys.push(`${hubungan}|nama:${nama}|hp:${phone}`);
  return keys;
}

async function ensureJurusan(kode, nama) {
  if (!kode) return null;

  const existing = jurusanByKode.get(kode.toUpperCase());
  if (existing) return existing.id;

  if (!args.execute) {
    return null;
  }

  const result = await admin
    .from("jurusan")
    .insert({ nama, kode })
    .select("id, nama, kode")
    .single();

  if (result.error) {
    throw new Error(`Gagal membuat jurusan ${kode}: ${result.error.message}`);
  }

  jurusanByKode.set(kode.toUpperCase(), result.data);
  return result.data.id;
}

const dkvJurusanId = await ensureJurusan(
  "DKV",
  "Desain Komunikasi Visual",
);

function findJurusanId(student) {
  const kode = nullable(student.jurusan);

  if (!kode) return null;

  if (kode.toUpperCase() === "DKV") {
    return dkvJurusanId;
  }

  return jurusanByKode.get(kode.toUpperCase())?.id ?? null;
}

async function createAuthUser({ email, password, username, nama, peran }) {
  const result = await withRetry(
    () =>
      admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username, nama_lengkap: nama },
        app_metadata: { peran },
      }),
    `Gagal membuat akun ${email}`,
  );

  if (!result.data?.user) {
    throw new Error(`Gagal membuat akun ${email}: pengguna kosong.`);
  }

  authByEmail.set(email.toLowerCase(), result.data.user);
  return result.data.user;
}

async function rollbackAuthUser(userId) {
  await admin.from("pengguna").delete().eq("id", userId);
  await admin.auth.admin.deleteUser(userId).catch(() => undefined);
}

async function processStudent(student) {
  const nama = cleanName(student.nama);
  const nis = cleanName(student.nis);

  if (!nama || !nis) {
    errors.push(`Siswa tanpa nama/NIS: ${JSON.stringify(student)}`);
    return null;
  }

  const existing = siswaByNis.get(nis);

  if (existing) {
    stats.studentExisting += 1;
    return {
      id: existing.id,
      penggunaId: existing.pengguna_id,
      isNew: false,
    };
  }

  const username = studentUsername(student);
  const email = studentEmail(student);
  const existingPengguna = penggunaByUsername.get(username.toLowerCase());

  if (existingPengguna && existingPengguna.peran !== "siswa") {
    throw new Error(
      `Username ${username} sudah dipakai peran ${existingPengguna.peran}.`,
    );
  }

  if (!args.execute) {
    stats.studentCreated += 1;
    return {
      id: `preview-${nis}`,
      penggunaId: null,
      isNew: true,
    };
  }

  let userId = existingPengguna?.id ?? authByEmail.get(email)?.id ?? null;
  let password = null;

  if (!userId) {
    password = generatePassword(12);
    const user = await createAuthUser({
      email,
      password,
      username,
      nama,
      peran: "siswa",
    });
    userId = user.id;
  }

  const penggunaResult = await admin.from("pengguna").upsert(
    {
      id: userId,
      username,
      email,
      nama_lengkap: nama,
      peran: "siswa",
      telepon: nullable(student.telepon),
      aktif: true,
    },
    { onConflict: "id" },
  );

  if (penggunaResult.error) {
    if (password) {
      await rollbackAuthUser(userId);
    }
    throw new Error(`Profil siswa ${nama}: ${penggunaResult.error.message}`);
  }

  const siswaResult = await admin
    .from("siswa")
    .insert({
      pengguna_id: userId,
      nis,
      nisn: nullable(student.nisn),
      kelas: nullable(student.kelas),
      jurusan_id: findJurusanId(student),
      telepon: nullable(student.telepon),
      alamat: nullable(student.alamat),
      tempat_lahir: nullable(student.tempat_lahir),
      tanggal_lahir: nullable(student.tanggal_lahir),
      nama_orangtua: nullable(student.nama_orangtua),
      telepon_orangtua: nullable(student.telepon_orangtua),
      aktif: true,
    })
    .select("id, pengguna_id")
    .single();

  if (siswaResult.error) {
    if (password) {
      await rollbackAuthUser(userId);
    }
    throw new Error(`Data siswa ${nama}: ${siswaResult.error.message}`);
  }

  siswaByNis.set(nis, siswaResult.data);
  stats.studentCreated += 1;
  credentials.push({
    peran: "siswa",
    nama_lengkap: nama,
    username,
    email,
    password: password ?? "",
    nis,
    kelas: nullable(student.kelas) ?? "",
    hubungan: "",
    nama_siswa: nama,
    status: password ? "baru" : "sudah ada",
    catatan: "Login memakai username. Email internal.",
  });

  return {
    id: siswaResult.data.id,
    penggunaId: userId,
    isNew: true,
  };
}

async function processParent(parent, student, siswaId) {
  const hubungan = parent.hubungan;
  const nama = cleanName(parent.nama);

  if (!["ayah", "ibu"].includes(hubungan) || !nama || isPlaceholder(nama)) {
    return;
  }

  const [key, fallbackKey = key] = parentKeys(parent, student);
  let record =
    parentByKey.get(key) ??
    parentByNamePhone.get(fallbackKey) ??
    parentByNamePhone.get(key);

  if (!record && !args.execute) {
    const username = parentUsername(hubungan, student.nis);
    const existing = penggunaByUsername.get(username.toLowerCase());

    if (existing && existing.peran !== "ortu") {
      throw new Error(
        `Username ${username} sudah dipakai peran ${existing.peran}.`,
      );
    }

    if (existing) {
      record = {
        penggunaId: existing.id,
        nama: existing.nama_lengkap ?? nama,
        username,
        email: existing.email,
        password: "",
        children: [],
        isNew: false,
      };
      parentByKey.set(key, record);
      parentByNamePhone.set(fallbackKey, record);
      parentByNamePhone.set(key, record);
    }
  }

  if (!record) {
    if (!args.execute) {
      record = {
        penggunaId: `preview-${hubungan}-${student.nis}`,
        nama,
        username: parentUsername(hubungan, student.nis),
        email: parentEmail(hubungan, student.nis),
        password: "",
        children: [],
        isNew: true,
      };
      parentByKey.set(key, record);
      parentByNamePhone.set(fallbackKey, record);
      parentByNamePhone.set(key, record);
      stats.parentCreated += 1;
    } else {
      const username = parentUsername(hubungan, student.nis);
      const email = parentEmail(hubungan, student.nis);
      const existingPengguna = penggunaByUsername.get(username.toLowerCase());
      let userId = existingPengguna?.id ?? authByEmail.get(email)?.id ?? null;
      let password = null;

      if (userId && existingPengguna && existingPengguna.peran !== "ortu") {
        throw new Error(
          `Username ${username} sudah dipakai peran ${existingPengguna.peran}.`,
        );
      }

      if (!userId) {
        password = generatePassword(12);
        const user = await createAuthUser({
          email,
          password,
          username,
          nama,
          peran: "ortu",
        });
        userId = user.id;
      }

      const penggunaResult = await admin.from("pengguna").upsert(
        {
          id: userId,
          username,
          email,
          nama_lengkap: nama,
          peran: "ortu",
          telepon: normalizePhone(parent.telepon ?? student.telepon),
          aktif: true,
        },
        { onConflict: "id" },
      );

      if (penggunaResult.error) {
        if (password) {
          await rollbackAuthUser(userId);
        }
        throw new Error(
          `Profil orang tua ${nama}: ${penggunaResult.error.message}`,
        );
      }

      record = {
        penggunaId: userId,
        nama,
        username,
        email,
        password: password ?? "",
        children: [],
        isNew: Boolean(password),
      };

      penggunaByUsername.set(username.toLowerCase(), {
        id: userId,
        username,
        email,
        peran: "ortu",
      });
      parentByKey.set(key, record);
      parentByNamePhone.set(fallbackKey, record);
      parentByNamePhone.set(key, record);

      if (password) {
        stats.parentCreated += 1;
      } else {
        stats.parentExisting += 1;
      }
    }
  } else {
    stats.parentExisting += 1;
  }

  if (
    args.execute &&
    record.isNew &&
    !credentials.some((row) => row.username === record.username)
  ) {
    credentials.push({
      peran: "ortu",
      nama_lengkap: record.nama,
      username: record.username,
      email: record.email,
      password: record.password,
      nis: student.nis,
      kelas: "",
      hubungan,
      nama_siswa: student.nama,
      status: "baru",
      catatan: "Login memakai username. Email internal.",
    });
  }

  const relationKey = `${record.penggunaId}|${siswaId}`;
  const alreadyLinked = relasiSet.has(relationKey);

  if (alreadyLinked) {
    stats.relationExisting += 1;
  } else {
    if (args.execute) {
      const relationResult = await admin.from("orang_tua_siswa").insert({
        pengguna_id: record.penggunaId,
        siswa_id: siswaId,
        hubungan,
      });

      if (relationResult.error) {
        throw new Error(
          `Relasi ${nama} ke ${student.nama}: ${relationResult.error.message}`,
        );
      }
    }

    relasiSet.add(relationKey);
    stats.relationCreated += 1;
  }

  if (!record.children.includes(student.nama)) {
    record.children.push(student.nama);
  }
}

for (const student of students) {
  try {
    const siswa = await processStudent(student);

    if (!siswa) continue;

    for (const parent of student.orang_tua ?? []) {
      await processParent(parent, student, siswa.id);
    }
  } catch (error) {
    errors.push(
      `${cleanName(student.nama)} (${cleanName(student.nis)}): ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

for (const record of parentByKey.values()) {
  const index = credentials.findIndex(
    (row) => row.peran === "ortu" && row.username === record.username,
  );

  if (index >= 0) {
    credentials[index].nama_siswa = record.children.join("; ");
  }
}

const order = { siswa: 0, ortu: 1 };
credentials.sort(
  (a, b) =>
    order[a.peran] - order[b.peran] ||
    a.nama_lengkap.localeCompare(b.nama_lengkap, "id"),
);

if (args.out && args.execute && credentials.length) {
  writeCsv(args.out, credentials);
} else if (args.execute && !credentials.length) {
  console.log("\nTidak ada akun baru. Berkas kredensial tidak ditulis.");
}

console.log(
  JSON.stringify(
    {
      mode: args.execute ? "execute" : "preview",
      file: args.file,
      out: args.execute ? args.out : null,
      studentsInFile: allStudents.length,
      studentsProcessed: students.length,
      ...stats,
      parentAccounts: parentByKey.size,
      errors: errors.length,
      credentials: credentials.length,
    },
    null,
    2,
  ),
);

if (errors.length) {
  console.error("\nMasalah yang perlu diperiksa:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
}

if (args.execute && args.out && credentials.length) {
  console.log(`\nKredensial akun baru: ${args.out}`);
}
