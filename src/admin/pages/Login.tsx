import { useEffect, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { LogIn, Loader2, AlertCircle, ShieldAlert, Lock } from "lucide-react";
import { profile } from "../../data/content";
import { useAdminAuth } from "../AdminAuthContext";
import { getLoginLockout, registerFailedAttempt, resetLoginAttempts } from "../loginRateLimit";
import styles from "./Login.module.css";

export function Login() {
  const { session, configured, signIn, loading, unauthorizedMessage } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [honeypot, setHoneypot] = useState(""); // field jebakan bot — manusia tidak akan mengisi ini
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lockout, setLockout] = useState(() => getLoginLockout());

  // Tampilkan pesan dari AdminAuthContext kalau akun berhasil login ke
  // Supabase Auth tapi belum terdaftar sebagai admin (lihat AdminAuthContext).
  useEffect(() => {
    if (unauthorizedMessage) setError(unauthorizedMessage);
  }, [unauthorizedMessage]);

  // Update hitungan mundur lockout tiap detik selagi terkunci.
  useEffect(() => {
    if (!lockout.locked) return;
    const id = window.setInterval(() => setLockout(getLoginLockout()), 1000);
    return () => window.clearInterval(id);
  }, [lockout.locked]);

  if (!loading && session) {
    return <Navigate to="/admin" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const currentLockout = getLoginLockout();
    if (currentLockout.locked) {
      setLockout(currentLockout);
      setError(`Terlalu banyak percobaan gagal. Coba lagi dalam ${currentLockout.secondsLeft} detik.`);
      return;
    }

    // Honeypot terisi = kemungkinan besar bot. Diam-diam gagalkan tanpa
    // memberi tahu detail apapun, dan tetap hitung sebagai percobaan gagal.
    if (honeypot) {
      const next = registerFailedAttempt();
      setLockout(next);
      setError("Gagal masuk. Periksa kembali email & password kamu.");
      return;
    }

    setSubmitting(true);
    try {
      await signIn(email, password);
      resetLoginAttempts();
    } catch (err) {
      const next = registerFailedAttempt();
      setLockout(next);
      setError(
        next.locked
          ? `Terlalu banyak percobaan gagal. Coba lagi dalam ${next.secondsLeft} detik.`
          : err instanceof Error
          ? err.message
          : "Gagal masuk. Coba lagi."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const isLocked = lockout.locked;

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.logoRow}>
          <img src={profile.logoImage} alt="" className={styles.logo} />
          <div>
            <p className={styles.brand}>{profile.name}</p>
            <p className={`mono ${styles.brandTag}`}>Admin Panel</p>
          </div>
        </div>

        <h1 className={styles.heading}>Masuk ke admin</h1>
        <p className={styles.subheading}>Kelola konten portofolio kamu.</p>

        {!configured && (
          <div className={styles.warning}>
            <ShieldAlert size={16} />
            <span>
              Supabase belum dikonfigurasi. Isi <code>VITE_SUPABASE_URL</code> dan{" "}
              <code>VITE_SUPABASE_ANON_KEY</code> di file <code>.env</code>, lalu jalankan{" "}
              <code>supabase-setup.sql</code> dan buat user admin di Supabase Dashboard.
            </span>
          </div>
        )}

        {isLocked && (
          <div className={styles.warning}>
            <Lock size={16} />
            <span>
              Terlalu banyak percobaan gagal. Form dikunci sementara — coba lagi dalam{" "}
              <strong>{lockout.secondsLeft} detik</strong>.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.field}>
            <label htmlFor="admin-email">Email</label>
            <input
              id="admin-email"
              type="email"
              inputMode="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!configured || submitting || isLocked}
              placeholder="admin@email.com"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={!configured || submitting || isLocked}
              placeholder="••••••••"
            />
          </div>

          {/* Honeypot: disembunyikan dari mata manusia lewat CSS (bukan
              type="hidden" atau display:none, supaya lolos dari heuristik bot
              yang mengecek itu), tapi tetap ada di DOM untuk dijebak bot form-filler. */}
          <div className={styles.honeypot} aria-hidden="true">
            <label htmlFor="admin-website">Website</label>
            <input
              id="admin-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          {error && (
            <p className={styles.error} role="alert">
              <AlertCircle size={14} /> {error}
            </p>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={!configured || submitting || isLocked}
          >
            {submitting ? <Loader2 size={16} className={styles.spin} /> : <LogIn size={16} />}
            {submitting ? "Memproses…" : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
