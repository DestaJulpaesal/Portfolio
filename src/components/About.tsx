import { motion } from "framer-motion";
import { ArrowUpRight, Download, MapPin, Sparkles } from "lucide-react";
import { hasRealUrl } from "../data/content";
import { useAboutContent, useProfileContent } from "../hooks/useSiteContent";
import { MagneticButton } from "./ui/MagneticButton";
import styles from "./About.module.css";

export function About() {
  const { profile } = useProfileContent();
  const { about } = useAboutContent();

  return (
    <section id="about" className={styles.aboutSection}>
      <div className={`container ${styles.container}`}>
        <div className={styles.sectionHeader}>
          <p className={`mono ${styles.eyebrow}`}>
            <span className={styles.number}>01</span>
            <span className={styles.eyebrowRule} />
            Tentang Saya
          </p>
          <span className={`mono ${styles.headerNote}`}>SEDIKIT TENTANG PERJALANAN SAYA</span>
        </div>

        <div className={styles.editorialGrid}>
          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className={styles.profilePanel}
            aria-label={`Profil ${profile.name}`}
          >
            <div className={styles.portrait}>
              {about.photo ? (
                <img
                  src={about.photo}
                  alt={profile.name}
                  className={`${styles.photo} ${styles[`photo-${about.photoFilter ?? "natural"}`]}`}
                />
              ) : (
                <div className={`mono ${styles.photoPlaceholder}`}>Foto profil</div>
              )}
              <span className={`mono ${styles.portraitIndex}`}>01 / PROFILE</span>
              <div className={styles.portraitCaption}>
                <span className={`mono ${styles.identityLabel}`}>STUDENT & BUILDER</span>
                <h3>{profile.name}</h3>
                <p>{profile.role}</p>
              </div>
            </div>

            <div className={styles.locationBar}>
              <MapPin size={14} />
              <span>{profile.location}</span>
              <span className={styles.statusDot} aria-label="Terbuka untuk kolaborasi" />
            </div>

            <div className={styles.stats}>
              {profile.stats.map((stat, index) => (
                <div className={styles.stat} key={stat.label}>
                  <span className={`mono ${styles.statIndex}`}>0{index + 1}</span>
                  <p className={`mono ${styles.statValue}`}>{stat.value}</p>
                  <p className={styles.statLabel}>{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.aside>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className={styles.story}
          >
            <span className={`mono ${styles.kicker}`}>
              <Sparkles size={14} />
              KODE, RASA INGIN TAHU, DAN DAMPAK
            </span>
            <h2 className={styles.heading}>
              Membangun solusi
              <br />
              dengan <span>kode & kreativitas.</span>
            </h2>
            <p className={styles.paragraph}>{about.paragraph}</p>

            <div className={styles.focusHeader}>
              <span className={`mono ${styles.focusLabel}`}>HAL YANG SAYA PEGANG</span>
              <span className={`mono ${styles.focusCount}`}>
                {String(about.bullets.length).padStart(2, "0")} POIN
              </span>
            </div>

            <div className={styles.highlights}>
              {about.bullets.map((bullet, index) => (
                <motion.div
                  key={bullet}
                  className={styles.highlight}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.38, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className={`mono ${styles.highlightIndex}`}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p>{bullet}</p>
                  <ArrowUpRight size={15} className={styles.highlightArrow} aria-hidden="true" />
                </motion.div>
              ))}
            </div>

            <div className={styles.storyFooter}>
              <div className={styles.availability}>
                <span className={styles.availabilityDot} />
                <span>{profile.availability}</span>
              </div>
              <div className={styles.actions}>
                {hasRealUrl(profile.cvUrl) ? (
                  <MagneticButton href={profile.cvUrl} variant="primary" download>
                    Download CV <Download size={15} />
                  </MagneticButton>
                ) : (
                  <span className={styles.ctaDisabled} title="CV belum tersedia">
                    Download CV <Download size={15} />
                  </span>
                )}
                <MagneticButton href="#contact" variant="ghost">
                  Hubungi Saya <ArrowUpRight size={15} />
                </MagneticButton>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
