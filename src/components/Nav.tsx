import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useProfileContent } from "../hooks/useSiteContent";
import { MagneticButton } from "./ui/MagneticButton";
import { ThemeToggle } from "./ui/ThemeToggle";
import styles from "./Nav.module.css";

const links = [
  { href: "#top", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#skills", label: "Skills" },
  { href: "#work", label: "Projects" },
  { href: "#certifications", label: "Sertifikasi" },
  { href: "#contact", label: "Contact" },
];

export function Nav() {
  const { profile } = useProfileContent();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeHash, setActiveHash] = useState("#top");

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(100, (window.scrollY / scrollable) * 100) : 0);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll-spy: tandai link yang sesuai section paling dominan di viewport,
  // supaya nav selalu mencerminkan posisi baca user tanpa perlu hover.
  useEffect(() => {
    const sections = links
      .map((link) => document.querySelector(link.href))
      .filter((el): el is Element => !!el);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          setActiveHash(`#${visible.target.id}`);
        }
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <header className={`${styles.nav} ${scrolled ? styles.scrolled : ""}`}>
      <span className={styles.progressBar} style={{ width: `${progress}%` }} aria-hidden="true" />
      <div className={`container ${styles.inner}`}>
        <a href="#top" className={styles.mark} aria-label="Kembali ke atas">
          <span className={styles.markIcon}>
            <img src={profile.logoImage} alt="" className={styles.markImg} />
          </span>
          <span className="mono">
            {profile.logoMark && `${profile.logoMark}.`}
            {profile.name.split(" ")[0].toUpperCase()}
          </span>
        </a>

        <nav className={styles.links} aria-label="Navigasi utama">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`${styles.link} ${activeHash === link.href ? styles.linkActive : ""}`}
              aria-current={activeHash === link.href ? "true" : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className={styles.actions}>
          <ThemeToggle className={styles.themeToggleGap} />

          <MagneticButton href="#contact" variant="primary" className={styles.cta}>
            Let's Talk →
          </MagneticButton>

          <button
            className={styles.burger}
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Tutup menu" : "Buka menu"}
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            className={styles.mobileMenu}
            aria-label="Navigasi mobile"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {links.map((link, i) => (
              <motion.a
                key={link.href}
                href={link.href}
                className={`${styles.mobileLink} ${activeHash === link.href ? styles.mobileLinkActive : ""}`}
                onClick={() => setOpen(false)}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              >
                {link.label}
              </motion.a>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: links.length * 0.04, ease: [0.22, 1, 0.36, 1] }}
              className={styles.mobileCtaRow}
            >
              <MagneticButton
                href="#contact"
                variant="primary"
                className={styles.mobileCta}
                onClick={() => setOpen(false)}
              >
                Let's Talk →
              </MagneticButton>
            </motion.div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
