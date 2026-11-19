# ANIMATION.md — Gerak Web PKL

> Animasi di sini bukan hiasan. Setiap gerakan harus menjawab salah satu dari tiga pertanyaan:
> **"Apa yang berubah?", "Dari mana saya datang?", "Apakah aksi saya berhasil?"**
> Kalau tidak bisa menjawab salah satunya, animasi itu tidak dipakai.

Versi 1.0 · 16 November 2026
Acuan token: [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) §9
Arah desain: [`DESIGN.md`](./DESIGN.md) §7
Stack: CSS transition + `motion/react` (hanya untuk 5 kasus)

---

## 0. Prinsip: gerak yang menjelaskan

Web PKL dipakai berulang setiap hari oleh siswa, guru, dan admin. Animasi yang lucu akan melelahkan pada hari kedua. Karena itu arahnya:

- **Tenang.** Durasi pendek, easing lembut, tanpa bounce.
- **Fungsional.** Gerak muncul saat status berubah, panel terbuka, atau data selesai dimuat.
- **Sekali.** Momen besar hanya terjadi sekali, bukan berulang.
- **Tidak menghalangi.** Konten sudah terbaca sebelum animasi selesai.
- **Bisa dimatikan.** `prefers-reduced-motion` selalu dihormati.

Referensi rasa: aplikasi seperti Linear, Stripe Dashboard, dan Vercel — bukan situs award, bukan template SB Admin.

---

## 1. Sepuluh aturan emas

1. **Satu momen per halaman.** Maksimal satu animasi yang benar-benar diingat; sisanya umpan balik kecil.
2. **90% layar tidak bergerak.** Hanya elemen yang berubah status atau yang disentuh yang bergerak.
3. **120–260 ms** untuk interaksi. Hanya count-up (900 ms), progress (600 ms), dan timeline (320 ms) yang lebih lama.
4. **Hanya `transform`, `opacity`, dan warna.** Jangan animasi `width`, `height`, `top`, `left`, `margin`, `box-shadow`.
5. **Tanpa bounce, overshoot, elastic, atau wobble.** Easing selalu ease-out.
6. **Tanpa animasi saat scroll.** Tidak ada fade-in, parallax, stagger, atau reveal.
7. **Tanpa loop.** Satu-satunya loop adalah skeleton saat memuat dan progress yang benar-benar berjalan.
8. **Sukses hanya setelah server menjawab.** Jangan menampilkan cap/centang optimistis.
9. **Konten terbaca tanpa animasi.** Tanpa JS dan reduced motion, halaman tetap utuh.
10. **Satu sistem.** Durasi, easing, dan jarak hanya dari token di §2.
11. **Ganti tema** memakai transisi warna 320 ms + ikon 300 ms; hanya saat tombol tema ditekan, bukan pada hover.

---

## 2. Token gerak

| Token | Nilai | Dipakai untuk |
|---|---|---|
| `--m-press` | 90 ms | Tombol ditekan |
| `--m-fast` | 120 ms | Hover keluar, tutup panel |
| `--m-check` | 160 ms | Centang checkbox |
| `--m-base` | 180 ms | Hover masuk, page enter, toast |
| `--m-panel` | 200 ms | Modal, dropdown |
| `--m-slide` | 240 ms | Indicator sidebar, drawer |
| `--m-stamp` | 260 ms | Cap verifikasi |
| `--m-upload` | 300 ms | Centang unggah |
| `--m-timeline` | 320 ms | Garis waktu surat |
| `--m-progress` | 600 ms | Progress ring/bar |
| `--m-count` | 900 ms | Count-up dashboard |

Easing:

| Token | Nilai |
|---|---|
| `--ease-out` | `cubic-bezier(.2, .8, .2, 1)` |
| `--ease-enter` | `cubic-bezier(.22, 1, .36, 1)` |

Jarak:

| Gerak | Jarak |
|---|---|
| Card lift | 2 px |
| Button hover | 1 px naik |
| Button press | 1 px turun + scale 0,985 |
| Page enter | 8 px naik |
| Modal enter | 6 px naik |
| Toast enter | 8 px naik |
| Dropdown | 4 px turun |
| Arrow | 3 px kanan |
| Photo zoom | 1,02–1,03 |
| Stamp | scale 1,12→1, rotate -8°→-6° |

