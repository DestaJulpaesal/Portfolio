import { useEffect, useState } from "react";
import { fetchProjects, fetchCertifications, type ProjectRow, type CertificationRow } from "../lib/adminData";
import { projects as staticProjects, certifications as staticCertifications } from "../data/content";

/**
 * Ambil daftar proyek dari API PostgreSQL supaya perubahan dari halaman
 * /admin langsung tampil di halaman publik. Kalau API belum tersedia atau
 * query gagal, otomatis fallback ke data statis di content.ts
 * supaya situs tidak pernah tampil kosong/error ke pengunjung.
 */
export function useProjects() {
  const [projects, setProjects] = useState<ProjectRow[] | typeof staticProjects>(staticProjects);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchProjects()
      .then((rows) => {
        if (!cancelled && rows.length > 0) setProjects(rows);
      })
      .catch(() => {
        // Keep the published portfolio available while the API is offline.
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchCertifications()
      .then((rows) => {
        if (!cancelled && rows.length > 0) setCertifications(rows);
      })
      .catch(() => {
        // Keep the published portfolio available while the API is offline.
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
