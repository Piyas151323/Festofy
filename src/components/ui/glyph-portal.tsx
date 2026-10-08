/**
 * GlyphPortal: scroll-driven "portal through the letters" hero.
 *
 * An oversized word is knocked out of a dark overlay (SVG mask) so a scene shows
 * through the letters. Scrolling zooms into the selected letter until the overlay
 * dissolves and the revealed content takes over.
 *
 * Perf: scroll progress is applied directly to DOM nodes via refs (no React state
 * updates while scrolling). Listeners and rAF are cleaned up on unmount.
 */
import React, {
  useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState,
} from 'react';

type Props = {
  word: string;
  above?: React.ReactNode;      // sits above the word, fades out first
  below?: React.ReactNode;      // sits below the word, fades out first
  scene?: React.ReactNode;      // visible through the letters
  children: React.ReactNode;    // revealed content
  fallback: React.ReactNode;    // static version (reduced motion / init failure)
  overlayColor?: string;
  textColor?: string;
  scrollLengthVh?: number;
  defaultIndex?: number;
  /** Sticky offset, e.g. height of a sticky navbar. Any CSS length. */
  topOffset?: string;
  /** Pass if the page scrolls inside an element instead of the window. */
  scrollContainer?: HTMLElement | null;
};

const VB_W = 1000, VB_H = 300, TEXT_W = 900, BASE_Y = 238, FONT = 260, BIG = 2000;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t: number) => t * t * (3 - 2 * t);

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia?.(REDUCED_QUERY).matches
  );
  useEffect(() => {
    const m = window.matchMedia?.(REDUCED_QUERY);
    if (!m) return;
    const h = () => setReduced(m.matches);
    m.addEventListener('change', h);
    return () => m.removeEventListener('change', h);
  }, []);
  return reduced;
}

class PortalBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err: unknown) { console.warn('GlyphPortal failed, showing static fallback:', err); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export const GlyphPortal: React.FC<Props> = (props) => {
  const reduced = usePrefersReducedMotion();
  const [failed, setFailed] = useState(false);
  const supported =
    typeof window !== 'undefined' &&
    typeof SVGTextContentElement !== 'undefined' &&
    !!window.CSS?.supports?.('position', 'sticky');