---

## 3. Tiga lapis gerak

### Lapis 1 — Masuk halaman
Sekali per navigasi. Fade 0→1 + naik 8 px, 180 ms. Tidak ada exit animation (jangan menunda navigasi).

### Lapis 2 — Perubahan status
Badge berganti, cap muncul, progress ring terisi, timeline maju. Ini lapis yang memberi nilai desain.

### Lapis 3 — Umpan balik
Hover, tekan, fokus, unggah, toast, validasi. Kecil, cepat, konsisten.

Tidak ada lapis keempat. Tidak ada animasi dekoratif yang berjalan sendiri.

---

## 4. Tujuh momen khas

### 4.1 Cap verifikasi — momen utama

**Di mana:** halaman verifikasi jurnal, saat guru/instruktur menekan "Setujui".
**Kenapa:** ini momen paling bermakna — pekerjaan siswa dinyatakan sah.
**Cara:** setelah server sukses, cap 96 px muncul dengan scale 1,12→1, rotasi -8°→-6°, opacity 0→1, 260 ms. Badge status berganti setelah cap selesai. Toast muncul 120 ms kemudian.
**Jangan:** cap muncul sebelum server menjawab; cap berkedip; suara; confetti.

### 4.2 Garis waktu surat

**Di mana:** detail surat / pengajuan PKL.
**Kenapa:** menunjukkan posisi surat tanpa membaca tabel.
**Cara:** garis vertikal `scaleY(0)→1`, 320 ms, `transform-origin: top`. Titik aktif `scale(.8)→1` + opacity, 200 ms, delay 120 ms. Titik lain statis.
**Jangan:** titik berdenyut terus; garis berulang; animasi saat scroll.

### 4.3 Cincin mutaba'ah

**Di mana:** beranda siswa dan halaman mutaba'ah.
**Kenapa:** progres mingguan lebih cepat dipahami sebagai cincin daripada angka.
**Cara:** `stroke-dashoffset` dari penuh ke nilai, 600 ms, sekali saat mount. Angka di tengah ikut menghitung (opsional, 600 ms).
**Jangan:** ring berputar; ring berulang; ring beranimasi setiap kali kembali ke halaman.

### 4.4 Angka ringkasan

**Di mana:** dashboard staf (4 kartu statistik).
**Kenapa:** memberi rasa "data baru termuat" satu kali.
**Cara:** count-up 900 ms, ease-enter, sekali per sesi (`sessionStorage`). Lebar angka sudah dicadangkan agar tidak menggeser layout. Nilai akhir ada di HTML untuk no-JS.
**Jangan:** count-up di tabel, di setiap refresh, atau saat scroll.

### 4.5 Indikator sidebar

**Di mana:** semua halaman dengan sidebar.
**Kenapa:** menjelaskan perpindahan halaman.
**Cara:** pill aktif meluncur dengan `layoutId`, 240 ms, ease-out. Teks berubah warna 120 ms.
**Jangan:** pill memantul; pill berkedip; dua indikator aktif.

### 4.6 Masuk halaman

**Di mana:** semua halaman.
**Kenapa:** memberi orientasi halus setelah navigasi.
**Cara:** `template.tsx`: opacity 0→1, y 8→0, 180 ms. Hanya elemen konten, bukan shell.
**Jangan:** animasi exit; wipe layar; delay data.

### 4.7 Unggah berkas

**Di mana:** form jurnal, surat balasan, surat izin.
**Kenapa:** memberi kepastian file sedang diproses.
**Cara:** dropzone border berubah 120 ms; preview fade 180 ms; saat selesai, centang digambar 300 ms. Kalau progress tidak tersedia, tampilkan spinner 16 px + "Mengunggah…" — **jangan memalsukan progress**.
**Jangan:** progress palsu yang berhenti di 90%; upload spinner berputar selamanya tanpa pesan.

---

## 5. Spesifikasi per komponen

### 5.1 Tombol

