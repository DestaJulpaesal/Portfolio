import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  User,
  Tag,
  MessageSquare,
  ArrowUpRight,
} from "lucide-react";
import { contactInfo } from "../data/content";
import { useProfileContent } from "../hooks/useSiteContent";
import { isSupabaseConfigured, sendContactMessage } from "../lib/supabase";
import { WhatsAppIcon } from "./icons/BrandIcons";
import styles from "./Contact.module.css";

type Status = "idle" | "loading" | "success" | "error";

const homeAddress = "5CVH+6Q4, Citatah Nyalindung, Cirawamekar, Kec. Cipatat, Kabupaten Bandung Barat, Jawa Barat 40554";
const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(homeAddress)}`;

export function Contact() {
  const { profile } = useProfileContent();
  const waHref = profile.socials.find((s) => s.icon === "whatsapp")?.href ?? "#";
  const infoCards = [
    {
      icon: Mail,
      label: "Email",
      value: profile.email,
      href: `mailto:${profile.email}`,
    },
    {
      icon: Phone,
      label: "Phone",
      value: profile.phone,
      href: `tel:${profile.phone.replace(/\s|x/g, "")}`,
    },
    {
      icon: WhatsAppIcon,
      label: "WhatsApp",
      value: "Chat langsung",
      href: waHref,
    },
    {
      icon: MapPin,
      label: "Lokasi",
      value: profile.location,
      href: mapsHref,
    },
  ];
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      await sendContactMessage(form);
      setStatus("success");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Gagal mengirim pesan.");
    }
  }

  return (
    <section id="contact">
      <div className="container">
        <div className={styles.grid}>
          <motion.div
            initial={{ opacity: 0, x: -16, scale: 0.98 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className={`mono ${styles.eyebrow}`}>
              <span className={styles.number}>05</span> Get In Touch
            </p>
            <h2 className={styles.heading}>{contactInfo.heading}</h2>
            <p className={styles.subheading}>{contactInfo.subheading}</p>

            <div className={styles.infoGrid}>
              {infoCards.map((item) => {
                const Icon = item.icon;
                const Wrapper = item.href ? "a" : "div";
                return (
                  <Wrapper
                    key={item.label}
                    href={item.href}
                    target={item.href?.startsWith("http") ? "_blank" : undefined}
                    rel={item.href?.startsWith("http") ? "noreferrer" : undefined}
                    className={styles.infoCard}
                  >
                    <span className={styles.infoIcon}>
                      <Icon size={18} />
                    </span>
                    <span className={styles.infoLabel}>{item.label}</span>
                    <span className={styles.infoValue}>{item.value}</span>
                  </Wrapper>
                );
              })}
            </div>

            <div className={styles.mapWrap}>
              <iframe
                title="Lokasi rumah — Citatah Nyalindung, Cirawamekar"
                className={styles.mapFrame}
                src={`https://www.google.com/maps?q=${encodeURIComponent(homeAddress)}&output=embed`}
                loading="lazy"
              />
              <div className={styles.availabilityBadge}>
                <span className={styles.availabilityDot} />
                {profile.availability}
              </div>
              <a
                href={mapsHref}
                target="_blank"
                rel="noreferrer"
                className={styles.mapOpenBtn}
              >
                Buka di Google Maps <ArrowUpRight size={13} />
              </a>
            </div>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, x: 16, scale: 0.98 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            onSubmit={handleSubmit}
            className={styles.form}
          >
            <p className={styles.formEyebrow}>Kirim Pesan</p>
            <h3 className={styles.formHeading}>Ceritakan proyekmu</h3>

            {!isSupabaseConfigured && (
              <p className={styles.notice}>
                Form ini siap dipakai — tinggal hubungkan ke Supabase kamu lewat file{" "}
                <code>.env</code> (lihat <code>.env.example</code>).
              </p>
            )}

            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="name">Nama Kamu</label>
                <div className={styles.inputWrap}>
                  <User size={15} className={styles.inputIcon} />
                  <input
                    id="name"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Nama Kamu"
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label htmlFor="email">Email Kamu</label>
                <div className={styles.inputWrap}>
                  <Mail size={15} className={styles.inputIcon} />
                  <input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="nama@email.com"
                  />
                </div>
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="subject">Subjek</label>
              <div className={styles.inputWrap}>
                <Tag size={15} className={styles.inputIcon} />
                <input
                  id="subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Subjek"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="message">Pesan</label>
              <div className={styles.inputWrap}>
                <MessageSquare size={15} className={`${styles.inputIcon} ${styles.inputIconTop}`} />
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Ceritakan proyekmu..."
                />
              </div>
            </div>

            <button type="submit" className={styles.submit} disabled={status === "loading"}>
              {status === "loading" ? (
                <>
                  <Loader2 size={16} className={styles.spin} /> Mengirim...
                </>
              ) : (
                <>
                  Send Message <Send size={16} />
                </>
              )}
            </button>

            {status === "success" && (
              <p className={styles.success}>
                <CheckCircle2 size={15} /> Pesan terkirim, terima kasih!
              </p>
            )}
            {status === "error" && (
              <p className={styles.errorText}>
                <AlertCircle size={15} /> {errorMsg}
              </p>
            )}
          </motion.form>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className={styles.ctaBanner}
        >
          <div className={styles.ctaGrid} aria-hidden="true" />
          <div className={styles.ctaGlow} aria-hidden="true" />
          <div className={styles.ctaContent}>
            <p className={`mono ${styles.ctaEyebrow}`}>Siap Berkolaborasi</p>
            <h3 className={styles.ctaHeading}>
              Punya ide proyek? <br className={styles.ctaBreak} /> Yuk mulai diskusi sekarang.
            </h3>
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className={styles.ctaButton}
            >
              Hubungi via WhatsApp <ArrowUpRight size={17} />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
