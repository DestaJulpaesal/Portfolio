import { useEffect, useState } from "react";

interface UseTypewriterOptions {
  /** Jeda antar karakter (ms) */
  speed?: number;
  /** Jeda antar baris (ms) */
  lineDelay?: number;
  /** Jeda sebelum mulai mengetik (ms) */
  startDelay?: number;
}

/**
 * Mengetik beberapa baris teks satu per satu, karakter demi karakter,
 * seperti efek terminal. Mengembalikan teks yang sudah "diketik" sejauh ini
 * per baris, baris mana yang sedang aktif diketik, dan status selesai.
 */
export function useTypewriter(lines: string[], options: UseTypewriterOptions = {}) {
  const { speed = 40, lineDelay = 250, startDelay = 200 } = options;
  const joinedLines = lines.join("\u0001");

  const [displayed, setDisplayed] = useState<string[]>(() => lines.map(() => ""));
  const [activeLine, setActiveLine] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timeouts: number[] = [];
    const currentLines = joinedLines.split("\u0001");

    function wait(ms: number) {
      return new Promise<void>((resolve) => {
        timeouts.push(window.setTimeout(resolve, ms));
      });
    }

    async function run() {
      setDisplayed(currentLines.map(() => ""));
      setDone(false);
      await wait(startDelay);

      for (let li = 0; li < currentLines.length; li++) {
        if (cancelled) return;
        setActiveLine(li);
        const line = currentLines[li];

        for (let ci = 1; ci <= line.length; ci++) {
          if (cancelled) return;
          await wait(speed);
          setDisplayed((prev) => {
            const next = [...prev];
            next[li] = line.slice(0, ci);
            return next;
          });
        }

        if (li < currentLines.length - 1) await wait(lineDelay);
      }

      if (!cancelled) setDone(true);
    }

    run();
    return () => {
      cancelled = true;
      timeouts.forEach((id) => window.clearTimeout(id));
    };
  }, [joinedLines, speed, lineDelay, startDelay]);

  return { displayed, activeLine, done };
}
