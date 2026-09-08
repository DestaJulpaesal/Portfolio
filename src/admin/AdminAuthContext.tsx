import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { fetchAdminRole, type AdminRole } from "../lib/adminData";

interface AdminAuthValue {
  session: Session | null;
  loading: boolean;
  configured: boolean;
  /** null = sudah dicek tapi akun ini TIDAK terdaftar di tabel admin_users. */
  role: AdminRole | null;
  /** true selagi masih mengecek tabel admin_users setelah session didapat. */
  checkingRole: boolean;
  isOwner: boolean;
  /** Diisi kalau login Supabase Auth berhasil tapi akun belum terdaftar sebagai admin. */
  unauthorizedMessage: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthValue | undefined>(undefined);

const UNAUTHORIZED_MSG =
  "Akun ini berhasil login tapi belum terdaftar sebagai admin. Minta admin lain (role owner) mendaftarkan akunmu lewat halaman Manage Admins, atau tambahkan manual lewat SQL Editor Supabase (lihat supabase-setup.sql).";

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AdminRole | null>(null);
  const [checkingRole, setCheckingRole] = useState(false);
  const [unauthorizedMessage, setUnauthorizedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Setiap kali ada session (baru login / restore session), cek apakah akun
  // ini terdaftar di tabel admin_users. Kalau tidak — sekadar berhasil login
  // ke Supabase Auth TIDAK cukup untuk dianggap admin — otomatis sign out
  // dan tampilkan pesan yang jelas ke pengguna.
  useEffect(() => {
    if (!session || !supabase) {
      setRole(null);
      setUnauthorizedMessage(null);
      return;
    }

    let cancelled = false;
    setCheckingRole(true);
    setUnauthorizedMessage(null);
    const client = supabase;

    fetchAdminRole(session.user.id)
      .then(async (row) => {
        if (cancelled) return;
        if (!row) {
          setRole(null);
          setUnauthorizedMessage(UNAUTHORIZED_MSG);
          await client.auth.signOut();
        } else {
          setRole(row.role);
        }
      })
      .catch(() => {
        if (cancelled) return;
        // Tabel admin_users belum dibuat (belum jalankan supabase-setup.sql
        // versi terbaru) — daripada mengunci semua orang, izinkan masuk
        // sebagai 'owner' sementara supaya tidak jadi lockout total, tapi
        // beri tahu lewat console untuk developer.
        console.warn(
          "Tabel 'admin_users' belum ditemukan — jalankan blok terbaru di supabase-setup.sql. Sementara semua akun login dianggap owner."
        );
        setRole("owner");
      })
      .finally(() => {
        if (!cancelled) setCheckingRole(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session]);

  const value = useMemo<AdminAuthValue>(
    () => ({
      session,
      loading,
      configured: isSupabaseConfigured,
      role,
      checkingRole,
      isOwner: role === "owner",
      unauthorizedMessage,
      async signIn(email: string, password: string) {
        if (!supabase) {
          throw new Error("Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY di .env");
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      async signOut() {
        if (!supabase) return;
        await supabase.auth.signOut();
      },
    }),
    [session, loading, role, checkingRole, unauthorizedMessage]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth harus dipakai di dalam AdminAuthProvider");
  return ctx;
}
