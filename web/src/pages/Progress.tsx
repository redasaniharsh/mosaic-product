import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownToLine,
  Camera,
  Check,
  ChevronRight,
  CircleDot,
  ImageOff,
  Info,
  Moon,
  RefreshCw,
  Sparkles,
  Trash2,
  Waves
} from 'lucide-react';
import { toast } from 'sonner';
import { appApi } from '../lib/api';
import { PageHeader, FooterNote } from '../components/AppShell';
import { AdherenceChart, Heatmap, TrendChart } from '../components/Charts';
import { CompareSlider, PhotoCapture } from '../components/PhotoCompare';
import { Btn, Card, Chip, Empty, Meter, Modal, Ring, Skeleton, StatTile } from '../components/ui';
import type { HeatCell, SeriesPoint, WeekRow } from '../lib/types';
import { cn, downloadJson, inr, prettyDate } from '../lib/utils';

type PhotoMeta = {
  id: string;
  date: string;
  week: number;
  angle: string;
  lighting?: number | null;
  notes?: string | null;
};

type ProgressData = {
  series: SeriesPoint[];
  series90: SeriesPoint[];
  heatmap: HeatCell[];
  weeks: WeekRow[];
  photos: PhotoMeta[];
  score: { score: number; parts: { key: string; label: string; weight: number; value: number }[] };
  spend: { items: { slug: string; name: string; monthlyCost: number }[]; total: number };
  refills: { slug: string; name: string; packWeeks: number; perWeek: number; monthlyCost: number }[];
  streak: { current: number; best: number };
  phases: { week: number; name: string; range: string; summary: string; expectation: string; signal: string }[];
};

const ANGLE_LABEL: Record<string, string> = {
  crown: 'Crown',
  front: 'Hairline',
  temple: 'Temple',
  beard: 'Beard',
  skin: 'Skin'
};

