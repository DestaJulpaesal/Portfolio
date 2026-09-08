import { useState } from "react";
import { motion } from "framer-motion";
import { Award, Download, ExternalLink, Eye } from "lucide-react";
import { cvSection, hasRealUrl, type Certification } from "../data/content";
import { useCertifications } from "../hooks/useContentData";
import { useProfileContent } from "../hooks/useSiteContent";
import { MagneticButton } from "./ui/MagneticButton";
import { Modal } from "./ui/Modal";
import styles from "./Certifications.module.css";

export function Certifications() {
  const { certifications } = useCertifications();
  const { profile } = useProfileContent();
  const [activeCert, setActiveCert] = useState<Certification | null>(null);

  function handleCardMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  return (
    <section id="certifications">
      <div className="container">
        <p className={`mono ${styles.eyebrow}`}>
          <span className={styles.number}>04</span> Sertifikasi &amp; CV
        </p>
        <h2 className={styles.heading}>Sertifikasi &amp; pencapaian</h2>

        <div className={styles.grid}>
          {certifications.map((cert, i) => (
            <motion.div
              key={cert.name + cert.date}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className={styles.card}
              onMouseMove={handleCardMouseMove}
            >
              <span className={styles.cardSpotlight} aria-hidden="true" />
              <div className={styles.cardTop}>
                <span className={styles.iconWrap}>
                  <Award size={18} />
                </span>
                {cert.url && cert.url !== "#" && (
                  <a
                    href={cert.url}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.externalLink}
                    aria-label={`Buka sertifikat ${cert.name}`}
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
              <p className={styles.certName}>{cert.name}</p>
              <p className={`mono ${styles.issuer}`}>{cert.issuer}</p>
              <p className={`mono ${styles.date}`}>{cert.date}</p>

              <button
                type="button"
                className={styles.detailBtn}
                onClick={() => setActiveCert(cert)}
              >
                <Eye size={13} /> Lihat Detail
              </button>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className={styles.cvBanner}
        >
          <div>
            <p className={styles.cvHeading}>{cvSection.heading}</p>
            <p className={styles.cvDescription}>{cvSection.description}</p>
          </div>
          {hasRealUrl(profile.cvUrl) ? (
            <MagneticButton href={profile.cvUrl} variant="primary" className={styles.cvButton} download>
              <Download size={16} />
              {cvSection.buttonLabel}
            </MagneticButton>
          ) : (
            <span
              className={`${styles.cvButton} ${styles.cvButtonDisabled}`}
              title="CV belum diunggah — tambahkan file & set profile.cvUrl di content.ts"
            >
              <Download size={16} />
              {cvSection.buttonLabel}
            </span>
          )}
        </motion.div>
      </div>

      <Modal open={!!activeCert} onClose={() => setActiveCert(null)}>
        {activeCert && (
          <div className={styles.modalBody}>
            <span className={styles.modalIconWrap}>
              <Award size={20} />
            </span>
            <h3 className={styles.modalTitle}>{activeCert.name}</h3>
            <p className={`mono ${styles.modalMeta}`}>
              {activeCert.issuer} • {activeCert.date}
            </p>
            <p className={styles.modalDescription}>{activeCert.description}</p>
            {activeCert.url && activeCert.url !== "#" && (
              <a
                href={activeCert.url}
                target="_blank"
                rel="noreferrer"
                className={styles.modalLink}
              >
                <ExternalLink size={14} /> Lihat sertifikat asli
              </a>
            )}
          </div>
        )}
      </Modal>
    </section>
  );
}