| State | Gerak | Durasi |
|---|---|---|
| Hover | latar 14% lebih gelap, naik 1 px | 180 ms masuk / 120 ms keluar |
| Press | turun 1 px, scale 0,985 | 90 ms |
| Focus | ring 2 px, tanpa transisi | 0 ms |
| Disabled | tidak bergerak | — |
| Loading | spinner 16 px, teks tetap | 1 detik/putaran |

Hanya untuk `(hover: hover) and (pointer: fine)`. Di HP tidak ada hover.

```css
.btn {
  transition:
    background-color var(--m-fast) var(--ease-out),
    border-color var(--m-fast) var(--ease-out),
    transform var(--m-base) var(--ease-out);
}
.btn:hover { transform: translateY(-1px); }
.btn:active { transform: translateY(1px) scale(.985); transition-duration: var(--m-press); }
@media (hover: none) { .btn:hover { transform: none; } }
```

### 5.2 Link

- Link dalam teks: garis bawah digambar kiri→kanan 180 ms; keluar 120 ms.
- Link navigasi: teks menguat + garis 1 px muncul 4 px di bawah, 180 ms masuk / 120 ms keluar.
- Jangan memakai warna saja sebagai penanda link.

### 5.3 Card yang bisa diklik

- Hover: naik 2 px, border `border-strong`, shadow-xs tetap.
- Keluar: 120 ms.
- Tidak ada tilt, scale, glow, atau cursor follower.
- Card yang tidak bisa diklik: tidak bergerak.

### 5.4 Input & form field

- Fokus: border `brand-500` + ring 3 px `brand-100`, 120 ms.
- Error: border `danger` muncul 120 ms; **tidak ada shake**.
- Helper/error: fade 120 ms, tanpa menggeser field (ruang sudah dicadangkan).
- Label tidak bergerak (tidak ada floating label).
- Checkbox: centang digambar 160 ms; kotak berubah warna 120 ms.
- Switch: knob bergeser 180 ms, tanpa memantul.

### 5.5 Tabel

- Baris hover: latar `brand-50`, 120 ms.
- Aksi baris: opacity 0→1, 120 ms, hanya saat hover/focus; di HP selalu terlihat.
- Sorting: ikon berputar 180 ms.
- Baris baru setelah simpan: fade 180 ms, tanpa stagger.
- Tidak ada animasi saat filter berubah; hasil langsung tampil. Kalau loading > 300 ms, skeleton.
- Header sticky tidak beranimasi.

### 5.6 Tab / segmented control

- Indikator meluncur 240 ms (`layoutId`).
- Panel berganti dengan fade 160 ms; tinggi panel tetap.
- Jangan memakai tab untuk navigasi halaman.

### 5.7 Modal

- Backdrop fade 180 ms.
- Panel: opacity 0→1, scale 0,98→1, y 6→0, 200 ms.
- Tutup: 120 ms.
- Fokus masuk ke elemen pertama; Esc menutup; fokus kembali ke pemicu.
- Tidak ada bounce.

### 5.8 Drawer / bottom sheet

- Desktop: slide dari kanan 240 ms.
- HP: slide dari bawah 240 ms.
- Backdrop fade 180 ms.
- Tutup 200 ms.
- Tidak ada spring.

### 5.9 Toast

- Masuk: opacity 0→1, y 8→0, 180 ms.
- Keluar: 120 ms.
- Auto-dismiss 4 detik; pause saat hover; maksimal 3 toast.
- Ikon status statis; tidak berdenyut.
- Gunakan Sonner; jangan menambah animasi kedua di dalam toast.

### 5.10 Dropdown / popover

- Fade + turun 4 px, 120 ms.
- Tutup 120 ms.
- Tidak ada scale besar.

### 5.11 Tooltip

- Muncul setelah 300 ms hover; fade 120 ms; hilang 120 ms.
- Hanya untuk ikon/aksi singkat.

### 5.12 Skeleton

- Pulse opacity 0,5→1, 1,2 detik, **hanya saat memuat**.
- Bentuk mengikuti konten (judul, baris, tombol).
- Berhenti begitu data tampil.
- Reduced motion: static.

### 5.13 Status badge

- Saat status berubah: badge lama fade out 120 ms, badge baru fade in + scale 0,96→1, 160 ms.
- Tidak ada warna berkedip.
- Teks + ikon selalu ada.

