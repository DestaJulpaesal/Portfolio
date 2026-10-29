import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Github,
  Instagram,
  Linkedin,
} from "lucide-react";
import { useProfileContent } from "../hooks/useSiteContent";
import { useTypewriter } from "../hooks/useTypewriter";
import { MagneticButton } from "./ui/MagneticButton";
import { TikTokIcon, WhatsAppIcon } from "./icons/BrandIcons";
import styles from "./Hero.module.css";

const socialIcons = {
  github: Github,
  linkedin: Linkedin,
  tiktok: TikTokIcon,
  instagram: Instagram,
  whatsapp: WhatsAppIcon,
};

export function Hero() {
  const { profile, loading } = useProfileContent();
  const { displayed, activeLine, done } = useTypewriter(
    [profile.name.toUpperCase(), profile.headlineAccent],
    { speed: 48, lineDelay: 220, startDelay: 250 }
  );

  if (loading) {
    return (
      <section id="top" className={styles.hero} aria-busy="true">
        <div className={`container ${styles.loadingState}`} />
      </section>
    );
  }

  return (
    <section id="top" className={styles.hero}>
      <div className={styles.background} aria-hidden="true">
        <span className={styles.orbit} />
        <span className={styles.orbitInner} />
        <span className={styles.glowOrb} />
        <span className={`${styles.cube} ${styles.cubeOne}`} />
        <span className={`${styles.cube} ${styles.cubeTwo}`} />
        <span className={`${styles.cube} ${styles.cubeThree}`} />
        <span className={styles.particleField} />
      </div>

      <div className={styles.grid}>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className={styles.copy}
        >
          <p className={`mono ${styles.hello}`}>
            <span />
            HELLO, I’M
          </p>

          <h1 className={styles.title} aria-label={`${profile.name}, ${profile.headlineAccent}`}>
            <span className={styles.titleMask}>
              <span className={styles.name} aria-hidden="true">
                {displayed[0]}
                {activeLine === 0 && !done && <span className={styles.typeCursor} />}
              </span>
            </span>
            <span className={styles.titleMask}>
              <span className={styles.headline} aria-hidden="true">
                {displayed[1]}
                {activeLine === 1 && !done && <span className={styles.typeCursor} />}
              </span>
            </span>
          </h1>

          <p className={styles.tagline}>{profile.tagline}</p>

          <div className={styles.actions}>
            <MagneticButton href="#work" variant="primary" className={styles.workButton}>
              Lihat Proyek <ArrowRight size={16} />
            </MagneticButton>
            <a href="#about" className={styles.aboutButton}>
              <span><ArrowUpRight size={16} /></span>
              Tentang Saya
            </a>
          </div>
          <nav className={styles.socialLinks} aria-label="Media sosial">
            {profile.socials.map((social) => {
              const Icon = socialIcons[social.icon];
              return (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Icon size={15} aria-hidden="true" />
                  <span>{social.label}</span>
                </a>
              );
            })}
          </nav>
        </motion.div>

        <motion.div
          className={styles.portraitFrame}
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          <img
            src={profile.photo || "/projects/hero-reference.webp"}
            alt={`Potret ${profile.name}`}
            className={`${styles.portrait} ${styles[`photo-${profile.photoFilter ?? "natural"}`]}`}
            draggable={false}
          />
        </motion.div>

      </div>
    </section>
  );
}
