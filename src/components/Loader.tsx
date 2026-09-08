import { motion } from "framer-motion";

export function Loader() {
  return (
    <motion.div
      className="loader"
      aria-busy="true"
      aria-label="Memuat halaman"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: "easeInOut" }}
    >
      <div className="loaderMark" aria-hidden="true">
        <img src="/logo.png" alt="" />
      </div>
      <div className="loaderTrack" aria-hidden="true">
        <span className="loaderProgress" />
      </div>
    </motion.div>
  );
}
