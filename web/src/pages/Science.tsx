import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Camera,
  Check,
  CircleDashed,
  ClipboardList,
  Eye,
  HeartPulse,
  Layers,
  LineChart,
  Quote,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Timer,
  TriangleAlert,
  Waves
} from 'lucide-react';
import { publicApi } from '../lib/api';
import type { SiteData } from '../lib/types';
import { PageHeader, FooterNote } from '../components/AppShell';
import { Card, Chip, Skeleton } from '../components/ui';

const FAQS = [
  {
    q: 'How long before anything can honestly be judged?',
    a: 'The hair follicle cycle runs in months, not weeks. Shedding can settle by week 6–8, but a density change is usually only photographable from week 9–13. The app therefore rewards adherence before it rewards appearance.'
  },
  {
    q: 'Why does hair fall increase in the first month?',
    a: 'Resting (telogen) hairs are pushed out before the growth (anagen) phase restarts. If the shedding is diffuse and settles by week 6–8, it fits the cycle. If it is patchy, painful or accompanied by scaling, that is a different pathway and needs a clinician.'
  },
  {
    q: 'Does the AI diagnose me?',
    a: 'No. The rule engine owns plan composition and safety. The model writes language over structured data — your adherence, week, sleep and logged shedding — and is instructed never to diagnose. Red-flag symptoms bypass the model entirely.'
  },
  {
    q: 'What is the app not measuring?',
    a: 'It does not measure follicle density, blood markers or hair diameter. Those need a clinic. It measures the variables that predict whether you will still be on the routine at week 12, and it makes your own photos comparable.'
  },
  {
    q: 'What happens if the AI providers go down?',
    a: 'The coach falls back through three Gemini keys, then a second provider, then a deterministic coach that reads the same data. The app never leaves you at a dead spinner; the answer just becomes more rule-shaped.'
  },
  {
    q: 'Is my data shared?',
    a: 'In this build everything sits in a local SQLite file on the demo server. An escalation is queued as a row; nothing is sent to a real clinic. You can export or delete your data from the Progress screen.'
  }
];

