import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { useAdminAuth } from "./AdminAuthContext";
import styles from "./RequireAuth.module.css";

export function RequireAuth({ children }: PropsWithChildren) {
  const { session, loading, checkingRole, role } = useAdminAuth();

  if (loading || (session && checkingRole)) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
      </div>
    );
  }

  // Session Supabase Auth ada tapi tidak terdaftar sebagai admin (role null)
  // — AdminAuthContext sudah otomatis sign-out akun ini, jadi cukup redirect
  // ke login; pesan penjelasannya ditampilkan di halaman Login lewat context.
  if (!session || !role) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}

/** Bungkus route yang cuma boleh diakses role "owner" (mis. Manage Admins). */
export function RequireOwner({ children }: PropsWithChildren) {
  const { session, loading, checkingRole, isOwner } = useAdminAuth();

  if (loading || (session && checkingRole)) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isOwner) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
