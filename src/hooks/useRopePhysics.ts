import { useEffect, useRef, useCallback } from "react";

// Simulasi tali pakai Verlet integration: tali jadi rantai N titik, titik-0
// dijepit (pin) di anchor atas, titik terakhir "dipegang" foto/kartu di
// ujungnya. Karena tiap titik cuma dibatasi jarak ke tetangganya (bukan
// diputar sebagai satu balok kaku), tali otomatis meliuk/melengkung natural
// -- baik pas jatuh pertama kali, pas ditarik ke arah manapun, maupun pas
// dilepas (efek "cambuk"/whip yang bikin dia sempat ngeliuk kayak ular
// sebelum tenang lagi).
export interface RopePhysicsOptions {
  segments?: number;
  gravity?: number;
  damping?: number;
  iterations?: number;
  windAmplitude?: number;
  getLength: () => number; // panjang tali saat ini (bisa beda per breakpoint layar)
  getMaxReach?: () => number; // jarak maksimum ujung tali dari anchor saat ditarik
}

export interface RopePhysicsCallbacks {
  onTap?: () => void;
  onGrabChange?: (grabbing: boolean) => void;
}

export function useRopePhysics(opts: RopePhysicsOptions, callbacks: RopePhysicsCallbacks = {}) {
  const {
    segments = 9,
    gravity = 1500,
    damping = 0.985,
    iterations = 5,
    windAmplitude = 34,
  } = opts;

  const stageRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const pathGlowRef = useRef<SVGPathElement | null>(null);
  const cardWrapRef = useRef<HTMLDivElement | null>(null);

  const N = segments;
  const xs = useRef(new Float64Array(N + 1));
  const ys = useRef(new Float64Array(N + 1));
  const pxs = useRef(new Float64Array(N + 1));
  const pys = useRef(new Float64Array(N + 1));

  const draggingRef = useRef(false);
  const pointerTarget = useRef({ x: 0, y: 0 });
  const pointerStartClient = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);
  const anchorClient = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  const cardHalfWidthRef = useRef(95);
  const svgCenterXRef = useRef(260);
  const svgPadTopRef = useRef(420);
  const settledRef = useRef(false);

  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const optsRef = useRef(opts);
  optsRef.current = opts;

  // Reset & susun ulang titik-titik tali dalam keadaan "tergulung" dekat
  // anchor, lalu lepas -- gravitasi + constraint solver bikin dia jatuh
  // sambil meliuk turun sendiri, bukan cuma scaleY lurus dari 0 ke 1.
  const dropIn = useCallback(() => {
    const length = optsRef.current.getLength();
    const segLen = length / N;
    for (let i = 0; i <= N; i++) {
      const wobble = Math.sin(i * 1.7) * segLen * 0.55;
      xs.current[i] = i === 0 ? 0 : wobble;
      ys.current[i] = i * segLen * 0.12;
      pxs.current[i] = xs.current[i];
      pys.current[i] = ys.current[i] - segLen * 0.02;
    }
    settledRef.current = false;
  }, [N]);

  const updateAnchorClient = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    anchorClient.current = { x: rect.left + rect.width / 2, y: rect.top };
  }, []);

  useEffect(() => {
    dropIn();
    updateAnchorClient();
    const onResize = () => updateAnchorClient();
    window.addEventListener("resize", onResize);

    let cancelled = false;

    function frame(t: number) {
      if (cancelled) return;
      if (lastTimeRef.current == null) lastTimeRef.current = t;
      let dt = (t - lastTimeRef.current) / 1000;
      lastTimeRef.current = t;
      dt = Math.min(dt, 0.032);
      timeRef.current += dt;

      const length = optsRef.current.getLength();
      const segLen = length / N;
      const g = gravity;
      const dragging = draggingRef.current;

      // Integrasi Verlet untuk semua titik selain anchor (index 0, selalu
      // dijepit di 0,0) dan -- kalau lagi ditarik -- selain titik terakhir
      // (yang dipaksa mengikuti posisi pointer).
      for (let i = 1; i <= N; i++) {
        if (dragging && i === N) continue;
        const vx = (xs.current[i] - pxs.current[i]) * damping;
        const vy = (ys.current[i] - pys.current[i]) * damping;
        const wind = Math.sin(timeRef.current * 0.85 + i * 0.8) * (i / N) * windAmplitude;
        const nx = xs.current[i] + vx + wind * dt * dt;
        const ny = ys.current[i] + vy + g * dt * dt;
        pxs.current[i] = xs.current[i];
        pys.current[i] = ys.current[i];
        xs.current[i] = nx;
        ys.current[i] = ny;
      }

      if (dragging) {
        pxs.current[N] = xs.current[N];
        pys.current[N] = ys.current[N];
        xs.current[N] = pointerTarget.current.x;
        ys.current[N] = pointerTarget.current.y;
      }

      // Constraint solver: jaga jarak antar titik bertetangga tetap =
      // panjang 1 segmen. Diulang beberapa iterasi supaya seluruh rantai
      // konsisten (bukan cuma pasangan terakhir yang diproses).
      for (let iter = 0; iter < iterations; iter++) {
        xs.current[0] = 0;
        ys.current[0] = 0;
        for (let i = 0; i < N; i++) {
          const dx = xs.current[i + 1] - xs.current[i];
          const dy = ys.current[i + 1] - ys.current[i];
          const dist = Math.hypot(dx, dy) || 0.0001;
          const diff = (dist - segLen) / dist;
          const pinned0 = i === 0;
          const pinned1 = dragging && i + 1 === N;
          const inv0 = pinned0 ? 0 : 1;
          const inv1 = pinned1 ? 0 : 1;
          const total = inv0 + inv1 || 1;
          const move0 = (inv0 / total) * diff;
          const move1 = (inv1 / total) * diff;
          xs.current[i] += dx * move0;
          ys.current[i] += dy * move0;
          xs.current[i + 1] -= dx * move1;
          ys.current[i + 1] -= dy * move1;
        }
        if (dragging) {
          xs.current[N] = pointerTarget.current.x;
          ys.current[N] = pointerTarget.current.y;
        }
      }
      xs.current[0] = 0;
      ys.current[0] = 0;

      // Bangun path SVG halus (quadratic through-points) dari titik-titik tali.
      // svgPadTop cuma dipakai buat geser sistem koordinat internal SVG
      // (supaya ada ruang gambar di atas anchor kalau kartu ditarik ke atas),
      // tidak memengaruhi simulasi fisika itu sendiri (yang selalu relatif
      // ke anchor di 0,0).
      const cx = svgCenterXRef.current;
      const padY = svgPadTopRef.current;
      let d = `M ${cx + xs.current[0]} ${ys.current[0] + padY}`;
      for (let i = 1; i < N; i++) {
        const midX = cx + (xs.current[i] + xs.current[i + 1]) / 2;
        const midY = (ys.current[i] + ys.current[i + 1]) / 2 + padY;
        d += ` Q ${cx + xs.current[i]} ${ys.current[i] + padY} ${midX} ${midY}`;
      }
      d += ` L ${cx + xs.current[N]} ${ys.current[N] + padY}`;
      if (pathRef.current) pathRef.current.setAttribute("d", d);
      if (pathGlowRef.current) pathGlowRef.current.setAttribute("d", d);

      // Posisikan & putar kartu mengikuti ujung & arah segmen terakhir tali.
      const cardEl = cardWrapRef.current;
      if (cardEl) {
        const halfW = cardHalfWidthRef.current;
        const endX = xs.current[N];
        const endY = ys.current[N];
        const segDx = xs.current[N] - xs.current[N - 1];
        const segDy = Math.max(ys.current[N] - ys.current[N - 1], 0.0001);
        let angle = (Math.atan2(segDx, segDy) * 180) / Math.PI;
        angle = Math.max(-18, Math.min(18, angle));
        cardEl.style.transform = `translate3d(${endX - halfW}px, ${endY}px, 0) rotate(${angle}deg)`;
        const shadowBlur = 10 + Math.abs(angle) * 0.4;
        const shadowY = 16 + Math.min(Math.abs(endY) * 0.02, 10);
        cardEl.style.filter = `drop-shadow(${angle * 0.7}px ${shadowY}px ${shadowBlur}px rgba(0,0,0,0.38))`;
      }

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [N, gravity, damping, iterations, windAmplitude, dropIn, updateAnchorClient]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
      updateAnchorClient();
      draggingRef.current = true;
      movedRef.current = false;
      pointerStartClient.current = { x: e.clientX, y: e.clientY };
      if (cardWrapRef.current) cardHalfWidthRef.current = cardWrapRef.current.offsetWidth / 2;
      callbacksRef.current.onGrabChange?.(true);
    },
    [updateAnchorClient]
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const dx0 = e.clientX - pointerStartClient.current.x;
    const dy0 = e.clientY - pointerStartClient.current.y;
    if (!movedRef.current && Math.hypot(dx0, dy0) > 6) movedRef.current = true;

    let localX = e.clientX - anchorClient.current.x;
    let localY = e.clientY - anchorClient.current.y;
    const maxReach = optsRef.current.getMaxReach?.() ?? optsRef.current.getLength() * 1.02;
    const dist = Math.hypot(localX, localY);
    if (dist > maxReach) {
      const scale = maxReach / dist;
      localX *= scale;
      localY *= scale;
    }
    pointerTarget.current = { x: localX, y: localY };
  }, []);

  const endDrag = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    callbacksRef.current.onGrabChange?.(false);
    const wasTap = !movedRef.current;
    movedRef.current = false;
    if (wasTap) callbacksRef.current.onTap?.();
  }, []);

  return {
    stageRef,
    pathRef,
    pathGlowRef,
    cardWrapRef,
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    dropIn,
    svgCenterXRef,
    svgPadTopRef,
    cardHalfWidthRef,
  };
}
