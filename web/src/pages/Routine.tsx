import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Info,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  TriangleAlert
} from 'lucide-react';
import { toast } from 'sonner';
import { appApi } from '../lib/api';
import { PageHeader, FooterNote } from '../components/AppShell';
import { ProductImage } from '../components/ProductImage';
import { Btn, Card, CheckBox, Chip, Empty, Field, Meter, Modal, Skeleton } from '../components/ui';
import type { RoutineItem, UserPlan } from '../lib/types';
import { cadenceLabel, cn, prettyDate } from '../lib/utils';

type WeekRow = {
  week: number;
  start: string;
  end: string;
  phase: number;
  state: 'past' | 'current' | 'upcoming';
  adherence: number | null;
  hairFall: number | null;
  logged: number;
  photos: number;
};

type Bundle = {
  routine: { id: string; headline: string; rationale: string; startDate: string; week: number; phase: any } | null;
  week: number;
  phase: any;
  items: RoutineItem[];
  allItems: RoutineItem[];
  weeks: WeekRow[];
  plan: UserPlan | null;
  todaySchedule: RoutineItem[];
};

const PHASE_NAMES = ['Foundation', 'Consistency', 'Evidence'];

export default function Routine() {
  const [data, setData] = useState<Bundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [week, setWeek] = useState<number>(1);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [busyItem, setBusyItem] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<RoutineItem | null>(null);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [res, ov] = await Promise.all([appApi.routine(), appApi.overview()]);
      setData(res as Bundle);
      setWeek(res.week || 1);
      setDone(new Set((ov.overview?.today?.items || []).filter((i: any) => i.done).map((i: any) => i.id)));
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Could not load the routine.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    if (!data) return [] as RoutineItem[];
    return data.allItems.filter((i) => i.week_start <= week);
  }, [data, week]);

  const am = visible.filter((i) => i.time_of_day === 'AM').sort((a, b) => (a.step || 0) - (b.step || 0));
  const pm = visible.filter((i) => i.time_of_day !== 'AM').sort((a, b) => (a.step || 0) - (b.step || 0));

  const toggle = async (item: RoutineItem) => {
    setBusyItem(item.id);
    const isDone = done.has(item.id);
    setDone((prev) => {
      const next = new Set(prev);
      if (isDone) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
    try {
      await appApi.toggle(item.id);
    } catch (e: any) {
      toast.error(e?.message || 'Could not save that dose.');
      setDone((prev) => {
        const next = new Set(prev);
        if (isDone) next.add(item.id);
        else next.delete(item.id);
        return next;
      });
    } finally {
      setBusyItem(null);
    }
  };

  const remove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await appApi.removeItem(removeTarget.id);
      toast.success(`${removeTarget.name} removed from the active plan`);
      setRemoveTarget(null);
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Could not remove that item.');
    } finally {
      setRemoving(false);
    }
  };

  if (error) {
    return (
      <div className="pt-10">
        <Empty title="Routine unavailable" body={error} action={<Btn onClick={load}>Try again</Btn>} />
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <Skeleton className="h-9 w-56" />
        <Skeleton className="mt-6 h-44" />
        <Skeleton className="mt-4 h-72" />
      </div>
    );
  }

  if (!data.routine) {
    return (
      <div className="pt-10">
        <Empty
          title="No plan yet"
          body="Complete the six-step assessment and the rule engine will build your 13-week routine."
          action={
            <Link to="/onboarding" className="btn-primary">
              Start the assessment
            </Link>
          }
        />
      </div>
    );
  }

  const routine = data.routine;

  const group = (title: string, items: RoutineItem[], icon: React.ReactNode) =>
    items.length ? (
      <div>
        <div className="mb-2 flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted">
          {icon} {title}
          <span className="ml-auto font-mono normal-case tracking-normal text-muted/70">{items.length} {items.length === 1 ? 'step' : 'steps'}</span>
        </div>
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item.id} className="group p-4 transition hover:border-ink/20">
              <div className="flex items-start gap-3">
                {week === data.week ? (
                  <button
                    onClick={() => toggle(item)}
                    disabled={busyItem === item.id}
                    aria-label={done.has(item.id) ? `Mark ${item.name} undone` : `Mark ${item.name} done`}
                    className={cn(
                      'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition',
                      done.has(item.id) ? 'border-forest bg-forest text-lime' : 'border-ink/20 bg-white hover:border-ink/45'
                    )}
                  >
                    {done.has(item.id) ? <Check className="h-3 w-3" strokeWidth={3} /> : <Circle className="h-2 w-2 opacity-0" />}
                  </button>
                ) : (
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border border-ink/10 bg-ink/[0.03] text-[9px] font-mono text-muted">
                    {item.step ?? '·'}
                  </span>
                )}
                <ProductImage
                  src={item.image}
                  alt={item.name}
                  accent={item.accent}
                  className="mt-0.5 h-10 w-10 shrink-0 rounded-lg border border-line"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn('text-[13px] font-medium', week === data.week && done.has(item.id) && 'text-forest')}>{item.name}</span>
                    {item.optional && <span className="rounded bg-ink/5 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-muted">optional</span>}
                    {item.week_start > 1 && <Chip>enters week {item.week_start}</Chip>}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {item.time_of_day}
                    </span>
                    <span>{cadenceLabel(item.cadence)}</span>
                    {item.dose && <span className="text-ink/60">{item.dose}</span>}
                  </div>
                  {item.instructions && <p className="mt-1.5 text-[11px] leading-relaxed text-muted/90">{item.instructions}</p>}
                </div>
                <button
                  onClick={() => setRemoveTarget(item)}
                  className="rounded-lg p-1.5 text-muted/40 opacity-0 transition hover:bg-danger/5 hover:text-danger group-hover:opacity-100"
                  aria-label={`Remove ${item.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    ) : null;

  return (
    <div className="pb-4">
      <PageHeader
        eyebrow={`Active plan · started ${prettyDate(routine.startDate)}`}
        title={<>Week {data.week} of 13, on purpose.</>}
        sub={routine.rationale}
        action={
          <Link to="/app/products" className="btn-primary btn-sm">
            <Plus className="h-3.5 w-3.5" /> Add a product
          </Link>
        }
      />

      {/* Phase progress */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { name: 'Foundation', range: 'Week 1–4', note: 'Build the habit before judging the result.', start: 1, end: 4 },
          { name: 'Consistency', range: 'Week 5–8', note: 'The habit is load-bearing. This is where routines die.', start: 5, end: 8 },
          { name: 'Evidence', range: 'Week 9–13', note: 'Compare like-for-like photos, not memory.', start: 9, end: 13 }
        ].map((p) => {
          const active = data.week >= p.start && data.week <= p.end;
          return (
            <div
              key={p.name}
              className={cn(
                'rounded-2xl border p-4 transition',
                active ? 'border-forest/30 bg-forest text-paper shadow-soft' : data.week > p.end ? 'border-line bg-chalk' : 'border-dashed border-line bg-transparent'
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn('font-mono text-[10px] uppercase tracking-[0.14em]', active ? 'text-lime' : 'text-muted')}>{p.range}</span>
                {data.week > p.end ? <Check className="h-3.5 w-3.5 text-forest" /> : active ? <span className="h-1.5 w-1.5 rounded-full bg-lime" /> : <Circle className="h-3 w-3 text-muted/40" />}
              </div>
              <div className={cn('mt-2 font-display text-xl leading-none', active && 'text-paper')}>{p.name}</div>
              <p className={cn('mt-1.5 text-[11px] leading-relaxed', active ? 'text-paper/55' : 'text-muted')}>{p.note}</p>
            </div>
          );
        })}
      </div>

      {/* Week strip */}
      <Card className="mt-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-medium text-muted">
            <CalendarDays className="h-3.5 w-3.5" /> Preview a week
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setWeek((w) => Math.max(1, w - 1))}
              disabled={week <= 1}
              className="rounded-lg border border-line p-1.5 text-muted transition hover:text-ink disabled:opacity-30"
              aria-label="Previous week"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setWeek((w) => Math.min(13, w + 1))}
              disabled={week >= 13}
              className="rounded-lg border border-line p-1.5 text-muted transition hover:text-ink disabled:opacity-30"
              aria-label="Next week"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {Array.from({ length: 13 }).map((_, i) => {
            const w = i + 1;
            const row = data.weeks.find((r) => r.week === w);
            const active = week === w;
            return (
              <button
                key={w}
                onClick={() => setWeek(w)}
                className={cn(
                  'flex w-14 shrink-0 flex-col items-center gap-1 rounded-xl border py-2 transition',
                  active ? 'border-forest bg-forest text-paper' : row?.state === 'past' ? 'border-line bg-white/70 hover:border-ink/25' : 'border-dashed border-line text-muted'
                )}
              >
                <span className="text-[10px] font-medium">W{w}</span>
                <span className={cn('h-1 w-8 overflow-hidden rounded-full', active ? 'bg-white/20' : 'bg-ink/[0.08]')}>
                  <span
                    className={cn('block h-full rounded-full', active ? 'bg-lime' : 'bg-forest')}
                    style={{ width: `${row?.adherence ?? 0}%` }}
                  />
                </span>
                <span className={cn('font-mono text-[8.5px]', active ? 'text-paper/60' : 'text-muted/70')}>
                  {row?.adherence != null ? `${row.adherence}%` : '—'}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="eyebrow">Week {week} · {week === data.week ? 'current' : week < data.week ? 'past week' : 'preview'}</div>
              <div className="mt-1 font-display text-xl leading-none tracking-tight">
                {visible.length} active {visible.length === 1 ? 'step' : 'steps'}
              </div>
            </div>
            {week !== data.week && (
              <button onClick={() => setWeek(data.week)} className="text-[11px] font-medium text-forest hover:underline">
                Back to today
              </button>
            )}
          </div>

          {week === data.week && (
            <div className="rounded-xl border border-forest/20 bg-forest/[0.04] px-3.5 py-2.5 text-[11.5px] leading-relaxed text-ink/70">
              Tap the box to log a dose for today. Items beyond this week are hidden until their phase begins.
            </div>
          )}

          {group('Morning', am, <SunIcon />)}
          {group('Evening', pm, <MoonIcon />)}

          {!visible.length && (
            <Empty title="Nothing starts this week" body="Your plan begins in a later phase. The first four weeks are the habit, not the stack." />
          )}

          {/* Week history */}
          <Card className="overflow-hidden">
            <div className="border-b border-line px-4 py-3">
              <div className="eyebrow">Week by week</div>
              <div className="mt-1 text-[12px] text-muted">Adherence, logs and photos — computed from check-ins.</div>
            </div>
            <div className="divide-y divide-line">
              {data.weeks.slice(0, Math.max(data.week, 1)).reverse().slice(0, 6).map((w) => (
                <div key={w.week} className="flex items-center gap-4 px-4 py-3">
                  <div className="w-12">
                    <div className="text-[12px] font-medium">W{w.week}</div>
                    <div className="font-mono text-[9px] text-muted">{w.state}</div>
                  </div>
                  <div className="flex-1">
                    <Meter value={w.adherence ?? 0} tone={(w.adherence ?? 0) >= 70 ? 'bg-forest' : 'bg-amber'} />
                  </div>
                  <div className="w-12 text-right font-display text-base leading-none">{w.adherence != null ? `${w.adherence}%` : '—'}</div>
                  <div className="hidden w-24 text-right text-[10.5px] text-muted sm:block">
                    {w.logged} logs · {w.photos} photos
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 eyebrow">
              <ShieldCheck className="h-3.5 w-3.5 text-forest" /> Guardrails
            </div>
            <div className="mt-3 space-y-3">
              {(data.plan?.guardrails || []).map((g) => (
                <div key={g.title} className="border-t border-line pt-3 first:border-0 first:pt-0">
                  <div className="text-[12px] font-medium">{g.title}</div>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{g.body}</p>
                </div>
              ))}
              {!data.plan?.guardrails?.length && (
                <p className="text-[11.5px] leading-relaxed text-muted">
                  Never miss twice. Sleep is part of the stack. Protein at two meals. Red flags go to a clinician, not a new
                  product.
                </p>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 eyebrow">
              <Sparkles className="h-3.5 w-3.5 text-forest" /> What to expect
            </div>
            <div className="mt-3 space-y-2.5">
              {(data.plan?.expectations || [
                'Weeks 1–4: more shedding is the cycle resetting, not the product failing.',
                'Weeks 5–8: shedding settles. Adherence is the only variable that matters.',
                'Weeks 9–13: density change becomes photographable at the same angle and light.'
              ]).map((e, i) => (
                <div key={i} className="flex gap-2.5 text-[11.5px] leading-relaxed text-ink/70">
                  <span className="mt-0.5 font-mono text-[9.5px] text-muted">0{i + 1}</span>
                  {e}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 eyebrow">
              <TriangleAlert className="h-3.5 w-3.5 text-amber" /> Stop and book a review
            </div>
            <ul className="mt-3 space-y-2">
              {(data.plan?.watchFor || [
                'Coin-sized bald patches, a painful or scaly scalp.',
                'A rash that persists after stopping the product.',
                'No change at all by week 12 — review the diagnosis.'
              ]).map((w, i) => (
                <li key={i} className="flex gap-2.5 text-[11.5px] leading-relaxed text-ink/70">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber" /> {w}
                </li>
              ))}
            </ul>
            <Link to="/app/assistant" className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-forest hover:underline">
              Ask the coach <ArrowRight className="h-3 w-3" />
            </Link>
          </Card>
        </div>
      </div>

      <Modal open={Boolean(removeTarget)} onClose={() => setRemoveTarget(null)} title="Remove this step?">
        <p className="text-[12.5px] leading-relaxed text-muted">
          {removeTarget?.name} will stop appearing on your daily plan. Your logged history stays intact. If you remove the serum,
          the plan loses its primary active — the coach will flag it.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Btn variant="ghost" size="sm" onClick={() => setRemoveTarget(null)}>
            Keep it
          </Btn>
          <Btn size="sm" onClick={remove} loading={removing} className="bg-danger text-paper hover:bg-danger/90">
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </Btn>
        </div>
      </Modal>

      <FooterNote />
    </div>
  );
}

const SunIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </svg>
);
