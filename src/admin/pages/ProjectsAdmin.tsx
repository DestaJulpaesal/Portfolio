import { useEffect, useMemo, useState, type FormEvent, type DragEvent } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  FolderKanban,
  Loader2,
  ExternalLink,
  Github,
  GripVertical,
} from "lucide-react";
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
  reorderProjects,
  type ProjectRow,
  type ProjectInput,
} from "../../lib/adminData";
import type { Project } from "../../data/content";
import { Modal } from "../../components/ui/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { TagInput } from "../components/TagInput";
import { ImageUploadField } from "../components/ImageUploadField";
import { StatusBadge } from "../components/StatusBadge";
import { useToast } from "../ToastContext";
import shared from "./AdminPage.module.css";

const emptyForm: ProjectInput = {
  name: "",
  summary: "",
  description: "",
  features: [],
  stack: [],
  href: "",
  repo: "",
  status: "source-only",
  image: "",
  sort_order: 0,
};

const statusOptions: { value: Project["status"]; label: string }[] = [
  { value: "live", label: "Live" },
  { value: "in-progress", label: "Dalam pengerjaan" },
  { value: "source-only", label: "Source tersedia" },
  { value: "archived", label: "Arsip" },
];

export function ProjectsAdmin() {
  const { notify } = useToast();
  const [rows, setRows] = useState<ProjectRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectRow | null>(null);
  const [form, setForm] = useState<ProjectInput>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<ProjectRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Drag-and-drop reorder — hanya aktif kalau tidak sedang mencari/memfilter,
  // supaya urutan yang di-drag jelas merujuk ke urutan asli, bukan hasil filter.
  const reorderEnabled = !search && statusFilter === "all";
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  async function load() {
    try {
      const data = await fetchProjects();
      setRows(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat proyek. Pastikan tabel 'projects' sudah dibuat lewat supabase-setup.sql.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    return rows.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.summary.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setFormOpen(true);
  }

  function openEdit(row: ProjectRow) {
    setEditing(row);
    setForm({
      name: row.name,
      summary: row.summary,
      description: row.description,
      features: row.features,
      stack: row.stack,
      href: row.href ?? "",
      repo: row.repo ?? "",
      status: row.status,
      image: row.image ?? "",
      sort_order: row.sort_order,
    });
    setFormErrors({});
    setFormOpen(true);
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Nama proyek wajib diisi.";
    if (!form.summary.trim()) errs.summary = "Ringkasan singkat wajib diisi.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const payload: ProjectInput = {
      ...form,
      href: form.href?.trim() || undefined,
      repo: form.repo?.trim() || undefined,
      image: form.image?.trim() || undefined,
    };

    try {
      if (editing) {
        await updateProject(editing.id, payload);
        notify("success", "Proyek berhasil diperbarui.");
      } else {
        await createProject(payload);
        notify("success", "Proyek baru berhasil ditambahkan.");
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Gagal menyimpan proyek.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteProject(pendingDelete.id);
      notify("success", `"${pendingDelete.name}" dihapus.`);
      setPendingDelete(null);
      await load();
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Gagal menghapus proyek.");
    } finally {
      setDeleting(false);
    }
  }

  function handleDragStart(index: number) {
    if (!reorderEnabled) return;
    setDragIndex(index);
  }

  function handleDragOver(e: DragEvent, index: number) {
    if (!reorderEnabled || dragIndex === null) return;
    e.preventDefault();
    setDragOverIndex(index);
  }

  async function handleDrop(index: number) {
    if (!reorderEnabled || dragIndex === null || !rows) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    if (dragIndex === index) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    const next = [...rows];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);

    setRows(next); // update optimis biar terasa instan
    setDragIndex(null);
    setDragOverIndex(null);
    setSavingOrder(true);
    try {
      await reorderProjects(next.map((p) => p.id));
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Gagal menyimpan urutan baru.");
      await load(); // rollback ke urutan tersimpan kalau gagal
    } finally {
      setSavingOrder(false);
    }
  }

  function handleDragEnd() {
    setDragIndex(null);
    setDragOverIndex(null);
  }

  return (
    <div>
      <header className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>Projects</h1>
          <p className={shared.pageSubtitle}>
            Kelola daftar proyek yang tampil di section "Featured Projects" pada halaman utama.
          </p>
        </div>
        <button type="button" className={shared.primaryBtn} onClick={openCreate}>
          <Plus size={16} /> Tambah proyek
        </button>
      </header>

      {error && <p className={shared.errorBanner}>{error}</p>}

      {!reorderEnabled && rows && rows.length > 1 && (
        <p className={shared.hintBanner}>
          Reset pencarian &amp; filter status ke "Semua status" untuk bisa drag &amp; drop mengurutkan proyek.
        </p>
      )}
      {savingOrder && (
        <p className={shared.hintBanner}>
          <Loader2 size={13} className={shared.spin} /> Menyimpan urutan baru…
        </p>
      )}

      <div className={shared.toolbar}>
        <div className={shared.searchBox}>
          <Search size={15} />
          <input
            type="text"
            placeholder="Cari nama atau ringkasan proyek…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Cari proyek"
          />
        </div>
        <select
          className={shared.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter status"
        >
          <option value="all">Semua status</option>
          {statusOptions.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className={shared.tableWrap}>
        {rows === null ? (
          <div className={shared.loadingCell}>
            <Loader2 size={18} className={shared.spin} /> Memuat proyek…
          </div>
        ) : filtered.length === 0 ? (
          <div className={shared.emptyState}>
            <FolderKanban size={30} />
            <p>{rows.length === 0 ? "Belum ada proyek. Tambahkan yang pertama." : "Tidak ada proyek yang cocok dengan pencarian."}</p>
            {rows.length === 0 && (
              <button type="button" className={shared.primaryBtn} onClick={openCreate}>
                <Plus size={16} /> Tambah proyek
              </button>
            )}
          </div>
        ) : (
          <table className={shared.table}>
            <thead>
              <tr>
                {reorderEnabled && <th style={{ width: 32 }}></th>}
                <th>Proyek</th>
                <th>Stack</th>
                <th>Status</th>
                <th>Link</th>
                <th style={{ textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr
                  key={p.id}
                  draggable={reorderEnabled}
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDrop={() => handleDrop(i)}
                  onDragEnd={handleDragEnd}
                  className={[
                    dragIndex === i ? shared.rowDragging : "",
                    dragOverIndex === i && dragIndex !== i ? shared.rowDragOver : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {reorderEnabled && (
                    <td>
                      <span className={shared.dragHandle} title="Geser untuk mengurutkan">
                        <GripVertical size={15} />
                      </span>
                    </td>
                  )}
                  <td>
                    <div className={shared.nameCell}>
                      {p.image ? (
                        <img src={p.image} alt="" className={shared.thumb} />
                      ) : (
                        <span className={shared.thumbFallback}>
                          <FolderKanban size={16} />
                        </span>
                      )}
                      <div className={shared.nameText}>
                        <strong>{p.name}</strong>
                        <span>{p.summary}</span>
                      </div>
                    </div>
                  </td>
                  <td>{p.stack.slice(0, 3).join(", ") || "—"}</td>
                  <td>
                    <StatusBadge status={p.status} />
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      {p.href && p.href !== "#" && (
                        <a href={p.href} target="_blank" rel="noreferrer" title="Buka demo">
                          <ExternalLink size={15} />
                        </a>
                      )}
                      {p.repo && p.repo !== "#" && (
                        <a href={p.repo} target="_blank" rel="noreferrer" title="Buka repo">
                          <Github size={15} />
                        </a>
                      )}
                      {(!p.href || p.href === "#") && (!p.repo || p.repo === "#") && "—"}
                    </div>
                  </td>
                  <td>
                    <div className={shared.actionsCell}>
                      <button
                        type="button"
                        className={shared.iconBtn}
                        onClick={() => openEdit(p)}
                        aria-label={`Ubah ${p.name}`}
                        title="Ubah"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className={`${shared.iconBtn} ${shared.dangerHover}`}
                        onClick={() => setPendingDelete(p)}
                        aria-label={`Hapus ${p.name}`}
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

      <Modal open={formOpen} onClose={() => setFormOpen(false)}>
        <form onSubmit={handleSubmit} className={shared.form} noValidate>
          <h2 className={shared.formTitle}>{editing ? "Ubah proyek" : "Tambah proyek"}</h2>

          <div className={shared.formGrid}>
            <div className={`${shared.field} ${shared.fullWidth}`}>
              <label htmlFor="p-name">Nama proyek *</label>
              <input
                id="p-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                aria-invalid={!!formErrors.name}
                aria-describedby={formErrors.name ? "p-name-error" : undefined}
              />
              {formErrors.name && (
                <p id="p-name-error" className={shared.fieldError}>
                  {formErrors.name}
                </p>
              )}
            </div>

            <div className={`${shared.field} ${shared.fullWidth}`}>
              <label htmlFor="p-summary">Ringkasan singkat *</label>
              <input
                id="p-summary"
                type="text"
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                aria-invalid={!!formErrors.summary}
                aria-describedby={formErrors.summary ? "p-summary-error" : undefined}
              />
              {formErrors.summary && (
                <p id="p-summary-error" className={shared.fieldError}>
                  {formErrors.summary}
                </p>
              )}
            </div>

            <div className={`${shared.field} ${shared.fullWidth}`}>
              <label htmlFor="p-description">Deskripsi lengkap</label>
              <textarea
                id="p-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className={`${shared.field} ${shared.fullWidth}`}>
              <TagInput
                id="p-features"
                label="Fitur utama"
                hint="Ketik lalu tekan Enter untuk menambah item."
                values={form.features}
                onChange={(features) => setForm({ ...form, features })}
                placeholder="mis. Login & registrasi"
              />
            </div>

            <div className={`${shared.field} ${shared.fullWidth}`}>
              <TagInput
                id="p-stack"
                label="Tech stack"
                hint="Ketik lalu tekan Enter untuk menambah item."
                values={form.stack}
                onChange={(stack) => setForm({ ...form, stack })}
                placeholder="mis. Laravel"
              />
            </div>

            <div className={shared.field}>
              <label htmlFor="p-href">Link demo (opsional)</label>
              <input
                id="p-href"
                type="url"
                value={form.href}
                onChange={(e) => setForm({ ...form, href: e.target.value })}
                placeholder="https://…"
              />
            </div>

            <div className={shared.field}>
              <label htmlFor="p-repo">Link repository (opsional)</label>
              <input
                id="p-repo"
                type="url"
                value={form.repo}
                onChange={(e) => setForm({ ...form, repo: e.target.value })}
                placeholder="https://github.com/…"
              />
            </div>

            <div className={shared.field}>
              <label htmlFor="p-status">Status</label>
              <select
                id="p-status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Project["status"] })}
              >
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={shared.field}>
              <label htmlFor="p-sort">Urutan tampil</label>
              <input
                id="p-sort"
                type="text"
                inputMode="numeric"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
              />
            </div>

            <div className={`${shared.field} ${shared.fullWidth}`}>
              <ImageUploadField
                id="p-image"
                label="Gambar/screenshot proyek"
                value={form.image ?? ""}
                onChange={(image) => setForm({ ...form, image })}
                folder="projects"
              />
            </div>
          </div>

          <div className={shared.formActions}>
            <button type="button" className={shared.secondaryBtn} onClick={() => setFormOpen(false)}>
              Batal
            </button>
            <button type="submit" className={shared.submitBtn} disabled={saving}>
              {saving && <Loader2 size={15} className={shared.spin} />}
              {saving ? "Menyimpan…" : editing ? "Simpan perubahan" : "Tambah proyek"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Hapus proyek ini?"
        description={`"${pendingDelete?.name}" akan dihapus permanen dan langsung hilang dari halaman publik.`}
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
