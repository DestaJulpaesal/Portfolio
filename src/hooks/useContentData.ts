import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "../lib/supabase";
import { fetchProjects, fetchCertifications, type ProjectRow, type CertificationRow } from "../lib/adminData";
import { projects as staticProjects, certifications as staticCertifications } from "../data/content";

/**
 * Ambil daftar proyek dari Supabase (kalau sudah dikonfigurasi & tabelnya
 * sudah ada) supaya perubahan dari halaman /admin langsung tampil di
 * halaman publik. Kalau Supabase belum di-setup, atau query gagal (mis.
 * tabel belum dibuat), otomatis fallback ke data statis di content.ts
 * supaya situs tidak pernah tampil kosong/error ke pengunjung.
 */
export function useProjects() {
  const [projects, setProjects] = useState<ProjectRow[] | typeof staticProjects>(staticProjects);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;

    fetchProjects()
      .then((rows) => {
        if (!cancelled && rows.length > 0) setProjects(rows);
      })
      .catch(() => {
        // Tabel belum dibuat / query gagal — diam-diam pakai fallback statis.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { projects, loading };
}

export function useCertifications() {
  const [certifications, setCertifications] = useState<
    CertificationRow[] | typeof staticCertifications
  >(staticCertifications);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;

    fetchCertifications()
      .then((rows) => {
        if (!cancelled && rows.length > 0) setCertifications(rows);
      })
      .catch(() => {
        // Tabel belum dibuat / query gagal — diam-diam pakai fallback statis.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { certifications, loading };
}
