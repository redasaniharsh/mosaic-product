import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
  FlaskConical,
  Plus,
  Search,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import { appApi, publicApi } from '../lib/api';
import { PageHeader, FooterNote } from '../components/AppShell';
import { ProductImage } from '../components/ProductImage';
import { Btn, Card, Chip, Empty, Field, Input, Modal, Select, Skeleton } from '../components/ui';
import type { Product, Review, SiteData } from '../lib/types';
import { cn, compact, inr } from '../lib/utils';

const CATEGORY_ORDER = ['Hair', 'Beard', 'Skin', 'Nutrition', 'Performance', 'Intimate Wellness', 'Programs'];

export default function Products() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [site, setSite] = useState<SiteData | null>(null);
  const [routineSlugs, setRoutineSlugs] = useState<Set<string>>(new Set());
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('All');
  const [concern, setConcern] = useState('');
  const [detail, setDetail] = useState<{ product: Product; reviews: Review[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, ov, s] = await Promise.all([appApi.products(), appApi.overview(), publicApi.site().catch(() => null)]);
      setProducts(p.products);
      setRoutineSlugs(new Set((ov.overview?.routine?.items || []).map((i: any) => i.product_slug)));
      if (s) setSite(s);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Could not load the catalogue.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(() => {
    if (!products) return ['All'];
    const present = [...new Set(products.map((p) => p.category))];
    return ['All', ...CATEGORY_ORDER.filter((c) => present.includes(c)), ...present.filter((c) => !CATEGORY_ORDER.includes(c))];
  }, [products]);

  const filtered = useMemo(() => {
    if (!products) return [];
    const needle = q.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== 'All' && p.category !== category) return false;
      if (concern && !p.concerns.includes(concern)) return false;
      if (needle && !`${p.name} ${p.tagline} ${p.description} ${p.actives.join(' ')}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [products, q, category, concern]);

  const openDetail = async (slug: string) => {
    setDetailLoading(slug);
    try {
      const res = await appApi.product(slug);
      setDetail({ product: res.product, reviews: res.reviews || [] });
    } catch (e: any) {
      toast.error(e?.message || 'Could not load that product.');
    } finally {
      setDetailLoading(null);
    }
  };

  const add = async (slug: string) => {
    setAdding(slug);
    try {
      await appApi.addItem(slug);
      setRoutineSlugs((prev) => new Set(prev).add(slug));
      toast.success('Added to your active routine');
      setDetail(null);
    } catch (e: any) {
      toast.error(e?.message || 'Could not add that product.');
    } finally {
      setAdding(null);
    }
  };

  if (error) {
    return (
      <div className="pt-10">
        <Empty title="Catalogue unavailable" body={error} action={<Btn onClick={load}>Try again</Btn>} />
      </div>
    );
  }

  return (
    <div className="pb-4">
      <PageHeader
        eyebrow="The catalogue · only what the plan can use"
        title={<>Products with a reason.</>}
        sub="Every item maps to a concern, a phase and a dose. Adding one before week 8 makes it impossible to tell what is working."
        action={
          <Link to="/app/routine" className="btn-ghost btn-sm">
            View my routine <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <Card className="p-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search serum, biotin, beard, acne…" className="pl-9" />
          </div>
          <div className="flex gap-2">
            <Select value={concern} onChange={(e) => setConcern(e.target.value)} className="min-w-[170px]">
              <option value="">All concerns</option>
              {(site?.concerns || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-[11.5px] font-medium transition',
                category === c ? 'bg-ink text-paper' : 'border border-line bg-white/60 text-muted hover:text-ink'
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </Card>

      {!products ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          <Empty
            title="Nothing matches that filter"
            body="Try a different concern, or clear the search. The catalogue only lists products that are actually in the routine engine."
            action={
              <Btn
                variant="ghost"
                onClick={() => {
                  setQ('');
                  setCategory('All');
                  setConcern('');
                }}
              >
                Clear filters
              </Btn>
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center justify-between px-1">
            <span className="text-[10.5px] text-muted">
              {filtered.length} of {products.length} products
            </span>
            {routineSlugs.size > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[10.5px] text-forest">
                <BadgeCheck className="h-3 w-3" /> {routineSlugs.size} already in your plan
              </span>
            )}
          </div>

          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => {
              const inRoutine = routineSlugs.has(p.slug);
              return (
                <Card key={p.slug} className="group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lift">
                  <button
                    onClick={() => openDetail(p.slug)}
                    className="relative block h-40 w-full overflow-hidden text-left"
                    aria-label={`View details for ${p.name}`}
                  >
                    <ProductImage
                      src={p.image}
                      alt={p.name}
                      accent={p.accent}
                      className="absolute inset-0 h-full w-full"
                      imgClassName="transition duration-700 group-hover:scale-[1.05]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-ink/30" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/65">{p.category}</span>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-white/85">
                        <Star className="h-3 w-3 fill-lime text-lime" /> {p.rating}
                        <span className="text-white/40">·</span>
                        <span className="text-white/60">{compact(p.reviews)} reviews</span>
                      </div>
                    </div>
                    <span className="absolute right-3 top-3 rounded-full border border-white/15 bg-ink/40 px-2 py-0.5 text-[9px] uppercase tracking-wide text-white/80 backdrop-blur">
                      {p.form}
                    </span>
                    <span className="absolute bottom-3 right-3 grid h-7 w-7 place-items-center rounded-full border border-white/20 bg-ink/40 text-white/85 opacity-0 backdrop-blur transition group-hover:opacity-100">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </button>

                  <div className="flex flex-1 flex-col p-4">
                    <button onClick={() => openDetail(p.slug)} className="text-left">
                      <h3 className="text-[13.5px] font-medium leading-snug">{p.name}</h3>
                      <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-muted">{p.tagline}</p>
                    </button>

                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {p.actives.slice(0, 3).map((a) => (
                        <span key={a} className="rounded-full bg-ink/[0.05] px-2 py-0.5 text-[9.5px] text-ink/65">
                          {a}
                        </span>
                      ))}
                    </div>

                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-[14px] font-medium">{inr(p.price)}</span>
                      <span className="text-[10.5px] text-muted line-through">{inr(p.mrp)}</span>
                      <span className="ml-auto text-[9.5px] text-muted">{p.size}</span>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <Btn variant="ghost" size="sm" className="flex-1" onClick={() => openDetail(p.slug)} loading={detailLoading === p.slug}>
                        Details
                      </Btn>
                      <Btn
                        size="sm"
                        variant={inRoutine ? 'ghost' : 'primary'}
                        disabled={inRoutine}
                        onClick={() => add(p.slug)}
                        loading={adding === p.slug}
                        className="flex-1"
                        icon={inRoutine ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                      >
                        {inRoutine ? 'In routine' : 'Add'}
                      </Btn>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Product detail */}
      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.product.name} width="max-w-2xl">
        {detail && (
          <div className="max-h-[72vh] overflow-y-auto pr-1">
            <div className="relative mb-4 overflow-hidden rounded-2xl border border-line">
              <ProductImage
                src={detail.product.image}
                alt={detail.product.name}
                accent={detail.product.accent}
                className="h-40 w-full sm:h-48"
                eager
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-4">
                <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-white/75">
                  {detail.product.category} · {detail.product.form}
                </span>
                <span className="rounded-full border border-white/15 bg-ink/40 px-2 py-0.5 text-[9px] uppercase tracking-wide text-white/80 backdrop-blur">
                  {detail.product.size}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Chip tone="lime">{detail.product.category}</Chip>
              <Chip>{detail.product.form}</Chip>
              <Chip>
                <Star className="h-3 w-3 fill-amber text-amber" /> {detail.product.rating} · {compact(detail.product.reviews)} reviews
              </Chip>
              {routineSlugs.has(detail.product.slug) && (
                <Chip tone="ink">
                  <Check className="h-3 w-3" /> in your routine
                </Chip>
              )}
            </div>

            <p className="mt-3 text-[13px] leading-relaxed text-ink/80">{detail.product.description}</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-line bg-white/60 p-3.5">
                <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.13em] text-muted">
                  <FlaskConical className="h-3 w-3" /> Actives
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {detail.product.actives.map((a) => (
                    <span key={a} className="rounded-full bg-forest/[0.07] px-2 py-0.5 text-[10.5px] text-forest">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-line bg-white/60 p-3.5">
                <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.13em] text-muted">
                  <Sparkles className="h-3 w-3" /> How to use
                </div>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink/75">{detail.product.instructions}</p>
                <div className="mt-1.5 font-mono text-[9.5px] uppercase tracking-wider text-muted">
                  {detail.product.time_of_day} · {detail.product.cadence.replace(/_/g, ' ')}
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-forest/20 bg-forest/[0.04] p-3.5">
              <div className="text-[10px] font-medium uppercase tracking-[0.13em] text-forest">What the evidence supports</div>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink/75">{detail.product.evidence}</p>
            </div>

            <div className="mt-3 rounded-xl border border-amber/25 bg-amber/[0.04] p-3.5">
              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.13em] text-amber">
                <ShieldAlert className="h-3 w-3" /> Cautions
              </div>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink/75">{detail.product.cautions}</p>
            </div>

            {detail.reviews.length > 0 && (
              <div className="mt-5">
                <div className="eyebrow mb-2.5">From public reviews · paraphrased</div>
                <div className="space-y-2">
                  {detail.reviews.map((r) => (
                    <div key={r.id} className="rounded-xl border border-line bg-chalk p-3">
                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn('h-2.5 w-2.5', i < r.rating ? 'fill-amber text-amber' : 'text-line')} />
                        ))}
                        <span className="ml-1 font-mono text-[9px] uppercase tracking-wider text-muted">{r.source}</span>
                      </div>
                      <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink/75">{r.text}</p>
                      <div className="mt-1 font-mono text-[9px] uppercase tracking-wider text-muted/70">theme: {r.theme}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
              <div>
                <span className="text-[15px] font-medium">{inr(detail.product.price)}</span>
                <span className="ml-2 text-[11px] text-muted line-through">{inr(detail.product.mrp)}</span>
                <div className="text-[9.5px] text-muted">{detail.product.size}</div>
              </div>
              <div className="flex gap-2">
                <Btn variant="ghost" size="sm" onClick={() => setDetail(null)}>
                  Close
                </Btn>
                <Btn
                  size="sm"
                  disabled={routineSlugs.has(detail.product.slug)}
                  onClick={() => add(detail.product.slug)}
                  loading={adding === detail.product.slug}
                  icon={routineSlugs.has(detail.product.slug) ? <Check className="h-3.5 w-3.5" /> : <ShoppingBag className="h-3.5 w-3.5" />}
                >
                  {routineSlugs.has(detail.product.slug) ? 'Already active' : 'Add to my routine'}
                </Btn>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <FooterNote />
    </div>
  );
}
