import { useEffect, useMemo, useState } from "react";
import { Search, Trash2, Inbox, Loader2, Mail, Eye, CircleDot } from "lucide-react";
import {
  fetchMessages,
  markMessageRead,
  deleteMessage,
  type MessageRow,
} from "../../lib/adminData";
import { Modal } from "../../components/ui/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useToast } from "../ToastContext";
import shared from "./AdminPage.module.css";
import styles from "./MessagesAdmin.module.css";

type StatusFilter = "all" | "unread" | "read";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function MessagesAdmin() {
  const { notify } = useToast();
  const [rows, setRows] = useState<MessageRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [active, setActive] = useState<MessageRow | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MessageRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    try {
      const data = await fetchMessages();
      setRows(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memuat pesan. Pastikan tabel 'messages' & kolom is_read sudah dibuat lewat supabase-setup.sql."
      );
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    return rows.filter((m) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.subject ?? "").toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "unread" && !m.is_read) ||
        (statusFilter === "read" && m.is_read);
      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  const unreadCount = rows?.filter((m) => !m.is_read).length ?? 0;

  async function openMessage(row: MessageRow) {
    setActive(row);
    if (!row.is_read) {
      try {
        const updated = await markMessageRead(row.id, true);
        setRows((prev) => (prev ? prev.map((m) => (m.id === updated.id ? updated : m)) : prev));
      } catch {
        // Gagal tandai terbaca bukan error fatal — biarkan pengguna tetap bisa baca pesannya.
      }
    }
  }

  async function toggleRead(row: MessageRow) {
    try {
      const updated = await markMessageRead(row.id, !row.is_read);
      setRows((prev) => (prev ? prev.map((m) => (m.id === updated.id ? updated : m)) : prev));
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Gagal memperbarui status pesan.");
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteMessage(pendingDelete.id);
      notify("success", `Pesan dari "${pendingDelete.name}" dihapus.`);
      setPendingDelete(null);
      if (active?.id === pendingDelete.id) setActive(null);
      await load();
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Gagal menghapus pesan.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <header className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>Messages</h1>
          <p className={shared.pageSubtitle}>
            Pesan yang masuk lewat form Contact di halaman utama.
            {unreadCount > 0 && (
              <>
                {" "}
                <span className={styles.unreadPill}>{unreadCount} belum dibaca</span>
              </>
            )}
          </p>
        </div>
      </header>

      {error && <p className={shared.errorBanner}>{error}</p>}

      <div className={shared.toolbar}>
        <div className={shared.searchBox}>
          <Search size={15} />
          <input
            type="text"
            placeholder="Cari nama, email, subjek, atau isi pesan…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Cari pesan"
          />
        </div>
        <select
          className={shared.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          aria-label="Filter status pesan"
        >
          <option value="all">Semua pesan</option>
          <option value="unread">Belum dibaca</option>
          <option value="read">Sudah dibaca</option>
        </select>
      </div>

      <div className={shared.tableWrap}>
        {rows === null ? (
          <div className={shared.loadingCell}>
            <Loader2 size={18} className={shared.spin} /> Memuat pesan…
          </div>
        ) : filtered.length === 0 ? (
          <div className={shared.emptyState}>
            <Inbox size={30} />
            <p>
              {rows.length === 0
                ? "Belum ada pesan masuk dari form Contact."
                : "Tidak ada pesan yang cocok dengan pencarian/filter."}
            </p>
          </div>
        ) : (
          <table className={shared.table}>
            <thead>
              <tr>
                <th></th>
                <th>Pengirim</th>
                <th>Subjek</th>
                <th>Tanggal</th>
                <th style={{ textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className={!m.is_read ? styles.unreadRow : undefined}>
                  <td>
                    <button
                      type="button"
                      className={styles.dotBtn}
                      onClick={() => toggleRead(m)}
                      title={m.is_read ? "Tandai belum dibaca" : "Tandai sudah dibaca"}
                      aria-label={m.is_read ? "Tandai belum dibaca" : "Tandai sudah dibaca"}
                    >
                      <CircleDot size={10} className={m.is_read ? styles.dotRead : styles.dotUnread} />
                    </button>
                  </td>
                  <td>
                    <div className={shared.nameCell}>
                      <span className={shared.thumbFallback}>
                        <Mail size={16} />
                      </span>
                      <div className={shared.nameText}>
                        <strong>{m.name}</strong>
                        <span>{m.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className={styles.subjectCell}>{m.subject || "(tanpa subjek)"}</td>
                  <td className={styles.dateCell}>{formatDate(m.created_at)}</td>
                  <td>
                    <div className={shared.actionsCell}>
                      <button
                        type="button"
                        className={shared.iconBtn}
                        onClick={() => openMessage(m)}
                        aria-label={`Lihat pesan dari ${m.name}`}
                        title="Lihat pesan"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        type="button"
                        className={`${shared.iconBtn} ${shared.dangerHover}`}
                        onClick={() => setPendingDelete(m)}
                        aria-label={`Hapus pesan dari ${m.name}`}
                        title="Hapus"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={!!active} onClose={() => setActive(null)}>
        {active && (
          <div className={styles.detail}>
            <h2 className={styles.detailTitle}>{active.subject || "(tanpa subjek)"}</h2>
            <div className={styles.detailMeta}>
              <span>
                <strong>{active.name}</strong> · {active.email}
              </span>
              <span>{formatDate(active.created_at)}</span>
            </div>
            <p className={styles.detailMessage}>{active.message}</p>
            <div className={styles.detailActions}>
              <a href={`mailto:${active.email}`} className={shared.secondaryBtn}>
                <Mail size={14} /> Balas via Email
              </a>
              <button
                type="button"
                className={`${shared.secondaryBtn} ${shared.dangerHover}`}
                onClick={() => setPendingDelete(active)}
              >
                <Trash2 size={14} /> Hapus
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Hapus pesan ini?"
        description={`Pesan dari "${pendingDelete?.name}" akan dihapus permanen.`}
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