### 5.14 Pagination

- Tidak ada animasi. Halaman aktif langsung berubah.
- Fokus tetap terlihat.

### 5.15 Empty state

- Tidak ada animasi loop.
- Ikon statis; teks dan tombol langsung tampil.
- Kalau baru muncul setelah data kosong, fade 120 ms.

### 5.16 Sidebar

- Item hover: latar 120 ms.
- Item aktif: pill meluncur 240 ms; teks 120 ms.
- Collapse: label fade 120 ms; lebar berubah **instan** (tidak dianimasikan) agar tidak janky.
- Drawer mobile: slide 240 ms.

### 5.17 Login

- Form fields: fade + naik 12 px, 180 ms, stagger 40 ms, hanya saat mount.
- Panel brand statis (tidak ada gerakan).
- Error login: fade 120 ms; tidak shake.
- Tombol loading: spinner 16 px.

### 5.18 Print

- Tidak ada animasi sama sekali.
- `@media print` mematikan transition/transform.
- Pratinjau surat tampil langsung.

### 5.19 Question builder (mutaba'ah)

- Tambah/hapus pertanyaan: fade 120 ms; tanpa animasi height.
- Pindah urutan: tombol naik/turun; baris diberi highlight 180 ms, bukan slide.
- Ganti tipe: panel opsi fade 120 ms.
- Pratinjau: fade 180 ms.
- Tidak ada drag-and-drop library.
- Tidak ada animasi saat mengetik pertanyaan.

---

## 6. Koreografi per halaman

| Halaman | Masuk | Momen khas | Umpan balik |
|---|---|---|---|
| Login | Form stagger 40 ms, 180 ms | — | Tombol press, error fade |
| Ringkasan staf | Fade + 8 px, 180 ms | Count-up 900 ms sekali | Card hover 2 px |
| Daftar/table | Fade + 8 px | — | Row hover, drawer filter 240 ms |
| Detail siswa | Fade + 8 px | Timeline 320 ms | Tab indicator 240 ms |
| Form jurnal | Fade + 8 px | Centang unggah 300 ms | Upload, validasi |
| Tugas | Fade + 8 px | Check draw 160 ms | Tombol selesai, toast |
| Mutaba'ah admin | Fade + 8 px | Tab indicator 240 ms | Reorder baris 180 ms |
| Verifikasi | Fade + 8 px | **Cap 260 ms** | Tombol press, toast |
| Beranda siswa | Fade + 8 px | Ring 600 ms | Check draw 160 ms |
| Mutaba'ah | Fade + 8 px | Ring 600 ms | Check draw 160 ms |
| Surat | Fade + 8 px | Preview fade 200 ms | Tombol press |
| Navigasi | — | Indicator 240 ms | Hover 120 ms |

Aturan: maksimal **dua** hal bergerak bersamaan. Jangan menampilkan count-up dan cap di halaman yang sama.

---

## 7. Reduced motion

Tiga lapis perlindungan:

1. `MotionConfig reducedMotion="user"` di root.
2. Hook `useReducedMotion()` untuk count-up, stamp, ring, dan page transition.
3. CSS global:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Perilaku reduced motion:

| Elemen | Perilaku |
|---|---|
| Page enter | langsung tampil |
| Count-up | langsung angka akhir |
| Stamp | langsung tampil |
| Ring | langsung penuh |
| Timeline | langsung penuh |
| Modal/drawer | langsung tampil |
| Toast | fade singkat atau langsung |
| Hover | hanya perubahan warna |
| Skeleton | static |

Konten tidak boleh tersembunyi karena animasi dimatikan.

---

## 8. Implementasi Next.js

### 8.1 Prinsip implementasi

- **CSS dulu.** Hover, focus, press, row hover, input, badge — CSS transition.
- **`motion/react` hanya untuk 5 kasus:** page transition, sidebar indicator, modal/drawer presence, count-up, stamp.
- Jangan memakai `motion` di server component.
- Jangan memakai Lottie, GSAP, ScrollTrigger, Lenis, atau smooth-scroll library.
- Jangan memakai `framer-motion` lama; gunakan paket `motion` dan import dari `motion/react`.

### 8.2 Root