  if (reduced || failed || !supported) return <>{props.fallback}</>;
  return (
    <PortalBoundary fallback={props.fallback}>
      <PortalStage {...props} onError={() => setFailed(true)} />
    </PortalBoundary>
  );
};

const PortalStage: React.FC<Props & { onError: () => void }> = ({
  word, above, below, scene, children, onError,
  overlayColor = '#090a0b', textColor = '#f4f5f7',
  scrollLengthVh = 320, defaultIndex = 0, topOffset = '0px', scrollContainer,
}) => {
  const letters = useMemo(() => Array.from(word), [word]);
  const maskId = 'gp' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const equalSlots = useMemo(
    () => letters.map((_, i) => ({ x: 50 + (i * TEXT_W) / letters.length, w: TEXT_W / letters.length })),
    [letters]
  );
  const [selected, setSelected] = useState(Math.min(defaultIndex, letters.length - 1));
  const [slots, setSlots] = useState(equalSlots);

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const textRef = useRef<SVGTextElement>(null);
  const maskGRef = useRef<SVGGElement>(null);
  const whiteGRef = useRef<SVGGElement>(null);
  const overlayRef = useRef<SVGRectElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const hitRef = useRef<HTMLDivElement>(null);

  const slotsRef = useRef(slots);
  const selectedRef = useRef(selected);
  const geomRef = useRef({ vw: 1000, vh: 600 });
  slotsRef.current = slots;
  selectedRef.current = selected;

  const apply = useCallback(() => {
    const section = sectionRef.current, stage = stageRef.current;
    if (!section || !stage) return;
    const total = Math.max(1, section.offsetHeight - stage.offsetHeight);
    const p = clamp(-section.getBoundingClientRect().top / total);

    const slot = slotsRef.current[selectedRef.current] ?? slotsRef.current[0];
    const cx = slot.x + slot.w / 2;
    const cy = BASE_Y - FONT * 0.36;
    const { vw, vh } = geomRef.current;
    const maxScale = 2 * Math.max(vw / Math.max(slot.w, 1), vh / (FONT * 0.7));

    const t = ease(clamp((p - 0.06) / 0.58));
    const s = Math.pow(maxScale, t);
    const tx = cx + (VB_W / 2 - cx) * t;
    const ty = cy + (VB_H / 2 - cy) * t;
    const tr = `translate(${tx} ${ty}) scale(${s}) translate(${-cx} ${-cy})`;
    maskGRef.current?.setAttribute('transform', tr);
    whiteGRef.current?.setAttribute('transform', tr);

    const overlayOpacity = String(1 - ease(clamp((p - 0.45) / 0.2)));
    if (whiteGRef.current) whiteGRef.current.style.opacity = String(1 - clamp(p / 0.12));
    if (overlayRef.current) overlayRef.current.style.opacity = overlayOpacity;
    if (glowRef.current) glowRef.current.style.opacity = overlayOpacity;
    if (dimRef.current) dimRef.current.style.opacity = String(0.92 * ease(clamp((p - 0.5) / 0.25)));
    if (introRef.current) introRef.current.style.opacity = String(1 - clamp(p / 0.1));

    const c = ease(clamp((p - 0.74) / 0.14));
    const content = contentRef.current;
    if (content) {
      content.style.opacity = String(c);
      content.style.transform = `translateY(${(1 - c) * 24}px)`;
      content.style.visibility = c > 0 ? 'visible' : 'hidden';
      content.style.pointerEvents = c > 0.5 ? 'auto' : 'none';
    }
    if (hitRef.current) hitRef.current.style.visibility = p < 0.1 ? 'visible' : 'hidden';
  }, []);

  const measureGeom = useCallback(() => {
    const svg = svgRef.current, stage = stageRef.current;
    if (!svg || !stage) return;
    const unit = svg.getBoundingClientRect().width / VB_W || 1;
    geomRef.current = { vw: stage.clientWidth / unit, vh: stage.clientHeight / unit };
  }, []);

  const measureSlots = useCallback(() => {
    const text = textRef.current;
    if (!text) return;
    try {
      const next = letters.map((_, i) => {
        const e = text.getExtentOfChar(i);
        return { x: e.x, w: e.width };
      });
      if (next.every((n) => Number.isFinite(n.x) && n.w > 0)) setSlots(next);
    } catch {
      onError();
    }
  }, [letters, onError]);

  useLayoutEffect(() => {
    let cancelled = false;
    measureSlots();
    document.fonts?.ready.then(() => { if (!cancelled) measureSlots(); });
    return () => { cancelled = true; };
  }, [measureSlots]);

  useEffect(() => {
    let raf = 0;
    const target: HTMLElement | Window = scrollContainer ?? window;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; apply(); });
    };
    const onResize = () => { measureGeom(); onScroll(); };
    measureGeom();
    apply();
    target.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      target.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [apply, measureGeom, scrollContainer]);

  // Re-apply only when selection / letter geometry changes (rare).
  useEffect(() => { apply(); }, [selected, slots, apply]);

  const textProps = {
    x: VB_W / 2, y: BASE_Y, textAnchor: 'middle' as const, fontSize: FONT,
    textLength: TEXT_W, lengthAdjust: 'spacingAndGlyphs' as const,
    className: 'font-heading font-extrabold',
  };
  const bigW = BIG * 2 + VB_W, bigH = BIG * 2 + VB_H;

  return (
    <section
      ref={sectionRef}
      className="relative border-b border-[#242730]"
      style={{ height: `${scrollLengthVh}vh`, ['--gw' as string]: 'min(92vw, 1200px)' }}
    >
      <h1 className="sr-only">{word}</h1>
      <div
        ref={stageRef}
        className="sticky h-[calc(100vh-var(--gp-top))] overflow-hidden supports-[height:100svh]:h-[calc(100svh-var(--gp-top))]"
        style={{ top: topOffset, background: overlayColor, ['--gp-top' as string]: topOffset }}
      >
        <div className="absolute inset-0">
          {/* Scene seen through the letters */}
          <div className="absolute inset-0" aria-hidden="true">{scene}</div>

          {/* Dark overlay with the word knocked out */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative" style={{ width: 'var(--gw)' }}>
              <svg
                ref={svgRef}
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                className="block h-auto w-full overflow-visible"
                role="img"
                aria-label={word}
                focusable="false"
              >
                <defs>
                  <mask id={maskId} maskUnits="userSpaceOnUse" x={-BIG} y={-BIG} width={bigW} height={bigH}>
                    <rect x={-BIG} y={-BIG} width={bigW} height={bigH} fill="#fff" />
                    <g ref={maskGRef}>
                      <text ref={textRef} {...textProps} fill="#000">{word}</text>
                    </g>
                  </mask>
                </defs>
                <rect
                  ref={overlayRef} x={-BIG} y={-BIG} width={bigW} height={bigH}
                  fill={overlayColor} mask={`url(#${maskId})`}
                />
                <g ref={whiteGRef}>
                  <text {...textProps} fill={textColor}>{word}</text>
                </g>
              </svg>

              {/* Letter selection targets (keyboard + touch) */}
              <div ref={hitRef} className="absolute inset-0">
                {letters.map((ch, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Zoom into letter ${ch}`}
                    aria-pressed={i === selected}
                    onClick={() => setSelected(i)}
                    className="absolute rounded-md bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff4f1a]"
                    style={{
                      left: `${(slots[i]?.x ?? 0) / 10}%`,
                      width: `${(slots[i]?.w ?? 0) / 10}%`,
                      top: '17%', height: '62%', minWidth: 28,
                    }}
                  >
                    {i === selected && (
                      <span className="pointer-events-none absolute -bottom-2 left-1/4 right-1/4 h-0.5 rounded bg-[#ff4f1a]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Restrained brand glow (same as the existing hero) */}
          <div
            ref={glowRef}
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/3 h-[350px] w-[600px] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff4f1a]/10 blur-[130px]"
          />

          {/* Darkens the scene so revealed text stays readable */}
          <div
            ref={dimRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0"
            style={{ background: overlayColor }}
          />

          {/* Opening-frame copy */}
          <div ref={introRef} className="pointer-events-none absolute inset-0">
            <div
              className="absolute inset-x-0 flex justify-center px-4 text-center"
              style={{ bottom: 'calc(50% + var(--gw) * 0.125)' }}
            >
              {above}
            </div>
            <div
              className="absolute inset-x-0 flex justify-center px-4 text-center"
              style={{ top: 'calc(50% + var(--gw) * 0.125)' }}
            >
              {below}
            </div>
          </div>

          {/* Revealed content */}
          <div
            ref={contentRef}
            className="absolute inset-0 flex items-center justify-center px-4 py-6 sm:px-6"
            style={{ opacity: 0, visibility: 'hidden', pointerEvents: 'none' }}
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  );
};