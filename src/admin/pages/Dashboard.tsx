import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FolderKanban, Award, CheckCircle2, ArrowUpRight, Loader2, Mail } from "lucide-react";
import {
  fetchProjects,
  fetchCertifications,
  fetchMessages,
  type ProjectRow,
  type CertificationRow,
  type MessageRow,
} from "../../lib/adminData";
import { profile } from "../../data/content";
import shared from "./AdminPage.module.css";
import styles from "./Dashboard.module.css";

export function Dashboard() {
  const [projects, setProjects] = useState<ProjectRow[] | null>(null);
  const [certifications, setCertifications] = useState<CertificationRow[] | null>(null);
  const [messages, setMessages] = useState<MessageRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchProjects(), fetchCertifications()])
      .then(([p, c]) => {
        setProjects(p);
        setCertifications(c);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Gagal memuat data."));

    // Pesan masuk query terpisah supaya tabel messages yang belum ter-setup
    // tidak mengganggu tampilan statistik proyek/sertifikasi.
    fetchMessages()
      .then(setMessages)
      .catch(() => setMessages([]));
  }, []);

  const loading = projects === null || certifications === null;
  const liveCount = projects?.filter((p) => p.status === "live").length ?? 0;
  const unreadCount = messages?.filter((m) => !m.is_read).length ?? 0;

  return (
    <div>
      <header className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>Selamat datang, {profile.name.split(" ")[0]}</h1>
          <p className={shared.pageSubtitle}>Ringkasan konten portofolio kamu saat ini.</p>
        </div>
      </header>

      {error && <p className={shared.errorBanner}>{error}</p>}

      {loading && !error ? (
        <div className={styles.loading}>
          <Loader2 size={20} className={styles.spin} /> Memuat data…
        </div>
      ) : (
        <>
          <div className={styles.statGrid}>
            <div className={styles.statCard}>
              <span className={`${styles.statIcon} ${styles.iconBlue}`}>
                <FolderKanban size={18} />
              </span>
              <div>
                <p className={styles.statValue}>{projects?.length ?? 0}</p>
                <p className={styles.statLabel}>Total proyek</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <span className={`${styles.statIcon} ${styles.iconGreen}`}>
                <CheckCircle2 size={18} />
              </span>
              <div>
                <p className={styles.statValue}>{liveCount}</p>
                <p className={styles.statLabel}>Proyek live</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <span className={`${styles.statIcon} ${styles.iconGold}`}>
                <Award size={18} />
              </span>
              <div>
                <p className={styles.statValue}>{certifications?.length ?? 0}</p>
                <p className={styles.statLabel}>Sertifikasi</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <span className={`${styles.statIcon} ${styles.iconPink}`}>
                <Mail size={18} />
              </span>
              <div>
                <p className={styles.statValue}>{unreadCount}</p>
                <p className={styles.statLabel}>Pesan belum dibaca</p>
              </div>
            </div>
          </div>

          <div className={styles.quickLinks}>
            <Link to="/admin/projects" className={styles.quickLink}>
              <span>
                <strong>Kelola Projects</strong>
                <p>Tambah, ubah, atau hapus proyek yang tampil di halaman utama.</p>
              </span>
              <ArrowUpRight size={18} />
            </Link>
            <Link to="/admin/certifications" className={styles.quickLink}>
              <span>
                <strong>Kelola Certifications</strong>
                <p>Perbarui daftar sertifikasi & pencapaian.</p>
              </span>
              <ArrowUpRight size={18} />
            </Link>
            <Link to="/admin/messages" className={styles.quickLink}>
              <span>
                <strong>Lihat Messages</strong>
                <p>Baca pesan yang masuk lewat form Contact di halaman utama.</p>
              </span>
              <ArrowUpRight size={18} />
            </Link>
            <Link to="/admin/profile" className={styles.quickLink}>
              <span>
                <strong>Edit Profile & Hero</strong>
                <p>Ubah headline, tagline, foto, dan social links.</p>
              </span>
              <ArrowUpRight size={18} />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
