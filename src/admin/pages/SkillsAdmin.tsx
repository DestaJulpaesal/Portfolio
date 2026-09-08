import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Save, RotateCcw, Plus, Trash2, Folder } from "lucide-react";
import { fetchSiteContent, saveSiteContent } from "../../lib/adminData";
import { defaultSkillsData, SKILL_ICON_OPTIONS, type SkillsData, type SkillCategory } from "../../data/content";
import { useToast } from "../ToastContext";
import shared from "./AdminPage.module.css";
import repeater from "../components/RepeaterField.module.css";

export function SkillsAdmin() {
  const { notify } = useToast();
  const [form, setForm] = useState<SkillsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const data = await fetchSiteContent<SkillsData>("skills");
      setForm(data ?? defaultSkillsData());
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memuat data Skills. Pastikan tabel 'site_content' sudah dibuat lewat supabase-setup.sql."
      );
      setForm(defaultSkillsData());
    }
  }

  useEffect(() => {
    load();
  }, []);

  function updateCategories(updater: (categories: SkillCategory[]) => SkillCategory[]) {
    setForm((prev) => (prev ? { ...prev, categories: updater(prev.categories) } : prev));
  }

  function addCategory() {
    updateCategories((cats) => [...cats, { name: "Kategori baru", items: [] }]);
  }

  function removeCategory(catIndex: number) {
    updateCategories((cats) => cats.filter((_, i) => i !== catIndex));
  }

  function renameCategory(catIndex: number, name: string) {
    updateCategories((cats) => cats.map((c, i) => (i === catIndex ? { ...c, name } : c)));
  }

  function addItem(catIndex: number) {
    updateCategories((cats) =>
      cats.map((c, i) =>
        i === catIndex ? { ...c, items: [...c.items, { name: "", icon: "javascript" }] } : c
      )
    );
  }

  function removeItem(catIndex: number, itemIndex: number) {
    updateCategories((cats) =>
      cats.map((c, i) => (i === catIndex ? { ...c, items: c.items.filter((_, j) => j !== itemIndex) } : c))
    );
  }

  function updateItem(catIndex: number, itemIndex: number, key: "name" | "icon", value: string) {
    updateCategories((cats) =>
      cats.map((c, i) =>
        i === catIndex
          ? {
              ...c,
              items: c.items.map((item, j) => (j === itemIndex ? { ...item, [key]: value } : item)),
            }
          : c
      )
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      await saveSiteContent("skills", form);
      notify("success", "Section Skills berhasil disimpan.");
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Gagal menyimpan Skills.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <header className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>Skills</h1>
          <p className={shared.pageSubtitle}>
            Kelola kategori & item skill yang tampil di section "Skills & Stack".
          </p>
        </div>
        <button type="button" className={shared.primaryBtn} onClick={addCategory}>
          <Plus size={16} /> Tambah kategori
        </button>
      </header>

      {error && <p className={shared.errorBanner}>{error}</p>}

      {!form ? (
        <div className={shared.loadingCell}>
          <Loader2 size={18} className={shared.spin} /> Memuat data…
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={shared.form} noValidate>
          {form.categories.length === 0 && (
            <div className={shared.emptyState}>
              <Folder size={30} />
              <p>Belum ada kategori skill. Tambahkan yang pertama.</p>
              <button type="button" className={shared.primaryBtn} onClick={addCategory}>
                <Plus size={16} /> Tambah kategori
              </button>
            </div>
          )}

          {form.categories.map((cat, ci) => (
            <div className={repeater.section} key={ci}>
              <div className={repeater.sectionHead}>
                <input
                  type="text"
                  value={cat.name}
                  onChange={(e) => renameCategory(ci, e.target.value)}
                  aria-label={`Nama kategori ${ci + 1}`}
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    background: "transparent",
                    border: "none",
                    color: "var(--text)",
                    fontFamily: "inherit",
                    flex: 1,
                    minWidth: 0,
                  }}
                />
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button type="button" className={repeater.addBtn} onClick={() => addItem(ci)}>
                    <Plus size={13} /> Skill
                  </button>
                  <button
                    type="button"
                    className={repeater.removeBtn}
                    onClick={() => removeCategory(ci)}
                    aria-label={`Hapus kategori ${cat.name || ci + 1}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {cat.items.length === 0 && <p className={repeater.emptyHint}>Belum ada skill di kategori ini.</p>}

              {cat.items.map((item, ii) => (
                <div className={repeater.row} key={ii}>
                  <div className={repeater.rowInputs}>
                    <input
                      type="text"
                      placeholder="Nama skill (mis. Laravel)"
                      value={item.name}
                      onChange={(e) => updateItem(ci, ii, "name", e.target.value)}
                      aria-label={`Nama skill ${ii + 1} di kategori ${cat.name}`}
                    />
                    <select
                      value={item.icon}
                      onChange={(e) => updateItem(ci, ii, "icon", e.target.value)}
                      aria-label={`Ikon skill ${ii + 1} di kategori ${cat.name}`}
                    >
                      {SKILL_ICON_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    className={repeater.removeBtn}
                    onClick={() => removeItem(ci, ii)}
                    aria-label={`Hapus skill ${ii + 1}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ))}

          <div className={shared.formActions}>
            <button
              type="button"
              className={shared.secondaryBtn}
              onClick={() => setForm(defaultSkillsData())}
              disabled={saving}
            >
              <RotateCcw size={14} /> Reset ke default
            </button>
            <button type="submit" className={shared.submitBtn} disabled={saving}>
              {saving ? <Loader2 size={15} className={shared.spin} /> : <Save size={15} />}
              {saving ? "Menyimpan…" : "Simpan perubahan"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
