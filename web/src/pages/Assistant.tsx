import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Bot,
  CalendarDays,
  Check,
  CircleAlert,
  Eraser,
  HeartPulse,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
  Stethoscope,
  User as UserIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { aiApi, appApi, streamChat } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { ChatMessage, Insight, Overview } from '../lib/types';
import { PageHeader, FooterNote } from '../components/AppShell';
import { Btn, Card, Chip, Field, Input, Modal, Select, Skeleton, Textarea } from '../components/ui';
import { cn, prettyDate } from '../lib/utils';

const SUGGESTIONS = [
  'Why is my hair falling more in week 5?',
  'I missed four days. Should I double up?',
  'How do I compare photos properly?',
  'My scalp itches after the serum. What now?'
];

const PROVIDER_LABEL = (p?: string) => {
  if (!p) return 'rules engine';
  if (p.startsWith('gemini')) return 'Gemini 2.5 Flash';
  if (p.startsWith('nvidia')) return 'Nemotron 550B';
  return p;
};

const RichText = ({ text }: { text: string }) => {
  const blocks = text.split(/\n{2,}/).filter(Boolean);
  return (
    <>
      {blocks.map((block, bi) => {
        const lines = block.split('\n');
        const isList = lines.every((l) => /^\s*[-•*]\s+/.test(l));
        if (isList) {
          return (
            <ul key={bi} className="my-2 space-y-1.5">
              {lines.map((l, li) => (
                <li key={li} className="flex gap-2">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-current opacity-40" />
                  <span>{inline(l.replace(/^\s*[-•*]\s+/, ''))}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={bi} className={bi > 0 ? 'mt-2.5' : ''}>
            {lines.map((l, li) => (
              <span key={li}>
                {inline(l)}
                {li < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </>
  );
};

const inline = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? (
      <strong key={i} className="font-semibold">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    )
  );
};

export default function Assistant() {
  const { user, overview } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [meta, setMeta] = useState<{ week: number; adherence7: number; model: string } | null>(null);
  const [status, setStatus] = useState<{ enabled: boolean; chain: string[]; fallback: string } | null>(null);
  const [ov, setOv] = useState<Overview | null>(overview);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [review, setReview] = useState<Insight | null>(null);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [redFlag, setRedFlag] = useState(false);

  const [escOpen, setEscOpen] = useState(false);
  const [esc, setEsc] = useState({ reason: 'Unexpected shedding pattern', detail: '' });
  const [escBusy, setEscBusy] = useState(false);

  const abortRef = useRef<null | (() => void)>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [hist, st, ovRes, rev] = await Promise.allSettled([
        aiApi.history(),
        aiApi.status(),
        appApi.overview(),
        appApi.weeklyInsight()
      ]);
      if (hist.status === 'fulfilled') {
        setMessages(
          (hist.value.messages || []).map((m) => ({
            role: m.role,
            content: m.content,
            meta: m.meta || null
          }))
        );
      }
      if (st.status === 'fulfilled') setStatus(st.value);
      if (ovRes.status === 'fulfilled') setOv(ovRes.value.overview);
      if (rev.status === 'fulfilled' && rev.value?.insight) setReview(rev.value.insight);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, pending]);

  const send = (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || pending) return;
    const history = messages.filter((m) => !m.streaming);
    setInput('');
    setPending(true);
    setRedFlag(false);
    setMessages((prev) => [...prev, { role: 'user', content: text }, { role: 'assistant', content: '', streaming: true }]);

    abortRef.current = streamChat(text, history, {
      onMeta: (m) => setMeta(m),
      onToken: (t) => {
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.streaming) next[next.length - 1] = { ...last, content: last.content + t };
          return next;
        });
      },
      onDone: (d) => {
        setPending(false);
        setRedFlag(Boolean(d.redFlag));
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.streaming) {
            next[next.length - 1] = {
              ...last,
              content: d.content || last.content,
              streaming: false,
              meta: { mode: d.mode, redFlag: d.redFlag }
            };
          }
          return next;
        });
        abortRef.current = null;
      },
      onError: (err) => {
        setPending(false);
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.streaming) {
            next[next.length - 1] = {
              ...last,
              content: 'The coach could not answer just now. Your plan and logs are safe — try again in a moment.',
              streaming: false
            };
          }
          return next;
        });
        toast.error(err.message || 'Coach unavailable');
        abortRef.current = null;
      }
    });
  };

  const stop = () => {
    abortRef.current?.();
    abortRef.current = null;
    setPending(false);
    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last?.streaming) next[next.length - 1] = { ...last, streaming: false };
      return next;
    });
  };

  const clear = async () => {
    setClearing(true);
    try {
      await aiApi.clear();
      setMessages([]);
      setReview(null);
      toast.success('Conversation cleared');
    } catch (e: any) {
      toast.error(e?.message || 'Could not clear the conversation.');
    } finally {
      setClearing(false);
    }
  };

  const generateReview = async (refresh = false) => {
    setReviewBusy(true);
    try {
      const res = await appApi.review(refresh);
      setReview(res.insight);
      toast.success('Review updated');
    } catch (e: any) {
      toast.error(e?.message || 'Review unavailable.');
    } finally {
      setReviewBusy(false);
    }
  };

  const submitEscalation = async () => {
    setEscBusy(true);
    try {
      const res = await appApi.escalate({ reason: esc.reason, detail: esc.detail });
      toast.success('Clinician review queued');
      setEscOpen(false);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Review queued. ${res.sla}\n\nBefore it happens:\n- ${res.prep.join('\n- ')}`
        }
      ]);
    } catch (e: any) {
      toast.error(e?.message || 'Could not queue the review.');
    } finally {
      setEscBusy(false);
    }
  };

  const week = meta?.week ?? ov?.routine?.week ?? 1;
  const adherence7 = meta?.adherence7 ?? ov?.stats?.adherence7 ?? 0;
  const chain = status?.chain || [];
  const lastAssistantMeta = useMemo(() => [...messages].reverse().find((m) => m.role === 'assistant')?.meta, [messages]);

  return (
    <div className="pb-4">
      <PageHeader
        eyebrow="Companion coach · grounded in your logs"
        title={<>Ask the 11pm question.</>}
        sub="Every answer carries your week, adherence, sleep and logged shedding. If a symptom needs a clinician, it says so."
        action={
          <div className="flex items-center gap-2">
            <Chip tone={status?.enabled ? 'lime' : 'warn'}>
              <span className={cn('h-1.5 w-1.5 rounded-full', status?.enabled ? 'bg-forest' : 'bg-amber')} />
              {status?.enabled ? 'AI live' : 'rules mode'}
            </Chip>
            <Btn variant="ghost" size="sm" onClick={clear} loading={clearing} icon={<Eraser className="h-3.5 w-3.5" />}>
              Clear
            </Btn>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.45fr_0.55fr]">
        {/* Chat */}
        <Card className="flex min-h-[620px] flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-lime">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <div className="text-[12.5px] font-medium">Man Matters Companion</div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-forest" />
                  Week {week} · {adherence7}% adherence ·{' '}
                  {lastAssistantMeta?.mode === 'rules' ? 'rules engine' : meta?.model ? PROVIDER_LABEL(meta.model) : 'live coach'}
                </div>
              </div>
            </div>
            <Link to="/app/routine" className="hidden text-[10.5px] text-muted transition hover:text-ink sm:block">
              Context: week {week}
            </Link>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-2/3" />
                <Skeleton className="ml-auto h-12 w-1/2" />
                <Skeleton className="h-24 w-3/4" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-forest/10 text-forest">
                  <Bot className="h-6 w-6" />
                </span>
                <h2 className="mt-4 font-display text-2xl tracking-tight">What is actually on your mind?</h2>
                <p className="mt-1.5 max-w-sm text-[12px] leading-relaxed text-muted">
                  Shedding panic, a missed week, a side effect, or doubt about whether any of this is working. It answers with
                  your numbers, not a blog post.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-full border border-line bg-white/70 px-3 py-1.5 text-[11px] text-ink/70 transition hover:border-ink/30 hover:text-ink"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={cn('flex gap-2.5', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {m.role === 'assistant' && (
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-lime">
                      <Sparkles className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed',
                      m.role === 'user'
                        ? 'rounded-br-md bg-ink text-paper'
                        : 'rounded-bl-md border border-line bg-white/75 text-ink/85'
                    )}
                  >
                    {m.role === 'assistant' ? (
                      m.content ? (
                        <RichText text={m.content} />
                      ) : (
                        <span className="inline-flex items-center gap-1.5 py-0.5 text-muted">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-forest" />
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-forest [animation-delay:150ms]" />
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-forest [animation-delay:300ms]" />
                          <span className="ml-1 text-[11px]">reading your data</span>
                        </span>
                      )
                    ) : (
                      m.content
                    )}
                    {m.streaming && m.content && <span className="ml-0.5 inline-block h-3.5 w-1 animate-blink bg-forest align-middle" />}
                    {!m.streaming && m.role === 'assistant' && m.meta?.mode === 'rules' && (
                      <div className="mt-2 border-t border-line pt-1.5 text-[9.5px] uppercase tracking-[0.12em] text-muted/70">
                        deterministic coach · providers unavailable
                      </div>
                    )}
                  </div>
                  {m.role === 'user' && (
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-forest text-[10px] font-medium text-lime">
                      {(user?.name || 'Y')[0].toUpperCase()}
                    </span>
                  )}
                </div>
              ))
            )}

            {redFlag && (
              <div className="rounded-xl border border-danger/25 bg-danger/[0.04] p-3.5">
                <div className="flex items-center gap-2 text-[11.5px] font-medium text-danger">
                  <CircleAlert className="h-3.5 w-3.5" /> This needs a clinician, not a coach
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-ink/70">
                  What you described is outside what a routine can safely explain. Queue a Man Matters doctor review and bring the
                  dates and the product list.
                </p>
                <Btn size="sm" className="mt-2.5" onClick={() => setEscOpen(true)} icon={<Stethoscope className="h-3.5 w-3.5" />}>
                  Book a review
                </Btn>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-line p-3">
            {messages.length > 0 && (
              <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {SUGGESTIONS.slice(1).map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    disabled={pending}
                    className="shrink-0 rounded-full border border-line px-2.5 py-1 text-[10px] text-muted transition hover:border-ink/25 hover:text-ink disabled:opacity-40"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2 rounded-2xl border border-line bg-white p-1.5 focus-within:border-ink/35 focus-within:ring-4 focus-within:ring-ink/5">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder="Ask about shedding, missed doses, side effects, or whether it is working…"
                className="max-h-32 min-h-[38px] flex-1 resize-none bg-transparent px-2.5 py-2 text-[12.5px] leading-relaxed placeholder:text-muted/60 focus:outline-none"
              />
              {pending ? (
                <button onClick={stop} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink text-paper" aria-label="Stop">
                  <Square className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => send()}
                  disabled={!input.trim()}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-forest text-lime transition hover:bg-forest/90 disabled:opacity-35"
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="mt-1.5 flex items-center justify-between px-1 text-[9.5px] text-muted/70">
              <span>Enter to send · Shift+Enter for a new line</span>
              <span>{chain.length ? `${chain.length} providers in the fallback chain` : 'rules fallback'}</span>
            </div>
          </div>
        </Card>

        {/* Side rail */}
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 eyebrow">
              <Activity className="h-3.5 w-3.5 text-forest" /> What the coach sees
            </div>
            <div className="mt-3 space-y-2">
              {[
                ['Week', `${week} of 13`],
                ['7-day adherence', `${adherence7}%`],
                ['30-day adherence', `${ov?.stats?.adherence30 ?? 0}%`],
                ['Today', `${ov?.today?.doneCount ?? 0}/${ov?.today?.total ?? 0} doses`],
                ['Last photo', ov?.stats?.lastPhoto ? prettyDate(ov.stats.lastPhoto) : 'none'],
                ['Streak', `${ov?.stats?.streak?.current ?? 0} days`]
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between border-b border-line pb-2 text-[11.5px] last:border-0 last:pb-0">
                  <span className="text-muted">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-muted">
              Prompts are assembled from SQLite rows. The model is told to quote these numbers or stay quiet.
            </p>
          </Card>

          <Card className={cn('p-5', review && 'bg-forest text-paper')}>
            <div className={cn('flex items-center justify-between', review ? 'text-paper' : '')}>
              <div className={cn('eyebrow', review && 'text-lime/70')}>Weekly review</div>
              <button
                onClick={() => generateReview(true)}
                disabled={reviewBusy}
                className={cn('rounded-lg p-1', review ? 'text-lime' : 'text-muted hover:text-ink', reviewBusy && 'opacity-50')}
                aria-label="Regenerate review"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', reviewBusy && 'animate-spin')} />
              </button>
            </div>
            {review ? (
              <>
                <div className="mt-2 font-display text-xl leading-tight text-paper">{review.headline || review.title}</div>
                <p className="mt-2 text-[11.5px] leading-relaxed text-paper/65">{review.body}</p>
                <div className="mt-3 space-y-1.5">
                  {review.actions?.slice(0, 2).map((a, i) => (
                    <div key={i} className="flex gap-2 text-[11px] leading-relaxed text-paper/80">
                      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-lime text-[8px] font-bold text-ink">
                        {i + 1}
                      </span>
                      {a.label}
                    </div>
                  ))}
                </div>
                {review.coachNote && <p className="mt-3 border-t border-white/10 pt-2 text-[10.5px] italic leading-relaxed text-paper/50">“{review.coachNote}”</p>}
                <div className="mt-2 text-[9px] uppercase tracking-[0.12em] text-paper/35">{review.source || 'live'}</div>
              </>
            ) : (
              <>
                <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
                  The Sunday review names one lever for the week. It cites your numbers or it does not speak.
                </p>
                <Btn variant="ghost" size="sm" className="mt-3 w-full" onClick={() => generateReview(false)} loading={reviewBusy}>
                  {reviewBusy ? 'Reading your week' : 'Generate review'}
                </Btn>
              </>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 eyebrow">
              <ShieldCheck className="h-3.5 w-3.5 text-forest" /> Safety path
            </div>
            <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
              Red-flag symptoms bypass the model entirely and route to a clinician queue with a 24-hour SLA on weekdays.
            </p>
            <div className="mt-3 space-y-1.5">
              {['Sudden patchy loss', 'Painful or bleeding scalp', 'Persistent rash', 'Lump, fever, chest pain'].map((s) => (
                <div key={s} className="flex items-center gap-2 text-[11px] text-ink/70">
                  <span className="h-1 w-1 rounded-full bg-amber" /> {s}
                </div>
              ))}
            </div>
            <Btn variant="ghost" size="sm" className="mt-3 w-full" onClick={() => setEscOpen(true)} icon={<Stethoscope className="h-3.5 w-3.5" />}>
              Book a clinician review
            </Btn>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 eyebrow">
              <HeartPulse className="h-3.5 w-3.5 text-forest" /> Provider chain
            </div>
            <div className="mt-3 space-y-1.5">
              {(chain.length ? chain : ['rules']).map((c, i) => (
                <div key={`${c}-${i}`} className="flex items-center gap-2 rounded-lg border border-line bg-white/60 px-2.5 py-1.5 font-mono text-[9.5px] text-ink/65">
                  <span className="text-muted/50">0{i + 1}</span>
                  <span className="truncate">{c}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-muted">Rotates on rate limits, then falls back to a deterministic coach.</p>
          </Card>
        </div>
      </div>

      <Modal open={escOpen} onClose={() => setEscOpen(false)} title="Book a clinician review">
        <p className="-mt-2 mb-4 text-[12px] leading-relaxed text-muted">
          This goes to a Man Matters clinician queue. It is not an emergency service — for severe symptoms, use local urgent care.
        </p>
        <div className="space-y-3">
          <Field label="What should they review?">
            <Select value={esc.reason} onChange={(e) => setEsc({ ...esc, reason: e.target.value })}>
              <option>Unexpected shedding pattern</option>
              <option>Scalp pain or irritation</option>
              <option>Rash or reaction to a product</option>
              <option>Patchy hair loss</option>
              <option>No change after 12 weeks</option>
              <option>Something else</option>
            </Select>
          </Field>
          <Field label="Detail" hint="When it started, which product, and what you have already tried.">
            <Textarea
              value={esc.detail}
              onChange={(e) => setEsc({ ...esc, detail: e.target.value })}
              placeholder="Started 4 days after beginning the serum. Itching on the crown, no redness."
            />
          </Field>
        </div>
        <div className="mt-5 flex items-center justify-between">
          <span className="text-[10px] text-muted">24-hour SLA on weekdays</span>
          <div className="flex gap-2">
            <Btn variant="ghost" size="sm" onClick={() => setEscOpen(false)}>
              Cancel
            </Btn>
            <Btn size="sm" onClick={submitEscalation} loading={escBusy} icon={<Check className="h-3.5 w-3.5" />}>
              Queue review
            </Btn>
          </div>
        </div>
      </Modal>

      <FooterNote />
    </div>
  );
}
