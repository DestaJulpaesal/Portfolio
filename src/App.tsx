import { motion, MotionConfig } from "framer-motion";
import { useEffect, useState } from "react";
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
import { useReveal } from "./hooks/useReveal";

function PortfolioPage() {
  const revealRef = useReveal<HTMLDivElement>();

  return (
    <div ref={revealRef}>
      <motion.div
        key="page"
        initial={{ y: 48 }}
        animate={{ y: 0 }}
        transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
      >
        <Nav />
        <main>
          <Hero />
          <About />
          <Skills />
          <Projects />
          <Certifications />
          <Contact />
        </main>
        <Footer />
      </motion.div>
    </div>
  );
}

function App() {
  const { profile, loading } = useProfileContent();
  const [introElapsed, setIntroElapsed] = useState(false);
  const [maxWaitElapsed, setMaxWaitElapsed] = useState(false);
  const [introVisible, setIntroVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setIntroElapsed(true), 1000);
    const maxWaitTimer = window.setTimeout(() => setMaxWaitElapsed(true), 2500);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(maxWaitTimer);
    };
  }, []);

  useEffect(() => {
    function revealOnResume() {
      if (document.visibilityState !== "visible") return;
      setIntroElapsed(true);
      setMaxWaitElapsed(true);
    }

    document.addEventListener("visibilitychange", revealOnResume);
    return () => document.removeEventListener("visibilitychange", revealOnResume);
  }, []);

  const pageReady = introElapsed && (!loading || maxWaitElapsed);

  useEffect(() => {
    if (loading) return;

    const browserTitle = profile.browserTitle?.trim()
      || [profile.name, profile.role].filter(Boolean).join(" — ");
    if (browserTitle) document.title = browserTitle;

    const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (favicon) {
      favicon.href = profile.faviconUrl?.trim() || "/logo-white.png?v=1";
      const faviconPath = new URL(favicon.href).pathname;
      if (faviconPath.endsWith(".svg")) {
        favicon.type = "image/svg+xml";
      } else if (faviconPath.endsWith(".png")) {
        favicon.type = "image/png";
      } else {
        favicon.removeAttribute("type");
      }
    }
  }, [loading, profile.browserTitle, profile.faviconUrl, profile.name, profile.role]);

  useEffect(() => {
    if (!pageReady) return;
    const timer = window.setTimeout(() => setIntroVisible(false), 1080);
    return () => window.clearTimeout(timer);
  }, [pageReady]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="gridBackdrop" aria-hidden="true" />
      {pageReady && <PortfolioPage key="page" />}
      {introVisible && (
        <Loader exiting={pageReady} />
      )}
    </MotionConfig>
  );
}

export default App;
