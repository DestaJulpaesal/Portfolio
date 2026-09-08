import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { uploadMedia } from "../../lib/supabase";
import { useToast } from "../ToastContext";
import styles from "./ImageUploadField.module.css";

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  folder: "projects" | "certifications" | "profile";
}

const MAX_SIZE_MB = 5;

/**
 * Upload gambar ke Supabase Storage (bucket "portfolio-media") dan simpan
 * public URL-nya. Field teks di bawah tetap bisa diisi manual kalau mau
 * pakai gambar yang sudah ada di /public/projects (mis. "/projects/5.png").
 */
export function ImageUploadField({ id, label, value, onChange, folder }: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { notify } = useToast();

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      notify("error", "File harus berupa gambar (PNG, JPG, WebP, dll).");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      notify("error", `Ukuran gambar maksimal ${MAX_SIZE_MB}MB.`);
      return;
    }

    setUploading(true);
    try {
      const url = await uploadMedia(file, folder);
      onChange(url);
      notify("success", "Gambar berhasil diunggah.");
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Gagal mengunggah gambar.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>

      <div className={styles.row}>
        <div className={styles.preview}>
          {value ? (
            <img src={value} alt="" />
          ) : (
            <ImagePlus size={20} className={styles.placeholderIcon} />
          )}
        </div>

        <div className={styles.controls}>
          <input
            id={id}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/projects/nama-file.png atau URL"
            className={styles.input}
            autoComplete="off"
          />
          <div className={styles.buttonRow}>
            <button
              type="button"
              className={styles.uploadBtn}
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 size={14} className={styles.spin} /> : <ImagePlus size={14} />}
              {uploading ? "Mengunggah…" : "Unggah gambar"}
            </button>
            {value && (
              <button type="button" className={styles.clearBtn} onClick={() => onChange("")}>
                <X size={13} /> Hapus
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className={styles.hiddenInput}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      </div>
    </div>
  );
}
