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
  const settleStartX = useRef(new Float64Array(N + 1));
  const settleStartY = useRef(new Float64Array(N + 1));

  const draggingRef = useRef(false);
  const pointerTarget = useRef({ x: 0, y: 0 });
  const pointerGrabOffset = useRef({ x: 0, y: 0 });
  const pointerVelocity = useRef({ x: 0, y: 0 });
  const lastPointerMove = useRef({ time: 0 });
  const anchorClient = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  const calmTimeRef = useRef(0);
  const settleElapsedRef = useRef(0);
  const settleDurationRef = useRef(0.45);
  const cardHalfWidthRef = useRef(95);
  const svgCenterXRef = useRef(260);
  const svgPadTopRef = useRef(420);
  const settledRef = useRef(false);
  const settlingRef = useRef(false);
  const renderedCard = useRef({ x: 0, y: 0, angle: 0, initialized: false });

  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const optsRef = useRef(opts);
  optsRef.current = opts;

  // Fold the rope into a compact coil; gravity then pulls the lower links down
  // first so it gradually unravels instead of extending as a straight line.
  const dropIn = useCallback(() => {
    const length = optsRef.current.getLength();
    const segLen = length / N;
    const turnAngle = 2.3;
    const coilRadius = segLen / (2 * Math.sin(turnAngle / 2));
    for (let i = 0; i <= N; i++) {
      const angle = i * turnAngle;
      xs.current[i] = coilRadius * (1 - Math.cos(angle));
      ys.current[i] = coilRadius * Math.sin(angle);
      pxs.current[i] = xs.current[i];
      pys.current[i] = ys.current[i];
    }
    xs.current[0] = 0;
    ys.current[0] = 0;
    calmTimeRef.current = 0;
    settleElapsedRef.current = 0;
    settledRef.current = false;
    settlingRef.current = false;
    renderedCard.current.initialized = false;
  }, [N]);

  const updateAnchorClient = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    anchorClient.current = { x: rect.left + rect.width / 2, y: rect.top };
    if (cardWrapRef.current) {
      cardHalfWidthRef.current = cardWrapRef.current.offsetWidth / 2;
    }
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
      if (dragging) {
        calmTimeRef.current = 0;
        settleElapsedRef.current = 0;
        settledRef.current = false;
        settlingRef.current = false;
      }

      if (settledRef.current && !dragging) {
        for (let i = 0; i <= N; i++) {
          xs.current[i] = 0;
          ys.current[i] = i * segLen;
          pxs.current[i] = xs.current[i];
          pys.current[i] = ys.current[i];
        }
      } else if (settlingRef.current && !dragging) {
        settleElapsedRef.current += dt;
        const settleProgress = Math.max(
          0,
          Math.min(1, settleElapsedRef.current / settleDurationRef.current)
        );
        const settleEase = settleProgress * settleProgress * (3 - 2 * settleProgress);
        for (let i = 0; i <= N; i++) {
          xs.current[i] = settleStartX.current[i] * (1 - settleEase);
          ys.current[i] = settleStartY.current[i] + (i * segLen - settleStartY.current[i]) * settleEase;
          pxs.current[i] = xs.current[i];
          pys.current[i] = ys.current[i];
        }
        if (settleProgress === 1) {
          settlingRef.current = false;
          settledRef.current = true;
        }
      } else {
        // Keep the rope lively while dragging; after release, momentum and
        // gravity alone determine how long the swing takes to calm down.
        for (let i = 1; i <= N; i++) {
          if (dragging && i === N) continue;
          const vx = (xs.current[i] - pxs.current[i]) * damping;
          const vy = (ys.current[i] - pys.current[i]) * damping;
          const progress = i / N;
          const windWave =
            Math.sin(timeRef.current * 1.35 - i * 0.78) +
            Math.sin(timeRef.current * 2.25 + i * 1.3) * 0.42;
          const wind = dragging ? windWave * progress * windAmplitude : 0;
          const nx = xs.current[i] + vx + wind * dt * dt;
          const ny = ys.current[i] + vy + g * (0.25 + progress * 0.75) * dt * dt;
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

        // Keep adjacent rope points at a consistent distance.
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

        if (!dragging && !settledRef.current) {
          let maxSpeed = 0;
          let maxHorizontal = 0;
          for (let i = 1; i <= N; i++) {
            maxSpeed = Math.max(
              maxSpeed,
              Math.hypot(xs.current[i] - pxs.current[i], ys.current[i] - pys.current[i])
            );
            maxHorizontal = Math.max(maxHorizontal, Math.abs(xs.current[i]));
          }

          const calm = maxSpeed < 0.2 && maxHorizontal < Math.max(1.5, segLen * 0.015);
          calmTimeRef.current = calm ? calmTimeRef.current + dt : 0;
          if (!settlingRef.current && calmTimeRef.current >= 0.18) {
            settleStartX.current.set(xs.current);
            settleStartY.current.set(ys.current);
            settleElapsedRef.current = 0;
            settleDurationRef.current = Math.max(
              0.35,
              Math.min(1.1, 0.35 + (maxHorizontal / length) * 0.8 + maxSpeed * 0.025)
            );
            settlingRef.current = true;
          }
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
        const targetAngle = Math.max(-26, Math.min(26, (Math.atan2(segDx, segDy) * 180) / Math.PI));
        const rendered = renderedCard.current;
        if (!rendered.initialized) {
          rendered.x = endX - halfW;
          rendered.y = endY;
          rendered.angle = targetAngle;
          rendered.initialized = true;
        } else {
          const smoothing = dragging ? 1 : 1 - Math.exp(-dt * 14);
          rendered.x += (endX - halfW - rendered.x) * smoothing;
          rendered.y += (endY - rendered.y) * smoothing;
          rendered.angle += (targetAngle - rendered.angle) * smoothing;
        }
        cardEl.style.transform = `translate3d(${rendered.x}px, ${rendered.y}px, 0) rotate(${rendered.angle}deg)`;
        const angle = rendered.angle;
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
      const card = cardWrapRef.current;
      if (card) {
        cardHalfWidthRef.current = card.offsetWidth / 2;
        const rect = card.getBoundingClientRect();
        pointerGrabOffset.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
        pointerTarget.current = {
          x: rect.left + rect.width / 2 - anchorClient.current.x,
          y: rect.top - anchorClient.current.y,
        };
      }
      pointerVelocity.current = { x: 0, y: 0 };
      lastPointerMove.current.time = e.timeStamp;
      callbacksRef.current.onGrabChange?.(true);
    },
    [updateAnchorClient]
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const localX =
      e.clientX - pointerGrabOffset.current.x + cardHalfWidthRef.current - anchorClient.current.x;
    const localY = e.clientY - pointerGrabOffset.current.y - anchorClient.current.y;
    const maxReach = optsRef.current.getMaxReach?.() ?? optsRef.current.getLength() * 1.02;
    let targetX = localX;
    let targetY = localY;
    const dist = Math.hypot(targetX, targetY);
    if (dist > maxReach) {
      const scale = maxReach / dist;
      targetX *= scale;
      targetY *= scale;
    }
    const elapsed = Math.max(8, e.timeStamp - lastPointerMove.current.time);
    const velocityScale = 16.67 / elapsed;
    let velocityX = (targetX - pointerTarget.current.x) * velocityScale;
    let velocityY = (targetY - pointerTarget.current.y) * velocityScale;
    const velocityMagnitude = Math.hypot(velocityX, velocityY);
    const maxVelocity = 32;
    if (velocityMagnitude > maxVelocity) {
      velocityX *= maxVelocity / velocityMagnitude;
      velocityY *= maxVelocity / velocityMagnitude;
    }
    pointerVelocity.current = { x: velocityX, y: velocityY };
    pointerTarget.current = { x: targetX, y: targetY };
    lastPointerMove.current.time = e.timeStamp;
  }, []);

  const endDrag = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    pxs.current[N] = xs.current[N] - pointerVelocity.current.x * 0.8;
    pys.current[N] = ys.current[N] - pointerVelocity.current.y * 0.8;
    callbacksRef.current.onGrabChange?.(false);
  }, [N]);

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
