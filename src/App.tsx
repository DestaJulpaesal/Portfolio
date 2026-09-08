import { AnimatePresence, motion } from "framer-motion";
import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { About } from "./components/About";
import { Skills } from "./components/Skills";
import { Projects } from "./components/Projects";
import { Certifications } from "./components/Certifications";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";
import { useProfileContent } from "./hooks/useSiteContent";
import { Loader } from "./components/Loader";

function App() {
  const { loading } = useProfileContent();

  return (
    <>
      <div className="gridBackdrop" aria-hidden="true" />
      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <Loader key="loader" />
        ) : (
          <motion.div
            key="page"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
          <Nav />
          <main className="publicMain">
            <Hero />
            <About />
            <Skills />
            <Projects />
            <Certifications />
            <Contact />
          </main>
          <Footer />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default App;
