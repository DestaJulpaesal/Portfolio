import { useEffect, useState } from "react";
import { fetchSiteContent } from "../lib/adminData";
import {
  defaultProfileData,
  defaultAboutData,
  defaultSkillsData,
  type ProfileData,
  type AboutData,
  type SkillsData,
} from "../data/content";

function useSiteSection<T>(section: "profile" | "about" | "skills", getDefault: () => T) {
  const [data, setData] = useState<T>(getDefault);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchSiteContent<T>(section)
      .then((row) => {
        if (!cancelled && row) setData(row);
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
