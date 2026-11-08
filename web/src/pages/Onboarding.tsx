import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  HeartPulse,
  Moon,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Sun,
  TriangleAlert,
  Wallet,
  Waves,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { appApi, publicApi, ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { SiteData, UserPlan } from '../lib/types';
import { Btn, Card, Chip, Field, Input, Logo, Meter, Select, Textarea } from '../components/ui';
import { cn } from '../lib/utils';

const GOALS = [
  { id: 'hair', label: 'Hair', blurb: 'Fall, thinning, hairline', icon: Waves },
  { id: 'beard', label: 'Beard', blurb: 'Patchy cheeks, density', icon: ScanFace },
  { id: 'skin', label: 'Skin', blurb: 'Acne, marks, dullness', icon: Sun },
  { id: 'energy', label: 'Energy', blurb: 'Crashes, recovery, sleep', icon: Zap },
  { id: 'weight', label: 'Weight', blurb: 'Belly fat that returns', icon: Activity },
  { id: 'intimate', label: 'Intimate', blurb: 'Confidence and control', icon: HeartPulse }
] as const;

const GOAL_CONCERNS: Record<string, string[]> = {
  hair: ['hair_fall', 'thinning', 'receding_hairline'],
  beard: ['beard_patchy'],
  skin: ['skin_glow', 'acne', 'pigmentation', 'dark_circles'],
  energy: ['low_energy', 'sleep'],
  weight: ['weight'],
  intimate: ['intimate_wellness']
};

const FALLBACK_CONCERNS = [
  { id: 'hair_fall', label: 'Hair fall', blurb: 'More strands on the pillow, shower or comb than last year.' },
  { id: 'thinning', label: 'Thinning & density', blurb: 'Scalp visible under light, crown feels lighter.' },
  { id: 'receding_hairline', label: 'Receding hairline', blurb: 'Temples moving back, M-shape forming.' },
  { id: 'beard_patchy', label: 'Patchy beard', blurb: 'Cheeks or chin that will not fill in.' },
  { id: 'skin_glow', label: 'Dull skin', blurb: 'Tired, uneven tone, no glow.' },
  { id: 'acne', label: 'Acne & oiliness', blurb: 'Breakouts that return every few weeks.' },
  { id: 'pigmentation', label: 'Dark spots', blurb: 'Post-acne marks and sun patches that linger.' },
  { id: 'dark_circles', label: 'Dark circles', blurb: 'Under-eye shadows that sleep does not fix.' },
  { id: 'low_energy', label: 'Low energy', blurb: 'Afternoon crashes, poor recovery.' },
  { id: 'weight', label: 'Weight & belly fat', blurb: 'The same 4 kg that keeps coming back.' },
  { id: 'intimate_wellness', label: 'Intimate wellness', blurb: 'Confidence and control.' },
  { id: 'sleep', label: 'Sleep quality', blurb: 'Waking up unrefreshed.' }
];

const STEPS = ['Goal', 'Concerns', 'Profile', 'Lifestyle', 'Plan settings'];

type Answers = {
  goal: string;
  concern: string;
  concerns: string[];
  age: string;
  hairType: string;
  scalp: string;
  beardType: string;
  skinType: string;
  durationOfConcern: string;
  sleepHours: number;
  stress: number;
  diet: string;
  budget: 'lean' | 'balanced' | 'premium';
  routineTime: string;
  reportDeficiency: boolean;
  medications: string;
  city: string;
};

const GENERATING = [
  'Reading your answers',
  'Mapping your concern to a stage',
  'Sequencing products into 3 phases',
  'Checking interactions and safety rules',
  'Writing the honest expectations'
];

export default function Onboarding() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [site, setSite] = useState<SiteData | null>(null);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ plan: UserPlan; overview: any } | null>(null);
  const [genIdx, setGenIdx] = useState(0);
  const startedAt = useRef(Date.now());

  const [a, setA] = useState<Answers>({
    goal: '',
    concern: '',
    concerns: [],
    age: user?.age ? String(user.age) : '',
    hairType: 'straight',
    scalp: 'normal',
    beardType: 'patchy',
    skinType: 'combination',
    durationOfConcern: '1-2 years',
    sleepHours: 7,
    stress: 3,
    diet: 'mixed',
    budget: 'balanced',
    routineTime: 'night',
    reportDeficiency: false,
    medications: '',
    city: user?.city || ''
  });

  useEffect(() => {
    publicApi.site().then(setSite).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!busy) return;
    startedAt.current = Date.now();
    setGenIdx(0);
    const id = window.setInterval(() => setGenIdx((i) => Math.min(GENERATING.length - 1, i + 1)), 2200);
    return () => window.clearInterval(id);
  }, [busy]);

  const concerns = site?.concerns?.length ? site.concerns : FALLBACK_CONCERNS;
  const visibleConcerns = useMemo(() => {
    if (!a.goal) return concerns;
    const ids = GOAL_CONCERNS[a.goal] || [];
    return concerns.filter((c) => ids.includes(c.id));
  }, [a.goal, concerns]);

  const set = <K extends keyof Answers>(key: K, value: Answers[K]) => setA((prev) => ({ ...prev, [key]: value }));

  const toggleConcern = (id: string) => {
    setA((prev) => {
      const exists = prev.concerns.includes(id);
      const next = exists ? prev.concerns.filter((c) => c !== id) : prev.concerns.length >= 3 ? prev.concerns : [...prev.concerns, id];
      return { ...prev, concerns: next, concern: next[0] || '' };
    });
  };

  const canContinue = () => {
    if (step === 0) return Boolean(a.goal);
    if (step === 1) return a.concerns.length > 0;
    return true;
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const payload = {
        ...a,
        age: a.age ? Number(a.age) : undefined,
        concerns: a.concerns,
        concern: a.concern || a.concerns[0]
      };
      const res = await appApi.onboard(payload as Record<string, unknown>);
      const elapsed = Date.now() - startedAt.current;
      if (elapsed < 1400) await new Promise((r) => setTimeout(r, 1400 - elapsed));
      setResult({ plan: res.plan, overview: res.overview });
      await refresh();
      toast.success('Your 13-week plan is ready');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not build the plan. Try again.');
      setBusy(false);
    }
  };

  /* ------------------------------- Generating ------------------------------ */
  if (busy) {
    return (
      <div className="relative grid min-h-screen place-items-center overflow-hidden bg-ink px-6 text-paper">
        <div className="pointer-events-none absolute inset-0 grain" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime/10 blur-3xl" />
        <div className="relative w-full max-w-md text-center">
          <div className="mx-auto grid h-14 w-14 animate-breathe place-items-center rounded-2xl border border-lime/30 bg-lime/10">
            <Sparkles className="h-6 w-6 text-lime" />
          </div>
          <h1 className="mt-7 font-display text-4xl leading-none tracking-tight">Building your 13 weeks.</h1>
          <p className="mt-3 text-[12.5px] leading-relaxed text-paper/50">
            The rule engine owns the plan and the safety checks. The model writes the narrative. Neither invents your numbers.
          </p>
          <div className="mt-8 space-y-2 text-left">
            {GENERATING.map((label, i) => (
              <div
                key={label}
                className={cn(
                  'flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-[12px] transition',
                  i < genIdx
                    ? 'border-lime/20 bg-lime/[0.05] text-paper/70'
                    : i === genIdx
                      ? 'border-lime/40 bg-lime/[0.09] text-paper'
                      : 'border-white/10 text-paper/35'
                )}
              >
                <span
                  className={cn(
                    'grid h-4 w-4 place-items-center rounded-full border',
                    i < genIdx ? 'border-lime bg-lime text-ink' : 'border-current'
                  )}
                >
                  {i < genIdx ? <Check className="h-2.5 w-2.5" strokeWidth={4} /> : i === genIdx ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime" /> : null}
                </span>
                {label}
              </div>
            ))}
          </div>
          {error && (
            <div className="mt-6 rounded-xl border border-danger/40 bg-danger/10 p-3 text-left text-[12px] text-paper/80">
              {error}
              <button onClick={() => setBusy(false)} className="mt-2 block font-medium text-lime underline underline-offset-4">
                Go back and try again
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* -------------------------------- Result -------------------------------- */
  if (result) {
    const plan = result.plan;
    return (
      <div className="min-h-screen bg-paper">
        <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:py-14">
          <div className="flex items-center justify-between">
            <Logo />
            <Chip tone="lime">
              <Check className="h-3 w-3" /> Plan ready
            </Chip>
          </div>

          <div className="mt-9 animate-fade-up">
            <div className="eyebrow mb-3">Generated from your answers · {plan.generatedBy === 'rules' ? 'rule engine' : plan.generatedBy}</div>
            <h1 className="font-display text-[clamp(2.2rem,5vw,3.4rem)] leading-[1.02] tracking-tightest">{plan.headline}</h1>
            <p className="mt-4 text-[14px] leading-[1.75] text-ink/75">{plan.summary}</p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {plan.focusAreas?.map((f, i) => (
              <Card key={f.title} className="p-4.5" style={{ padding: '1.1rem' }}>
                <div className="font-mono text-[10px] text-muted/60">0{i + 1}</div>
                <div className="mt-1.5 text-[13px] font-medium">{f.title}</div>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{f.body}</p>
              </Card>
            ))}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <div className="eyebrow mb-3">What to expect, honestly</div>
              <ul className="space-y-2.5">
                {plan.expectations?.map((e, i) => (
                  <li key={i} className="flex gap-2.5 text-[12px] leading-relaxed text-ink/75">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-forest" /> {e}
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-5">
              <div className="eyebrow mb-3">Book a review if you see</div>
              <ul className="space-y-2.5">
                {plan.watchFor?.map((e, i) => (
                  <li key={i} className="flex gap-2.5 text-[12px] leading-relaxed text-ink/75">
                    <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber" /> {e}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card className="mt-4 bg-forest p-5 text-paper">
            <div className="flex items-center gap-2 eyebrow text-lime/70">
              <ShieldCheck className="h-3.5 w-3.5" /> Your guardrails
            </div>
            <div className="mt-3 space-y-3">
              {plan.guardrails?.map((g) => (
                <div key={g.title} className="border-t border-white/10 pt-3 first:border-0 first:pt-0">
                  <div className="text-[12.5px] font-medium">{g.title}</div>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-paper/55">{g.body}</p>
                </div>
              ))}
            </div>
          </Card>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Btn
              variant="lime"
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => navigate('/app', { replace: true })}
            >
              Open today's plan <ArrowRight className="h-4 w-4" />
            </Btn>
            <span className="text-[11px] text-muted">Your first check-in takes 20 seconds.</span>
          </div>
        </div>
      </div>
    );
  }

  /* --------------------------------- Wizard -------------------------------- */
  return (
    <div className="min-h-screen bg-paper">
      <div className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10.5px] text-muted">
              {step + 1} / {STEPS.length}
            </span>
            <div className="h-1 w-24 overflow-hidden rounded-full bg-ink/[0.08] sm:w-40">
              <div
                className="h-full rounded-full bg-forest transition-all duration-500"
                style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-4xl gap-8 px-5 py-8 sm:px-8 sm:py-12 lg:grid-cols-[190px_1fr]">
        {/* Step rail */}
        <div className="hidden lg:block">
          <div className="sticky top-24 space-y-1">
            {STEPS.map((label, i) => (
              <div
                key={label}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] transition',
                  i === step ? 'bg-ink text-paper' : i < step ? 'text-forest' : 'text-muted/70'
                )}
              >
                <span
                  className={cn(
                    'grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[9.5px]',
                    i === step ? 'border-lime bg-lime text-ink' : i < step ? 'border-forest bg-forest/10' : 'border-current'
                  )}
                >
                  {i < step ? <Check className="h-2.5 w-2.5" strokeWidth={4} /> : i + 1}
                </span>
                {label}
              </div>
            ))}
            <p className="mt-6 border-t border-line pt-4 text-[10.5px] leading-relaxed text-muted">
              The assessment shapes the plan. It is not a diagnosis — red flags are routed to a clinician, not a serum.
            </p>
          </div>
        </div>

        <div className="min-w-0">
          <div className="animate-fade-up" key={step}>
            {step === 0 && (
              <>
                <div className="eyebrow mb-2">Step 1 · The goal</div>
                <h1 className="font-display text-[clamp(1.9rem,4.4vw,2.7rem)] leading-none tracking-tightest">
                  What are we actually trying to change?
                </h1>
                <p className="mt-3 max-w-lg text-[13px] leading-relaxed text-muted">
                  Pick the one that bothers you most. The routine can include more later — the plan starts with one job.
                </p>
                <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                  {GOALS.map(({ id, label, blurb, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => {
                        set('goal', id);
                        setA((prev) => ({ ...prev, concerns: [], concern: '' }));
                      }}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border p-3.5 text-left transition',
                        a.goal === id ? 'border-forest bg-forest text-paper shadow-soft' : 'border-line bg-chalk hover:border-ink/25'
                      )}
                    >
                      <span
                        className={cn(
                          'grid h-9 w-9 shrink-0 place-items-center rounded-lg',
                          a.goal === id ? 'bg-lime text-ink' : 'bg-ink/[0.05] text-forest'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-[13px] font-medium">{label}</span>
                        <span className={cn('mt-0.5 block text-[11px]', a.goal === id ? 'text-paper/55' : 'text-muted')}>{blurb}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="eyebrow mb-2">Step 2 · The concern</div>
                <h1 className="font-display text-[clamp(1.9rem,4.4vw,2.7rem)] leading-none tracking-tightest">
                  Which of these is true for you?
                </h1>
                <p className="mt-3 max-w-lg text-[13px] leading-relaxed text-muted">
                  Pick up to three. The first one becomes the primary target; the rest influence which products enter later.
                </p>
                <div className="mt-6 grid gap-2.5">
                  {visibleConcerns.map((c) => {
                    const on = a.concerns.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleConcern(c.id)}
                        className={cn(
                          'flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition',
                          on ? 'border-forest/40 bg-forest/[0.055]' : 'border-line bg-chalk hover:border-ink/25'
                        )}
                      >
                        <span
                          className={cn(
                            'grid h-5 w-5 shrink-0 place-items-center rounded-md border',
                            on ? 'border-forest bg-forest text-lime' : 'border-ink/20 bg-white'
                          )}
                        >
                          {on && <Check className="h-3 w-3" strokeWidth={3} />}
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-2 text-[13px] font-medium">
                            {c.label}
                            {on && a.concerns[0] === c.id && (
                              <span className="rounded-full bg-lime px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-forest">
                                primary
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 block text-[11.5px] text-muted">{c.blurb}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="eyebrow mb-2">Step 3 · Your profile</div>
                <h1 className="font-display text-[clamp(1.9rem,4.4vw,2.7rem)] leading-none tracking-tightest">
                  A little context changes the plan.
                </h1>
                <p className="mt-3 max-w-lg text-[13px] leading-relaxed text-muted">
                  This decides dose, cadence and whether a device is worth adding at all.
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <Field label="Age">
                    <Input inputMode="numeric" value={a.age} onChange={(e) => set('age', e.target.value)} placeholder="24" />
                  </Field>
                  <Field label="City">
                    <Input value={a.city} onChange={(e) => set('city', e.target.value)} placeholder="Mumbai" />
                  </Field>
                </div>

                {(a.goal === 'hair' || a.concerns.some((c) => ['hair_fall', 'thinning', 'receding_hairline'].includes(c))) && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Field label="Hair type">
                      <Select value={a.hairType} onChange={(e) => set('hairType', e.target.value)}>
                        <option value="straight">Straight</option>
                        <option value="wavy">Wavy</option>
                        <option value="curly">Curly</option>
                        <option value="coily">Coily</option>
                      </Select>
                    </Field>
                    <Field label="Scalp">
                      <Select value={a.scalp} onChange={(e) => set('scalp', e.target.value)}>
                        <option value="normal">Normal</option>
                        <option value="oily">Oily by evening</option>
                        <option value="dry">Dry / tight</option>
                        <option value="sensitive">Sensitive / itchy</option>
                        <option value="dandruff">Flaky / dandruff</option>
                      </Select>
                    </Field>
                  </div>
                )}

                {(a.goal === 'beard' || a.concerns.includes('beard_patchy')) && (
                  <Field label="Beard coverage" className="mt-4">
                    <Select value={a.beardType} onChange={(e) => set('beardType', e.target.value)}>
                      <option value="patchy">Patchy cheeks / chin</option>
                      <option value="thin">Thin but even</option>
                      <option value="full">Full, want density</option>
                    </Select>
                  </Field>
                )}

                {(a.goal === 'skin' || a.concerns.some((c) => ['skin_glow', 'acne', 'pigmentation', 'dark_circles'].includes(c))) && (
                  <Field label="Skin type" className="mt-4">
                    <Select value={a.skinType} onChange={(e) => set('skinType', e.target.value)}>
                      <option value="oily">Oily</option>
                      <option value="combination">Combination</option>
                      <option value="dry">Dry</option>
                      <option value="sensitive">Sensitive</option>
                    </Select>
                  </Field>
                )}

                <Field label="How long has this been going on?" className="mt-4">
                  <Select value={a.durationOfConcern} onChange={(e) => set('durationOfConcern', e.target.value)}>
                    <option value="under 6 months">Under 6 months</option>
                    <option value="6-12 months">6–12 months</option>
                    <option value="1-2 years">1–2 years</option>
                    <option value="2-5 years">2–5 years</option>
                    <option value="5+ years">5+ years</option>
                  </Select>
                </Field>
              </>
            )}

            {step === 3 && (
              <>
                <div className="eyebrow mb-2">Step 4 · Lifestyle</div>
                <h1 className="font-display text-[clamp(1.9rem,4.4vw,2.7rem)] leading-none tracking-tightest">
                  The routine has to survive your week.
                </h1>
                <p className="mt-3 max-w-lg text-[13px] leading-relaxed text-muted">
                  Sleep and stress are not soft factors. They change the follicle's repair window, and the plan adjusts for them.
                </p>

                <div className="mt-6 space-y-5">
                  <div className="rounded-xl border border-line bg-chalk p-4">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-[12.5px] font-medium">
                        <Moon className="h-3.5 w-3.5 text-forest" /> Average sleep
                      </span>
                      <span className="font-display text-xl">{a.sleepHours}h</span>
                    </div>
                    <input
                      type="range"
                      min={4}
                      max={10}
                      step={0.5}
                      value={a.sleepHours}
                      onChange={(e) => set('sleepHours', Number(e.target.value))}
                      className="mt-3 w-full accent-forest"
                    />
                    <div className="mt-1 flex justify-between font-mono text-[9.5px] text-muted">
                      <span>4h</span>
                      <span className={cn(a.sleepHours < 7 && 'text-amber')}>7h target</span>
                      <span>10h</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-line bg-chalk p-4">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-[12.5px] font-medium">
                        <Activity className="h-3.5 w-3.5 text-forest" /> Stress this month
                      </span>
                      <span className="font-display text-xl">{a.stress}/5</span>
                    </div>
                    <div className="mt-3 grid grid-cols-5 gap-1.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() => set('stress', n)}
                          className={cn(
                            'rounded-lg border py-2 text-[11.5px] font-medium transition',
                            a.stress === n ? 'border-forest bg-forest text-lime' : 'border-line bg-white text-muted hover:border-ink/25'
                          )}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <div className="mt-1.5 flex justify-between font-mono text-[9.5px] text-muted">
                      <span>calm</span>
                      <span>high</span>
                    </div>
                  </div>

                  <Field label="Diet">
                    <Select value={a.diet} onChange={(e) => set('diet', e.target.value)}>
                      <option value="mixed">Mixed / home food</option>
                      <option value="vegetarian">Vegetarian</option>
                      <option value="eggetarian">Eggetarian</option>
                      <option value="vegan">Vegan</option>
                      <option value="high_protein">High protein</option>
                    </Select>
                  </Field>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <div className="eyebrow mb-2">Step 5 · Plan settings</div>
                <h1 className="font-display text-[clamp(1.9rem,4.4vw,2.7rem)] leading-none tracking-tightest">
                  What fits your bathroom shelf and your budget?
                </h1>
                <p className="mt-3 max-w-lg text-[13px] leading-relaxed text-muted">
                  A smaller routine done daily beats a perfect one done twice. We start where you will actually comply.
                </p>

                <div className="mt-6 space-y-5">
                  <div>
                    <span className="field-label">Monthly budget for the stack</span>
                    <div className="grid gap-2.5 sm:grid-cols-3">
                      {[
                        { id: 'lean', label: 'Lean', note: 'Essentials only', icon: Wallet },
                        { id: 'balanced', label: 'Balanced', note: 'Core + nutrition', icon: ShieldCheck },
                        { id: 'premium', label: 'Premium', note: 'Full protocol', icon: Sparkles }
                      ].map(({ id, label, note, icon: Icon }) => (
                        <button
                          key={id}
                          onClick={() => set('budget', id as Answers['budget'])}
                          className={cn(
                            'rounded-xl border p-3.5 text-left transition',
                            a.budget === id ? 'border-forest bg-forest text-paper' : 'border-line bg-chalk hover:border-ink/25'
                          )}
                        >
                          <Icon className={cn('h-4 w-4', a.budget === id ? 'text-lime' : 'text-forest')} />
                          <div className="mt-2 text-[12.5px] font-medium">{label}</div>
                          <div className={cn('text-[10.5px]', a.budget === id ? 'text-paper/55' : 'text-muted')}>{note}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Field label="When will you actually do the routine?">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'morning', label: 'Morning', icon: Sun },
                        { id: 'night', label: 'Night', icon: Moon },
                        { id: 'split', label: 'Split AM/PM', icon: Clock }
                      ].map(({ id, label, icon: Icon }) => (
                        <button
                          key={id}
                          onClick={() => set('routineTime', id)}
                          className={cn(
                            'flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[12px] font-medium transition',
                            a.routineTime === id ? 'border-forest bg-forest text-lime' : 'border-line bg-white text-muted hover:border-ink/25'
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" /> {label}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <div className="rounded-xl border border-line bg-chalk p-4">
                    <button
                      onClick={() => set('reportDeficiency', !a.reportDeficiency)}
                      className="flex w-full items-center gap-3 text-left"
                    >
                      <span
                        className={cn(
                          'grid h-5 w-5 shrink-0 place-items-center rounded-md border',
                          a.reportDeficiency ? 'border-forest bg-forest text-lime' : 'border-ink/20 bg-white'
                        )}
                      >
                        {a.reportDeficiency && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      <span>
                        <span className="block text-[12.5px] font-medium">I have a recent blood report showing a deficiency</span>
                        <span className="mt-0.5 block text-[11px] text-muted">D3, B12, ferritin or thyroid. This changes the nutrition leg.</span>
                      </span>
                    </button>
                  </div>

                  <Field
                    label="Anything a clinician should know?"
                    hint="Prescription medicines, allergies, or a scalp condition. Leave blank if none."
                  >
                    <Textarea
                      value={a.medications}
                      onChange={(e) => set('medications', e.target.value)}
                      placeholder="e.g. on minoxidil for 2 years, sensitive to fragrance"
                      className="min-h-[78px]"
                    />
                  </Field>
                </div>
              </>
            )}
          </div>

          {error && !busy && (
            <p className="mt-4 rounded-xl border border-danger/25 bg-danger/[0.05] px-3 py-2 text-[12px] text-danger">{error}</p>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
            <Btn variant="quiet" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Btn>
            {step < STEPS.length - 1 ? (
              <Btn variant="primary" onClick={() => setStep((s) => s + 1)} disabled={!canContinue()} icon={<ArrowRight className="h-4 w-4" />}>
                Continue
              </Btn>
            ) : (
              <Btn variant="lime" onClick={submit} disabled={!canContinue()} icon={<Sparkles className="h-4 w-4" />}>
                Build my plan
              </Btn>
            )}
          </div>

          <div className="mt-4 lg:hidden">
            <div className="mb-2 flex justify-between font-mono text-[9.5px] uppercase tracking-wider text-muted">
              {STEPS.map((s, i) => (
                <span key={s} className={cn(i === step && 'text-ink', i < step && 'text-forest')}>
                  {i + 1}
                </span>
              ))}
            </div>
            <Meter value={((step + 1) / STEPS.length) * 100} tone="bg-forest" />
          </div>
        </div>
      </div>
    </div>
  );
}
