import { useRef, type PropsWithChildren, type AnchorHTMLAttributes } from "react";
import styles from "./MagneticButton.module.css";

type Props = PropsWithChildren<
  AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: "primary" | "ghost" }
>;

/**
 * Tombol dengan efek "magnetik" ringan — bergeser sedikit mengikuti kursor
 * saat di-hover, memberi kesan interaktif tanpa berlebihan.
 */
export function MagneticButton({ children, variant = "primary", className = "", ...rest }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.25;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.25;
    el.style.transform = `translate(${x}px, ${y}px)`;
  }

  function handleMouseLeave() {
    const el = ref.current;
    if (el) el.style.transform = "translate(0, 0)";
  }

  return (
    <a
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`${styles.btn} ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </a>
  );
}
