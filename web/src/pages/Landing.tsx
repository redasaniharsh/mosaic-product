import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  Check,
  CircleDashed,
  Layers,
  LineChart as LineChartIcon,
  Quote,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Timer,
  TriangleAlert
} from 'lucide-react';
import { publicApi } from '../lib/api';
import type { SiteData } from '../lib/types';
import { cadenceLabel, cn, compact, inr } from '../lib/utils';
import { Chip, Logo, Ring, Skeleton } from '../components/ui';
import { ProductImage } from '../components/ProductImage';
import { useAuth } from '../lib/auth';

const SectionHead = ({
  eyebrow,
  title,
  sub,
  align = 'left',
  light
}: {
  eyebrow: string;
  title: React.ReactNode;
  sub?: React.ReactNode;
  align?: 'left' | 'center';
  light?: boolean;
}) => (
  <div className={cn('max-w-3xl', align === 'center' && 'mx-auto text-center')}>
    <div className={cn('eyebrow mb-3', light && 'text-paper/50')}>{eyebrow}</div>
    <h2 className={cn('display text-[clamp(2rem,5vw,3.5rem)] leading-[1.02]', light ? 'text-paper' : 'text-ink')}>{title}</h2>
    {sub && <p className={cn('mt-4 max-w-2xl text-[14px] leading-relaxed', light ? 'text-paper/60' : 'text-muted')}>{sub}</p>}
  </div>
);

