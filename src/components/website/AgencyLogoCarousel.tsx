import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import {
  motion,
  useAnimationControls,
  useMotionValue,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

// Horizontal cover-flow carousel. Items sit in a draggable track; the item
// closest to the container center is the focus — its logo pops forward (scale
// above 1) while the others recede, continuously driven by the drag position
// (so it responds live while dragging). On release the track springs to snap
// the nearest item into the center. Left/right controls advance the focus.
//
// It also auto-scrolls: the focus advances to the next item every few seconds,
// pausing while the user hovers or drags, and resuming after a snap settles.
const ITEM_W = 280;
const GAP = 24;
const STEP = ITEM_W + GAP;
const AUTO_MS = 3200;
const SPRING = { type: 'spring', stiffness: 200, damping: 32, mass: 0.9 } as const;

export interface CarouselAgency {
  id: string;
  name: string;
  logo: string;
  darkBg: boolean;
  featured?: boolean;
  slug: string;
}

function CarouselItem({ agency, index, x, baseX }: {
  agency: CarouselAgency;
  index: number;
  x: MotionValue<number>;
  baseX: number;
}) {
  const { t } = useTranslation();
  const scale = useTransform(x, v => {
    const d = Math.abs(index - (baseX - v) / STEP);
    return 1.12 - Math.min(d, 2.5) * 0.12;
  });
  const opacity = useTransform(x, v => {
    const d = Math.abs(index - (baseX - v) / STEP);
    return Math.max(1 - Math.min(d, 2) * 0.18, 0.6);
  });
  const zIndex = useTransform(x, v => {
    const d = Math.abs(index - (baseX - v) / STEP);
    return Math.round(10 - Math.min(d, 3));
  });
  return (
    <motion.div
      style={{ scale, opacity, zIndex, transformOrigin: 'center', willChange: 'transform' }}
      className="h-full w-[280px] shrink-0"
    >
      <Link
        to={`/agency/${agency.id}/${agency.slug}`}
        aria-label={`${t('agencies.viewRoutes')} — ${agency.name}`}
        className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white transition-colors duration-200 hover:border-[var(--blue)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] no-underline"
      >
        <div className={`relative flex flex-1 items-center justify-center overflow-hidden p-6 ${agency.darkBg ? 'bg-gradient-to-br from-[#1D4ED8] to-[#1E40AF]' : 'bg-white'}`}>
          <img
            src={agency.logo}
            alt={agency.name}
            loading="lazy"
            decoding="async"
            className="h-24 w-40 object-contain"
          />
          {agency.featured && (
            <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--blue-dark)]">
              {t('agencies.featured')}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-4 sm:px-5 py-3.5">
          <span className="min-w-0 truncate text-[14px] font-bold text-[var(--text)]">{agency.name}</span>
          <span className="inline-flex shrink-0 items-center gap-1 text-[13px] font-bold text-[var(--blue)]">
            {t('agencies.viewRoutes')}
            <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

export default function AgencyLogoCarousel({ items }: { items: CarouselAgency[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(0);
  const x = useMotionValue(0);
  const controls = useAnimationControls();
  const initialized = useRef(false);
  const activeRef = useRef(0);
  const [paused, setPaused] = useState(false);
  const n = items.length;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerW(el.clientWidth));
    ro.observe(el);
    setContainerW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const baseX = containerW ? Math.max(containerW / 2 - ITEM_W / 2, 0) : 0;
  const minX = containerW ? baseX - STEP * Math.max(n - 1, 0) : 0;

  useEffect(() => {
    if (containerW > 0 && !initialized.current) {
      initialized.current = true;
      x.set(baseX);
    }
  }, [containerW, baseX, x]);

  const goTo = useCallback((index: number, resumeAfter = false) => {
    if (n === 0) return;
    const target = ((index % n) + n) % n;
    activeRef.current = target;
    controls.start({ x: baseX - target * STEP, transition: SPRING }).then(() => {
      if (resumeAfter) setPaused(false);
    });
  }, [baseX, n, controls]);

  useEffect(() => {
    if (paused || n < 2 || containerW === 0) return;
    const id = window.setInterval(() => goTo(activeRef.current + 1), AUTO_MS);
    return () => window.clearInterval(id);
  }, [paused, n, containerW, goTo]);

  if (n === 0) return null;

  return (
    <div
      ref={containerRef}
      className="relative h-[300px] sm:h-[330px] overflow-hidden py-2"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <button
        type="button"
        aria-label="Previous agency"
        onClick={() => goTo(activeRef.current - 1)}
        className="absolute left-2 sm:left-4 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border)] bg-white/90 text-[var(--text)] shadow-sm transition-colors duration-200 hover:border-[var(--blue)] hover:text-[var(--blue)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        aria-label="Next agency"
        onClick={() => goTo(activeRef.current + 1)}
        className="absolute right-2 sm:right-4 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border)] bg-white/90 text-[var(--text)] shadow-sm transition-colors duration-200 hover:border-[var(--blue)] hover:text-[var(--blue)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
      >
        <ChevronRight size={18} />
      </button>
      <motion.div
        className="flex items-stretch gap-5"
        style={{ x, willChange: 'transform' }}
        drag="x"
        dragConstraints={{ left: minX, right: baseX }}
        dragElastic={0.12}
        dragMomentum={false}
        animate={controls}
        onDragStart={() => setPaused(true)}
        onDragEnd={(_, info) => {
          const projected = x.get() + info.offset.x * 0.15;
          const idx = Math.round((baseX - projected) / STEP);
          goTo(idx, true);
        }}
      >
        {items.map((agency, i) => (
          <CarouselItem key={agency.id} agency={agency} index={i} x={x} baseX={baseX} />
        ))}
      </motion.div>
    </div>
  );
}
