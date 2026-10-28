# Portfolio — React, Vite, PostgreSQL

Portofolio ini memakai React, TypeScript, Vite, dan API Node.js. Data admin disimpan di PostgreSQL; server aplikasi dan database bisa dijalankan bersama lewat Docker Compose.

## Menjalankan lokal

1. Salin `.env.example` menjadi `.env`, lalu isi `DB_PASSWORD`, `JWT_SECRET`, `ADMIN_EMAIL`, dan `ADMIN_PASSWORD` dengan nilai unik. Password admin minimal 12 karakter dan `JWT_SECRET` minimal 32 karakter.
2. Nyalakan API dan PostgreSQL:
   ```bash
   docker compose up -d --build
   ```
3. Isi database baru dengan contoh proyek, sertifikasi, profil, About, dan Skills:
   ```bash
   npm run seed:postgres
   ```
   Perintah ini hanya menambahkan data bawaan bila tabel terkait masih kosong; data yang sudah ada tidak ditimpa.
4. Jalankan Vite untuk pengembangan:
   ```bash
   npm install
   npm run dev
   ```
5. Buka `http://localhost:5173`. Halaman admin ada di `http://localhost:5173/admin/login`.

API tersedia di `http://localhost:3001`; PostgreSQL hanya dipublikasikan ke komputer lokal di port `5433`. Saat database masih kosong, server otomatis membuat akun owner dari `ADMIN_EMAIL` dan `ADMIN_PASSWORD`. Tabel dibuat otomatis saat API mulai berjalan.

## Deploy dengan Docker

Di server yang sudah memasang Docker Compose:

1. Isi `.env` dengan secret produksi yang kuat dan unik.
2. Pasang reverse proxy HTTPS di depan port `3001`, set `COOKIE_SECURE=true` di `.env` (dan `TRUST_PROXY=1` bila memakai satu reverse proxy tepercaya), lalu jalankan ulang container.
3. Jalankan `docker compose up -d --build`.

Jangan publikasikan port PostgreSQL ke internet atau commit `.env`. Volume `postgres_data` menyimpan database dan `portfolio_uploads` menyimpan gambar yang diunggah. `docker compose down` mempertahankan volume; **jangan** gunakan `docker compose down -v` kecuali memang ingin menghapus data.

## Memindahkan data dari Supabase

Ekspor tabel berikut sebagai CSV dari Supabase Dashboard: `projects`, `certifications`, `messages`, dan `site_content`. Simpan file dengan nama tabelnya, misalnya `projects.csv`, di satu folder. Setelah container berjalan, jalankan dari PowerShell:

```powershell
npm run import:supabase -- .\supabase-export
```

Importer hanya menerima CSV tabel yang dikenal dan memasukkan data dalam satu transaksi. Jalankan sekali setelah database baru dibuat; baris dengan ID yang sama akan diperbarui jika diimpor ulang. Jangan impor SQL dump Supabase mentah karena dump tersebut dapat memuat schema internal, policy, dan fungsi khusus Supabase.

Akun/password Supabase Auth tidak ikut dipindahkan. Akun owner baru dibuat dari variabel `ADMIN_EMAIL` dan `ADMIN_PASSWORD`; admin tambahan dapat dibuat dari halaman **Manage Admins**. Gambar yang sebelumnya ada di Supabase Storage perlu diunduh lalu diunggah ulang melalui admin jika ingin berhenti memakai URL Supabase lama.

## Build

```bash
npm run build
```

## Halaman Admin

Halaman `/admin` mengelola proyek, sertifikasi, pesan kontak, profil, About, Skills, dan akun admin. API memeriksa autentikasi dan role di server untuk setiap operasi tulis; browser tidak pernah menerima kredensial PostgreSQL. Role `owner` dapat mengelola akun admin, sedangkan `editor` dapat mengelola konten.

## Struktur penting

```text
server/
  index.js       API, autentikasi, validasi, dan upload
  schema.sql     schema PostgreSQL yang dibuat otomatis
src/
  lib/api.ts     komunikasi frontend ke API
  lib/adminData.ts operasi data yang dipakai halaman admin dan publik
scripts/
  import-supabase-csv.mjs  importer CSV Supabase
```
