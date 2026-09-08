import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import styles from "./TagInput.module.css";

interface Props {
  id: string;
  label: string;
  hint?: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

/**
 * Input tag/chip untuk field array bebas seperti "stack" atau "features".
 * Ketik lalu Enter/koma untuk menambah, klik X pada chip untuk hapus.
 * Dibuat sebagai komponen sendiri (bukan textarea dipisah koma) supaya
 * jelas terlihat sebagai daftar item, bukan satu blok teks.
 */
export function TagInput({ id, label, hint, values, onChange, placeholder }: Props) {
  const [draft, setDraft] = useState("");

  function commitDraft() {
    const value = draft.trim();
    if (!value) return;
    if (!values.includes(value)) onChange([...values, value]);
    setDraft("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitDraft();
    } else if (e.key === "Backspace" && draft === "" && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  }

  function removeAt(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.box} onClick={() => document.getElementById(id)?.focus()}>
        {values.map((value, i) => (
          <span key={value + i} className={styles.chip}>
            {value}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeAt(i);
              }}
              aria-label={`Hapus ${value}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          id={id}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitDraft}
          placeholder={values.length === 0 ? placeholder : ""}
          className={styles.input}
          autoComplete="off"
        />
      </div>
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}
