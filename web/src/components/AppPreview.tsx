import { Camera, Check, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { Ring } from './ui';

/**
 * The dashboard preview that used to sit in the landing hero. It now lives in
 * the "how it works" section so the hero can lead with the product films.
 */
export function AppPreview({ className }: { className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-[radial-gradient(60%_60%_at_60%_30%,rgba(200,241,105,0.28),transparent_70%)] blur-2xl" />
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
            You're in the weeks 2–4 shedding window. More strands now means the cycle is resetting — stopping here is the
            most common mistake.
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-5 py-3">
          <div className="flex items-center gap-2 text-[9.5px] uppercase tracking-wider text-paper/35">
            <span className="h-1 w-1 rounded-full bg-lime" /> Baseline · W1
          </div>
          <svg viewBox="0 0 120 22" className="h-6 w-28" aria-hidden="true">
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
  );
}
