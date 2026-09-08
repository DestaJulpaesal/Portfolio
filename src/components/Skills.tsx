import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Folder } from "lucide-react";
import { useSkillsContent } from "../hooks/useSiteContent";
import { skillIconMap } from "./skillIcons";
import styles from "./Skills.module.css";

export function Skills() {
  const { categories: skillCategories } = useSkillsContent();
  const [active, setActive] = useState(0);
  const activeCategory = skillCategories[Math.min(active, skillCategories.length - 1)] ?? skillCategories[0];

  if (!activeCategory) return null;

  return (
    <section id="skills">
      <div className="container">
        <motion.p
          className={`mono ${styles.eyebrow}`}
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className={styles.number}>02</span> Skills &amp; Stack
        </motion.p>
        <motion.h2
          className={styles.heading}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        >
          My Expertise — dikelompokkan per kategori
        </motion.h2>

        <motion.div
          className={styles.layout}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={styles.sidebar} role="tablist" aria-label="Kategori skill">
            {skillCategories.map((cat, i) => {
              const isActive = i === active;
              return (
                <button
                  key={cat.name}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`${styles.sidebarItem} ${isActive ? styles.sidebarItemActive : ""}`}
                  onClick={() => setActive(i)}
                >
                  <span className={styles.sidebarItemLabel}>
                    <Folder size={15} />
                    {cat.name}
                  </span>
                  <span className={styles.sidebarItemMeta}>
                    <span className={`mono ${styles.sidebarItemCount}`}>{cat.items.length}</span>
                    <ChevronRight size={14} className={styles.sidebarItemChevron} />
                  </span>
                </button>
              );
            })}
          </div>

          <div className={styles.panel}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory.name}
                className={styles.grid}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {activeCategory.items.map((skill, i) => {
                  const { Icon, color } = skillIconMap[skill.icon];
                  return (
                    <motion.div
                      key={skill.name}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{ y: -4 }}
                      className={styles.badge}
                    >
                      <Icon size={26} color={color} />
                      <span>{skill.name}</span>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.p
          className={`mono ${styles.note}`}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          ◆ Selalu belajar teknologi baru
        </motion.p>
      </div>
    </section>
  );
}
