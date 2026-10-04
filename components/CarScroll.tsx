"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

type Manifest = {
  frameCount: number;
  width: number;
  height: number;
  bgColor: string;
  pattern: string;
};

type CarScrollProps = {
  onProgress: (percent: number) => void;
  onReady: () => void;
  onBackground: (color: string) => void;
  onError: (message: string) => void;
};

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const framePath = (index: number) =>
  `${BASE_PATH}/hero-webp/frame_${String(index + 1).padStart(4, "0")}.webp`;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smoothstep = (value: number, start: number, end: number) => {
  const t = clamp01((value - start) / (end - start));
  return t * t * (3 - 2 * t);
};
const fragmentationAt = (progress: number) => Math.min(smoothstep(progress, 0.28, 0.6), 1 - smoothstep(progress, 0.6, 0.89));

export default function CarScroll({ onProgress, onReady, onBackground, onError }: CarScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<Array<HTMLImageElement | undefined>>([]);
  const backgroundRef = useRef("#050505");
  const frameCountRef = useRef(1);
  const lastIndexRef = useRef(-1);
  const latestProgressRef = useRef(0);
  const lastFragmentationRef = useRef(-1);
  const rafRef = useRef<number | null>(null);
  const [frameCount, setFrameCount] = useState(1);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });
  const springProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    mass: 0.4,
  });
  const visualProgress = prefersReducedMotion ? scrollYProgress : springProgress;
  const frameIndex = useTransform(visualProgress, [0, 1], [0, Math.max(0, frameCount - 1)]);

  const drawFrame = useCallback((requestedIndex: number, progress = 0) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !context) return;

    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.width / ratio;
    const height = canvas.height / ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.fillStyle = backgroundRef.current;
    context.fillRect(0, 0, width, height);

    const images = framesRef.current;
    let image = images[requestedIndex];
    if (!image) {
      for (let distance = 1; distance < images.length && !image; distance += 1) {
        image = images[requestedIndex - distance] ?? images[requestedIndex + distance];
      }
    }
    if (!image?.naturalWidth || !image.naturalHeight) return;

    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const originX = (width - drawWidth) / 2;
    const originY = (height - drawHeight) / 2;
    const fragmentation = fragmentationAt(progress);
    if (fragmentation < 0.003) {
      context.drawImage(image, originX, originY, drawWidth, drawHeight);
      return;
    }

    const columns = 4;
    const rows = 3;
    const tileWidth = image.naturalWidth / columns;
    const tileHeight = image.naturalHeight / rows;
    const maxOffset = Math.min(width, height) * 0.19 * fragmentation;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const tile = row * columns + column;
        const sourceX = column * tileWidth;
        const sourceY = row * tileHeight;
        const sourceWidth = Math.min(tileWidth, image.naturalWidth - sourceX);
        const sourceHeight = Math.min(tileHeight, image.naturalHeight - sourceY);
        const axisX = (column + 0.5) / columns * 2 - 1;
        const axisY = (row + 0.5) / rows * 2 - 1;
        const length = Math.hypot(axisX, axisY) || 1;
        const variation = 0.8 + ((tile * 7) % 5) * 0.09;
        const distance = maxOffset * variation;
        const shiftX = axisX / length * distance + Math.sin(tile * 1.7) * distance * 0.09;
        const shiftY = axisY / length * distance + Math.cos(tile * 1.3) * distance * 0.09;
        context.drawImage(
          image,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          originX + sourceX * scale + shiftX,
          originY + sourceY * scale + shiftY,
          sourceWidth * scale,
          sourceHeight * scale,
        );
      }
    }
  }, []);

  const queueFrame = useCallback(
    (requestedIndex: number, progress = latestProgressRef.current) => {
      const boundedIndex = Math.min(Math.max(0, requestedIndex), frameCountRef.current - 1);
      const fragmentation = fragmentationAt(progress);
      if (boundedIndex === lastIndexRef.current && Math.abs(fragmentation - lastFragmentationRef.current) < 0.003) return;
      lastIndexRef.current = boundedIndex;
      lastFragmentationRef.current = fragmentation;
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = window.requestAnimationFrame(() => drawFrame(boundedIndex, progress));
    },
    [drawFrame],
  );

  useMotionValueEvent(frameIndex, "change", (value) => queueFrame(Math.round(value), latestProgressRef.current));
  useMotionValueEvent(visualProgress, "change", (value) => {
    const adjustedProgress = prefersReducedMotion ? 0 : value;
    latestProgressRef.current = adjustedProgress;
    queueFrame(Math.round(frameIndex.get()), adjustedProgress);
  });

  useEffect(() => {
    let cancelled = false;
    const loadFrame = (index: number) =>
      new Promise<boolean>((resolve) => {
        const image = new Image();
        image.decoding = "async";
        image.onload = async () => {
          try {
            await image.decode();
          } catch {
            // onload already guarantees a drawable image in browsers without decode support.
          }
          if (!cancelled) framesRef.current[index] = image;
          resolve(true);
        };
        image.onerror = () => resolve(false);
        image.src = framePath(index);
        if (image.complete && image.naturalWidth > 0) {
          void image.decode().catch(() => undefined).then(() => {
            if (!cancelled) framesRef.current[index] = image;
            resolve(true);
          });
        }
      });

    const preload = async () => {
      try {
        const response = await fetch(`${BASE_PATH}/hero-webp/manifest.json`, { cache: "force-cache" });
        if (!response.ok) throw new Error(`Frame manifest request failed (${response.status}).`);
        const manifest = (await response.json()) as Manifest;
        if (!Number.isInteger(manifest.frameCount) || manifest.frameCount < 1) {
          throw new Error("The frame manifest is invalid or empty.");
        }
        frameCountRef.current = manifest.frameCount;
        setFrameCount(manifest.frameCount);
        backgroundRef.current = manifest.bgColor || "#050505";
        onBackground(backgroundRef.current);
        framesRef.current = new Array(manifest.frameCount);

        let settled = 0;
        const loadAndTrack = async (index: number) => {
          await loadFrame(index);
          settled += 1;
          if (!cancelled) onProgress(Math.round((settled / manifest.frameCount) * 100));
        };
        const firstBatchSize = Math.min(20, manifest.frameCount);
        await Promise.all(Array.from({ length: firstBatchSize }, (_, index) => loadAndTrack(index)));
        for (let start = firstBatchSize; start < manifest.frameCount; start += 12) {
          const end = Math.min(start + 12, manifest.frameCount);
          await Promise.all(Array.from({ length: end - start }, (_, offset) => loadAndTrack(start + offset)));
        }
        if (cancelled) return;
        if (!framesRef.current.some(Boolean)) throw new Error("No animation frames could be decoded.");
        lastIndexRef.current = -1;
        drawFrame(0);
        onReady();
      } catch (error) {
        if (!cancelled) onError(error instanceof Error ? error.message : "Unable to load the image sequence.");
      }
    };

    void preload();
    return () => {
      cancelled = true;
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    };
  }, [drawFrame, onBackground, onError, onProgress, onReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resizeCanvas = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(bounds.width * ratio));
      canvas.height = Math.max(1, Math.round(bounds.height * ratio));
      lastIndexRef.current = -1;
      lastFragmentationRef.current = -1;
      drawFrame(Math.round(frameIndex.get()), latestProgressRef.current);
    };
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(canvas);
    resizeCanvas();
    return () => observer.disconnect();
  }, [drawFrame, frameIndex]);

  const heroOpacity = useTransform(visualProgress, [0, 0.045, 0.16, 0.23], [1, 1, 0, 0]);
  const firstOpacity = useTransform(visualProgress, [0.18, 0.29, 0.39, 0.48], [0, 1, 1, 0]);
  const engineOpacity = useTransform(visualProgress, [0.46, 0.59, 0.69, 0.78], [0, 1, 1, 0]);
  const finaleOpacity = useTransform(visualProgress, [0.78, 0.9, 1], [0, 1, 1]);
  const heroY = useTransform(visualProgress, [0, 0.23], [0, -22]);
  const firstY = useTransform(visualProgress, [0.18, 0.39], [18, -12]);
  const engineY = useTransform(visualProgress, [0.46, 0.69], [18, -12]);
  const finaleY = useTransform(visualProgress, [0.78, 0.93], [18, 0]);
  const heroBlur = useTransform(visualProgress, [0, 0.045, 0.23], ["0px", "0px", "10px"]);
  const firstBlur = useTransform(visualProgress, [0.18, 0.29, 0.48], ["10px", "0px", "10px"]);
  const engineBlur = useTransform(visualProgress, [0.46, 0.59, 0.78], ["10px", "0px", "10px"]);
  const finaleBlur = useTransform(visualProgress, [0.78, 0.9, 1], ["10px", "0px", "0px"]);
  const progressScale = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.06, 0.14], [1, 0.55, 0]);

  const refinedStyle = (y: typeof heroY, blur: typeof heroBlur) => ({
    y: prefersReducedMotion ? 0 : y,
    filter: prefersReducedMotion ? "blur(0px)" : blur,
  });

  return (
      <section ref={containerRef} id="anatomy" className="car-sequence" aria-label="Bugatti Chiron driving sequence with scroll-linked digital fragmentation and reassembly">
        <div className="scroll-pin">
        <canvas ref={canvasRef} className="car-canvas" aria-label="Bugatti Chiron driving imagery breaking into tiles and reassembling as the page scrolls" role="img" />
        <div className="canvas-vignette" aria-hidden="true" />
        <div className="story-layer">
          <motion.div className="story-copy story-hero" style={{ opacity: heroOpacity, ...refinedStyle(heroY, heroBlur) }}>
            <p className="eyebrow"><span className="eyebrow-rule" />The art of going beyond</p>
            <h1>BUGATTI<br /><span>CHIRON</span></h1>
            <p className="story-description">Anatomy of Speed. 1,500 horsepower, engineered to the last detail.</p>
          </motion.div>

          <motion.div className="story-copy story-left" style={{ opacity: firstOpacity, ...refinedStyle(firstY, firstBlur) }}>
            <p className="eyebrow">01 / Motion, in detail</p>
            <h2>Every curve,<br /><em>in motion.</em></h2>
            <p className="story-description">A driving portrait reveals the Chiron from every angle: sculpted lines, active aerodynamics and relentless pace.</p>
          </motion.div>

          <motion.div className="story-copy story-right" style={{ opacity: engineOpacity, ...refinedStyle(engineY, engineBlur) }}>
            <p className="eyebrow">02 / The force within</p>
            <h2>The 8.0L<br /><em>W16 heart.</em></h2>
            <p className="story-description">Four turbochargers. Sixteen cylinders. 1,500 PS and 1,600 Nm — the unseen force behind every frame.</p>
          </motion.div>

          <motion.div className="story-copy story-finale" style={{ opacity: finaleOpacity, ...refinedStyle(finaleY, finaleBlur) }}>
            <p className="eyebrow"><span className="eyebrow-rule" />03 / Form follows force</p>
            <h2>Reassembled.<br /><em>Unstoppable.</em></h2>
            <div className="story-actions">
              <a className="button button-primary" href="https://www.bugatti.com/en/models/chiron" target="_blank" rel="noreferrer">Configure Yours <span aria-hidden="true">↗</span></a>
              <a className="button button-quiet" href="#anatomy" onClick={(event) => { event.preventDefault(); window.scrollTo({ top: containerRef.current?.offsetTop ?? 0, behavior: prefersReducedMotion ? "auto" : "smooth" }); }}>Watch the Film <span aria-hidden="true">↻</span></a>
            </div>
          </motion.div>
        </div>

        <motion.div className="scroll-cue" style={{ opacity: prefersReducedMotion ? 1 : cueOpacity }} aria-hidden="true">
          <span>Scroll to explore</span><span className="scroll-cue-line" />
        </motion.div>
        <div className="sequence-index" aria-hidden="true"><span>01</span><span className="index-divider" /><span>04</span></div>
        <div className="scroll-progress-track" aria-hidden="true"><motion.span className="scroll-progress-fill" style={{ scaleY: progressScale }} /></div>
      </div>
    </section>
  );
}