```tsx
// app/providers.tsx
"use client";
import { MotionConfig } from "motion/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
```

### 8.3 Page transition

```tsx
// app/(app)/template.tsx
"use client";
import { motion, useReducedMotion } from "motion/react";

export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

### 8.4 Sidebar indicator

```tsx
{items.map((item) => {
  const active = pathname === item.href;
  return (
    <Link key={item.href} href={item.href} className="relative flex h-11 items-center gap-3 rounded-lg px-3">
      {active && (
        <motion.span
          layoutId="nav-active"
          className="absolute inset-0 rounded-lg bg-sidebar-active"
          transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
        />
      )}
      <Icon className="relative z-10 size-5" />
      <span className="relative z-10">{item.label}</span>
    </Link>
  );
})}
```

### 8.5 Count-up

```tsx
"use client";
import { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "motion/react";

export function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!ref.current) return;
    if (reduce) {
      ref.current.textContent = value.toLocaleString("id-ID");
      return;
    }
    const controls = animate(0, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = Math.round(v).toLocaleString("id-ID");
      },
    });
    return () => controls.stop();
  }, [value, reduce]);

  return (
    <span ref={ref} className="tabular-nums">
      {value.toLocaleString("id-ID")}
    </span>
  );
}
```

Catatan: animasi hanya saat mount pertama; jangan ulang saat refetch. Simpan flag di `sessionStorage` jika perlu.

### 8.6 Cap verifikasi

```tsx
"use client";
import { motion, useReducedMotion } from "motion/react";

export function VerificationStamp({ name, date }: { name: string; date: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 1.12, rotate: -8 }}
      animate={{ opacity: 1, scale: 1, rotate: -6 }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
      className="..."
    >
      <span>TERVERIFIKASI</span>
      <span>{name}</span>
      <span>{date}</span>
    </motion.div>
  );
}
```

Hanya render komponen ini **setelah** respons server sukses.

### 8.7 Ring mutaba'ah

```tsx
const C = 2 * Math.PI * 30; // r=30
<circle
  cx="36" cy="36" r="30"
  fill="none"
  stroke="var(--color-brand-100)"
  strokeWidth="8"
/>
<circle
  cx="36" cy="36" r="30"
  fill="none"
  stroke="var(--color-brand-500)"
  strokeWidth="8"
  strokeLinecap="round"
  strokeDasharray={C}
  strokeDashoffset={C * (1 - progress)}
  style={{ transition: "stroke-dashoffset 600ms var(--ease-out)" }}
  transform="rotate(-90 36 36)"
