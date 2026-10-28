import { useEffect, useState, type FormEvent } from "react";
import {
  Loader2,
  UserPlus,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Info,
  Users,
  PencilLine,
} from "lucide-react";
import {
  fetchAdminUsers,
  addAdminUser,
  updateAdminUserRole,
  removeAdminUser,
  type AdminUserRow,
  type AdminRole,
} from "../../lib/adminData";
import { useAdminAuth } from "../AdminAuthContext";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useToast } from "../ToastContext";
import shared from "./AdminPage.module.css";
import styles from "./AdminsAdmin.module.css";

export function AdminsAdmin() {
  const { notify } = useToast();
  const { session } = useAdminAuth();
  const [rows, setRows] = useState<AdminUserRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<AdminRole>("editor");
  const [adding, setAdding] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<AdminUserRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    try {
      const data = await fetchAdminUsers();
      setRows(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memuat daftar admin."
      );
    }
  }

  useEffect(() => {
    load();
  }, []);

  const ownerCount = rows?.filter((r) => r.role === "owner").length ?? 0;
  const editorCount = rows?.filter((r) => r.role === "editor").length ?? 0;

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!newEmail.trim() || newPassword.length < 12) {
      notify("error", "Email wajib diisi dan password harus minimal 12 karakter.");
      return;
    }
    setAdding(true);
    try {
      await addAdminUser({
        email: newEmail.trim(),
        password: newPassword,
        role: newRole,
      });
      notify("success", `${newEmail} berhasil ditambahkan sebagai ${newRole}.`);
      setNewEmail("");
      setNewPassword("");
      setNewRole("editor");
      await load();
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Gagal menambahkan admin.");
    } finally {
      setAdding(false);
    }
  }

  async function handleRoleChange(row: AdminUserRow, role: AdminRole) {
    if (row.role === "owner" && role === "editor" && ownerCount <= 1) {
      notify("error", "Tidak bisa menurunkan owner terakhir. Tambahkan owner lain dulu.");
      return;
    }
    try {
      await updateAdminUserRole(row.id, role);
      notify("success", `Role ${row.email} diubah jadi ${role}.`);
      await load();
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Gagal mengubah role.");
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    if (pendingDelete.role === "owner" && ownerCount <= 1) {
      notify("error", "Tidak bisa menghapus owner terakhir.");
      setPendingDelete(null);
      return;
    }
    setDeleting(true);
    try {
      await removeAdminUser(pendingDelete.id);
      notify("success", `${pendingDelete.email} dihapus dari daftar admin.`);
      setPendingDelete(null);
      await load();
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Gagal menghapus admin.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <header className={shared.pageHeader}>
        <div>
          <p className={styles.eyebrow}>AKSES & KEAMANAN</p>
          <h1 className={shared.pageTitle}>Manage Admins</h1>
          <p className={shared.pageSubtitle}>
            Kelola akun yang punya akses ke dashboard dan atur perannya.
          </p>
        </div>
      </header>

      <section className={styles.statsGrid} aria-label="Ringkasan admin">
        <article className={styles.statCard}>
          <span className={`${styles.statIcon} ${styles.statIconBlue}`}><Users size={18} /></span>
          <div>
            <p className={styles.statLabel}>Total admin</p>
            <p className={styles.statValue}>{rows?.length ?? "—"}</p>
          </div>
        </article>
        <article className={styles.statCard}>
          <span className={`${styles.statIcon} ${styles.statIconGold}`}><ShieldCheck size={18} /></span>
          <div>
            <p className={styles.statLabel}>Owner</p>
            <p className={styles.statValue}>{rows ? ownerCount : "—"}</p>
          </div>
        </article>
        <article className={styles.statCard}>
          <span className={`${styles.statIcon} ${styles.statIconGreen}`}><PencilLine size={18} /></span>
          <div>
            <p className={styles.statLabel}>Editor</p>
            <p className={styles.statValue}>{rows ? editorCount : "—"}</p>
          </div>
        </article>
      </section>

      {error && <p className={shared.errorBanner}>{error}</p>}

      <section className={styles.sectionCard}>
        <div className={styles.sectionHeading}>
          <div>
            <h2 className={styles.sectionTitle}>Tambah admin</h2>
            <p className={styles.sectionDescription}>Buat akses baru untuk orang yang membantu mengelola portofolio.</p>
          </div>
          <span className={styles.sectionIcon}><UserPlus size={18} /></span>
        </div>
        <div className={styles.infoBox}>
          <Info size={16} />
          <p>Password awal disimpan dengan aman sebagai hash. Bagikan kepada admin baru melalui saluran pribadi.</p>
        </div>

        <form onSubmit={handleAdd} className={styles.addForm}>
          <div className={shared.field}>
            <label htmlFor="adm-email">Email</label>
            <input
              id="adm-email"
              type="email"
              autoComplete="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="nama@email.com"
              required
            />
          </div>
          <div className={shared.field}>
            <label htmlFor="adm-password">Password awal</label>
            <input
              id="adm-password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 12 karakter"
              required
            />
          </div>
          <div className={shared.field}>
            <label htmlFor="adm-role">Peran</label>
            <select id="adm-role" value={newRole} onChange={(e) => setNewRole(e.target.value as AdminRole)}>
              <option value="editor">Editor</option>
              <option value="owner">Owner</option>
            </select>
          </div>
          <button type="submit" className={`${shared.primaryBtn} ${styles.addButton}`} disabled={adding}>
            {adding ? <Loader2 size={15} className={shared.spin} /> : <UserPlus size={15} />}
            {adding ? "Membuat akun…" : "Tambah admin"}
          </button>
        </form>
      </section>

      <section className={styles.sectionCard}>
        <div className={styles.sectionHeading}>
          <div>
            <h2 className={styles.sectionTitle}>Tim admin</h2>
            <p className={styles.sectionDescription}>Atur peran atau cabut akses admin.</p>
          </div>
          {rows && <span className={styles.memberCount}>{rows.length} akun</span>}
        </div>
        <div className={shared.tableWrap}>
        {rows === null ? (
          <div className={shared.loadingCell}>
            <Loader2 size={18} className={shared.spin} /> Memuat daftar admin…
          </div>
        ) : rows.length === 0 ? (
          <div className={shared.emptyState}>
            <ShieldAlert size={30} />
            <p>Belum ada admin terdaftar.</p>
          </div>
        ) : (
          <table className={`${shared.table} ${styles.adminTable}`}>
            <thead>
              <tr>
                <th>Admin</th>
                <th>Akses</th>
                <th>Terdaftar</th>
                <th style={{ textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isSelf = r.id === session?.user.id;
                const isLastOwner = r.role === "owner" && ownerCount <= 1;
                return (
                  <tr key={r.id}>
                    <td>
                      <div className={`${shared.nameCell} ${styles.adminIdentity}`}>
                        <span className={`${shared.thumbFallback} ${styles.adminAvatar}`}>
                          {r.role === "owner" ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                        </span>
                        <div className={`${shared.nameText} ${styles.adminNameText}`}>
                          <strong>{r.email}</strong>
                          {isSelf && <span className={styles.youTag}>Kamu</span>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={`${styles.roleCell} ${r.role === "owner" ? styles.ownerRole : styles.editorRole}`}>
                        {r.role === "owner" ? <ShieldCheck size={14} /> : <PencilLine size={14} />}
                        <select
                          className={styles.roleSelect}
                          value={r.role}
                          aria-label={`Peran ${r.email}`}
                          onChange={(e) => handleRoleChange(r, e.target.value as AdminRole)}
                        >
                          <option value="editor">Editor</option>
                          <option value="owner">Owner</option>
                        </select>
                      </div>
                    </td>
                    <td className={styles.joinedDate}>
                      <time dateTime={r.created_at}>
                        {new Date(r.created_at).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </time>
                    </td>
                    <td>
                      <div className={shared.actionsCell}>
                        <button
                          type="button"
                          className={`${shared.iconBtn} ${shared.dangerHover}`}
                          onClick={() => setPendingDelete(r)}
                          aria-label={`Hapus admin ${r.email}`}
                          title="Hapus dari daftar admin"
                          disabled={isLastOwner}
                        >
                          <Trash2 size={14} />
                          <span className={styles.removeLabel}>Hapus</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        </div>
        {ownerCount === 1 && rows?.some((row) => row.role === "owner") && (
          <p className={styles.ownerHint}>
            <ShieldAlert size={14} /> Owner terakhir tidak bisa dihapus atau diturunkan perannya.
          </p>
        )}
      </section>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Hapus admin ini?"
        description={`"${pendingDelete?.email}" tidak akan bisa masuk ke /admin lagi.`}
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
