/**
 * Import akun guru dari rekap pegawai (XLSX).
 *
 *   node scripts/import-guru-pegawai.mjs \
 *     --file ~/Downloads/Data_Pegawai_SMK-IT_As-Syifa_September_2026.xlsx \
 *     --out ~/Downloads/guru-akun.csv
 *
 * Tanpa --execute hanya menampilkan rencana. Akun yang sudah ada tidak
 * dibuat ulang dan kata sandinya tidak diubah.
 *
 * Format yang didukung: sheet pertama XLSX dengan kolom B = nama lengkap,
 * C = jabatan/unit, data mulai baris 6.
 */
import { execFileSync } from "node:child_process";
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

  if (!envPath) throw new Error("Berkas .env.local tidak ditemukan.");

  const text = fs.readFileSync(envPath, "utf8");

  for (const line of text.split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/);
    if (!match) continue;

    const [, key, raw] = match;
    process.env[key] ??= raw.replace(/^["']|["']$/g, "");
  }
}

function parseArgs(argv) {
  const args = { execute: false, force: false, limit: null, file: null, out: null };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--execute") args.execute = true;
    else if (arg === "--force") args.force = true;
    else if (arg === "--file") args.file = argv[++index];
    else if (arg === "--out") args.out = argv[++index];
    else if (arg === "--limit") args.limit = Number.parseInt(argv[++index] ?? "", 10);
    else if (arg === "--help" || arg === "-h") {
      console.log(
        [
          "Pemakaian:",
          "  node scripts/import-guru-pegawai.mjs --file data.xlsx [--out hasil.csv] [--execute] [--force] [--limit N]",
          "",
          "--file     Berkas XLSX rekap pegawai.",
          "--out      Berkas CSV kredensial akun baru. Wajib saat --execute.",
          "--execute  Benar-benar membuat akun. Tanpa ini hanya pratinjau.",
          "--force    Izinkan menimpa berkas CSV yang sudah ada.",
          "--limit    Batasi jumlah baris untuk uji coba.",
        ].join("\n"),
      );
      process.exit(0);
    } else {
      throw new Error(`Argumen tidak dikenal: ${arg}`);
    }
  }

  if (!args.file) throw new Error("Wajib memakai --file.");
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

  while (chars.length < length) chars.push(pick(ALL));

  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swap = randomIndex(index + 1);
    [chars[index], chars[swap]] = [chars[swap], chars[index]];
  }

  return chars.join("");
}

function xmlText(value) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function readXlsxRows(file) {
  const sharedXml = execFileSync("unzip", ["-p", file, "xl/sharedStrings.xml"], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  const shared = Array.from(sharedXml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)).map(
    (match) =>
      Array.from(match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g))
        .map((text) => xmlText(text[1]))
        .join(""),
  );
  const sheetXml = execFileSync("unzip", ["-p", file, "xl/worksheets/sheet1.xml"], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  const rows = [];

  for (const rowMatch of sheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells = {};

    for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = cellMatch[1];
      const body = cellMatch[2];
      const ref = attrs.match(/\br="([A-Z]+)\d+"/);
      const type = attrs.match(/\bt="([^"]+)"/);
      if (!ref) continue;

      const raw = body.match(/<v\b[^>]*>([\s\S]*?)<\/v>/);
      const inline = body.match(/<is\b[^>]*>([\s\S]*?)<\/is>/);
      let value = "";

      if (type?.[1] === "s" && raw) {
        value = shared[Number(raw[1])] ?? "";
      } else if (type?.[1] === "inlineStr" && inline) {
        value = Array.from(inline[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g))
          .map((text) => xmlText(text[1]))
          .join("");
      } else if (raw) {
        value = xmlText(raw[1]);
      }

      cells[ref[1]] = value.replace(/\s+/g, " ").trim();
    }

    rows.push(cells);
  }

  return rows;
}

function cleanName(value) {
  return value.replace(/\s+/g, " ").trim();
}

