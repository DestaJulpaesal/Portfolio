import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Save, RotateCcw } from "lucide-react";
import { fetchSiteContent, saveSiteContent } from "../../lib/adminData";
import { defaultAboutData, PHOTO_TREATMENT_OPTIONS, type AboutData } from "../../data/content";
import { ImageUploadField } from "../components/ImageUploadField";
import { TagInput } from "../components/TagInput";
import { useToast } from "../ToastContext";
import shared from "./AdminPage.module.css";

export function AboutAdmin() {
  const { notify } = useToast();
  const [form, setForm] = useState<AboutData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const data = await fetchSiteContent<AboutData>("about");
      setForm(data ?? defaultAboutData());
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memuat data About. Pastikan tabel 'site_content' sudah dibuat lewat supabase-setup.sql."
      );
      setForm(defaultAboutData());
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      await saveSiteContent("about", form);
      notify("success", "Section About berhasil disimpan.");
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Gagal menyimpan About.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <header className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>About</h1>
          <p className={shared.pageSubtitle}>Konten yang tampil di section "About Me" pada halaman utama.</p>
        </div>
      </header>

      {error && <p className={shared.errorBanner}>{error}</p>}

      {!form ? (
        <div className={shared.loadingCell}>
          <Loader2 size={18} className={shared.spin} /> Memuat data…
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={shared.form} noValidate>
          <div className={shared.formGrid}>
            <div className={`${shared.field} ${shared.fullWidth}`}>
              <ImageUploadField
                id="ab-photo"
                label="Foto section About"
                value={form.photo}
                onChange={(v) => setForm({ ...form, photo: v })}
                folder="profile"
              />
            </div>

            <div className={shared.field}>
              <label htmlFor="ab-photo-filter">Treatment foto About</label>
              <select
                id="ab-photo-filter"
                value={form.photoFilter ?? "natural"}
                onChange={(e) => setForm({ ...form, photoFilter: e.target.value as AboutData["photoFilter"] })}
              >
                {PHOTO_TREATMENT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={`${shared.field} ${shared.fullWidth}`}>
              <label htmlFor="ab-paragraph">Paragraf tentang kamu</label>
              <textarea
                id="ab-paragraph"
                rows={5}
                value={form.paragraph}
                onChange={(e) => setForm({ ...form, paragraph: e.target.value })}
              />
            </div>

            <div className={`${shared.field} ${shared.fullWidth}`}>
              <TagInput
                id="ab-bullets"
                label="Poin-poin singkat (highlight)"
                hint="Ketik lalu tekan Enter untuk menambah poin baru."
                values={form.bullets}
                onChange={(bullets) => setForm({ ...form, bullets })}
                placeholder="mis. Fokus pada Reusability & Clean Code"
              />
            </div>
          </div>

          <div className={shared.formActions}>
            <button
              type="button"
              className={shared.secondaryBtn}
              onClick={() => setForm(defaultAboutData())}
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
