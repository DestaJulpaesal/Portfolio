import { useEffect, useMemo, useState, type FormEvent, type DragEvent } from "react";
import { Search, Plus, Pencil, Trash2, Award, Loader2, ExternalLink, GripVertical } from "lucide-react";
import {
  fetchCertifications,
  createCertification,
  updateCertification,
  deleteCertification,
  reorderCertifications,
  type CertificationRow,
  type CertificationInput,
} from "../../lib/adminData";
import { Modal } from "../../components/ui/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ImageUploadField } from "../components/ImageUploadField";
import { useToast } from "../ToastContext";
import shared from "./AdminPage.module.css";

const emptyForm: CertificationInput = {
  name: "",
  issuer: "",
  date: "",
  url: "",
  description: "",
  sort_order: 0,
};

export function CertificationsAdmin() {
  const { notify } = useToast();
  const [rows, setRows] = useState<CertificationRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CertificationRow | null>(null);
  const [form, setForm] = useState<CertificationInput>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<CertificationRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const reorderEnabled = !search;
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  async function load() {
    try {
      const data = await fetchCertifications();
      setRows(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memuat sertifikasi. Pastikan tabel 'certifications' sudah dibuat lewat supabase-setup.sql."
      );
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    if (!search) return rows;
    return rows.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.issuer.toLowerCase().includes(search.toLowerCase())
    );
  }, [rows, search]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setFormOpen(true);
  }

  function openEdit(row: CertificationRow) {
    setEditing(row);
    setForm({
      name: row.name,
      issuer: row.issuer,
      date: row.date,
      url: row.url ?? "",
      description: row.description,
      sort_order: row.sort_order,
    });
    setFormErrors({});
    setFormOpen(true);
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Nama sertifikat wajib diisi.";
    if (!form.issuer.trim()) errs.issuer = "Penerbit wajib diisi.";
    if (!form.date.trim()) errs.date = "Tahun/tanggal wajib diisi.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const payload: CertificationInput = {
      ...form,
      url: form.url?.trim() || undefined,
    };

    try {
      if (editing) {
        await updateCertification(editing.id, payload);
        notify("success", "Sertifikasi berhasil diperbarui.");
      } else {
        await createCertification(payload);
        notify("success", "Sertifikasi baru berhasil ditambahkan.");
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Gagal menyimpan sertifikasi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteCertification(pendingDelete.id);
      notify("success", `"${pendingDelete.name}" dihapus.`);
      setPendingDelete(null);
      await load();
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Gagal menghapus sertifikasi.");
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

    setRows(next);
    setDragIndex(null);
    setDragOverIndex(null);
    setSavingOrder(true);
    try {
      await reorderCertifications(next.map((c) => c.id));
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Gagal menyimpan urutan baru.");
      await load();
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
          <h1 className={shared.pageTitle}>Certifications</h1>
          <p className={shared.pageSubtitle}>Kelola daftar sertifikasi & pencapaian di halaman utama.</p>
        </div>
        <button type="button" className={shared.primaryBtn} onClick={openCreate}>
          <Plus size={16} /> Tambah sertifikasi
        </button>
      </header>

      {error && <p className={shared.errorBanner}>{error}</p>}

      {!reorderEnabled && rows && rows.length > 1 && (
        <p className={shared.hintBanner}>
          Reset pencarian untuk bisa drag &amp; drop mengurutkan sertifikasi.
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
            placeholder="Cari nama atau penerbit…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Cari sertifikasi"
          />
        </div>
      </div>

      <div className={shared.tableWrap}>
        {rows === null ? (
          <div className={shared.loadingCell}>
            <Loader2 size={18} className={shared.spin} /> Memuat sertifikasi…
          </div>
        ) : filtered.length === 0 ? (
          <div className={shared.emptyState}>
            <Award size={30} />
            <p>
              {rows.length === 0
                ? "Belum ada sertifikasi. Tambahkan yang pertama."
                : "Tidak ada sertifikasi yang cocok dengan pencarian."}
            </p>
            {rows.length === 0 && (
              <button type="button" className={shared.primaryBtn} onClick={openCreate}>
                <Plus size={16} /> Tambah sertifikasi
              </button>
            )}
          </div>
        ) : (
          <table className={shared.table}>
            <thead>
              <tr>
                {reorderEnabled && <th style={{ width: 32 }}></th>}
                <th>Sertifikat</th>
                <th>Penerbit</th>
                <th>Tahun</th>
                <th>File</th>
                <th style={{ textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr
                  key={c.id}
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
                      {c.url ? (
                        <img src={c.url} alt="" className={shared.thumb} />
                      ) : (
                        <span className={shared.thumbFallback}>
                          <Award size={16} />
                        </span>
                      )}
                      <div className={shared.nameText}>
                        <strong>{c.name}</strong>
                        <span>{c.description}</span>
                      </div>
                    </div>
                  </td>
                  <td>{c.issuer}</td>
                  <td>{c.date}</td>
                  <td>
                    {c.url ? (
                      <a href={c.url} target="_blank" rel="noreferrer" title="Buka file">
                        <ExternalLink size={15} />
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <div className={shared.actionsCell}>
                      <button
                        type="button"
                        className={shared.iconBtn}
                        onClick={() => openEdit(c)}
                        aria-label={`Ubah ${c.name}`}
                        title="Ubah"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className={`${shared.iconBtn} ${shared.dangerHover}`}
                        onClick={() => setPendingDelete(c)}
                        aria-label={`Hapus ${c.name}`}
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
          <h2 className={shared.formTitle}>{editing ? "Ubah sertifikasi" : "Tambah sertifikasi"}</h2>

          <div className={shared.formGrid}>
            <div className={`${shared.field} ${shared.fullWidth}`}>
              <label htmlFor="c-name">Nama sertifikat *</label>
              <input
                id="c-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                aria-invalid={!!formErrors.name}
                aria-describedby={formErrors.name ? "c-name-error" : undefined}
              />
              {formErrors.name && (
                <p id="c-name-error" className={shared.fieldError}>
                  {formErrors.name}
                </p>
              )}
            </div>

            <div className={shared.field}>
              <label htmlFor="c-issuer">Penerbit *</label>
              <input
                id="c-issuer"
                type="text"
                value={form.issuer}
                onChange={(e) => setForm({ ...form, issuer: e.target.value })}
                aria-invalid={!!formErrors.issuer}
                aria-describedby={formErrors.issuer ? "c-issuer-error" : undefined}
              />
              {formErrors.issuer && (
                <p id="c-issuer-error" className={shared.fieldError}>
                  {formErrors.issuer}
                </p>
              )}
            </div>

            <div className={shared.field}>
              <label htmlFor="c-date">Tahun/tanggal *</label>
              <input
                id="c-date"
                type="text"
                placeholder="mis. 2026"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                aria-invalid={!!formErrors.date}
                aria-describedby={formErrors.date ? "c-date-error" : undefined}
              />
              {formErrors.date && (
                <p id="c-date-error" className={shared.fieldError}>
                  {formErrors.date}
                </p>
              )}
            </div>

            <div className={`${shared.field} ${shared.fullWidth}`}>
              <label htmlFor="c-description">Deskripsi</label>
              <textarea
                id="c-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className={shared.field}>
              <label htmlFor="c-sort">Urutan tampil</label>
              <input
                id="c-sort"
                type="text"
                inputMode="numeric"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
              />
            </div>

            <div className={`${shared.field} ${shared.fullWidth}`}>
              <ImageUploadField
                id="c-url"
                label="File sertifikat (gambar)"
                value={form.url ?? ""}
                onChange={(url) => setForm({ ...form, url })}
                folder="certifications"
              />
            </div>
          </div>

          <div className={shared.formActions}>
            <button type="button" className={shared.secondaryBtn} onClick={() => setFormOpen(false)}>
              Batal
            </button>
            <button type="submit" className={shared.submitBtn} disabled={saving}>
              {saving && <Loader2 size={15} className={shared.spin} />}
              {saving ? "Menyimpan…" : editing ? "Simpan perubahan" : "Tambah sertifikasi"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Hapus sertifikasi ini?"
        description={`"${pendingDelete?.name}" akan dihapus permanen dan langsung hilang dari halaman publik.`}
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
