-- Jalankan ini di Supabase Dashboard > SQL Editor > New query
-- Bikin tabel messages buat nampung submission dari form Contact

create table messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  created_at timestamptz default now()
);

alter table messages enable row level security;

create policy "Public can insert messages"
  on messages for insert
  to anon
  with check (true);


-- =====================================================================
-- ADMIN CRUD — jalankan blok di bawah ini juga di SQL Editor yang sama.
-- Tabel "projects" dan "certifications" jadi sumber data untuk halaman
-- publik (Projects & Certifications section) DAN halaman /admin.
-- =====================================================================

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  summary text not null,
  description text not null default '',
  features text[] not null default '{}',
  stack text[] not null default '{}',
  href text,
  repo text,
  status text not null default 'source-only'
    check (status in ('live', 'source-only', 'in-progress', 'archived')),
  image text,
  sort_order integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table certifications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  issuer text not null,
  date text not null,
  url text,
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table projects enable row level security;
alter table certifications enable row level security;

-- Siapa saja (pengunjung website) boleh BACA data ini — dipakai section publik.
create policy "Public can read projects"
  on projects for select
  to anon
  using (true);

create policy "Public can read certifications"
  on certifications for select
  to anon
  using (true);

-- Cuma user yang login (admin) yang boleh tambah/ubah/hapus.
create policy "Authenticated can manage projects"
  on projects for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated can manage certifications"
  on certifications for all
  to authenticated
  using (true)
  with check (true);

-- Auto-update kolom updated_at setiap kali baris diubah.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_set_updated_at
  before update on projects
  for each row execute function set_updated_at();

create trigger certifications_set_updated_at
  before update on certifications
  for each row execute function set_updated_at();


-- =====================================================================
-- STORAGE — bucket publik untuk upload gambar proyek & sertifikat lewat
-- halaman admin. Jalankan juga di SQL Editor yang sama.
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('portfolio-media', 'portfolio-media', true)
on conflict (id) do nothing;

create policy "Public can view portfolio media"
  on storage.objects for select
  to public
  using (bucket_id = 'portfolio-media');

create policy "Authenticated can upload portfolio media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'portfolio-media');

create policy "Authenticated can update portfolio media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'portfolio-media');

create policy "Authenticated can delete portfolio media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'portfolio-media');


-- =====================================================================
-- OPSIONAL — isi tabel "projects" & "certifications" dengan data yang
-- sudah ada di src/data/content.ts, supaya begitu admin login datanya
-- gak kosong. Hapus/lewati blok ini kalau mau mulai dari kosong dan
-- input manual lewat halaman admin.
-- =====================================================================

-- insert into projects (name, summary, description, features, stack, href, repo, status, image, sort_order) values
-- ('Nama Proyek', 'Ringkasan singkat', 'Deskripsi lengkap', '{"Fitur 1","Fitur 2"}', '{"Laravel","MySQL"}', null, 'https://github.com/user/repo', 'source-only', '/projects/1.png', 0);

-- insert into certifications (name, issuer, date, url, description, sort_order) values
-- ('Nama Sertifikat', 'Penerbit', '2026', '/projects/10.png', 'Deskripsi singkat', 0);


-- =====================================================================
-- UPDATE: Messages admin (baca pesan Contact lewat /admin)
-- Jalankan blok ini kalau tabel "messages" di atas sudah pernah dibuat
-- sebelumnya TANPA kolom is_read/read_at. Kalau kamu baru pertama kali
-- setup dari nol, boleh skip ALTER TABLE ini (tapi tetap perlu bagian
-- policy authenticated di bawah).
-- =====================================================================

alter table messages add column if not exists is_read boolean not null default false;
alter table messages add column if not exists read_at timestamptz;

-- Admin (siapapun yang login) boleh baca, tandai dibaca, dan hapus pesan.
create policy "Authenticated can read messages"
  on messages for select
  to authenticated
  using (true);

create policy "Authenticated can update messages"
  on messages for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated can delete messages"
  on messages for delete
  to authenticated
  using (true);


-- =====================================================================
-- UPDATE: Multi-admin & role (owner / editor)
-- Tabel ini menentukan akun Supabase Auth mana saja yang BOLEH masuk ke
-- /admin — cuma berhasil login ke Supabase Auth TIDAK otomatis jadi admin.
-- =====================================================================

create table admin_users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'editor' check (role in ('owner', 'editor')),
  created_at timestamptz default now()
);

alter table admin_users enable row level security;

-- Fungsi security definer supaya policy di bawah tidak recursive (baca
-- tabel admin_users dari dalam policy admin_users sendiri itu masalah
-- klasik di Postgres/Supabase kalau ditulis naif).
create or replace function is_admin()
returns boolean as $$
  select exists (select 1 from admin_users where id = auth.uid());
$$ language sql security definer stable;

create or replace function current_admin_role()
returns text as $$
  select role from admin_users where id = auth.uid();
$$ language sql security definer stable;

-- Semua admin boleh lihat dirinya sendiri; owner boleh lihat semua orang.
create policy "Admin can read own row, owner can read all"
  on admin_users for select
  to authenticated
  using (auth.uid() = id or current_admin_role() = 'owner');

-- Cuma owner yang boleh menambah/mengubah/menghapus baris admin_users.
create policy "Owner can insert admin_users"
  on admin_users for insert
  to authenticated
  with check (current_admin_role() = 'owner');

create policy "Owner can update admin_users"
  on admin_users for update
  to authenticated
  using (current_admin_role() = 'owner')
  with check (current_admin_role() = 'owner');

create policy "Owner can delete admin_users"
  on admin_users for delete
  to authenticated
  using (current_admin_role() = 'owner');

-- WAJIB: daftarkan akun pertamamu sebagai owner secara manual, karena
-- tabel ini masih kosong dan tidak ada siapa pun yang bisa insert lewat
-- policy di atas (butuh sudah jadi owner untuk bisa insert owner lain).
-- 1) Buat/gunakan akun di Supabase Dashboard > Authentication > Users.
-- 2) Salin "User UID"-nya, lalu jalankan (ganti nilai di bawah):
--
-- insert into admin_users (id, email, role) values
-- ('tempel-uuid-di-sini', 'kamu@email.com', 'owner');


-- =====================================================================
-- UPDATE: Konten yang bisa diedit — Profile/Hero, About, Skills
-- Disimpan sebagai satu baris JSON per section di tabel "site_content".
-- Halaman publik & /admin fallback ke data statis di content.ts kalau
-- baris untuk section tsb belum pernah disimpan.
-- =====================================================================

create table site_content (
  section text primary key check (section in ('profile', 'about', 'skills')),
  data jsonb not null,
  updated_at timestamptz default now()
);

alter table site_content enable row level security;

-- Siapa saja boleh baca (dipakai Hero/About/Skills di halaman publik).
create policy "Public can read site_content"
  on site_content for select
  to public
  using (true);

-- Cuma admin terdaftar (ada di admin_users) yang boleh insert/update.
-- Baik role owner maupun editor boleh mengedit konten section ini.
create policy "Admin can upsert site_content"
  on site_content for insert
  to authenticated
  with check (is_admin());

create policy "Admin can update site_content"
  on site_content for update
  to authenticated
  using (is_admin())
  with check (is_admin());

create trigger site_content_set_updated_at
  before update on site_content
  for each row execute function set_updated_at();