export default function Landing() {
  const [site, setSite] = useState<SiteData | null>(null);
  const [error, setError] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    publicApi
      .site()
      .then(setSite)
      .catch(() => setError(true));
  }, []);

  const proof = useMemo(() => {
    if (!site) return [];
    return site.patterns
      .filter((p) => ['no_progress_signal', 'shedding_panic', 'photo_inconsistency', 'all_or_nothing'].includes(p.theme))
      .slice(0, 3);
  }, [site]);

  const cta = user ? '/app' : '/signup';

  return (
    <div className="min-h-screen bg-paper">
      {/* ---------------------------------- Nav --------------------------------- */}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/80 backdrop-blur-lg">
        <div className="container-x flex h-[64px] items-center justify-between">
          <Link to="/">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-7 text-[12.5px] text-muted md:flex">
            <a href="#gap" className="transition hover:text-ink">
              The gap
            </a>
            <a href="#evidence" className="transition hover:text-ink">
              Evidence
            </a>
            <a href="#how" className="transition hover:text-ink">
              How it works
            </a>
            <a href="#science" className="transition hover:text-ink">
              The science
            </a>
            <a href="#build" className="transition hover:text-ink">
              The build
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link to="/app" className="btn-primary btn-sm">
                Open dashboard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden rounded-full px-3 py-2 text-[12.5px] text-muted transition hover:text-ink sm:block">
                  Sign in
                </Link>
                <Link to="/signup" className="btn-primary btn-sm">
                  Start free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* --------------------------------- Hero -------------------------------- */}
      <section className="relative overflow-hidden">
        <div className="container-x grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div className="animate-fade-up">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <Chip tone="ink">Mosaic Fellowship · Builder Round</Chip>
              <Chip>Man Matters</Chip>
            </div>
            <h1 className="display text-[clamp(2.8rem,6.4vw,4.6rem)] leading-[0.98]">
              Your hair doesn't change in 30 days.
              <span className="mt-1 block italic text-forest">Your routine has to survive the wait.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[14.5px] leading-relaxed text-muted">
              Man Matters Companion is a 90-day routine OS for men's hair, beard and skin. A plan built from your answers, a
              coach grounded in your own adherence data, and a photo protocol that makes week 12 judgeable.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to={cta} className="btn-lime px-6 py-3">
                Start your 90-day plan <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login?demo=1" className="btn-ghost px-6 py-3">
                Explore the live demo
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11.5px] text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-forest" /> 60-second assessment
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-forest" /> No card required
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-forest" /> Built from 5 customer conversations
              </span>
            </div>
          </div>

          {/* Product mock */}
          <div className="relative animate-fade-up [animation-delay:120ms]">
            <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-[radial-gradient(60%_60%_at_60%_30%,rgba(200,241,105,0.35),transparent_70%)] blur-2xl" />
            <div className="overflow-hidden rounded-[26px] border border-ink/10 bg-ink shadow-lift">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-paper/60">Today · Week 5</span>
                </div>
                <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-paper/70">
                  Consistency
                </span>
              </div>

              <div className="grid grid-cols-[1fr_112px] gap-4 p-5">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-paper/40">This week</div>
                  <div className="mt-1 font-display text-3xl text-paper">You're 83% on-plan.</div>
                  <div className="mt-2 text-[11.5px] leading-relaxed text-paper/50">
                    Week 3 fell to 42%. Week 5 recovered. That recovery is the whole game.
                  </div>
                </div>
                <div className="grid place-items-center">
                  <Ring value={83} size={98} stroke={7} tone="#C8F169" track="rgba(255,255,255,0.12)" sub="doses" />
                </div>
              </div>

              <div className="space-y-1.5 px-4 pb-4">
                {[
                  { name: 'Advanced Hair Growth Serum', time: 'PM · 5–6 drops', done: true },
                  { name: 'Biotin Gummies', time: 'AM · 1 gummy', done: true },
                  { name: 'Anti-Hairfall Shampoo', time: 'AM · wash day', done: false }
                ].map((row) => (
                  <div
                    key={row.name}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl border px-3 py-2.5',
                      row.done ? 'border-lime/25 bg-lime/[0.07]' : 'border-white/10 bg-white/[0.03]'
                    )}
                  >
                    <span
                      className={cn(
                        'grid h-4 w-4 place-items-center rounded-[5px] border',
                        row.done ? 'border-lime bg-lime text-ink' : 'border-white/25'
                      )}
                    >
                      {row.done && <Check className="h-2.5 w-2.5" strokeWidth={4} />}
                    </span>
                    <span className={cn('flex-1 truncate text-[11.5px]', row.done ? 'text-paper/90' : 'text-paper/60')}>{row.name}</span>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-paper/35">{row.time}</span>
                  </div>
                ))}
              </div>

              <div className="mx-4 mb-4 rounded-xl border border-lime/20 bg-lime/[0.06] p-3">
                <div className="flex items-center gap-1.5 text-[9.5px] font-medium uppercase tracking-[0.14em] text-lime">
                  <Sparkles className="h-3 w-3" /> Coach · grounded in your data
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-paper/75">
                  You're in the weeks 2–4 shedding window. More strands now means the cycle is resetting — stopping here is
                  the most common mistake.
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 px-5 py-3">
                <div className="flex items-center gap-2 text-[9.5px] uppercase tracking-wider text-paper/35">
                  <span className="h-1 w-1 rounded-full bg-lime" /> Baseline · W1
                </div>
                <svg viewBox="0 0 120 22" className="h-6 w-28">
                  <path d="M0 17 C18 17 22 13 36 13 S56 9 70 10 S96 5 120 4" fill="none" stroke="#C8F169" strokeWidth="1.6" />
                  {[0, 36, 70, 120].map((x, i) => (
                    <circle key={x} cx={x} cy={[17, 13, 10, 4][i]} r="1.8" fill="#C8F169" />
                  ))}
                </svg>
                <div className="text-[9.5px] uppercase tracking-wider text-paper/35">Week 5 · −19 strands</div>
              </div>
            </div>

            <div className="absolute -left-3 bottom-16 hidden rotate-[-3deg] rounded-xl border border-line bg-paper px-3 py-2 shadow-lift sm:block">
              <div className="text-[9px] uppercase tracking-[0.14em] text-muted">Standardised photo</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] font-medium">
                <Camera className="h-3 w-3 text-forest" /> Same light. Same angle.
              </div>
            </div>
            <div className="absolute -right-3 top-10 hidden rotate-[2deg] rounded-xl border border-forest/20 bg-forest px-3 py-2 text-paper shadow-lift sm:block">
              <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-lime">Retention target</div>
              <div className="mt-0.5 text-[12px] font-medium">+18pp by week 6</div>
            </div>
          </div>
        </div>

        {/* Stat band */}
        <div className="border-y border-line bg-chalk">
          <div className="container-x grid divide-y divide-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
            {[
              { k: 'Customer conversations', v: site ? String(site.stats.customers) : '5', s: 'Man Matters, Oct–Nov 2026' },
              {
                k: 'Said progress was unmeasurable',
                v: site ? `${site.patterns.find((p) => p.theme === 'no_progress_signal')?.count || 5}/5` : '5/5',
                s: 'The most repeated pattern'
              },
              { k: 'Before week 6', v: '3/5', s: 'Stopped or nearly stopped' },
              { k: 'Growth cycle', v: '12 wks', s: 'The honest evidence window' }
            ].map((item, i) => (
              <div key={item.k} className={cn('px-6 py-6 lg:px-7', i === 0 && 'lg:pl-0')}>
                <div className="font-display text-[2.1rem] leading-none tracking-tight">{item.v}</div>
                <div className="mt-2 text-[12px] font-medium">{item.k}</div>
                <div className="mt-0.5 text-[10.5px] text-muted">{item.s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------- The gap ------------------------------ */}
      <section id="gap" className="container-x py-20 lg:py-28">
        <SectionHead
          eyebrow="The problem"
          title={
            <>
              The product isn't failing.
              <br />
              <span className="italic text-forest">The proof is.</span>
            </>
          }
          sub="Five Man Matters customers, five different routines, one shared experience: somewhere between week 3 and week 6, the routine starts to feel like a guess."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="card relative overflow-hidden p-7 sm:p-9">
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-lime/30 blur-3xl" />
            <div className="eyebrow mb-4">The chosen problem</div>
            <h3 className="display text-[clamp(1.7rem,3.4vw,2.4rem)] leading-tight">
              {site?.chosenProblem.title || 'The 90-day proof gap'}
            </h3>
            <p className="mt-4 text-[14px] leading-[1.75] text-ink/75">
              {site?.chosenProblem.statement ||
                'Men abandon a Man Matters routine between weeks 3 and 6 because the product cannot show evidence of working inside the window where doubt peaks.'}
            </p>
            <div className="mt-6 rounded-xl border border-line bg-paper/70 p-4">
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted">Why this is a software problem</div>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink/70">
                {site?.chosenProblem.whyTechnology ||
                  'The evidence already exists — dose timestamps, photos, sleep, orders. It is just never assembled into a signal.'}
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Chip tone="lime">
                <Timer className="h-3 w-3" /> 12-week growth cycle
              </Chip>
              <Chip>
                <CircleDashed className="h-3 w-3" /> no clinician touchpoint weeks 3–8
              </Chip>
              <Chip>memory is a biased instrument</Chip>
            </div>
          </div>

          <div className="space-y-3">
            {(site?.rootCauses || []).slice(0, 5).map((rc, i) => (
              <div key={rc.layer} className="card flex gap-4 p-4.5 transition hover:-translate-y-0.5 hover:shadow-lift" style={{ padding: '1.1rem' }}>
                <span className="font-mono text-[10px] text-muted/60">0{i + 1}</span>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-forest">{rc.layer}</div>
                  <p className="mt-1 text-[12px] leading-relaxed text-ink/70">{rc.cause}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------- Evidence ------------------------------ */}
      <section id="evidence" className="border-y border-line bg-chalk py-20 lg:py-28">
        <div className="container-x">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <SectionHead eyebrow="From the conversations" title={<>What five customers actually said.</>} />
            <p className="text-[13px] leading-relaxed text-muted lg:pb-2">
              Names shortened for the public page; the full research document carries each customer's name, phone number,
              products and verbatim notes. Patterns below are counted from the tagged conversations, not written by hand.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(site?.quotes || []).slice(0, 3).map((q, i) => (
              <figure
                key={q.name + i}
                className={cn(
                  'flex flex-col justify-between rounded-2xl border p-6',
                  i === 0 ? 'border-forest/20 bg-forest text-paper' : 'border-line bg-paper'
                )}
              >
                <Quote className={cn('h-5 w-5', i === 0 ? 'text-lime' : 'text-ink/25')} />
                <blockquote className={cn('mt-4 text-[14.5px] leading-relaxed', i === 0 ? 'text-paper/90' : 'text-ink/80')}>
                  {q.quote}
                </blockquote>
                <figcaption className={cn('mt-6 flex items-center justify-between text-[11px]', i === 0 ? 'text-paper/50' : 'text-muted')}>
                  <span>
                    {q.name} · {q.city}
                  </span>
                  <span className={cn('rounded-full px-2 py-0.5', i === 0 ? 'bg-white/10' : 'bg-ink/5')}>{q.tenure}</span>
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {(site?.quotes || []).slice(3, 5).map((q) => (
              <figure key={q.name} className="rounded-2xl border border-line bg-paper p-5">
                <blockquote className="text-[13px] leading-relaxed text-ink/75">“{q.quote}”</blockquote>
                <figcaption className="mt-3 text-[11px] text-muted">
                  {q.name} · {q.city} · {q.tenure}
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="mt-10 grid gap-8 rounded-2xl border border-line bg-paper p-6 sm:p-8 lg:grid-cols-2">
            <div>
              <div className="eyebrow mb-4">Patterns across all five</div>
              <div className="space-y-4">
                {(proof.length ? proof : Array.from({ length: 3 }).map(() => null)).map((p, i) =>
                  p ? (
                    <div key={p.theme}>
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="text-[12.5px] font-medium">{p.label}</span>
                        <span className="font-mono text-[11px] text-muted">{p.count}/5</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/[0.06]">
                        <div className="h-full rounded-full bg-forest transition-all duration-700" style={{ width: `${(p.count / 5) * 100}%` }} />
                      </div>
                    </div>
                  ) : (
                    <Skeleton key={i} className="h-9 w-full" />
                  )
                )}
              </div>
            </div>
            <div className="lg:border-l lg:border-line lg:pl-8">
              <div className="eyebrow mb-4">What public reviews add</div>
              <div className="space-y-3">
                {(site?.reviewThemes || []).slice(0, 3).map((r) => (
                  <div key={r.theme} className="flex gap-3">
                    <span
                      className={cn(
                        'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                        r.sentiment === 'positive' ? 'bg-forest' : r.sentiment === 'negative' ? 'bg-danger' : 'bg-amber'
                      )}
                    />
                    <div>
                      <div className="text-[12px] font-medium">{r.theme}</div>
                      <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">{r.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------- How it works --------------------------- */}
      <section id="how" className="container-x py-20 lg:py-28">
        <SectionHead
          eyebrow="The solution"
          title={<>Four moves that close the proof gap.</>}
          sub="Not another tracker. Every screen exists to answer one question: is this working, and what should I do about it today?"
          align="center"
        />
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: ScanFace,
              step: '01',
              title: 'Assess, then prescribe',
              body: 'Six questions map your concern, stage, lifestyle and budget to a 13-week plan. Products enter in phases so you can tell what is adding what.'
            },
            {
              icon: Camera,
              step: '02',
              title: 'One standardised photo',
              body: 'The capture flow fixes the angle, checks lighting and labels the week — so week 12 is a comparison, not a feeling.'
            },
            {
              icon: Sparkles,
              step: '03',
              title: 'A coach that knows your data',
              body: 'Every prompt carries your week, adherence and logged shedding. It answers the 11pm panic with your numbers, not a blog post.'
            },
            {
              icon: LineChartIcon,
              step: '04',
              title: 'Weekly review, one action',
              body: 'A Sunday review names the single next lever. If the data says stop guessing, it escalates to a clinician instead.'
            }
          ].map(({ icon: Icon, step, title, body }) => (
            <div key={step} className="group card flex flex-col p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lift">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-lime transition group-hover:bg-forest">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="font-mono text-[10px] text-muted/60">{step}</span>
              </div>
              <h3 className="mt-5 font-display text-[1.35rem] leading-tight">{title}</h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink bg-ink p-6 text-paper sm:p-7">
          <div>
            <div className="font-display text-2xl tracking-tight">The demo account is already at week 5.</div>
            <p className="mt-1 text-[12px] text-paper/50">Five weeks of real check-ins, a shedding dip, a recovery, three photos and a live coach.</p>
          </div>
          <Link to="/login?demo=1" className="btn-lime">
            Open the demo <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* -------------------------------- Science ------------------------------- */}
      <section id="science" className="border-y border-line bg-ink py-20 text-paper lg:py-28">
        <div className="container-x">
          <SectionHead
            light
            eyebrow="The science · and the honesty"
            title={
              <>
                The 13 weeks, <span className="italic text-lime">without the hype.</span>
              </>
            }
            sub="Retention is not a motivation problem. It is an expectation problem. The plan tells you what each phase will and will not show."
          />
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-3">
            {(site?.phases || []).map((phase, i) => (
              <div key={phase.week} className="relative bg-ink p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-lime">Phase 0{i + 1}</span>
                  <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-[10px] text-paper/60">{phase.range}</span>
                </div>
                <h3 className="mt-5 font-display text-[1.8rem] leading-none">{phase.name}</h3>
                <p className="mt-2 text-[12px] text-paper/50">{phase.summary}</p>
                <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
                  <div>
                    <div className="text-[9.5px] uppercase tracking-[0.14em] text-paper/35">What to expect</div>
                    <p className="mt-1 text-[12px] leading-relaxed text-paper/75">{phase.expectation}</p>
                  </div>
                  <div>
                    <div className="text-[9.5px] uppercase tracking-[0.14em] text-paper/35">The signal that matters</div>
                    <p className="mt-1 text-[12px] leading-relaxed text-lime/90">{phase.signal}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-[11.5px] leading-relaxed text-paper/50">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-lime/70" />
            The app never promises regrowth. It reports your adherence, your logged shedding and your photos — and escalates to
            a clinician when the pattern stops looking routine.
          </div>
        </div>
      </section>

      {/* ------------------------------ Problems considered -------------------- */}
      <section className="container-x py-20 lg:py-28">
        <SectionHead
          eyebrow="Why this problem"
          title={<>Four problems were on the table.</>}
          sub="The other three were real. This one was upstream of all of them — and solvable with data the customer already generates."
        />
        <div className="mt-10 overflow-hidden rounded-2xl border border-line bg-chalk">
          {(site?.problemsConsidered || []).map((p, i) => (
            <div
              key={p.id}
              className={cn(
                'grid gap-3 border-b border-line p-5 last:border-0 sm:grid-cols-[80px_1fr_1.1fr] sm:gap-6 sm:p-6',
                p.chosen && 'bg-lime/10'
              )}
            >
              <div className="flex items-center gap-2 sm:block">
                <span className="font-mono text-[10px] text-muted">{p.id}</span>
                {p.chosen && <span className="ml-2 rounded-full bg-forest px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-lime sm:ml-0 sm:mt-2 sm:inline-block">Chosen</span>}
              </div>
              <div>
                <h4 className="text-[13.5px] font-medium">{p.title}</h4>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{p.evidence}</p>
              </div>
              <p className="text-[11.5px] leading-relaxed text-ink/65">
                {p.chosen ? <span className="font-medium text-forest">{p.whyChosen}</span> : p.whyNot}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------------- Build -------------------------------- */}
      <section id="build" className="border-y border-line bg-chalk py-20 lg:py-28">
        <div className="container-x">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <SectionHead
                eyebrow="Under the hood"
                title={<>AI where it earns its place.</>}
                sub="Most of this app is deterministic. The model is used for language and judgement — never for the user's numbers, the dose schedule or the safety rules."
              />
              <div className="mt-6 space-y-2 font-mono text-[11px] text-muted">
                {[
                  ['frontend', 'React 19 · Vite · Tailwind · Recharts'],
                  ['backend', 'Node · Express · SQLite (node:sqlite)'],
                  ['ai', 'Gemini 2.5 Flash ×3 keys → Nemotron 550B → rules'],
                  ['deploy', 'single service · API serves the built SPA']
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-3 rounded-lg border border-line bg-paper px-3 py-2">
                    <span className="w-16 shrink-0 text-muted/60">{k}</span>
                    <span className="text-ink/70">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: ShieldCheck,
                  title: 'Rules own safety',
                  body: 'The engine decides what to recommend and when to escalate. The model only phrases it. Red-flag symptoms bypass the model entirely.',
                  tag: 'guardrail'
                },
                {
                  icon: Layers,
                  title: 'Prompts carry the chart',
                  body: "The coach receives the user's week, 7/30-day adherence, logged shedding and sleep. It is instructed to quote them or stay quiet.",
                  tag: 'grounding'
                },
                {
                  icon: Sparkles,
                  title: 'Degrade, never dead-end',
                  body: 'Three Gemini keys, then Nemotron, then a deterministic coach that still reads the same data. No spinner-of-death on stage.',
                  tag: 'resilience'
                },
                {
                  icon: LineChartIcon,
                  title: 'Every card is a query',
                  body: 'Signals, refill estimates and weekly reviews are computed from SQLite rows — no hardcoded dashboard copy, no fake charts.',
                  tag: 'data'
                }
              ].map(({ icon: Icon, title, body, tag }) => (
                <div key={title} className="card p-5">
                  <div className="flex items-center justify-between">
                    <Icon className="h-4 w-4 text-forest" />
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted/60">{tag}</span>
                  </div>
                  <h3 className="mt-3.5 text-[13.5px] font-medium">{title}</h3>
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">{body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Products */}
          <div className="mt-16">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <div className="eyebrow mb-2">The stack</div>
                <h3 className="display text-[clamp(1.6rem,3vw,2.2rem)]">Real products, phased honestly.</h3>
              </div>
              <Link to="/app/products" className="hidden text-[12px] text-muted transition hover:text-ink sm:inline-flex sm:items-center sm:gap-1">
                Browse the catalogue <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(site?.featured || []).map((p) => (
                <div key={p.slug} className="card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lift">
                  <div className="relative h-36 w-full overflow-hidden">
                    <ProductImage
                      src={p.image}
                      alt={p.name}
                      accent={p.accent}
                      className="absolute inset-0 h-full w-full"
                      imgClassName="transition duration-700 group-hover:scale-[1.05]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-ink/25" />
                    <span className="absolute bottom-3 left-4 font-mono text-[9px] uppercase tracking-[0.16em] text-white/70">{p.category}</span>
                    <span className="absolute right-3 top-3 rounded-full border border-white/15 bg-ink/40 px-2 py-0.5 text-[9.5px] text-white/85 backdrop-blur">★ {p.rating}</span>
                  </div>
                  <div className="p-4">
                    <h4 className="text-[13px] font-medium leading-snug">{p.name}</h4>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted">{p.tagline}</p>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-[13px] font-medium">{inr(p.price)}</span>
                      <span className="text-[10.5px] text-muted line-through">{inr(p.mrp)}</span>
                      <span className="ml-auto font-mono text-[9.5px] text-muted/70">{compact(p.reviews)} rev</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------- CTA --------------------------------- */}
      <section className="relative overflow-hidden bg-forest py-20 text-paper lg:py-24">
        <div className="pointer-events-none absolute inset-0 grain" />
        <div className="pointer-events-none absolute -left-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-lime/20 blur-3xl" />
        <div className="container-x relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <div className="eyebrow mb-3 text-lime/70">Week 12 is the unfair judge</div>
            <h2 className="display max-w-2xl text-[clamp(2.2rem,5.5vw,4rem)] leading-[1.0]">
              Give the routine a fair trial.
            </h2>
            <p className="mt-4 max-w-xl text-[13.5px] leading-relaxed text-paper/60">
              A plan you can follow, a signal you can trust, and a coach that reads your data before it speaks.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to={cta} className="btn-lime px-6 py-3.5">
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/login?demo=1" className="btn inline-flex border border-paper/25 px-6 py-3.5 text-paper hover:bg-paper/10">
              View the demo account
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-ink py-10 text-paper/50">
        <div className="container-x flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <Logo light />
          <p className="max-w-md text-[10.5px] leading-relaxed">
            An independent Builder Round submission for the Mosaic Fellowship. Not an official Man Matters product. Customer
            quotes are paraphrased from recorded conversations with permission; public review themes are paraphrased.
          </p>
          <div className="flex flex-col gap-1 text-[10.5px]">
            <span>Mosaic Fellowship · Class of 2027</span>
            <span>{site ? `Built ${new Date().getFullYear()} · ${site.stats.checkins} check-ins in the demo DB` : 'Built with AI'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
