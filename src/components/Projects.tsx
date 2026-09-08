import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Eye, Github, CheckCircle2, Clock } from "lucide-react";
import { hasRealUrl, type Project, type SkillIcon } from "../data/content";
import { useProjects } from "../hooks/useContentData";
import { skillIconMap } from "./skillIcons";
import { SpotlightCard } from "./ui/SpotlightCard";
import { Modal } from "./ui/Modal";
import styles from "./Projects.module.css";

const statusLabel: Record<Project["status"], string> = {
  live: "Live",
  "source-only": "Source tersedia",
  "in-progress": "Dalam pengerjaan",
  archived: "Arsip",
};

// Cocokkan nama stack (string bebas di content.ts) ke ikon yang sudah ada di skillIconMap.
// Nama yang gak ketemu (mis. "NetBeans") otomatis tampil sebagai chip teks polos.
const stackIconLookup: Record<string, SkillIcon> = {
  laravel: "laravel", java: "java", javascript: "javascript", typescript: "typescript",
  react: "react", html5: "html5", css3: "css3", "tailwind css": "tailwind",
  tailwind: "tailwind", mysql: "mysql", sqlite: "sqlite", mongodb: "mongodb",
  git: "git", supabase: "supabase", "node.js": "nodejs", nodejs: "nodejs",
  php: "php", bootstrap: "bootstrap", express: "express", "express.js": "express",
  "vs code": "vscode", vscode: "vscode", apache: "apache",
};

function StackChip({ name }: { name: string }) {
  const iconEntry = skillIconMap[stackIconLookup[name.toLowerCase()] as SkillIcon];
  return (
    <span className={`mono ${styles.stackChip}`}>
      {iconEntry && <iconEntry.Icon size={11} style={{ color: iconEntry.color }} />}
      {name}
    </span>
  );
}

export function Projects() {
  const { projects } = useProjects();
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  return (
    <section id="work">
      <div className="container">
        <div className={styles.headRow}>
          <div>
            <p className={`mono ${styles.eyebrow}`}>
              <span className={styles.number}>03</span> Featured Projects
            </p>
            <h2 className={styles.heading}>Yang pernah saya bangun</h2>
          </div>
        </div>

        <div className={styles.grid}>
          {projects.map((project, i) => {
            const demoAvailable = hasRealUrl(project.href);
            const sourceAvailable = hasRealUrl(project.repo);

            return (
              <motion.div
                key={project.name}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                <SpotlightCard className={styles.card}>
                  <div className={styles.thumb}>
                    {project.image ? (
                      <img
                        src={project.image}
                        alt={`Tampilan layar ${project.name}`}
                        className={styles.thumbImage}
                        loading="lazy"
                      />
                    ) : (
                      <div className={`mono ${styles.thumbFallback}`} aria-hidden="true">
                        &lt;/&gt;
                      </div>
                    )}
                    <span
                      className={`mono ${styles.statusBadge} ${styles[`status-${project.status}`]}`}
                    >
                      {project.status === "in-progress" && <Clock size={11} />}
                      {statusLabel[project.status]}
                    </span>
                  </div>
                  <div className={styles.body}>
                    <div className={styles.stackRow}>
                      {project.stack.map((name) => (
                        <StackChip key={name} name={name} />
                      ))}
                    </div>
                    <h3 className={styles.name}>{project.name}</h3>
                    <p className={styles.summary}>{project.summary}</p>

                    <div className={styles.actions}>
                      {demoAvailable ? (
                        <a
                          href={project.href}
                          target="_blank"
                          rel="noreferrer"
                          className={`${styles.actionBtn} ${styles.actionPrimary}`}
                        >
                          <ArrowUpRight size={14} /> Demo
                        </a>
                      ) : (
                        <span
                          className={`${styles.actionBtn} ${styles.actionDisabled}`}
                          title="Belum di-deploy — cek source code di GitHub"
                        >
                          <Clock size={14} /> Belum di-hosting
                        </span>
                      )}
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => setActiveProject(project)}
                      >
                        <Eye size={14} /> Detail
                      </button>
                      {sourceAvailable && (
                        <a
                          href={project.repo}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.actionBtn}
                        >
                          <Github size={14} /> Source
                        </a>
                      )}
                    </div>
                  </div>
                </SpotlightCard>
              </motion.div>
            );
          })}
        </div>
      </div>

      <Modal open={!!activeProject} onClose={() => setActiveProject(null)}>
        {activeProject && (
          <div className={styles.modalBody}>
            {activeProject.image && (
              <img
                src={activeProject.image}
                alt={`Tampilan layar ${activeProject.name}`}
                className={styles.modalImage}
              />
            )}
            <span
              className={`mono ${styles.modalStatus} ${styles[`status-${activeProject.status}`]}`}
            >
              {statusLabel[activeProject.status]}
            </span>
            <h3 className={styles.modalTitle}>{activeProject.name}</h3>
            <div className={styles.stackRow}>
              {activeProject.stack.map((name) => (
                <StackChip key={name} name={name} />
              ))}
            </div>
            <p className={styles.modalDescription}>{activeProject.description}</p>

            {activeProject.features.length > 0 && (
              <ul className={styles.featureList}>
                {activeProject.features.map((feature) => (
                  <li key={feature}>
                    <CheckCircle2 size={15} className={styles.featureIcon} />
                    {feature}
                  </li>
                ))}
              </ul>
            )}

            <div className={styles.modalActions}>
              {hasRealUrl(activeProject.href) ? (
                <a
                  href={activeProject.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`${styles.actionBtn} ${styles.actionPrimary}`}
                >
                  <ArrowUpRight size={14} /> Lihat Demo
                </a>
              ) : (
                <span
                  className={`${styles.actionBtn} ${styles.actionDisabled}`}
                  title="Belum di-deploy — cek source code di GitHub"
                >
                  <Clock size={14} /> Demo belum tersedia
                </span>
              )}
              {hasRealUrl(activeProject.repo) && (
                <a
                  href={activeProject.repo}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.actionBtn}
                >
                  <Github size={14} /> Source Code
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}