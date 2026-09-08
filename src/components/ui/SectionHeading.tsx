import { motion } from "framer-motion";
import styles from "./SectionHeading.module.css";

interface Props {
  number: string;
  eyebrow: string;
  title: string;
  align?: "left" | "center";
}

export function SectionHeading({ number, eyebrow, title, align = "left" }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`${styles.wrap} ${align === "center" ? styles.center : ""}`}
    >
      <p className={`mono ${styles.eyebrow}`}>
        <span className={styles.number}>{number}</span> {eyebrow}
      </p>
      <h2 className={styles.title}>{title}</h2>
    </motion.div>
  );
}
