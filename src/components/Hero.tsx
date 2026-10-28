import { motion, useDragControls } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Github,
  Instagram,
  Linkedin,
} from "lucide-react";
import { useProfileContent } from "../hooks/useSiteContent";
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

const codeTextureLines = [
  "const user = await load();",
  "if (!user) return null;",
  "export function Profile() {",
  "  return <section>",
  "    data.map(render);",
  "    const result = fetch();",
  "    return result.json();",
  "  </section>",
  "}",
];

export function Hero() {
  const { profile, loading } = useProfileContent();
  const portraitDragControls = useDragControls();

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

          <h1 className={styles.title}>
            <span className={styles.name}>{profile.name.toUpperCase()}</span>
            <span className={styles.headline}>{profile.headlineAccent}</span>
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

        </motion.div>

        <motion.div
          className={styles.portraitFrame}
          drag
          dragListener={false}
          dragControls={portraitDragControls}
          dragConstraints={{ left: -90, right: 90, top: -50, bottom: 0 }}
          dragElastic={0.12}
          dragMomentum
          whileDrag={{ scale: 1.015, cursor: "grabbing" }}
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          <img
            src={profile.photo || "/projects/hero-reference.webp"}
            alt={`Potret ${profile.name}`}
            className={`${styles.portrait} ${styles[`photo-${profile.photoFilter ?? "natural"}`]}`}
            draggable={false}
            onPointerDown={(event) => portraitDragControls.start(event)}
          />
          <motion.span
            className={styles.codeTextureMask}
            aria-hidden="true"
            title="Seret untuk mengatur posisi tekstur kode"
            drag
            dragConstraints={{ left: -90, right: 90, top: -90, bottom: 90 }}
            dragElastic={0.08}
            dragMomentum={false}
            whileDrag={{ cursor: "grabbing" }}
          >
            <pre className={styles.codeTexture}>
              {Array.from(
                { length: 48 },
                (_, index) => codeTextureLines[index % codeTextureLines.length],
              ).join("\n")}
            </pre>
          </motion.span>
        </motion.div>

        <div className={styles.profilePanel}>
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
        </div>
      </div>
    </section>
  );
}
