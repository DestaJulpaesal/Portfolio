import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * true kalau .env sudah diisi kredensial Supabase asli.
 * Dipakai form kontak untuk menampilkan pesan yang jujur kalau belum di-setup,
 * daripada gagal diam-diam.
 */
export const isSupabaseConfigured = Boolean(
  url && anonKey && !url.includes("xxxxxxxxxxxx")
);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey)
  : null;

export interface ContactMessagePayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Kirim pesan dari form kontak ke tabel "messages" di Supabase.
 *
 * Setup tabel (jalankan di SQL Editor Supabase):
 *
 * create table messages (
 *   id uuid primary key default gen_random_uuid(),
 *   name text not null,
 *   email text not null,
 *   subject text,
 *   message text not null,
 *   created_at timestamptz default now()
 * );
 *
 * alter table messages enable row level security;
 *
 * create policy "Public can insert messages"
 *   on messages for insert
 *   to anon
 *   with check (true);
 */
export async function sendContactMessage(payload: ContactMessagePayload) {
  if (!supabase) {
    throw new Error(
      "Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env."
    );
  }

  const { error } = await supabase.from("messages").insert([payload]);
  if (error) throw error;
}

/**
 * Lempar error yang jelas kalau ada kode yang mencoba memanggil Supabase
 * padahal belum dikonfigurasi — dipakai di semua fungsi admin di bawah.
 */
function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env, lalu jalankan supabase-setup.sql."
    );
  }
  return supabase;
}

/** Upload satu file ke bucket "portfolio-media", kembalikan public URL-nya. */
export async function uploadMedia(file: File, folder: "projects" | "certifications" | "profile") {
  const client = requireSupabase();
  const ext = file.name.split(".").pop() || "bin";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await client.storage.from("portfolio-media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = client.storage.from("portfolio-media").getPublicUrl(path);
  return data.publicUrl;
}