/>
```

Reduced motion: set `transition: none`.

### 8.8 Checkbox / centang

```css
.check-path {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  transition: stroke-dashoffset var(--m-check) var(--ease-out);
}
[data-checked="true"] .check-path { stroke-dashoffset: 0; }
```

### 8.9 Timeline

```css
.timeline-line {
  transform: scaleY(0);
  transform-origin: top;
  transition: transform var(--m-timeline) var(--ease-out);
}
[data-complete="true"] .timeline-line { transform: scaleY(1); }
```

### 8.10 Upload

- Gunakan `browser-image-compression` sebelum upload (foto jurnal).
- Progress nyata: XHR ke Supabase signed upload URL. Kalau tidak tersedia, spinner + "Mengunggah…".
- Jangan memalsukan progress.
- Setelah sukses: centang 300 ms + preview tetap.

### 8.11 Toast

- Sonner; `position="bottom-right"` desktop, `top-center` HP.
- `duration={4000}`, `closeButton`.
- Styling memakai token; jangan menambah animasi kedua.

---

## 9. Performa

- Hanya `transform` dan `opacity` untuk animasi; warna untuk hover.
- Jangan animasi `box-shadow`; ganti border/warna.
- `will-change` hanya selama animasi, lalu hapus.
- Jangan membaca layout (`getBoundingClientRect`) di dalam loop animasi.
- Jangan memakai `setInterval` untuk animasi; gunakan CSS atau `motion`.
- Animasi hanya di client component yang kecil; jangan menjadikan seluruh halaman client component.
- Uji di CPU 4× throttle; animasi harus tetap 60 fps.
- Tidak ada layout shift (CLS < 0,1).

---

## 10. Pengujian

- [ ] Chrome DevTools → Rendering → `prefers-reduced-motion: reduce`; tidak ada konten hilang.
- [ ] Matikan JavaScript; halaman tetap terbaca dan angka final tampil.
- [ ] 390, 768, 1024, 1440 px; tidak ada animasi yang menyebabkan overflow.
- [ ] Keyboard: fokus terlihat, tidak ada animasi yang menutupi fokus.
- [ ] Tidak ada animasi saat scroll (kecuali tidak ada sama sekali).
- [ ] Tidak ada loop selain skeleton/progress nyata.
- [ ] Tidak ada animasi di `@media print`.
- [ ] Count-up tidak berulang saat back/refresh.
- [ ] Cap hanya muncul setelah server sukses.
- [ ] Toast tidak menumpuk lebih dari 3.
- [ ] CPU 4× throttle tetap halus.
- [ ] `MotionConfig reducedMotion="user"` aktif.
- [ ] Semua durasi dari token; tidak ada angka ajaib.

---

## 11. Anti-pattern (jangan)

- ❌ Card/row fade-in saat scroll.
- ❌ Parallax, scroll-jacking, smooth-scroll library.
- ❌ Bounce, elastic, overshoot, wobble.
- ❌ Confetti, emoji berjatuhan, partikel.
- ❌ Tilt 3D, card mengikuti kursor, magnetic button.
- ❌ Gradient bergerak, glow, neon, shimmer terang.
- ❌ Marquee, carousel otomatis, tab otomatis.
- ❌ Teks mengetik, scramble, angka berputar terus.
- ❌ Ikon berdenyut tanpa status nyata.
- ❌ Suara atau haptic.
- ❌ Animasi sebelum server sukses.
- ❌ Animasi yang menutupi konten atau menunda baca.
- ❌ Dua animasi besar dalam satu layar.
- ❌ Animasi `width/height/top/left/margin`.
- ❌ Durasi > 400 ms untuk interaksi.
- ❌ Loop tanpa akhir selain loading/progress.

---

## 12. Anggaran gerak per layar

| Lapis | Maksimum |
|---|---|
| Masuk halaman | 1 |
| Momen khas | 1 |
| Hover/press | Semua elemen interaktif, tetapi hanya properti murah |
| Loop | 0 (kecuali skeleton/progress nyata) |
| Animasi bersamaan | 2 |
| Durasi interaksi | ≤ 260 ms |
| Durasi momen | ≤ 900 ms (count-up) |

Kalau sebuah halaman ingin menambahkan animasi baru, hapus salah satu yang lama. Jangan menumpuk.

---

## 13. Checklist penerimaan animasi

- [ ] Setiap animasi punya alasan (status, orientasi, atau umpan balik).
- [ ] Hanya token dari §2.
- [ ] Hanya `transform`, `opacity`, warna.
- [ ] Tidak ada bounce/overshoot.
- [ ] Tidak ada animasi scroll.
- [ ] Tidak ada loop.
- [ ] Reduced motion aman.
- [ ] Tanpa JS tetap terbaca.
- [ ] Cap/centang hanya setelah server sukses.
- [ ] Tidak ada animasi di print.
- [ ] Diuji di 390/768/1024/1440.
- [ ] CPU 4× tetap 60 fps.
- [ ] Tidak ada layout shift.
- [ ] Semua halaman punya maksimal satu momen khas.

---

## 14. Hubungan dengan dokumen lain

- [`PRD.md`](./PRD.md) — fitur, role, status, acceptance.
- [`ERD.dbml`](./ERD.dbml) — tabel, enum, relasi.
- [`DESIGN.md`](./DESIGN.md) — alasan dan arah gerak.
- [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) — token, komponen, aksesibilitas.
- [`LAYOUT.md`](./LAYOUT.md) — susunan halaman dan koreografi per halaman.
- [`TECH_STACK.md`](./TECH_STACK.md) — pustaka animasi yang dipakai.
- [`AGENTS.md`](./AGENTS.md) — aturan kerja agent.

Aturan: kalau animasi baru tidak masuk salah satu lapis di §3, jangan tambahkan.
