import { supabase } from "./supabase";
import type {
  Project as ProjectContent,
  Certification as CertificationContent,
  ProfileData,
  AboutData,
  SkillsData,
} from "../data/content";

/**
 * Baris tabel "projects" & "certifications" di Supabase.
 * Bentuknya sama seperti tipe di data/content.ts, ditambah id/sort_order/timestamps
 * supaya halaman publik (Projects.tsx, Certifications.tsx) bisa pakai tipe yang sama.
 */
export interface ProjectRow extends ProjectContent {
  id: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CertificationRow extends CertificationContent {
  id: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type ProjectInput = Omit<ProjectRow, "id" | "created_at" | "updated_at">;
export type CertificationInput = Omit<CertificationRow, "id" | "created_at" | "updated_at">;

function client() {
  if (!supabase) {
    throw new Error(
      "Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env."
    );
  }
  return supabase;
}

/* ------------------------------- Projects ------------------------------- */

export async function fetchProjects(): Promise<ProjectRow[]> {
  const { data, error } = await client()
    .from("projects")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as ProjectRow[];
}

export async function createProject(input: ProjectInput) {
  const { data, error } = await client().from("projects").insert([input]).select().single();
  if (error) throw error;
  return data as ProjectRow;
}

export async function updateProject(id: string, input: Partial<ProjectInput>) {
  const { data, error } = await client()
    .from("projects")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as ProjectRow;
}

export async function deleteProject(id: string) {
  const { error } = await client().from("projects").delete().eq("id", id);
  if (error) throw error;
}

/* ---------------------------- Certifications ----------------------------- */

export async function fetchCertifications(): Promise<CertificationRow[]> {
  const { data, error } = await client()
    .from("certifications")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as CertificationRow[];
}

export async function createCertification(input: CertificationInput) {
  const { data, error } = await client()
    .from("certifications")
    .insert([input])
    .select()
    .single();
  if (error) throw error;
  return data as CertificationRow;
}

export async function updateCertification(id: string, input: Partial<CertificationInput>) {
  const { data, error } = await client()
    .from("certifications")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as CertificationRow;
}

export async function deleteCertification(id: string) {
  const { error } = await client().from("certifications").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Update sort_order banyak baris sekaligus setelah drag-and-drop reorder.
 * Dipanggil dengan urutan baru (index array = urutan tampil yang baru).
 */
export async function reorderProjects(orderedIds: string[]) {
  const c = client();
  await Promise.all(
    orderedIds.map((id, index) => c.from("projects").update({ sort_order: index }).eq("id", id))
  );
}

export async function reorderCertifications(orderedIds: string[]) {
  const c = client();
  await Promise.all(
    orderedIds.map((id, index) =>
      c.from("certifications").update({ sort_order: index }).eq("id", id)
    )
  );
}

/* --------------------------------- Messages -------------------------------- */
/** Baris tabel "messages" — diisi otomatis oleh form Contact di halaman publik. */
export interface MessageRow {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

export async function fetchMessages(): Promise<MessageRow[]> {
  const { data, error } = await client()
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as MessageRow[];
}

export async function markMessageRead(id: string, isRead: boolean) {
  const { data, error } = await client()
    .from("messages")
    .update({ is_read: isRead, read_at: isRead ? new Date().toISOString() : null })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as MessageRow;
}

export async function deleteMessage(id: string) {
  const { error } = await client().from("messages").delete().eq("id", id);
  if (error) throw error;
}

/** Hitung pesan yang belum dibaca — dipakai untuk badge di sidebar admin. */
export async function countUnreadMessages(): Promise<number> {
  const { count, error } = await client()
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);
  if (error) throw error;
  return count ?? 0;
}

/* ------------------------------- Admin users ------------------------------- */
/**
 * Baris tabel "admin_users" — daftar akun Supabase Auth yang diizinkan masuk
 * ke /admin, plus role-nya. Login berhasil ke Supabase Auth SAJA tidak cukup;
 * lihat AdminAuthContext.tsx untuk pengecekan otorisasinya.
 */
export type AdminRole = "owner" | "editor";

export interface AdminUserRow {
  id: string;
  email: string;
  role: AdminRole;
  created_at: string;
}

export async function fetchAdminUsers(): Promise<AdminUserRow[]> {
  const { data, error } = await client()
    .from("admin_users")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as AdminUserRow[];
}

export async function fetchAdminRole(userId: string): Promise<AdminUserRow | null> {
  const { data, error } = await client()
    .from("admin_users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as AdminUserRow | null) ?? null;
}

/**
 * Tambahkan admin baru. Orang tersebut HARUS sudah punya akun di Supabase
 * Auth (didaftarkan lewat Dashboard > Authentication > Add user, atau lewat
 * halaman signup kalau kamu buat sendiri) — UUID akun itu yang dipakai di sini.
 * Client anon/authenticated tidak bisa membuat akun auth baru langsung
 * (butuh service role key), jadi alurnya: buat akun di Dashboard dulu, salin
 * UUID-nya, baru daftarkan sebagai admin lewat halaman ini.
 */
export async function addAdminUser(input: { id: string; email: string; role: AdminRole }) {
  const { data, error } = await client().from("admin_users").insert([input]).select().single();
  if (error) throw error;
  return data as AdminUserRow;
}

export async function updateAdminUserRole(id: string, role: AdminRole) {
  const { data, error } = await client()
    .from("admin_users")
    .update({ role })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as AdminUserRow;
}

export async function removeAdminUser(id: string) {
  const { error } = await client().from("admin_users").delete().eq("id", id);
  if (error) throw error;
}

/* -------------------------------- Site content ------------------------------ */
/**
 * Tabel "site_content" menyimpan konten section Profile/Hero, About, dan
 * Skills sebagai JSON per baris (kolom "section" jadi primary key). Kalau
 * baris untuk suatu section belum ada, halaman publik & admin fallback ke
 * data statis di data/content.ts (lihat hooks/useSiteContent.ts).
 */
export type SiteContentSection = "profile" | "about" | "skills";

interface SiteContentRow<T> {
  section: SiteContentSection;
  data: T;
  updated_at: string;
}

export async function fetchSiteContent<T>(section: SiteContentSection): Promise<T | null> {
  const { data, error } = await client()
    .from("site_content")
    .select("*")
    .eq("section", section)
    .maybeSingle();
  if (error) throw error;
  return (data as SiteContentRow<T> | null)?.data ?? null;
}

export async function saveSiteContent<T>(section: SiteContentSection, data: T) {
  const { error } = await client()
    .from("site_content")
    .upsert({ section, data }, { onConflict: "section" });
  if (error) throw error;
}

export type { ProfileData, AboutData, SkillsData };
