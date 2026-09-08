import { CheckCircle2, Clock, FileCode2, Archive } from "lucide-react";
import type { Project } from "../../data/content";
import styles from "./StatusBadge.module.css";

const config: Record<Project["status"], { label: string; icon: typeof CheckCircle2; cls: string }> = {
  live: { label: "Live", icon: CheckCircle2, cls: styles.live },
  "in-progress": { label: "Dalam pengerjaan", icon: Clock, cls: styles.progress },
  "source-only": { label: "Source tersedia", icon: FileCode2, cls: styles.source },
  archived: { label: "Arsip", icon: Archive, cls: styles.archived },
};

export function StatusBadge({ status }: { status: Project["status"] }) {
  const { label, icon: Icon, cls } = config[status];
  return (
    <span className={`${styles.badge} ${cls}`}>
      <Icon size={12} />
      {label}
    </span>
  );
}