export default function Progress() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capture, setCapture] = useState(false);
  const [range, setRange] = useState<30 | 90>(30);
  const [metric, setMetric] = useState<'hairFall' | 'sleep' | 'stress'>('hairFall');
  const [compareIds, setCompareIds] = useState<{ before: string; after: string } | null>(null);
  const [photosFull, setPhotosFull] = useState<Record<string, string>>({});
  const [compareBusy, setCompareBusy] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [viewPhoto, setViewPhoto] = useState<{ id: string; url: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await appApi.progress();
      if (!res.routine) {
        setData(null);
        setError(null);
        return;
      }
      setData(res as ProgressData);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Could not load progress.');
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // The progress payload is metadata-only, so pull the six visible frames on
  // demand instead of shipping every base64 image with the page.
  useEffect(() => {
    const photos = data?.photos;
    if (!photos?.length) return;
    let cancelled = false;
    const visible = [...photos].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
    Promise.all(
      visible.map(async (p) => {
        try {
          const res = await appApi.photo(p.id);
          return res?.data_url ? ([p.id, res.data_url] as const) : null;
        } catch {
          return null;
        }
      })
    ).then((entries) => {
      if (cancelled) return;
      const loaded = Object.fromEntries(entries.filter((e): e is readonly [string, string] => Boolean(e)));
      if (Object.keys(loaded).length) setThumbs((prev) => ({ ...prev, ...loaded }));
    });
    return () => {
      cancelled = true;
    };
  }, [data?.photos]);

  const score = data?.score;
  const adherence30 = useMemo(() => {
    const vals = (data?.series || []).map((s) => s.adherence).filter((v): v is number => v != null);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  }, [data]);

  const openCompare = async (ids: { before: string; after: string }) => {
    setCompareBusy(true);
    try {
      const urls: Record<string, string> = { ...photosFull };
      await Promise.all(
        [ids.before, ids.after].map(async (id) => {
          if (urls[id]) return;
          const p = await appApi.photo(id);
          if (p?.data_url) urls[id] = p.data_url;
        })
      );
      setPhotosFull(urls);
      setCompareIds(ids);
    } catch {
      toast.error('Could not load those photos.');
    } finally {
      setCompareBusy(false);
    }
  };

  const quickCompare = () => {
    if (!data || data.photos.length < 2) return;
    const sorted = [...data.photos].sort((a, b) => a.date.localeCompare(b.date));
    openCompare({ before: sorted[0].id, after: sorted[sorted.length - 1].id });
  };

  const removePhoto = async (id: string) => {
    setDeleting(id);
    try {
      await appApi.deletePhoto(id);
      toast.success('Photo removed');
      await load();
      setCompareIds(null);
    } catch (e: any) {
      toast.error(e?.message || 'Could not remove the photo.');
    } finally {
      setDeleting(null);
    }
  };

  const exportData = async () => {
    setExporting(true);
    try {
      const res = await appApi.export();
      downloadJson(res, `man-matters-companion-${new Date().toISOString().slice(0, 10)}.json`);
      toast.success('Your data was exported');
    } catch (e: any) {
      toast.error(e?.message || 'Export failed.');
    } finally {
      setExporting(false);
    }
  };

  if (error) {
    return (
      <div className="pt-10">
        <Empty title="Progress unavailable" body={error} action={<Btn onClick={load}>Try again</Btn>} />
      </div>
    );
  }

  if (!data) {
    if (loaded) {
      return (
        <div className="pt-10">
          <Empty
            title="No plan to measure yet"
            body="Progress is computed from check-ins against an active routine. Build the plan first."
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
      <div>
        <Skeleton className="h-9 w-60" />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
        <Skeleton className="mt-4 h-72" />
      </div>
    );
  }

  const series = range === 30 ? data.series : data.series90;
  const logged = data.series90.filter((s) => s.logged).length;
  const photoMetaById = Object.fromEntries(data.photos.map((p) => [p.id, p]));
  const sortedPhotos = [...data.photos].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="pb-4">
      <PageHeader
        eyebrow="Progress · the honest scoreboard"
        title={<>Evidence, not vibes.</>}
        sub="Adherence, logged shedding and standardised photos. If the data says it is not working, the app says that too."
        action={
          <div className="flex gap-2">
            <Btn variant="ghost" size="sm" onClick={exportData} loading={exporting} icon={<ArrowDownToLine className="h-3.5 w-3.5" />}>
              Export data
            </Btn>
            <Btn size="sm" onClick={() => setCapture(true)} icon={<Camera className="h-3.5 w-3.5" />}>
              Take photo
            </Btn>
          </div>
        }
      />

      {/* Score band */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-center gap-4 p-4">
          <Ring value={score?.score || 0} size={92} stroke={8} label={`${score?.score || 0}`} sub="score" />
          <div>
            <div className="eyebrow">Progress score</div>
            <div className="mt-1 text-[12.5px] font-medium">
              {(score?.score || 0) >= 70 ? 'Compounding' : (score?.score || 0) >= 45 ? 'Holding' : 'Fragile'}
            </div>
            <p className="mt-1 text-[10.5px] leading-relaxed text-muted">Adherence 45% · logs 20% · photos 15% · sleep 10% · cadence 10%</p>
          </div>
        </Card>
        <StatTile label="30-day adherence" value={`${adherence30}%`} sub={`${logged} of 90 days logged`} />
        <StatTile label="Logging streak" value={`${data.streak.current}d`} sub={`Best ${data.streak.best} days`} />
        <StatTile label="Photos" value={data.photos.length} sub={data.photos[0] ? `Latest ${prettyDate(data.photos[0].date)}` : 'No baseline yet'} />
      </div>

      {/* Score parts */}
      <Card className="mt-4 p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="eyebrow">How the score is built</div>
            <div className="mt-1 text-[12px] text-muted">Weighted from your own rows. No engagement vanity metrics.</div>
          </div>
          <Chip tone={(score?.score || 0) >= 70 ? 'lime' : 'warn'}>{score?.score || 0}/100</Chip>
        </div>
        <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {(score?.parts || []).map((p) => (
            <div key={p.key}>
              <div className="flex items-baseline justify-between text-[11.5px]">
                <span className="text-ink/75">
                  {p.label} <span className="font-mono text-[9.5px] text-muted">· {p.weight}%</span>
                </span>
                <span className="font-medium">{Math.round(p.value)}%</span>
              </div>
              <Meter value={p.value} tone={p.value >= 70 ? 'bg-forest' : p.value >= 40 ? 'bg-amber' : 'bg-danger'} className="mt-1.5" />
            </div>
          ))}
        </div>
      </Card>

      {/* Charts */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="eyebrow">Adherence</div>
              <div className="mt-1 font-display text-lg leading-none tracking-tight">Every scheduled dose</div>
            </div>
            <div className="flex rounded-full border border-line p-0.5">
              {[30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setRange(d as 30 | 90)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[10.5px] font-medium transition',
                    range === d ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
                  )}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3">
            <AdherenceChart data={series} height={200} />
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-[10.5px] text-muted">
            <Info className="h-3 w-3" /> Null days had no scheduled dose, not a missed dose.
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="eyebrow">Correlated signals</div>
              <div className="mt-1 font-display text-lg leading-none tracking-tight">
                {metric === 'hairFall' ? 'Logged hair fall' : metric === 'sleep' ? 'Sleep hours' : 'Stress (1–5)'}
              </div>
            </div>
            <div className="flex rounded-full border border-line p-0.5">
              {[
                { id: 'hairFall', icon: Waves, label: 'Fall' },
                { id: 'sleep', icon: Moon, label: 'Sleep' },
                { id: 'stress', icon: CircleDot, label: 'Stress' }
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setMetric(id as typeof metric)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-medium transition',
                    metric === id ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
                  )}
                >
                  <Icon className="h-3 w-3" /> {label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3">
            <TrendChart
              data={data.series90}
              dataKey={metric}
              unit={metric === 'sleep' ? 'h' : metric === 'hairFall' ? ' strands' : ''}
              height={200}
              label={metric === 'hairFall' ? 'Hair fall' : metric === 'sleep' ? 'Sleep' : 'Stress'}
              color={metric === 'hairFall' ? '#15351F' : '#0B0C0E'}
            />
          </div>
          <p className="mt-1 text-[10.5px] text-muted">Shedding up in weeks 2–4 is the cycle, not the product. After week 8, it is a review trigger.</p>
        </Card>
      </div>

      {/* Heatmap */}
      <Card className="mt-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="eyebrow">13-week consistency map</div>
            <div className="mt-1 font-display text-lg leading-none tracking-tight">The pattern you cannot feel day to day</div>
          </div>
          <div className="flex items-center gap-1.5 text-[9.5px] text-muted">
            <span>missed</span>
            {['bg-ink/[0.08]', 'bg-forest/20', 'bg-forest/40', 'bg-forest/65', 'bg-forest'].map((c) => (
              <span key={c} className={cn('h-3 w-3 rounded-[3px]', c)} />
            ))}
            <span>full</span>
          </div>
        </div>
        <div className="mt-4">
          <Heatmap cells={data.heatmap} />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[10.5px] text-muted">
          <span>Started {prettyDate(data.weeks[0]?.start || data.series[0]?.date || new Date().toISOString().slice(0, 10))}</span>
          <span>Day {data.heatmap.filter((c) => !c.future).length} of the 91-day cycle</span>
          <span>{data.weeks.filter((w) => w.state === 'past' || w.state === 'current').length} weeks in</span>
        </div>
      </Card>

      {/* Photos */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="eyebrow">Photo protocol</div>
              <div className="mt-1 font-display text-lg leading-none tracking-tight">Same room. Same light. Same distance.</div>
            </div>
            <div className="flex gap-2">
              {data.photos.length >= 2 && (
                <Btn variant="ghost" size="sm" onClick={quickCompare} loading={compareBusy}>
                  Compare first vs latest
                </Btn>
              )}
              <Btn size="sm" onClick={() => setCapture(true)} icon={<Camera className="h-3.5 w-3.5" />}>
                Add
              </Btn>
            </div>
          </div>

          {data.photos.length ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {sortedPhotos.slice(0, 6).map((p, i) => {
                const baseline = [...data.photos].sort((a, b) => a.date.localeCompare(b.date))[0];
                return (
                  <div key={p.id} className="group rounded-xl border border-line bg-white/60 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink font-mono text-[9.5px] text-lime">W{p.week}</span>
                        <div>
                          <div className="text-[11.5px] font-medium">{ANGLE_LABEL[p.angle] || p.angle}</div>
                          <div className="text-[10px] text-muted">{prettyDate(p.date)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {p.id !== baseline.id && (
                          <button
                            onClick={() => openCompare({ before: baseline.id, after: p.id })}
                            className="rounded-md border border-line px-1.5 py-1 text-[9.5px] font-medium text-muted transition hover:text-ink"
                          >
                            vs W{baseline.week}
                          </button>
                        )}
                        <button
                          onClick={() => removePhoto(p.id)}
                          disabled={deleting === p.id}
                          className="rounded-md p-1 text-muted/40 transition hover:text-danger disabled:opacity-40"
                          aria-label="Delete photo"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => thumbs[p.id] && setViewPhoto({ id: p.id, url: thumbs[p.id] })}
                      className="mt-2 block w-full overflow-hidden rounded-lg border border-line bg-ink/[0.04]"
                      aria-label={`View week ${p.week} photo`}
                    >
                      {thumbs[p.id] ? (
                        <img
                          src={thumbs[p.id]}
                          alt={`Week ${p.week} · ${ANGLE_LABEL[p.angle] || p.angle}`}
                          className="aspect-[16/10] w-full object-cover transition duration-500 hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="aspect-[16/10] w-full skeleton" />
                      )}
                    </button>
                    {p.notes && <p className="mt-2 line-clamp-2 text-[10.5px] leading-relaxed text-muted">{p.notes}</p>}
                    {p.lighting != null && (
                      <div className="mt-2 flex items-center gap-1 text-[9.5px] text-muted/80">
                        <span className="h-1.5 w-1.5 rounded-full bg-forest/50" /> lighting {p.lighting}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-line px-6 py-10 text-center">
              <ImageOff className="h-5 w-5 text-muted" />
              <p className="mt-2 font-display text-xl">No baseline yet</p>
              <p className="mt-1 max-w-xs text-[11.5px] leading-relaxed text-muted">
                Without a week-1 frame, week 12 becomes a feeling. The capture flow checks light and labels the angle.
              </p>
              <Btn size="sm" className="mt-4" onClick={() => setCapture(true)}>
                Capture baseline
              </Btn>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="eyebrow">Monthly stack</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-3xl leading-none">{inr(data.spend.total)}</span>
              <span className="text-[11px] text-muted">/ month</span>
            </div>
            <div className="mt-3 space-y-2">
              {data.spend.items.map((i) => (
                <div key={i.slug} className="flex items-center justify-between border-t border-line pt-2 text-[11.5px] first:border-0 first:pt-0">
                  <span className="truncate text-ink/70">{i.name}</span>
                  <span className="ml-2 shrink-0 font-mono text-[10.5px] text-muted">{inr(i.monthlyCost)}</span>
                </div>
              ))}
            </div>
            <Link to="/app/products" className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-forest hover:underline">
              Review the stack <ChevronRight className="h-3 w-3" />
            </Link>
          </Card>

          <Card className="p-5">
            <div className="eyebrow">Refill forecast</div>
            <div className="mt-3 space-y-2.5">
              {data.refills.length ? (
                data.refills.map((r) => (
                  <div key={r.slug} className="rounded-xl border border-line bg-white/60 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[11.5px] font-medium">{r.name}</span>
                      <span className="font-mono text-[10px] text-muted">{r.perWeek}/wk</span>
                    </div>
                    <Meter value={Math.min(100, (r.packWeeks / 13) * 100)} className="mt-2" />
                    <div className="mt-1 text-[9.5px] text-muted">Pack lasts ~{Math.round(r.packWeeks)} weeks · {inr(r.monthlyCost)}/mo</div>
                  </div>
                ))
              ) : (
                <p className="text-[11.5px] text-muted">No consumables in the current phase.</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Weeks table */}
      <Card className="mt-4 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            <div className="eyebrow">Week ledger</div>
            <div className="mt-1 text-[12px] text-muted">The 13-week cycle, computed from check-ins and photos.</div>
          </div>
          <Chip>Week {data.weeks.find((w) => w.state === 'current')?.week || 1}</Chip>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] text-left">
            <thead>
              <tr className="border-b border-line text-[9.5px] uppercase tracking-[0.12em] text-muted">
                <th className="px-4 py-2.5 font-medium">Week</th>
                <th className="px-4 py-2.5 font-medium">Phase</th>
                <th className="px-4 py-2.5 font-medium">Adherence</th>
                <th className="px-4 py-2.5 font-medium">Avg hair fall</th>
                <th className="px-4 py-2.5 font-medium">Logs</th>
                <th className="px-4 py-2.5 font-medium">Photos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.weeks.map((w) => (
                <tr key={w.week} className={cn(w.state === 'current' && 'bg-forest/[0.04]', w.state === 'upcoming' && 'text-muted/60')}>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium">
                      W{w.week}
                      {w.state === 'current' && <span className="h-1.5 w-1.5 rounded-full bg-forest" />}
                      {w.state === 'past' && <Check className="h-3 w-3 text-forest/60" />}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[11.5px]">{w.phase === 1 ? 'Foundation' : w.phase === 2 ? 'Consistency' : 'Evidence'}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Meter value={w.adherence ?? 0} className="w-14" tone={(w.adherence ?? 0) >= 70 ? 'bg-forest' : 'bg-amber'} />
                      <span className="font-mono text-[10.5px]">{w.adherence != null ? `${w.adherence}%` : '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[10.5px]">{w.hairFall != null ? `${w.hairFall}` : '—'}</td>
                  <td className="px-4 py-2.5 font-mono text-[10.5px]">{w.logged}/7</td>
                  <td className="px-4 py-2.5 font-mono text-[10.5px]">{w.photos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <PhotoCapture open={capture} onClose={() => setCapture(false)} onSaved={load} week={data.weeks.find((w) => w.state === 'current')?.week} />

      <Modal
        open={Boolean(compareIds)}
        onClose={() => setCompareIds(null)}
        title="Like-for-like comparison"
        width="max-w-2xl"
      >
        {compareIds && photosFull[compareIds.before] && photosFull[compareIds.after] ? (
          <>
            <CompareSlider
              before={photosFull[compareIds.before]}
              after={photosFull[compareIds.after]}
              labelBefore={`Week ${photoMetaById[compareIds.before]?.week ?? '—'} · ${photoMetaById[compareIds.before] ? prettyDate(photoMetaById[compareIds.before].date) : ''}`}
              labelAfter={`Week ${photoMetaById[compareIds.after]?.week ?? '—'} · ${photoMetaById[compareIds.after] ? prettyDate(photoMetaById[compareIds.after].date) : ''}`}
            />
            <p className="mt-3 text-[11.5px] leading-relaxed text-muted">
              Drag the divider. If the light or angle differs, the comparison is not evidence — recapture in the same spot
              before drawing a conclusion.
            </p>
          </>
        ) : (
          <div className="grid h-56 place-items-center">
            <Skeleton className="h-full w-full" />
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <Btn variant="ghost" size="sm" onClick={() => setCompareIds(null)}>
            Close
          </Btn>
        </div>
      </Modal>

      <Modal
        open={Boolean(viewPhoto)}
        onClose={() => setViewPhoto(null)}
        title={
          viewPhoto
            ? `Week ${photoMetaById[viewPhoto.id]?.week ?? '—'} · ${
                ANGLE_LABEL[photoMetaById[viewPhoto.id]?.angle] || photoMetaById[viewPhoto.id]?.angle || 'Photo'
              }`
            : 'Photo'
        }
        width="max-w-xl"
      >
        {viewPhoto && (
          <img src={viewPhoto.url} alt="Progress photo" className="max-h-[68vh] w-full rounded-xl bg-ink object-contain" />
        )}
      </Modal>

      <FooterNote />
    </div>
  );
}
