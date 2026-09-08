import { motion } from "framer-motion";
import { Github, Linkedin, Instagram, ArrowUp, Mail, MapPin, Sparkles } from "lucide-react";
import { useProfileContent } from "../hooks/useSiteContent";
import { TikTokIcon, WhatsAppIcon } from "./icons/BrandIcons";
import styles from "./Footer.module.css";

const socialIcons = {
  github: Github,
  linkedin: Linkedin,
  tiktok: TikTokIcon,
  instagram: Instagram,
  whatsapp: WhatsAppIcon,
};

const quickLinks = [
  { href: "#top", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#skills", label: "Skills" },
  { href: "#work", label: "Projects" },
  { href: "#certifications", label: "Sertifikasi" },
];

export function Footer() {
  const { profile } = useProfileContent();
  const year = new Date().getFullYear();
  const contactItems = [
    { icon: Mail, label: profile.email, href: `mailto:${profile.email}` },
    { icon: MapPin, label: profile.location, href: undefined },
    { icon: Sparkles, label: "Sedang belajar & berkarya", href: undefined },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.glow} aria-hidden="true" />
      <span className={styles.watermark} aria-hidden="true">
        {profile.logoMark}
      </span>

      <motion.div
        className={`container ${styles.top}`}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={styles.brandCol}>
          <a href="#top" className={styles.mark}>
            <span className={styles.markIcon}>
              <img src={profile.logoImage} alt="" className={styles.markImg} />
            </span>
            <span className="mono">
              {profile.logoMark && `${profile.logoMark}.`}
              {profile.name.split(" ")[0].toUpperCase()}
            </span>
          </a>
          <p className={styles.tagline}>{profile.tagline}</p>

          <span className={styles.availabilityBadge}>
            <span className={styles.availabilityDot} />
            {profile.availability}
          </span>

          <div className={styles.socialIcons}>
            {profile.socials.map((social) => {
              const Icon = socialIcons[social.icon];
              return (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className={styles.socialIcon}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Icon size={15} />
                </a>
              );
            })}
          </div>
        </div>

        <div className={styles.linkCol}>
          <p className={styles.colTitle}>Navigasi</p>
          <nav className={styles.linkList} aria-label="Navigasi footer">
            {quickLinks.map((link) => (
              <a key={link.href} href={link.href}>
                <span className={styles.linkDash} />
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className={styles.linkCol}>
          <p className={styles.colTitle}>Kontak</p>
          <div className={styles.contactList}>
            {contactItems.map((item) => {
              const Icon = item.icon;
              const Wrapper = item.href ? "a" : "div";
              return (
                <Wrapper key={item.label} href={item.href} className={styles.contactItem}>
                  <span className={styles.contactIcon}>
                    <Icon size={13} />
                  </span>
                  {item.label}
                </Wrapper>
              );
            })}
          </div>
        </div>
      </motion.div>

      <motion.div
        className={`container ${styles.bottomBar}`}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className={styles.copy}>
          © {year} {profile.name}. All rights reserved.
        </p>
        <a href="#top" className={styles.toTop} aria-label="Kembali ke atas">
          <ArrowUp size={16} />
        </a>
      </motion.div>
    </footer>
  );
}
