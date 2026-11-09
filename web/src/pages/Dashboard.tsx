import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Camera,
  Check,
  ChevronRight,
  CircleDot,
  Droplets,
  Flame,
  Moon,
  Package,
  RefreshCw,
  Sparkles,
  Sun,
  TrendingDown,
  TriangleAlert,
  Waves
} from 'lucide-react';
import { toast } from 'sonner';
import { appApi } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { DayItem, Insight, Overview, SeriesPoint, Signal } from '../lib/types';
import { PageHeader, FooterNote } from '../components/AppShell';
import { ProductImage } from '../components/ProductImage';
import { AdherenceChart, TrendChart } from '../components/Charts';
import { Btn, Card, CheckBox, Chip, Empty, Field, Input, Meter, Ring, Select, Skeleton } from '../components/ui';
import { cn, greeting, inr, prettyDate, weekday } from '../lib/utils';

type Bundle = {
  overview: Overview;
  signals: Signal[];
  recent: SeriesPoint[];
  insight: Insight | null;
  spend: { items: { name: string; monthlyCost: number }[]; total: number } | null;
};

const MOODS = ['good', 'okay', 'low', 'rough'];

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<Bundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyItem, setBusyItem] = useState<string | null>(null);
  const [savingLog, setSavingLog] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);

  const [log, setLog] = useState({
    hairFall: '',
    sleepHours: '',
    water: '',
    stress: '',
    mood: '',
    notes: ''
  });

  const load = useCallback(async () => {
    try {
      const res = await appApi.overview();
      const bundle: Bundle = {
        overview: res.overview,
        signals: (res.signals || []) as Signal[],
        recent: (res.recent || []) as SeriesPoint[],
        insight: (res.insight || null) as Insight | null,
        spend: res.spend || null
      };
      setData(bundle);
      setError(null);
      const ci = res.overview?.today?.checkin;
      if (ci) {
        setLog({
          hairFall: ci.hairFall != null ? String(ci.hairFall) : '',
          sleepHours: ci.sleepHours != null ? String(ci.sleepHours) : '',
          water: ci.water != null ? String(ci.water) : '',
          stress: ci.stress != null ? String(ci.stress) : '',
          mood: ci.mood || '',
          notes: ci.notes || ''
        });
      }
    } catch (e: any) {
      setError(e?.message || 'Could not load your program.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (item: DayItem) => {
    if (!data) return;
    setBusyItem(item.id);
    const done = !item.done;
    setData((d) => {
      if (!d?.overview.today) return d;
      const items = d.overview.today.items.map((i) => (i.id === item.id ? { ...i, done } : i));
      return {
        ...d,
        overview: {
          ...d.overview,
          today: {
            ...d.overview.today,
            items,
            doneCount: items.filter((i) => i.done).length,
            completed: items.length > 0 && items.every((i) => i.done)
          }
        }
      };
    });
    try {
      await appApi.toggle(item.id);
      const res = await appApi.overview();
      setData((d) => (d ? { ...d, overview: res.overview, signals: res.signals as Signal[], recent: res.recent as SeriesPoint[] } : d));
    } catch (e: any) {
      toast.error(e?.message || 'Could not save the dose.');
      load();
    } finally {
      setBusyItem(null);
    }
  };

  const saveLog = async () => {
    setSavingLog(true);
    try {
      await appApi.checkin({
        hairFall: log.hairFall === '' ? null : Number(log.hairFall),
        sleepHours: log.sleepHours === '' ? null : Number(log.sleepHours),
        water: log.water === '' ? null : Number(log.water),
        stress: log.stress === '' ? null : Number(log.stress),
        mood: log.mood || null,
        notes: log.notes || null
      });
      toast.success('Check-in saved');
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Could not save the check-in.');
    } finally {
      setSavingLog(false);
    }
  };

  const generateReview = async (refresh = false) => {
    setReviewBusy(true);
    try {
      const res = await appApi.review(refresh);
      setData((d) => (d ? { ...d, insight: res.insight, signals: (res.signals as Signal[]) || d.signals } : d));
      toast.success('Weekly review ready');
    } catch (e: any) {
      toast.error(e?.message || 'The review is unavailable right now.');
    } finally {
      setReviewBusy(false);
    }
  };

  const o = data?.overview;
  const stats = o?.stats;
  const routine = o?.routine;
  const today = o?.today;
  const adherence = stats?.adherence7 ?? 0;
  const remaining = today ? today.total - today.doneCount : 0;

  const trendValues = useMemo(
    () => (data?.recent || []).map((d) => d.hairFall).filter((v): v is number => v != null),
    [data]
  );

  if (error) {
    return (
      <div className="pt-10">
        <Empty title="Your program could not load" body={error} action={<Btn onClick={load}>Try again</Btn>} />
      </div>
    );
  }

  if (!data || !o) {
    return (
      <div>
        <Skeleton className="h-9 w-64" />
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    );
  }

  if (!routine) {
    return (
      <div className="pt-10">
        <Empty
          title="No active routine"
          body="Finish the assessment to generate your 13-week plan."
          action={
            <Link to="/onboarding" className="btn-primary">
              Start the assessment
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="pb-4">
      <PageHeader
        eyebrow={`${greeting()} · ${prettyDate(today?.date || new Date())}`}
        title={
          <>
            {user?.name?.split(' ')[0]}, you're{' '}
            <span className={adherence >= 70 ? 'text-forest' : 'text-amber'}>{adherence}%</span> on-plan.
          </>
        }
        sub={
          remaining === 0
            ? 'Today is complete. The only job left is to keep tomorrow identical.'
            : `${remaining} ${remaining === 1 ? 'dose' : 'doses'} left today. Week ${routine.week} of 13 · ${routine.phase.name} phase.`
        }
        action={
          <Link to="/app/progress" className="btn-ghost btn-sm">
            <Camera className="h-3.5 w-3.5" /> Progress photos
          </Link>
        }
      />

      {/* ------------------------------- Top grid ------------------------------- */}
      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <div className="eyebrow">Today · {weekday(today?.date || new Date().toISOString().slice(0, 10))}</div>
              <div className="mt-1 font-display text-xl leading-none tracking-tight">
                {today?.completed ? 'Plan complete' : 'The minimum viable routine'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Chip tone={today?.completed ? 'lime' : 'default'}>
                {today?.doneCount}/{today?.total} done
              </Chip>
            </div>
          </div>

          <div className="space-y-2 p-4">
            {today?.items.length ? (
              today.items.map((item) => (
                <CheckBox
                  key={item.id}
                  checked={Boolean(item.done)}
                  onChange={() => toggle(item)}
                  disabled={busyItem === item.id}
                  label={
                    <span className="flex items-center gap-2">
                      <ProductImage
                        src={item.image}
                        alt={item.name}
                        accent={item.accent}
                        className="h-6 w-6 shrink-0 rounded-[5px] border border-line"
                      />
                      <span className="flex items-center gap-2">
                        {item.name}
                        {item.optional && <span className="rounded bg-ink/5 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-muted">optional</span>}
                      </span>
                    </span>
                  }
                  sub={`${item.time_of_day} · ${item.dose || item.cadence}${item.step ? ` · step ${item.step}` : ''}`}
                />
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-line px-4 py-8 text-center">
                <p className="text-[13px] font-medium">Nothing scheduled today</p>
                <p className="mt-1 text-[11.5px] text-muted">Your cadence has a rest day. The routine is not broken.</p>
              </div>
            )}

            {today?.items.length ? (
              <div className="flex items-center justify-between px-1 pt-1">
                <span className="text-[10.5px] text-muted">
                  {today.completed ? 'All doses logged. Tap a row to undo.' : 'Tap to log a dose — it saves immediately.'}
                </span>
                <Link to="/app/routine" className="inline-flex items-center gap-1 text-[11px] font-medium text-forest hover:underline">
                  Full routine <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            ) : null}
          </div>

          <div className="border-t border-line bg-chalk/60 px-5 py-3">
            <div className="flex items-center gap-2.5 text-[11.5px] leading-relaxed text-ink/70">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-forest" />
              {routine.phase.signal}
            </div>
          </div>
        </Card>

        <Card className="flex flex-col p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="eyebrow">Consistency · 7 day</div>
              <div className="mt-1 font-display text-xl leading-none tracking-tight">Is it holding?</div>
            </div>
            <Chip tone={adherence >= 70 ? 'lime' : 'warn'}>{adherence >= 70 ? 'safe zone' : 'below target'}</Chip>
          </div>

          <div className="mt-5 flex items-center justify-center">
            <Ring value={adherence} size={148} stroke={10} sub="7-day adherence" />
          </div>

          <div className="mt-5 grid grid-cols-3 divide-x divide-line border-t border-line pt-4 text-center">
            {[
              ['30-day', `${stats?.adherence30 ?? 0}%`],
              ['Streak', `${stats?.streak?.current ?? 0}d`],
              ['Score', `${stats?.score?.score ?? 0}`]
            ].map(([k, v]) => (
              <div key={k}>
                <div className="font-display text-xl leading-none">{v}</div>
                <div className="mt-1 text-[9.5px] uppercase tracking-[0.13em] text-muted">{k}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-paper px-3 py-2.5">
            <div className="flex items-center justify-between text-[10.5px] text-muted">
              <span>Cycle progress</span>
              <span>
                Week {routine.week}/13 · {Math.round((routine.week / 13) * 100)}%
              </span>
            </div>
            <Meter value={(routine.week / 13) * 100} className="mt-2" />
          </div>
        </Card>
      </div>

      {/* -------------------------------- Signals ------------------------------- */}
      {data.signals.length > 0 && (
        <section className="mt-4">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="eyebrow">What your data is saying</div>
            <span className="text-[10.5px] text-muted">Rules run against your own logs</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.signals.map((s) => (
              <Card key={s.id} className={cn('p-4', s.tone === 'good' && 'border-forest/20', s.tone === 'warn' && 'border-amber/25', s.tone === 'clinical' && 'border-danger/25')}>
                <div className="flex items-start gap-2.5">
                  <span
                    className={cn(
                      'mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-lg',
                      s.tone === 'good' ? 'bg-forest/10 text-forest' : s.tone === 'warn' ? 'bg-amber/10 text-amber' : s.tone === 'clinical' ? 'bg-danger/10 text-danger' : 'bg-ink/5 text-muted'
                    )}
                  >
                    {s.tone === 'clinical' ? <TriangleAlert className="h-3.5 w-3.5" /> : s.tone === 'warn' ? <TrendingDown className="h-3.5 w-3.5" /> : <CircleDot className="h-3.5 w-3.5" />}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-medium leading-snug">{s.title}</div>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{s.body}</p>
                    {s.action && (
                      <Link to={s.action.href} className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-forest hover:underline">
                        {s.action.label} <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* --------------------------- Charts + review --------------------------- */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="eyebrow">14-day adherence</div>
              <div className="mt-1 font-display text-lg leading-none tracking-tight">Where it slipped</div>
            </div>
            <Chip>target 70%</Chip>
          </div>
          <div className="mt-4">
            <AdherenceChart data={data.recent} height={180} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[10.5px] text-muted">
            <span>Every bar is a real check-in row.</span>
            <Link to="/app/progress" className="inline-flex items-center gap-1 font-medium text-forest hover:underline">
              90-day view <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="eyebrow">Logged hair fall</div>
              <div className="mt-1 font-display text-lg leading-none tracking-tight">
                {trendValues.length ? `${trendValues[trendValues.length - 1]} strands last wash` : 'Not enough logs yet'}
              </div>
            </div>
            <Waves className="h-4 w-4 text-forest" />
          </div>
          <div className="mt-4">
            {trendValues.length >= 2 ? (
              <TrendChart data={data.recent} dataKey="hairFall" unit=" strands" height={180} label="Hair fall" />
            ) : (
              <div className="grid h-[180px] place-items-center rounded-xl border border-dashed border-line text-center text-[11.5px] leading-relaxed text-muted">
                Log hair fall in the daily check-in below.
                <br />
                Two points make a trend. Four make a signal.
              </div>
            )}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[10.5px] text-muted">
            <Moon className="h-3 w-3" /> Shedding is expected in weeks 2–4 and again around week 6.
          </div>
        </Card>
      </div>

      {/* ------------------------------ Check-in ------------------------------- */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.72fr]">
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="eyebrow">Daily check-in</div>
              <div className="mt-1 font-display text-lg leading-none tracking-tight">Twenty seconds, honest numbers</div>
            </div>
            {today?.checkin && <Chip tone="lime"><Check className="h-3 w-3" /> logged today</Chip>}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Hair fall">
              <Input inputMode="numeric" value={log.hairFall} onChange={(e) => setLog({ ...log, hairFall: e.target.value })} placeholder="40" />
            </Field>
            <Field label="Sleep (h)">
              <Input inputMode="decimal" value={log.sleepHours} onChange={(e) => setLog({ ...log, sleepHours: e.target.value })} placeholder="7" />
            </Field>
            <Field label="Water (glasses)">
              <Input inputMode="numeric" value={log.water} onChange={(e) => setLog({ ...log, water: e.target.value })} placeholder="8" />
            </Field>
            <Field label="Stress (1-5)">
              <Input inputMode="numeric" value={log.stress} onChange={(e) => setLog({ ...log, stress: e.target.value })} placeholder="3" />
            </Field>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1.4fr]">
            <Field label="Mood">
              <Select value={log.mood} onChange={(e) => setLog({ ...log, mood: e.target.value })}>
                <option value="">Not set</option>
                {MOODS.map((m) => (
                  <option key={m} value={m}>
                    {m[0].toUpperCase() + m.slice(1)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Note (optional)">
              <Input value={log.notes} onChange={(e) => setLog({ ...log, notes: e.target.value })} placeholder="Shed more on wash day, scalp fine." />
            </Field>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-[10.5px] text-muted">Doses are logged separately above — this is context.</span>
            <Btn size="sm" onClick={saveLog} loading={savingLog} icon={<Check className="h-3.5 w-3.5" />}>
              Save check-in
            </Btn>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="eyebrow">Refill radar</div>
              <div className="mt-1 font-display text-lg leading-none tracking-tight">Don't run out mid-cycle</div>
            </div>
            <Package className="h-4 w-4 text-forest" />
          </div>

          <div className="mt-4 space-y-2.5">
            {(stats?.refills || []).length ? (
              stats?.refills.map((r) => (
                <div key={r.slug} className="rounded-xl border border-line bg-white/60 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[12px] font-medium">{r.name}</span>
                    <span className={cn('font-mono text-[10.5px]', r.daysLeft < 14 ? 'text-danger' : 'text-muted')}>{r.daysLeft}d left</span>
                  </div>
                  <Meter value={Math.min(100, (r.daysLeft / 42) * 100)} tone={r.daysLeft < 14 ? 'bg-danger' : 'bg-forest'} className="mt-2" />
                </div>
              ))
            ) : (
              <p className="text-[11.5px] text-muted">No consumable refills in this phase yet.</p>
            )}
          </div>

          {data.spend && data.spend.total > 0 && (
            <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
              <span className="text-[10.5px] uppercase tracking-[0.13em] text-muted">Monthly stack cost</span>
              <span className="font-display text-lg leading-none">{inr(data.spend.total)}</span>
            </div>
          )}
        </Card>
      </div>

      {/* ------------------------------- Review -------------------------------- */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className={cn('relative overflow-hidden p-5', data.insight && 'bg-forest text-paper')}>
          {data.insight && <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-lime/10 blur-2xl" />}
          <div className="relative flex items-start justify-between">
            <div>
              <div className={cn('eyebrow', data.insight && 'text-lime/70')}>This week's review · AI</div>
              <div className={cn('mt-1 font-display text-xl leading-tight tracking-tight', data.insight && 'text-paper')}>
                {data.insight ? data.insight.headline || data.insight.title : 'A grounded read on your week'}
              </div>
            </div>
            <Sparkles className={cn('h-4 w-4', data.insight ? 'text-lime' : 'text-forest')} />
          </div>

          {data.insight ? (
            <>
              <p className={cn('relative mt-3 text-[12.5px] leading-relaxed', data.insight && 'text-paper/70')}>{data.insight.body}</p>
              <div className="relative mt-4 space-y-2">
                {data.insight.actions?.map((a, i) => (
                  <div key={i} className={cn('rounded-xl border px-3 py-2', data.insight ? 'border-white/10 bg-white/[0.04]' : 'border-line bg-white/60')}>
                    <div className={cn('text-[11.5px] font-medium', data.insight && 'text-lime')}>
                      {i + 1}. {a.label}
                    </div>
                    <p className={cn('mt-0.5 text-[11px] leading-relaxed', data.insight ? 'text-paper/55' : 'text-muted')}>{a.detail}</p>
                  </div>
                ))}
              </div>
              <div className="relative mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                <span className={cn('text-[10px] uppercase tracking-[0.13em]', data.insight ? 'text-paper/40' : 'text-muted')}>
                  {data.insight.source || data.insight.coachNote ? 'Grounded in your logs' : 'Cached'}
                </span>
                <button
                  onClick={() => generateReview(true)}
                  disabled={reviewBusy}
                  className={cn('inline-flex items-center gap-1.5 text-[11px] font-medium', data.insight ? 'text-lime' : 'text-forest', reviewBusy && 'opacity-50')}
                >
                  <RefreshCw className={cn('h-3 w-3', reviewBusy && 'animate-spin')} /> Regenerate
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-3 text-[12.5px] leading-relaxed text-ink/70">
                The review reads your adherence, sleep and logged shedding, then names one lever for the week. It never invents
                numbers.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <Btn size="sm" onClick={() => generateReview(false)} loading={reviewBusy} icon={<Sparkles className="h-3.5 w-3.5" />}>
                  Generate this week's review
                </Btn>
                <span className="text-[10px] text-muted">Usually 5–10 seconds</span>
              </div>
            </>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="eyebrow">Photo timeline</div>
              <div className="mt-1 font-display text-lg leading-none tracking-tight">
                {stats?.photoCount ? `${stats.photoCount} standardised frames` : 'The baseline is missing'}
              </div>
            </div>
            <Link to="/app/progress" className="rounded-lg border border-line p-1.5 text-muted transition hover:text-ink">
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {o.photos && o.photos.length ? (
            <div className="mt-3 flex gap-2">
              {o.photos.slice(0, 3).map((p) => (
                <Link key={p.id} to="/app/progress" className="group relative flex-1 overflow-hidden rounded-xl bg-ink">
                  <img src={p.data_url} alt={`Week ${p.week}`} className="aspect-[3/4] w-full object-cover opacity-90 transition group-hover:opacity-100" />
                  <span className="absolute bottom-1.5 left-1.5 rounded-full bg-ink/70 px-1.5 py-0.5 text-[9px] font-medium text-paper backdrop-blur">
                    W{p.week}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-line px-4 py-6 text-center">
              <Camera className="mx-auto h-5 w-5 text-muted" />
              <p className="mt-2 text-[11.5px] leading-relaxed text-muted">Memory is a biased instrument. Add a baseline frame.</p>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[10.5px] text-muted">
            <span>Last photo</span>
            <span className="font-medium text-ink">{stats?.lastPhoto ? prettyDate(stats.lastPhoto) : 'never'}</span>
          </div>
        </Card>
      </div>

      {/* ------------------------------- Plan note ------------------------------ */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.13em] text-muted">
            <Flame className="h-3.5 w-3.5 text-forest" /> Best streak
          </div>
          <div className="mt-2 font-display text-2xl leading-none">{stats?.streak?.best ?? 0} days</div>
          <p className="mt-1 text-[10.5px] text-muted">Logging streak, not a perfection score.</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.13em] text-muted">
            <Droplets className="h-3.5 w-3.5 text-forest" /> Phase signal
          </div>
          <div className="mt-2 font-display text-2xl leading-none">{routine.phase.name}</div>
          <p className="mt-1 text-[10.5px] leading-relaxed text-muted">{routine.phase.expectation}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.13em] text-muted">
            <Sun className="h-3.5 w-3.5 text-forest" /> Honest expectation
          </div>
          <div className="mt-2 font-display text-2xl leading-none">{Math.max(0, 13 - routine.week)} wks left</div>
          <p className="mt-1 text-[10.5px] leading-relaxed text-muted">The evidence window is week 9–13. Until then, adherence is the signal.</p>
        </Card>
      </div>

      <FooterNote />
    </div>
  );
}
