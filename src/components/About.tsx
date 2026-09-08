import { motion } from "framer-motion";
import { Download, MapPin, Sparkles, ArrowUpRight } from "lucide-react";
import { hasRealUrl } from "../data/content";
import { useAboutContent, useProfileContent } from "../hooks/useSiteContent";
import { MagneticButton } from "./ui/MagneticButton";
import styles from "./About.module.css";

export function About() {
  const { profile } = useProfileContent();
  const { about } = useAboutContent();
  return (
    <section id="about">
      <div className="container">
        <p className={`mono ${styles.eyebrow}`}>
          <span className={styles.number}>01</span> About Me
        </p>

        <div className={styles.grid}>
          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.98 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={styles.profileCard}
          >
            <div className={styles.photoFrame}>
              {about.photo ? (
                <img src={about.photo} alt={profile.name} className={styles.photo} />
              ) : (
                <div className={`mono ${styles.photoPlaceholder}`}>Foto tentang kamu</div>
              )}
              <div className={styles.photoOverlay} aria-hidden="true" />
            </div>

            <div className={styles.infoStrip}>
              <span className={styles.roleRow}>
                <Sparkles size={13} />
                {profile.role}
              </span>
              <div className={styles.statsRow}>
                {profile.stats.map((stat) => (
                  <div key={stat.label} className={styles.stat}>
                    <p className={`mono ${styles.statValue}`}>{stat.value}</p>
                    <p className={styles.statLabel}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.98 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className={styles.content}
          >
            <h2 className={styles.heading}>
              Membangun solusi dengan <span className={styles.accent}>kode & kreativitas.</span>
            </h2>
            <p className={styles.paragraph}>{about.paragraph}</p>

            <div className={styles.highlights}>
              {about.bullets.map((bullet, i) => (
                <motion.div
                  key={bullet}
                  className={styles.highlightRow}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className={`mono ${styles.highlightIndex}`}>{String(i + 1).padStart(2, "0")}</span>
                  <p>{bullet}</p>
                </motion.div>
              ))}
            </div>

            <div className={styles.metaRow}>
              <span className={styles.metaItem}>
                <MapPin size={14} />
                {profile.location}
              </span>
              <span className={styles.metaDivider} aria-hidden="true" />
              <span className={styles.metaItem}>
                <span className={styles.metaDot} aria-hidden="true" />
                {profile.availability}
              </span>
            </div>

            <div className={styles.ctaRow}>
              {hasRealUrl(profile.cvUrl) ? (
                <MagneticButton href={profile.cvUrl} variant="primary" download>
                  Download CV <Download size={16} />
                </MagneticButton>
              ) : (
                <span
                  className={styles.ctaDisabled}
                  title="CV belum diunggah — tambahkan file & set profile.cvUrl di content.ts"
                >
                  Download CV <Download size={16} />
                </span>
              )}
              <MagneticButton href="#contact" variant="ghost">
                Hubungi Saya <ArrowUpRight size={16} />
              </MagneticButton>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