export default function Science() {
  const [site, setSite] = useState<SiteData | null>(null);

  useEffect(() => {
    publicApi.site().then(setSite).catch(() => undefined);
  }, []);

  return (
    <div className="pb-4">
      <PageHeader
        eyebrow="The science · and the honesty"
        title={<>The 13 weeks, without the hype.</>}
        sub="Retention is not a motivation problem. It is an expectation problem. This page is what the plan promises and what it refuses to promise."
        action={
          <Link to="/app/assistant" className="btn-ghost btn-sm">
            <Sparkles className="h-3.5 w-3.5" /> Ask the coach
          </Link>
        }
      />

      {/* Phases */}
      <div className="grid gap-3 md:grid-cols-3">
        {(site?.phases || Array.from({ length: 3 }).map(() => null)).map((phase, i) =>
          phase ? (
            <Card key={phase.week} className={i === 0 ? 'bg-forest p-5 text-paper' : 'p-5'}>
              <div className="flex items-center justify-between">
                <span className={`font-mono text-[10px] uppercase tracking-[0.16em] ${i === 0 ? 'text-lime' : 'text-muted'}`}>
                  Phase 0{i + 1}
                </span>
                <span className={`rounded-full border px-2.5 py-0.5 text-[9.5px] ${i === 0 ? 'border-white/20 text-paper/60' : 'border-line text-muted'}`}>
                  {phase.range}
                </span>
              </div>
              <h2 className={`mt-3 font-display text-2xl leading-none ${i === 0 ? 'text-paper' : ''}`}>{phase.name}</h2>
              <p className={`mt-1.5 text-[11.5px] leading-relaxed ${i === 0 ? 'text-paper/55' : 'text-muted'}`}>{phase.summary}</p>
              <div className={`mt-4 space-y-2.5 border-t pt-3 ${i === 0 ? 'border-white/10' : 'border-line'}`}>
                <div>
                  <div className={`text-[9px] uppercase tracking-[0.13em] ${i === 0 ? 'text-paper/35' : 'text-muted'}`}>What to expect</div>
                  <p className={`mt-0.5 text-[11px] leading-relaxed ${i === 0 ? 'text-paper/75' : 'text-ink/70'}`}>{phase.expectation}</p>
                </div>
                <div>
                  <div className={`text-[9px] uppercase tracking-[0.13em] ${i === 0 ? 'text-paper/35' : 'text-muted'}`}>Signal that matters</div>
                  <p className={`mt-0.5 text-[11px] leading-relaxed ${i === 0 ? 'text-lime/90' : 'text-forest'}`}>{phase.signal}</p>
                </div>
              </div>
            </Card>
          ) : (
            <Skeleton key={i} className="h-56" />
          )
        )}
      </div>

      {/* Evidence mechanics */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6">
          <div className="eyebrow mb-2">Why the proof is structurally hard</div>
          <h2 className="font-display text-[clamp(1.5rem,2.6vw,2.1rem)] leading-tight tracking-tight">
            The product is asked to prove itself inside the one window where evidence is impossible.
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: Timer,
                title: 'The cycle runs in months',
                body: 'Anagen (growth), catagen (transition) and telogen (rest) are not week-scale events. Any honest density signal is delayed by design.'
              },
              {
                icon: Eye,
                title: 'Memory is a biased instrument',
                body: 'We under-report gradual improvement and over-report sudden loss. The same head can look worse or better depending on the day you check.'
              },
              {
                icon: Camera,
                title: 'Camera-roll photos are not evidence',
                body: 'Different light, angle, hair length and phone. A true comparison fixes all four. That is a capture-protocol problem, not a willpower problem.'
              },
              {
                icon: CircleDashed,
                title: 'The touchpoint gap',
                body: 'Clinician contact is front-loaded at purchase and back-loaded at renewal. Weeks 3–8 have no human review, exactly when doubt peaks.'
              }
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-xl border border-line bg-white/55 p-3.5">
                <Icon className="h-4 w-4 text-forest" />
                <div className="mt-2 text-[12.5px] font-medium">{title}</div>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="eyebrow mb-2">What the app measures</div>
          <div className="space-y-3">
            {[
              { k: 'Dose adherence', v: 'From check-in rows against the scheduled cadence — not self-reported "mostly consistent".', ok: true },
              { k: 'Logging behaviour', v: 'Whether you opened the app and told the truth. A leading indicator of quitting.', ok: true },
              { k: 'Standardised photos', v: 'Angle, light and week labelled at capture, so week 12 is comparable.', ok: true },
              { k: 'Sleep and stress', v: 'Context variables that change the repair window. Logged, not guessed.', ok: true },
              { k: 'Follicle density', v: 'Not measured. A clinic does that. The app says so instead of faking a number.', ok: false }
            ].map((row) => (
              <div key={row.k} className="flex gap-2.5 border-t border-line pt-2.5 first:border-0 first:pt-0">
                <span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full ${row.ok ? 'bg-forest text-lime' : 'bg-ink/[0.06] text-muted'}`}>
                  {row.ok ? <Check className="h-2.5 w-2.5" strokeWidth={4} /> : <span className="text-[8px]">—</span>}
                </span>
                <div>
                  <div className="text-[12px] font-medium">{row.k}</div>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{row.v}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Research */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="p-6">
          <div className="eyebrow mb-2">The chosen problem</div>
          <h2 className="font-display text-[clamp(1.5rem,2.6vw,2rem)] leading-tight tracking-tight">
            {site?.chosenProblem.title || 'The 90-day proof gap'}
          </h2>
          <p className="mt-3 text-[12.5px] leading-[1.75] text-ink/75">
            {site?.chosenProblem.statement ||
              'Men abandon a routine between weeks 3 and 6 because the product cannot show evidence of working inside the window where doubt peaks.'}
          </p>
          <div className="mt-4 rounded-xl border border-line bg-paper/70 p-3.5">
            <div className="text-[9.5px] uppercase tracking-[0.13em] text-muted">Success metric</div>
            <p className="mt-1 text-[11.5px] leading-relaxed text-ink/70">
              {site?.chosenProblem.successMetric ||
                'Week-6 retention of the routine (+18pp target) and the share of users who can answer "is it working?" with a comparison, not a feeling.'}
            </p>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-forest/20 bg-forest/[0.04] px-3 py-2.5 text-[11px] leading-relaxed text-forest">
            <ClipboardList className="h-3.5 w-3.5 shrink-0" />
            Counted from five customer conversations, not written as a slogan.
          </div>
        </Card>

        <Card className="p-6">
          <div className="eyebrow mb-3">Root causes, layer by layer</div>
          <div className="space-y-3">
            {(site?.rootCauses || []).map((rc, i) => (
              <div key={rc.layer} className="flex gap-3 border-t border-line pt-3 first:border-0 first:pt-0">
                <span className="font-mono text-[9.5px] text-muted/60">0{i + 1}</span>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-forest">{rc.layer}</div>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink/70">{rc.cause}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Public reviews */}
      <Card className="mt-4 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="eyebrow mb-2">What public reviews add</div>
            <h2 className="font-display text-2xl leading-none tracking-tight">The same story, at scale.</h2>
          </div>
          <span className="text-[10px] text-muted">Paraphrased from marketplace listings · not verbatim</span>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {(site?.reviewThemes || []).map((r) => (
            <div key={r.theme} className="rounded-xl border border-line bg-white/55 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${r.sentiment === 'positive' ? 'bg-forest' : r.sentiment === 'negative' ? 'bg-danger' : 'bg-amber'}`}
                  />
                  <span className="text-[12.5px] font-medium">{r.theme}</span>
                </div>
                <Quote className="h-3.5 w-3.5 text-ink/20" />
              </div>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">{r.detail}</p>
              <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted/60">
                {Math.round(r.weight * 100)}% of sampled themes
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Problems considered */}
      <Card className="mt-4 overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <div className="eyebrow">Problems considered</div>
          <div className="mt-1 text-[12px] text-muted">Three were real. This one was upstream of all of them.</div>
        </div>
        <div className="divide-y divide-line">
          {(site?.problemsConsidered || []).map((p) => (
            <div key={p.id} className={`grid gap-3 px-5 py-4 sm:grid-cols-[34px_1fr_1.1fr] sm:gap-5 ${p.chosen ? 'bg-lime/[0.08]' : ''}`}>
              <div className="flex items-center gap-2 sm:block">
                <span className="font-mono text-[10px] text-muted">{p.id}</span>
                {p.chosen && (
                  <span className="ml-2 rounded-full bg-forest px-2 py-0.5 text-[8.5px] font-semibold uppercase tracking-wider text-lime sm:ml-0 sm:mt-1 sm:inline-block">
                    chosen
                  </span>
                )}
              </div>
              <div>
                <div className="text-[12.5px] font-medium">{p.title}</div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{p.evidence}</p>
              </div>
              <p className="text-[11px] leading-relaxed text-ink/65">{p.chosen ? <span className="font-medium text-forest">{p.whyChosen}</span> : p.whyNot}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Safety */}
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Card className="p-5 md:col-span-2">
          <div className="flex items-center gap-2 eyebrow">
            <ShieldCheck className="h-3.5 w-3.5 text-forest" /> Safety model
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-[12px] font-medium">The model never owns the decision</div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                Plan composition, dose cadence and escalation are deterministic rules. The model writes the sentence. If the
                provider chain fails, the deterministic coach still reads the same rows.
              </p>
            </div>
            <div>
              <div className="text-[12px] font-medium">Red flags bypass the model</div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                Sudden patchy loss, a painful or bleeding scalp, pus, scaling patches, a persistent rash, a lump, fever or a
                mental-health crisis route to a clinician review.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {['No diagnosis', 'No guaranteed regrowth', 'No stopping prescription medicine', 'Human review for red flags'].map((t) => (
              <Chip key={t}>
                <Check className="h-3 w-3 text-forest" /> {t}
              </Chip>
            ))}
          </div>
        </Card>
        <Card className="flex flex-col justify-between bg-forest p-5 text-paper">
          <div>
            <div className="eyebrow text-lime/70">If in doubt</div>
            <p className="mt-2 font-display text-xl leading-tight text-paper">Book the review, not the next serum.</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-paper/55">
              A clinician can look at the scalp. A product page cannot.
            </p>
          </div>
          <Link to="/app/assistant" className="btn-lime btn-sm mt-4 w-full">
            <Stethoscope className="h-3.5 w-3.5" /> Open the coach
          </Link>
        </Card>
      </div>

      {/* FAQ */}
      <Card className="mt-4 p-6">
        <div className="eyebrow mb-2">Straight answers</div>
        <h2 className="font-display text-2xl leading-none tracking-tight">Questions the marketing page avoids.</h2>
        <div className="mt-4 divide-y divide-line">
          {FAQS.map((f) => (
            <details key={f.q} className="group py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[12.5px] font-medium">
                {f.q}
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-line text-muted transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2 pr-8 text-[11.5px] leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </Card>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-chalk px-5 py-4">
        <div className="flex items-center gap-2.5">
          <BookOpen className="h-4 w-4 text-forest" />
          <span className="text-[12px] text-ink/75">Read the method behind the five conversations?</span>
        </div>
        <Link to="/" className="inline-flex items-center gap-1 text-[11.5px] font-medium text-forest hover:underline">
          Open the research summary <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <FooterNote />
    </div>
  );
}
