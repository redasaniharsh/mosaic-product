import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Clapperboard, Maximize2, RefreshCw, X } from 'lucide-react';
import { cn } from '../lib/utils';

/**
 * Hero product films.
 *
 * Three 9-second cuts, each pairing a product with a real line from the
 * customer research. Videos are served from /videos (same origin, no hotlinks),
 * so they survive a cold Render start.
 *
 * The sources are re-requested every 30 minutes: a cache-busting `?v=<bucket>`
 * is derived from a 30-minute clock, and the component moves to the next bucket
 * on its own. That keeps the player fresh on a long-lived tab and gives the
 * browser a reason to re-fetch instead of serving a stale buffer.
 */

const REFRESH_MS = 30 * 60 * 1000;

type Film = {
  slug: string;
  product: string;
  step: string;
  line: string;
  seconds: string;
};

const FILMS: Film[] = [
  {
    slug: 'hero-serum',
    product: 'Advanced Hair Growth Serum',
    step: 'Hair · Step 03',
    line: 'Nightly serum, 5–6 drops',
    seconds: '0:09'
  },
  {
    slug: 'hero-gummies',
    product: 'Biotin Gummies',
    step: 'Nutrition · Step 02',
    line: 'One gummy after breakfast',
    seconds: '0:09'
  },
  {
    slug: 'hero-shampoo',
    product: 'Anti-Hairfall Shampoo',
    step: 'Hair · Step 01',
    line: '60 seconds, 3–4 times a week',
    seconds: '0:09'
  }
];

const src = (slug: string, bucket: number) => `/videos/${slug}.mp4?v=${bucket}`;
const poster = (slug: string) => `/videos/${slug}.jpg`;

/** Moves to the next 30-minute window on its own, and catches up after sleep. */
function useThirtyMinuteBucket() {
  const [bucket, setBucket] = useState(() => Math.floor(Date.now() / REFRESH_MS));

  useEffect(() => {
    let timer = 0;

    const schedule = () => {
      const wait = REFRESH_MS - (Date.now() % REFRESH_MS) + 1000;
      timer = window.setTimeout(() => {
        setBucket(Math.floor(Date.now() / REFRESH_MS));
        schedule();
      }, wait);
    };

    const resync = () => {
      if (document.visibilityState !== 'visible') return;
      const current = Math.floor(Date.now() / REFRESH_MS);
      setBucket((prev) => (prev === current ? prev : current));
    };

    schedule();
    document.addEventListener('visibilitychange', resync);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', resync);
    };
  }, []);

  return bucket;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

function FilmCard({
  film,
  bucket,
  reduced,
  large,
  onSelect,
  onExpand
}: {
  film: Film;
  bucket: number;
  reduced: boolean;
  large?: boolean;
  onSelect?: () => void;
  onExpand?: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || reduced) return;
    const play = el.play();
    if (play && typeof play.catch === 'function') play.catch(() => {});
  }, [reduced, bucket]);

  const body = (
    <>
      <div className="relative aspect-video w-full">
        {reduced || failed ? (
          <img src={poster(film.slug)} alt={`${film.product} still`} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            key={bucket}
            src={src(film.slug, bucket)}
            poster={poster(film.slug)}
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            disablePictureInPicture
            onError={() => setFailed(true)}
          />
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent" />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3.5 sm:p-4">
          <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-lime">
            <Clapperboard className="h-2.5 w-2.5" />
            {film.step}
          </div>
          <div className={cn('mt-1 font-display leading-tight text-paper', large ? 'text-[1.35rem] sm:text-[1.6rem]' : 'text-[0.95rem]')}>
            {film.product}
          </div>
          {large && <div className="mt-1 text-[11.5px] text-paper/55">{film.line}</div>}
        </div>

        <div className="pointer-events-none absolute right-3 top-3 rounded-full border border-white/15 bg-ink/50 px-2 py-0.5 font-mono text-[9px] text-paper/80 backdrop-blur">
          {film.seconds}
        </div>

        {onExpand && (
          <button
            type="button"
            onClick={onExpand}
            aria-label={`Watch the ${film.product} film full size`}
            className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/20 bg-ink/55 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-paper/85 backdrop-blur transition hover:bg-ink/80 hover:text-paper"
          >
            <Maximize2 className="h-2.5 w-2.5" /> Watch
          </button>
        )}
      </div>
    </>
  );

  const shell = cn(
    'group relative block w-full overflow-hidden rounded-2xl border bg-ink text-left transition',
    large ? 'border-ink/15 shadow-lift' : 'border-line hover:border-ink/25'
  );

  if (!onSelect) return <div className={shell}>{body}</div>;

  return (
    <button type="button" onClick={onSelect} aria-label={`Play the ${film.product} film`} className={shell}>
      {body}
    </button>
  );
}

export function HeroFilms() {
  const bucket = useThirtyMinuteBucket();
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (expanded === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(null);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [expanded]);

  const others = FILMS.map((film, i) => ({ film, i })).filter(({ i }) => i !== active);
  const open = expanded === null ? null : FILMS[expanded];

  return (
    <div className="animate-fade-up [animation-delay:120ms]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-forest/50" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-forest" />
          </span>
          Product films · 9 seconds each
        </div>
        <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted/60">
          <RefreshCw className="h-2.5 w-2.5" /> refreshes every 30 min
        </span>
      </div>

      <FilmCard film={FILMS[active]} bucket={bucket} reduced={reduced} large onExpand={() => setExpanded(active)} />

      <div className="mt-3 grid grid-cols-2 gap-3">
        {others.map(({ film, i }) => (
          <FilmCard key={film.slug} film={film} bucket={bucket} reduced={reduced} onSelect={() => setActive(i)} />
        ))}
      </div>

      <div className="mt-3 flex items-start gap-2 text-[10.5px] leading-relaxed text-muted">
        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-forest/60" />
        Every line in these films comes from one of the five customer conversations. Tap a smaller film to bring it forward.
      </div>

      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${open.product} film`}
            className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-ink/90 p-4 backdrop-blur-sm"
            onClick={() => setExpanded(null)}
          >
            <div className="w-full max-w-[1000px]" onClick={(e) => e.stopPropagation()}>
              <div className="mb-3 flex items-end justify-between gap-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-lime">{open.step}</div>
                  <div className="mt-1 font-display text-xl text-paper sm:text-2xl">{open.product}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setExpanded(null)}
                  aria-label="Close film"
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/20 text-paper/80 transition hover:bg-white/10 hover:text-paper"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <video
                key={`expanded-${bucket}`}
                src={src(open.slug, bucket)}
                poster={poster(open.slug)}
                className="w-full rounded-2xl border border-white/10 bg-black shadow-lift"
                autoPlay
                muted
                loop
                controls
                playsInline
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-paper/40">
                <span>{open.line}</span>
                <span>source re-requested every 30 min</span>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
