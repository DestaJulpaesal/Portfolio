import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiRequest } from "../lib/api";
import type { AdminRole } from "../lib/adminData";

interface AdminSession {
  user: { id: string; email: string };
}

interface AdminAuthValue {
  session: AdminSession | null;
  loading: boolean;
  configured: boolean;
  role: AdminRole | null;
  checkingRole: boolean;
  isOwner: boolean;
  unauthorizedMessage: string | null;
  signIn: (email: string, password: string, website?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

interface AuthResponse {
  session: (AdminSession & { role: AdminRole }) | null;
}

const AdminAuthContext = createContext<AdminAuthValue | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [role, setRole] = useState<AdminRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiRequest<AuthResponse>("/api/auth/session")
      .then(({ session: current }) => {
        if (cancelled) return;
        setSession(current);
        setRole(current?.role ?? null);
      })
      .catch(() => {
        if (!cancelled) setConfigured(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AdminAuthValue>(
    () => ({
      session,
      loading,
      configured,
      role,
      checkingRole: false,
      isOwner: role === "owner",
      unauthorizedMessage: null,
      async signIn(email, password, website = "") {
        const result = await apiRequest<AuthResponse>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password, website }),
        });
        setConfigured(true);
        setSession(result.session);
        setRole(result.session?.role ?? null);
      },
      async signOut() {
        await apiRequest<void>("/api/auth/logout", { method: "POST" });
        setSession(null);
        setRole(null);
      },
    }),
    [session, loading, configured, role]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth harus dipakai di dalam AdminAuthProvider");
  return ctx;
}
