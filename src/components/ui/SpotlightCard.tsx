import { useRef, type PropsWithChildren, type HTMLAttributes } from "react";
import styles from "./SpotlightCard.module.css";

type Props = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;

/**
 * Card dengan efek spotlight yang mengikuti posisi kursor — dipakai di
 * Services, Projects, dan Testimonials supaya interaksi hover terasa hidup.
 */
export function SpotlightCard({ children, className = "", ...rest }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={`${styles.card} ${className}`}
      {...rest}
    >
      <div className={styles.spotlight} />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
