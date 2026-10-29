import { useEffect, useState } from "react";
import { fetchProjects, fetchCertifications, type ProjectRow, type CertificationRow } from "../lib/adminData";

export function useProjects() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchProjects()
      .then((rows) => {
        if (!cancelled) setProjects(rows);
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
  const [certifications, setCertifications] = useState<CertificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchCertifications()
      .then((rows) => {
        if (!cancelled) setCertifications(rows);
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
