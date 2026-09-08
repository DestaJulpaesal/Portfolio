import { useEffect, useId, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Github, Linkedin, Instagram, ArrowUpRight } from "lucide-react";
import { useProfileContent } from "../hooks/useSiteContent";
import { MagneticButton } from "./ui/MagneticButton";
import { useTypewriter } from "../hooks/useTypewriter";
import { TikTokIcon, WhatsAppIcon } from "./icons/BrandIcons";
import { useRopePhysics } from "../hooks/useRopePhysics";
import styles from "./Hero.module.css";

const socialIcons = {
  github: Github,
  linkedin: Linkedin,
  tiktok: TikTokIcon,
  instagram: Instagram,
  whatsapp: WhatsAppIcon,
};

const ROPE_SVG_WIDTH = 520;
const ROPE_SVG_HEIGHT = 1040;
const ROPE_SVG_PAD_TOP = 420;

export function Hero() {
  const { profile, loading } = useProfileContent();
  const ropePathId = useId().replace(/:/g, "");
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [cardOpacity, setCardOpacity] = useState(0);
  // Sisi kartu yang lagi menghadap depan: "photo" (foto) atau "id" (kartu ID
  // di baliknya, berisi nama/role/kontak). Diubah tiap kartu diklik & dibalik.
  const [cardFace, setCardFace] = useState<"photo" | "id">("photo");
  const [hasFlippedOnce, setHasFlippedOnce] = useState(false);
  // Panjang tali (px) & jarak tarik maksimum, menyesuaikan breakpoint layar
  // sama seperti tinggi .strap versi lama — supaya di HP tali tidak jatuh
  // dari jarak yang jauh lebih panjang daripada layarnya sendiri.
  function getRopeLength() {
    if (typeof window === "undefined") return 460;
    const w = window.innerWidth;
    if (w <= 480) return 190;
    if (w <= 900) return 270;
    return 460;
  }

  const rope = useRopePhysics(
    {
      segments: 9,
      gravity: 1500,
      damping: 0.985,
      iterations: 5,
      windAmplitude: 30,
      getLength: getRopeLength,
      getMaxReach: () => getRopeLength() * 1.05,
    },
    {
      onTap: () => flipCard(),
      onGrabChange: setIsGrabbing,
    }
  );

  const headlineLines = useMemo(
    () => [profile.headlineTop, profile.headlineAccent],
    [profile.headlineTop, profile.headlineAccent]
  );
  const strapLabel = useMemo(() => {
    const unit = `${profile.name.toUpperCase()} • `;
    return unit.repeat(6);
  }, [profile.name]);
  const { displayed, activeLine, done } = useTypewriter(headlineLines, {
    speed: 48,
    lineDelay: 340,
    startDelay: 300,
  });

  // Begitu komponen mount, tali disusun ulang dalam keadaan "tergulung"
  // dekat anchor (lihat rope.dropIn di useRopePhysics) lalu dilepas —
  // gravitasi & constraint solver di rAF loop yang bikin dia jatuh sambil
  // meliuk turun sendiri kayak ular, bukan animasi keyframe yang di-scripted.
  useEffect(() => {
    rope.svgCenterXRef.current = ROPE_SVG_WIDTH / 2;
    rope.svgPadTopRef.current = ROPE_SVG_PAD_TOP;
    rope.dropIn();
    const fadeTimer = window.setTimeout(() => setCardOpacity(1), 160);
    return () => window.clearTimeout(fadeTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Membalik kartu 180° di sumbu Y (efek "kartu ID dibalik"), bukan muter
  // 360° balik ke foto yang sama seperti sebelumnya. Nilai sudut terus
  // ditambah tiap klik (bukan bolak-balik 0/180) supaya putarannya selalu
  // terasa "hidup" ke arah yang sama, lalu dinormalisasi biar angkanya
  // tidak terus membesar tanpa batas.
  function flipCard() {
    setCardFace((face) => (face === "photo" ? "id" : "photo"));
    setHasFlippedOnce(true);
  }

  // Kartu adalah <a href="#about">, jadi klik/tap-nya selalu di-preventDefault
  // supaya tidak langsung lompat ke section #about — buka-balik kartu
  // ditentukan lewat pointerup (lihat releaseDrag), bukan dari sini, karena
  // event click bawaan browser kadang tidak muncul di HP setelah
  // setPointerCapture dipanggil (bikin tombol kerasa "gabisa dibalik").
  function handleCardClick(e: React.MouseEvent) {
    e.preventDefault();
  }

  // Tombol "Lihat Profil" di sisi belakang kartu — jangan ikut membalik
  // kartu lagi, langsung meluncur ke section About.
  function handleViewProfile(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    document.querySelector("#about")?.scrollIntoView({ behavior: "smooth" });
  }

  if (loading) {
    return (
      <section id="top" className={styles.hero} aria-busy="true">
        <div className={`container ${styles.loadingState}`} />
      </section>
    );
  }

  return (
    <section id="top" className={styles.hero}>
      <div className={`container ${styles.grid}`}>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={styles.copy}
        >
          <span className={styles.badge}>
            <span className={styles.badgeDot} />
            {profile.availability}
          </span>

          <h1 className={styles.title} aria-label={`${profile.headlineTop} ${profile.headlineAccent}`}>
            <span aria-hidden="true">
              {displayed[0]}
              {!done && activeLine === 0 && <span className={styles.typeCursor} />}
              <br />
              <span className={styles.accentText}>{displayed[1]}</span>
              {!done && activeLine === 1 && <span className={styles.typeCursor} />}
            </span>
          </h1>

          <p className={styles.tagline}>{profile.tagline}</p>

          <div className={styles.actions}>
            <MagneticButton href="#contact" variant="primary">
              Hire Me <ArrowUpRight size={16} />
            </MagneticButton>
            <MagneticButton href="#work" variant="ghost">
              View My Work
            </MagneticButton>
          </div>

          <div className={styles.socialRow}>
            <span className={`mono ${styles.followLabel}`}>Follow me on</span>
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
                    <Icon size={16} />
                  </a>
                );
              })}
            </div>
          </div>
        </motion.div>

        <div className={styles.photoWrap}>
          <span className={styles.photoGlow} aria-hidden="true" />
          <span
            className={styles.decoDot}
            aria-hidden="true"
            style={{ width: 14, height: 14, top: 40, left: "18%" }}
          />
          <span
            className={styles.decoDot}
            aria-hidden="true"
            style={{ width: 22, height: 22, top: 110, right: "12%" }}
          />
          <div className={styles.lanyardStage} ref={rope.stageRef}>
            <span className={styles.strapClip} aria-hidden="true" />

            {/* Tali digambar sebagai SVG path yang di-update tiap frame oleh
                simulasi fisika (lihat useRopePhysics) — jadi dia beneran
                meliuk kayak tali/ular, bukan satu balok kaku yang diputar. */}
            <svg
              className={styles.ropeSvg}
              width={ROPE_SVG_WIDTH}
              height={ROPE_SVG_HEIGHT}
              viewBox={`0 0 ${ROPE_SVG_WIDTH} ${ROPE_SVG_HEIGHT}`}
              aria-hidden="true"
            >
              <path ref={rope.pathRef} id={ropePathId} className={styles.ropeBase} d="" />
              <path ref={rope.pathGlowRef} className={styles.ropeHighlight} d="" />
              <text className={styles.ropeLabel}>
                <textPath href={`#${ropePathId}`} startOffset="1%">
                  {strapLabel}
                </textPath>
              </text>
            </svg>

            <div
              ref={rope.cardWrapRef}
              className={`${styles.cardWrap} ${isGrabbing ? styles.grabbing : ""}`}
              style={{ opacity: cardOpacity }}
              onPointerDown={rope.onPointerDown}
              onPointerMove={rope.onPointerMove}
              onPointerUp={rope.onPointerUp}
              onPointerCancel={rope.onPointerCancel}
            >
              <motion.a
                href="#about"
                className={styles.card}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                whileHover={{ y: -4, transition: { duration: 0.2, ease: "easeOut" } }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCardClick}
                aria-label={
                  cardFace === "photo"
                    ? "Klik untuk membalik kartu dan lihat info singkat, tarik untuk mengayun bebas"
                    : "Klik untuk membalik kartu kembali ke foto"
                }
              >
                <span className={styles.cardHole} aria-hidden="true" />

                <div className={`${styles.flipper} ${cardFace === "id" ? styles.flipperFlipped : ""}`}>
                  {/* Sisi depan: foto */}
                  <div className={`${styles.cardFace} ${styles.cardInner}`}>
                    {profile.photo ? (
                      <img src={profile.photo} alt={profile.name} className={styles.photo} />
                    ) : (
                      <div className={`mono ${styles.photoPlaceholder}`}>
                        Taruh foto kamu di
                        <br />
                        <code>src/data/content.ts</code>
                      </div>
                    )}
                    <span className={styles.cardShine} aria-hidden="true" />
                    {!hasFlippedOnce && (
                      <span className={styles.flipHint} aria-hidden="true">
                        ⟲
                      </span>
                    )}
                  </div>

                  {/* Sisi belakang: kartu ID mini */}
                  <div className={`${styles.cardFace} ${styles.cardBack}`}>
                    <div className={styles.idTopRow}>
                      <span className={styles.idChip} aria-hidden="true" />
                      <span className={`mono ${styles.idLogo}`}>{profile.logoMark}</span>
                    </div>
                    <p className={`mono ${styles.idName}`}>{profile.name}</p>
                    <p className={styles.idRole}>{profile.role}</p>
                    <div className={`mono ${styles.idMeta}`}>
                      {profile.location && <span>{profile.location}</span>}
                      {profile.email && <span>{profile.email}</span>}
                    </div>
                    <button
                      type="button"
                      className={styles.idCta}
                      onClick={handleViewProfile}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      Lihat Profil <ArrowUpRight size={12} />
                    </button>
                    <div className={styles.idBarcode} aria-hidden="true" />
                    <span className={styles.cardShine} aria-hidden="true" />
                  </div>
                </div>
              </motion.a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
