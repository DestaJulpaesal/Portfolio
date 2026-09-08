# Portfolio — Vite + React + TypeScript

Portfolio developer modern, dibangun dengan React 18, TypeScript, dan Vite. Tanpa framework CSS — semua styling pakai CSS Modules polos supaya ringan dan mudah dipahami.

## Menjalankan di lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`.

## Build untuk produksi

```bash
npm run build
npm run preview
```

Hasil build ada di folder `dist/` — tinggal upload ke Vercel, Netlify, GitHub Pages, atau hosting statis manapun.

## Struktur

```
src/
  components/     komponen per section (Nav, Hero, Skills, CareerLog, Projects, Contact)
  data/           content.ts — semua teks & data, edit di sini
  hooks/          useReveal.ts — animasi scroll-reveal
  index.css       design tokens & style global
```

## Kustomisasi cepat

1. **Ganti isi** — edit `src/data/content.ts` (nama, tagline, skill, proyek, riwayat karier).
2. **Ganti warna** — edit variabel di `:root` pada `src/index.css` (`--accent`, `--bg`, dst).
3. **Ganti font** — ganti link Google Fonts di `index.html` lalu update `--font-display` / `--font-body` / `--font-mono` di `index.css`.
4. **Tambah/kurangi section** — atur urutan komponen di `src/App.tsx`.
5. **Gambar proyek** — taruh screenshot di `public/projects/nama-file.png`, lalu isi field `image: "/projects/nama-file.png"` pada proyek terkait di `content.ts`. Kalau field `image` dikosongkan, kartu otomatis pakai pola dekoratif bertema kode sebagai fallback — jadi aman ditinggal kosong untuk proyek non-visual (API, CLI, library).

## Halaman Admin (`/admin`)

Ada halaman admin buat kelola **Projects** & **Certifications** tanpa harus edit kode — datanya disimpan di Supabase dan langsung tampil di halaman publik.

### Setup (sekali saja)

1. Bikin project di [supabase.com](https://supabase.com) (gratis).
2. Copy `.env.example` jadi `.env`, isi `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY` dari **Project Settings → API**.
3. Buka **SQL Editor** di dashboard Supabase, jalankan seluruh isi file `supabase-setup.sql` (bikin tabel `messages`, `projects`, `certifications`, `admin_users`, `site_content`, RLS policy, dan storage bucket buat upload gambar).
4. Buat user admin: **Authentication → Users → Add user**. Isi email & password.
5. **Daftarkan akun itu sebagai owner** — salin **User UID**-nya dari dashboard, lalu di SQL Editor jalankan:
   ```sql
   insert into admin_users (id, email, role) values
   ('tempel-uuid-di-sini', 'kamu@email.com', 'owner');
   ```
   Ini wajib — login ke Supabase Auth saja **tidak otomatis** jadi admin; harus terdaftar di tabel `admin_users` (lihat bagian "Multi-admin & role" di bawah).
6. Jalankan `npm install && npm run dev`, buka `http://localhost:5173/admin/login`, login pakai user tadi.

### Pemakaian

- **Dashboard** — ringkasan jumlah proyek, sertifikasi, dan pesan belum dibaca.
- **Projects** — tambah/ubah/hapus proyek: nama, ringkasan, deskripsi, fitur, stack, link demo/repo, status, gambar, dan urutan tampil. Bisa juga **drag & drop** baris tabel buat mengubah urutan langsung (nonaktif otomatis kalau sedang mencari/memfilter, supaya tidak salah urut).
- **Certifications** — sama seperti Projects, termasuk drag & drop reorder.
- **Messages** — baca pesan yang masuk dari form Contact di halaman publik: cari, filter belum/sudah dibaca, tandai dibaca, balas lewat email, atau hapus. Badge jumlah pesan belum dibaca muncul di sidebar & Dashboard.
- **Profile & Hero** — edit headline, tagline, role, status ketersediaan, kontak, foto, logo, statistik, dan social links. Data ini dipakai ulang di Hero, Nav, Footer, dan Contact — jadi cukup diedit sekali.
- **About** — edit foto, paragraf, dan poin-poin highlight di section About.
- **Skills** — kelola kategori skill beserta item & ikon-nya (tambah/hapus kategori dan skill, drag urutan lewat field "Urutan" kalau perlu presisi tinggi, atau susun ulang array langsung).
- **Manage Admins** *(hanya untuk role owner)* — lihat daftar admin, ubah role (`owner`/`editor`), atau cabut akses seseorang. Menambah admin baru butuh **User UID** dari Supabase Auth (buat akunnya dulu lewat Dashboard, baru daftarkan di sini).
- Semua perubahan di admin **langsung tampil** di halaman utama, tanpa perlu build ulang.
- Kalau `.env` belum diisi, halaman publik tetap jalan pakai data statis di `src/data/content.ts` (fallback aman), tapi `/admin` akan menampilkan peringatan dan tombol login nonaktif.

### Multi-admin & role

Ada dua role: **owner** (akses penuh, termasuk kelola admin lain) dan **editor** (kelola konten — Projects, Certifications, Messages, Profile/About/Skills — tapi tidak bisa membuka Manage Admins). Login Supabase Auth yang berhasil tapi akunnya belum terdaftar di tabel `admin_users` akan otomatis di-sign-out dengan pesan yang jelas, jadi bukan berarti "siapa saja yang berhasil login otomatis jadi admin penuh".

Menambah admin baru **tidak** membuat akun login baru dari sisi client (butuh service role key yang tidak dipaparkan ke browser demi keamanan) — alurnya tetap: buat akun di Supabase Dashboard dulu, baru daftarkan UID-nya lewat halaman Manage Admins atau langsung lewat SQL Editor.

### Proteksi login (rate-limit & anti-bot)

Form login punya dua lapis proteksi tambahan di sisi client:
- **Lockout progresif** — 5x gagal berturut-turut mengunci form 30 detik, 8x mengunci 2 menit, 12x+ mengunci 10 menit. Tersimpan di `localStorage` browser tsb.
- **Honeypot field** — input tersembunyi yang manusia tidak akan mengisi; kalau terisi (biasanya oleh bot form-filler), percobaan langsung digagalkan secara diam-diam.

Ini proteksi client-side untuk mempersulit brute-force sederhana, **bukan pengganti** proteksi server-side yang lebih kuat. Untuk keamanan produksi yang lebih serius, tambahkan Google reCAPTCHA/hCaptcha di form ini plus verifikasi token-nya di server (mis. Supabase Edge Function) sebelum memanggil `signInWithPassword`.

### Deploy

Situsnya SPA (client-side routing), jadi hosting statis butuh rule "semua path balik ke `index.html`":
- **Netlify** — sudah otomatis lewat `public/_redirects`.
- **Vercel** — sudah otomatis lewat `vercel.json`.
- Hosting lain (GitHub Pages, dll) — cek dokumentasi masing-masing untuk "SPA fallback / rewrite rule", kalau tidak, path `/admin` akan 404 saat diakses langsung (refresh).

Jangan lupa isi environment variable `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY` juga di pengaturan hosting (Netlify/Vercel), bukan cuma di `.env` lokal.

## Desain

- **Palet**: charcoal ink (`#14171C`) dengan aksen brass (`#C9A227`) dan teal-slate (`#6F938C`) — profesional, bukan neon.
- **Tipografi**: Newsreader (serif, judul) + Inter (body) + JetBrains Mono (label & kode).
- **Signature**: riwayat karier ditampilkan bergaya `git log --graph`, karena perjalanan karier memang sebuah urutan nyata.
