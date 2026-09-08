import { useEffect, useState, type FormEvent } from "react";
import { Loader2, UserPlus, Trash2, ShieldCheck, ShieldAlert, Info } from "lucide-react";
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

  const [newId, setNewId] = useState("");
  const [newEmail, setNewEmail] = useState("");
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
          : "Gagal memuat daftar admin. Pastikan tabel 'admin_users' sudah dibuat lewat supabase-setup.sql."
      );
    }
  }

  useEffect(() => {
    load();
  }, []);

  const ownerCount = rows?.filter((r) => r.role === "owner").length ?? 0;

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!newId.trim() || !newEmail.trim()) {
      notify("error", "UUID dan email wajib diisi.");
      return;
    }
    setAdding(true);
    try {
      await addAdminUser({ id: newId.trim(), email: newEmail.trim(), role: newRole });
      notify("success", `${newEmail} berhasil ditambahkan sebagai ${newRole}.`);
      setNewId("");
      setNewEmail("");
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
          <h1 className={shared.pageTitle}>Manage Admins</h1>
          <p className={shared.pageSubtitle}>
            Kelola siapa saja yang boleh masuk ke /admin dan role-nya. Hanya role <strong>owner</strong> yang bisa
            membuka halaman ini.
          </p>
        </div>
      </header>

      <div className={styles.infoBox}>
        <Info size={16} />
        <p>
          Menambah admin di sini <strong>tidak</strong> membuat akun login baru. Buat dulu akunnya lewat Supabase
          Dashboard → Authentication → Add user (atau minta orangnya daftar sendiri kalau kamu buka signup), salin{" "}
          <strong>User UID</strong>-nya, baru daftarkan di form bawah supaya akun itu diizinkan masuk ke /admin.
        </p>
      </div>

      {error && <p className={shared.errorBanner}>{error}</p>}

      <form onSubmit={handleAdd} className={styles.addForm}>
        <div className={shared.field}>
          <label htmlFor="adm-id">User UID (dari Supabase Auth)</label>
          <input
            id="adm-id"
            type="text"
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
            placeholder="mis. 3fa85f64-5717-4562-b3fc-2c963f66afa6"
          />
        </div>
        <div className={shared.field}>
          <label htmlFor="adm-email">Email</label>
          <input
            id="adm-email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="admin@email.com"
          />
        </div>
        <div className={shared.field}>
          <label htmlFor="adm-role">Role</label>
          <select id="adm-role" value={newRole} onChange={(e) => setNewRole(e.target.value as AdminRole)}>
            <option value="editor">Editor — kelola konten saja</option>
            <option value="owner">Owner — akses penuh + kelola admin</option>
          </select>
        </div>
        <button type="submit" className={shared.primaryBtn} disabled={adding}>
          {adding ? <Loader2 size={15} className={shared.spin} /> : <UserPlus size={15} />}
          {adding ? "Menambahkan…" : "Tambah admin"}
        </button>
      </form>

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
          <table className={shared.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Bergabung</th>
                <th style={{ textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isSelf = r.id === session?.user.id;
                return (
                  <tr key={r.id}>
                    <td>
                      <div className={shared.nameCell}>
                        <span className={shared.thumbFallback}>
                          {r.role === "owner" ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                        </span>
                        <div className={shared.nameText}>
                          <strong>
                            {r.email} {isSelf && <span className={styles.youTag}>(kamu)</span>}
                          </strong>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select
                        className={styles.roleSelect}
                        value={r.role}
                        onChange={(e) => handleRoleChange(r, e.target.value as AdminRole)}
                      >
                        <option value="editor">Editor</option>
                        <option value="owner">Owner</option>
                      </select>
                    </td>
                    <td>{new Date(r.created_at).toLocaleDateString("id-ID")}</td>
                    <td>
                      <div className={shared.actionsCell}>
                        <button
                          type="button"
                          className={`${shared.iconBtn} ${shared.dangerHover}`}
                          onClick={() => setPendingDelete(r)}
                          aria-label={`Hapus admin ${r.email}`}
                          title="Hapus dari daftar admin"
                        >
                          <Trash2 size={14} />
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

      <ConfirmDialog
        open={!!pendingDelete}
        title="Hapus admin ini?"
        description={`"${pendingDelete?.email}" tidak akan bisa masuk ke /admin lagi (akun Supabase Auth-nya sendiri tidak dihapus).`}
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