function usernameFor(name) {
  const baseName = cleanName(name).split(",")[0].trim();
  const tanpaGelar = baseName
    .replace(
      /\b(S\.?Pd|S\.?E|S\.?Kom|S\.?T|S\.?S|S\.?Sos|S\.?Ag|M\.?Ag|S\.?Pd\.?I|S\.?Ars\.?L|Gr|CT|C\.?NFT)\b\.?/gi,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();

  return (tanpaGelar || baseName)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .split(".")
    .filter(Boolean)
    .slice(0, 4)
    .join(".");
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function writeCsv(file, rows) {
  const header = ["nama_lengkap", "username", "email", "password", "jabatan", "status"];
  const lines = [
    header.join(","),
    ...rows.map((row) => header.map((key) => csvCell(row[key])).join(",")),
  ];

  fs.writeFileSync(file, `${lines.join("\n")}\n`, "utf8");
}

loadEnv();

const args = parseArgs(process.argv.slice(2));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi.");
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const rows = readXlsxRows(path.resolve(args.file))
  .filter((row) => row.B && row.C)
  .map((row) => ({
    nama: cleanName(row.B),
    jabatan: cleanName(row.C),
  }))
  .filter(
    (row) =>
      row.nama &&
      row.jabatan &&
      !/^total\b/i.test(row.nama) &&
      !/^nama\b/i.test(row.nama),
  )
  .slice(0, args.limit ?? undefined);

if (!rows.length) {
  throw new Error("Tidak ada baris pegawai yang bisa dibaca.");
}

const { data: existingUsers, error: userError } = await admin
  .from("pengguna")
  .select("id, username, nama_lengkap, email, peran")
  .eq("peran", "guru");

if (userError) throw new Error(`Gagal membaca pengguna: ${userError.message}`);

const byUsername = new Map(
  (existingUsers ?? []).map((user) => [user.username.toLowerCase(), user]),
);
const byName = new Map(
  (existingUsers ?? []).map((user) => [user.nama_lengkap.toLowerCase(), user]),
);
const credentials = [];
let created = 0;
let existing = 0;

for (const row of rows) {
  const base = usernameFor(row.nama);
  let username = base || "guru";
  let suffix = 2;

  while (byUsername.has(username.toLowerCase())) {
    const account = byUsername.get(username.toLowerCase());
    if (account && account.nama_lengkap.toLowerCase() === row.nama.toLowerCase()) break;
    username = `${base}${suffix}`;
    suffix += 1;
  }

  let account = byUsername.get(username.toLowerCase()) ?? byName.get(row.nama.toLowerCase());

  if (!args.execute) {
    console.log(`${row.nama} → @${username} · ${row.jabatan}`);
    continue;
  }

  let password = null;

  if (!account) {
    password = generatePassword(12);
    const createdUser = await admin.auth.admin.createUser({
      email: `${username}@guru.pkl.local`,
      password,
      email_confirm: true,
      user_metadata: { username, nama_lengkap: row.nama },
      app_metadata: { peran: "guru" },
    });

    if (createdUser.error || !createdUser.data.user) {
      throw new Error(`Gagal membuat akun ${row.nama}: ${createdUser.error?.message ?? "kosong"}`);
    }

    account = {
      id: createdUser.data.user.id,
      username,
      nama_lengkap: row.nama,
      email: `${username}@guru.pkl.local`,
      peran: "guru",
    };
    byUsername.set(username.toLowerCase(), account);
    byName.set(row.nama.toLowerCase(), account);
    created += 1;
    credentials.push({
      nama_lengkap: row.nama,
      username,
      email: account.email,
      password,
      jabatan: row.jabatan,
      status: "baru",
    });
  } else {
    existing += 1;
  }

  const penggunaResult = await admin.from("pengguna").upsert(
    {
      id: account.id,
      username: account.username,
      email: account.email,
      nama_lengkap: row.nama,
      peran: "guru",
      aktif: true,
    },
    { onConflict: "id" },
  );

  if (penggunaResult.error) {
    throw new Error(`Gagal menyimpan profil ${row.nama}: ${penggunaResult.error.message}`);
  }

  const guruResult = await admin.from("guru").upsert(
    {
      pengguna_id: account.id,
      jabatan: row.jabatan || null,
    },
    { onConflict: "pengguna_id" },
  );

  if (guruResult.error) {
    throw new Error(`Gagal menyimpan data guru ${row.nama}: ${guruResult.error.message}`);
  }
}

if (args.execute) {
  if (credentials.length) {
    if (fs.existsSync(args.out) && !args.force) {
      throw new Error(`Berkas ${args.out} sudah ada. Gunakan --force untuk menimpa.`);
    }

    writeCsv(args.out, credentials);
    console.log(`Kredensial akun baru ditulis ke ${args.out}`);
  } else {
    console.log("Semua akun sudah ada; tidak ada kredensial baru.");
  }

  console.log(`Selesai: ${created} akun baru, ${existing} akun lama diperbarui.`);
} else {
  console.log(`Pratinjau ${rows.length} pegawai. Tambahkan --execute untuk membuat akun.`);
}
