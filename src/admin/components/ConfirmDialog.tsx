import { AlertTriangle } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import styles from "./ConfirmDialog.module.css";

interface Props {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Hapus",
  danger = true,
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal open={open} onClose={onCancel}>
      <div className={styles.wrap}>
        <span className={`${styles.iconWrap} ${danger ? styles.danger : ""}`}>
          <AlertTriangle size={20} />
        </span>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel} disabled={busy}>
            Batal
          </button>
          <button
            type="button"
            className={`${styles.confirmBtn} ${danger ? styles.danger : ""}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Memproses…" : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
