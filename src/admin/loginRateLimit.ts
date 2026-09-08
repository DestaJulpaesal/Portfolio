/**
 * Rate-limit sederhana buat form login admin — bukan pengganti proteksi
 * server-side, tapi lapisan pertahanan tambahan yang gampang dipasang buat
 * MVP: mempersulit brute-force dari browser yang sama tanpa perlu backend.
 *
 * Disimpan di localStorage (bukan sessionStorage) supaya lockout tetap
 * berlaku walau tab ditutup-buka lagi. Untuk proteksi yang lebih serius di
 * production, tambahkan:
 *  - Google reCAPTCHA v3 (atau hCaptcha) di form ini, dan
 *  - verifikasi token captcha-nya di server (mis. Supabase Edge Function)
 *    sebelum memanggil signInWithPassword — client-side saja tidak cukup
 *    karena localStorage bisa dengan mudah di-reset oleh penyerang.
 */

const STORAGE_KEY = "admin_login_attempts";

interface AttemptState {
  count: number;
  lockUntil: number | null;
}

// Tahapan lockout progresif: makin banyak gagal berturut-turut, makin lama
// dikunci. Reset ke 0 begitu login berhasil.
const LOCK_STAGES: { afterAttempts: number; lockMs: number }[] = [
  { afterAttempts: 5, lockMs: 30 * 1000 }, // 5x gagal -> kunci 30 detik
  { afterAttempts: 8, lockMs: 2 * 60 * 1000 }, // 8x gagal -> kunci 2 menit
  { afterAttempts: 12, lockMs: 10 * 60 * 1000 }, // 12x+ gagal -> kunci 10 menit
];

function readState(): AttemptState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, lockUntil: null };
    const parsed = JSON.parse(raw);
    return {
      count: typeof parsed.count === "number" ? parsed.count : 0,
      lockUntil: typeof parsed.lockUntil === "number" ? parsed.lockUntil : null,
    };
  } catch {
    return { count: 0, lockUntil: null };
  }
}

function writeState(state: AttemptState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage tidak tersedia (mis. mode private ketat) — abaikan saja,
    // rate-limit jadi tidak aktif tapi login tetap bisa jalan.
  }
}

/** Cek apakah login sedang dikunci. Kalau ya, kembalikan sisa detiknya. */
export function getLoginLockout(): { locked: boolean; secondsLeft: number } {
  const state = readState();
  if (!state.lockUntil) return { locked: false, secondsLeft: 0 };

  const now = Date.now();
  if (now >= state.lockUntil) {
    // Waktu kunci sudah lewat — bersihkan biar tidak terus dianggap locked.
    writeState({ count: state.count, lockUntil: null });
    return { locked: false, secondsLeft: 0 };
  }

  return { locked: true, secondsLeft: Math.ceil((state.lockUntil - now) / 1000) };
}

/** Panggil setiap kali login gagal. Mengembalikan status lockout terbaru. */
export function registerFailedAttempt(): { locked: boolean; secondsLeft: number } {
  const state = readState();
  const count = state.count + 1;

  let lockMs = 0;
  for (const stage of LOCK_STAGES) {
    if (count >= stage.afterAttempts) lockMs = stage.lockMs;
  }

  const lockUntil = lockMs > 0 ? Date.now() + lockMs : state.lockUntil;
  writeState({ count, lockUntil });

  return getLoginLockout();
}

/** Panggil setiap kali login berhasil, supaya hitungan gagal direset. */
export function resetLoginAttempts() {
  writeState({ count: 0, lockUntil: null });
}
