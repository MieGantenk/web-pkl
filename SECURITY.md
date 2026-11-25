# Keamanan API

## CSRF untuk API mutasi

Proteksi CSRF ini hanya dipakai oleh **API route handler** dengan method
`POST`, `PUT`, `PATCH`, atau `DELETE`. Server Actions dan form yang sudah ada
tidak diubah karena Next.js sudah memvalidasi origin Server Actions.

### Cookie

`proxy.ts` membuat cookie `pkl_csrf` otomatis saat halaman aplikasi dimuat:

- Nilai: 32 byte acak dalam format hex (64 karakter).
- `HttpOnly: false` agar bisa dibaca client.
- `SameSite: Lax`.
- `Path: /`.
- `Secure: true` hanya di production.
- Berlaku 30 hari.

Cookie dibuat saat navigasi halaman, bukan saat request API. Jika API dipanggil
tanpa pernah membuka halaman aplikasi, request akan ditolak `403`.

### Route handler

Gunakan `verifyCsrfAndOrigin()` di awal route handler mutasi:

```ts
import { verifyCsrfAndOrigin } from "@/lib/security/verify-csrf";

export async function POST(request: Request) {
  const csrf = verifyCsrfAndOrigin(request);

  if (!csrf.ok) {
    return Response.json(
      { error: csrf.message },
      { status: csrf.status },
    );
  }

  // Lanjutkan operasi mutasi.
  return Response.json({ ok: true });
}
```

Helper akan memeriksa:

1. `Origin` atau `Referer` cocok dengan `Host` request.
2. Cookie `pkl_csrf` ada.
3. Header `x-csrf-token` ada.
4. Kedua token sama menggunakan `crypto.timingSafeEqual`.

Route handler mutasi harus memakai runtime Node.js (default Next.js), karena
helper menggunakan `node:crypto`.

### Client

Gunakan `fetchWithCsrf()` untuk request mutasi dari browser:

```ts
import { fetchWithCsrf } from "@/lib/security/csrf-client";

await fetchWithCsrf("/api/contoh", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ nama: "Contoh" }),
});
```

Helper membaca cookie `pkl_csrf`, menambahkan header `x-csrf-token`, dan memakai
`credentials: "same-origin"`.

### Route GET

Route `GET` yang sudah ada tidak terpengaruh dan tidak perlu token CSRF:

- `/api/surat/[id]/pdf`
- `/api/notifikasi`
- `/api/guru/jurnal/[id]/export`

## Security headers

`next.config.ts` menambahkan header berikut untuk semua route:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`

## Catatan

- Jangan menambahkan token CSRF ke Server Actions; proteksi bawaan Next.js
  menangani origin dan action ID.
- Jangan memakai helper ini untuk route `GET`.
- Jika nanti ada API mutasi, tambahkan pemanggilan helper di setiap route
  tersebut.
