import { useEffect, useRef } from "react";

/**
 * Menambahkan class "is-visible" pada elemen ber-class "reveal"
 * di dalam container ini ketika elemen tersebut masuk viewport.
 */
export function useReveal<T extends HTMLElement>() {
  const containerRef = useRef<T | null>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const targets = root.classList.contains("reveal")
      ? [root]
      : Array.from(root.querySelectorAll<HTMLElement>(".reveal"));

    if (targets.length === 0) return;

    const showAll = () => targets.forEach((target) => target.classList.add("is-visible"));
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window) ||
      document.visibilityState === "hidden"
    ) {
      showAll();
      return;
    }

    const revealRoot = document.documentElement;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    function revealVisibleTargets() {
      if (document.visibilityState === "hidden") return;

      for (const target of targets) {
        const rect = target.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight - 40) {
          target.classList.add("is-visible");
          observer.unobserve(target);
        }
      }
    }

    revealRoot.classList.add("reveal-enabled");
    targets.forEach((el) => observer.observe(el));
    document.addEventListener("visibilitychange", revealVisibleTargets);
    revealVisibleTargets();
    const failSafeTimer = window.setTimeout(showAll, 3000);
    return () => {
      window.clearTimeout(failSafeTimer);
      observer.disconnect();
      document.removeEventListener("visibilitychange", revealVisibleTargets);
      revealRoot.classList.remove("reveal-enabled");
    };
  }, []);

  return containerRef;
}
