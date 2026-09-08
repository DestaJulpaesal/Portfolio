import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Plus, Trash2, Save, RotateCcw } from "lucide-react";
import { fetchSiteContent, saveSiteContent } from "../../lib/adminData";
import { defaultProfileData, type ProfileData, type SocialLink } from "../../data/content";
import { ImageUploadField } from "../components/ImageUploadField";
import { useToast } from "../ToastContext";
import shared from "./AdminPage.module.css";
import repeater from "../components/RepeaterField.module.css";

const SOCIAL_ICON_OPTIONS: SocialLink["icon"][] = [
  "github",
  "linkedin",
  "tiktok",
  "instagram",
  "whatsapp",
];

export function ProfileAdmin() {
  const { notify } = useToast();
  const [form, setForm] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const data = await fetchSiteContent<ProfileData>("profile");
      setForm(data ?? defaultProfileData());
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memuat data profil. Pastikan tabel 'site_content' sudah dibuat lewat supabase-setup.sql."
      );
      setForm(defaultProfileData());
    }
  }

  useEffect(() => {
    load();
  }, []);

  function update<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function updateStat(index: number, key: "label" | "value", value: string) {
    setForm((prev) => {
      if (!prev) return prev;
      const stats = prev.stats.map((s, i) => (i === index ? { ...s, [key]: value } : s));
      return { ...prev, stats };
    });
  }

  function addStat() {
    setForm((prev) => (prev ? { ...prev, stats: [...prev.stats, { label: "", value: "" }] } : prev));
  }

  function removeStat(index: number) {
    setForm((prev) => (prev ? { ...prev, stats: prev.stats.filter((_, i) => i !== index) } : prev));
  }

  function updateSocial(index: number, key: keyof SocialLink, value: string) {
    setForm((prev) => {
      if (!prev) return prev;
      const socials = prev.socials.map((s, i) => (i === index ? { ...s, [key]: value } : s));
      return { ...prev, socials: socials as SocialLink[] };
    });
  }

  function addSocial() {
    setForm((prev) =>
      prev
        ? { ...prev, socials: [...prev.socials, { label: "", href: "", icon: "github" }] }
        : prev
    );
  }

  function removeSocial(index: number) {
    setForm((prev) => (prev ? { ...prev, socials: prev.socials.filter((_, i) => i !== index) } : prev));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      await saveSiteContent("profile", form);
      notify("success", "Profil & Hero berhasil disimpan.");
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Gagal menyimpan profil.");
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    setForm(defaultProfileData());
    notify("success", "Form dikembalikan ke data default (belum disimpan).");
  }

  return (
    <div>
      <header className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>Profile &amp; Hero</h1>
          <p className={shared.pageSubtitle}>
            Konten yang tampil di section Hero (paling atas) dan dipakai ulang di Nav, Footer, dan Contact.
          </p>
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
            <div className={shared.field}>
              <label htmlFor="pr-headline-top">Headline baris 1</label>
              <input
                id="pr-headline-top"
                type="text"
                value={form.headlineTop}
                onChange={(e) => update("headlineTop", e.target.value)}
              />
            </div>
            <div className={shared.field}>
              <label htmlFor="pr-headline-accent">Headline baris 2 (aksen)</label>
              <input
                id="pr-headline-accent"
                type="text"
                value={form.headlineAccent}
                onChange={(e) => update("headlineAccent", e.target.value)}
              />
            </div>

            <div className={`${shared.field} ${shared.fullWidth}`}>
              <label htmlFor="pr-tagline">Tagline</label>
              <textarea
                id="pr-tagline"
                value={form.tagline}
                onChange={(e) => update("tagline", e.target.value)}
              />
            </div>

            <div className={shared.field}>
              <label htmlFor="pr-role">Role / jabatan</label>
              <input
                id="pr-role"
                type="text"
                value={form.role}
                onChange={(e) => update("role", e.target.value)}
              />
            </div>
            <div className={shared.field}>
              <label htmlFor="pr-availability">Status ketersediaan</label>
              <input
                id="pr-availability"
                type="text"
                value={form.availability}
                onChange={(e) => update("availability", e.target.value)}
                placeholder="mis. Terbuka untuk kolaborasi & proyek"
              />
            </div>

            <div className={shared.field}>
              <label htmlFor="pr-location">Lokasi</label>
              <input
                id="pr-location"
                type="text"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
              />
            </div>
            <div className={shared.field}>
              <label htmlFor="pr-email">Email</label>
              <input
                id="pr-email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
            <div className={shared.field}>
              <label htmlFor="pr-phone">Nomor telepon</label>
              <input
                id="pr-phone"
                type="text"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="+62 8xx-xxxx-xxxx"
              />
            </div>
            <div className={shared.field}>
              <label htmlFor="pr-cv">Link CV (opsional)</label>
              <input
                id="pr-cv"
                type="text"
                value={form.cvUrl}
                onChange={(e) => update("cvUrl", e.target.value)}
                placeholder="https://… atau kosongkan / '#' kalau belum ada"
              />
            </div>

            <div className={`${shared.field} ${shared.fullWidth}`}>
              <ImageUploadField
                id="pr-photo"
                label="Foto profil (Hero & About)"
                value={form.photo}
                onChange={(v) => update("photo", v)}
                folder="profile"
              />
            </div>

            <div className={`${shared.field} ${shared.fullWidth}`}>
              <ImageUploadField
                id="pr-logo"
                label="Logo kecil (Nav & Footer)"
                value={form.logoImage}
                onChange={(v) => update("logoImage", v)}
                folder="profile"
              />
            </div>

            <div className={`${shared.field} ${shared.fullWidth}`}>
              <div className={repeater.section}>
                <div className={repeater.sectionHead}>
                  <div>
                    <p className={repeater.sectionTitle}>Statistik (di section About)</p>
                    <p className={repeater.sectionHint}>mis. Semester — 2, Project Selesai — 10</p>
                  </div>
                  <button type="button" className={repeater.addBtn} onClick={addStat}>
                    <Plus size={13} /> Tambah
                  </button>
                </div>

                {form.stats.length === 0 && <p className={repeater.emptyHint}>Belum ada statistik.</p>}

                {form.stats.map((stat, i) => (
                  <div className={repeater.row} key={i}>
                    <div className={repeater.rowInputs}>
                      <input
                        type="text"
                        placeholder="Label (mis. Semester)"
                        value={stat.label}
                        onChange={(e) => updateStat(i, "label", e.target.value)}
                        aria-label={`Label statistik ${i + 1}`}
                      />
                      <input
                        type="text"
                        placeholder="Nilai (mis. 2)"
                        value={stat.value}
                        onChange={(e) => updateStat(i, "value", e.target.value)}
                        aria-label={`Nilai statistik ${i + 1}`}
                      />
                    </div>
                    <button
                      type="button"
                      className={repeater.removeBtn}
                      onClick={() => removeStat(i)}
                      aria-label={`Hapus statistik ${i + 1}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${shared.field} ${shared.fullWidth}`}>
              <div className={repeater.section}>
                <div className={repeater.sectionHead}>
                  <div>
                    <p className={repeater.sectionTitle}>Social links</p>
                    <p className={repeater.sectionHint}>Tampil di Hero, Footer, dan tombol WhatsApp di Contact.</p>
                  </div>
                  <button type="button" className={repeater.addBtn} onClick={addSocial}>
                    <Plus size={13} /> Tambah
                  </button>
                </div>

                {form.socials.length === 0 && <p className={repeater.emptyHint}>Belum ada social link.</p>}

                {form.socials.map((social, i) => (
                  <div className={repeater.row} key={i}>
                    <div className={`${repeater.rowInputs} ${repeater.threeCol}`}>
                      <input
                        type="text"
                        placeholder="Label (mis. GitHub)"
                        value={social.label}
                        onChange={(e) => updateSocial(i, "label", e.target.value)}
                        aria-label={`Label social ${i + 1}`}
                      />
                      <input
                        type="text"
                        placeholder="https://…"
                        value={social.href}
                        onChange={(e) => updateSocial(i, "href", e.target.value)}
                        aria-label={`Link social ${i + 1}`}
                      />
                      <select
                        value={social.icon}
                        onChange={(e) => updateSocial(i, "icon", e.target.value)}
                        aria-label={`Ikon social ${i + 1}`}
                      >
                        {SOCIAL_ICON_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      className={repeater.removeBtn}
                      onClick={() => removeSocial(i)}
                      aria-label={`Hapus social ${i + 1}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={shared.formActions}>
            <button type="button" className={shared.secondaryBtn} onClick={handleReset} disabled={saving}>
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
