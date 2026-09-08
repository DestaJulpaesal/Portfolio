import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "../lib/supabase";
import { fetchSiteContent } from "../lib/adminData";
import {
  defaultProfileData,
  defaultAboutData,
  defaultSkillsData,
  type ProfileData,
  type AboutData,
  type SkillsData,
} from "../data/content";

/**
 * Sama seperti useProjects/useCertifications di useContentData.ts: ambil
 * override dari Supabase (tabel "site_content") kalau sudah dikonfigurasi,
 * dan diam-diam fallback ke data statis di content.ts kalau belum di-setup
 * atau baris untuk section itu belum pernah disimpan lewat /admin.
 */
function useSiteSection<T>(section: "profile" | "about" | "skills", getDefault: () => T) {
  const [data, setData] = useState<T>(getDefault);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;

    fetchSiteContent<T>(section)
      .then((row) => {
        if (!cancelled && row) setData(row);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  return { data, loading };
}

export function useProfileContent() {
  const { data, loading } = useSiteSection<ProfileData>("profile", defaultProfileData);
  return { profile: data, loading };
}

export function useAboutContent() {
  const { data, loading } = useSiteSection<AboutData>("about", defaultAboutData);
  return { about: data, loading };
}

export function useSkillsContent() {
  const { data, loading } = useSiteSection<SkillsData>("skills", defaultSkillsData);
  return { categories: data.categories, loading };
}
