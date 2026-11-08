import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { Logo } from './ui';

/**
 * Split-screen shell for /login and /signup.
 * Left rail carries the evidence story; right rail carries the form.
 */
export const AuthShell = ({
  title,
  sub,
  children,
  footer
}: {
  title: ReactNode;
  sub?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) => (
  <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[1.05fr_1fr]">
    {/* Story panel */}
    <aside className="relative hidden overflow-hidden bg-ink px-10 py-12 text-paper lg:flex lg:flex-col">
      <div className="pointer-events-none absolute inset-0 grain" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-[420px] w-[420px] rounded-full bg-lime/10 blur-3xl" />

      <Link to="/" className="relative">
        <Logo light />
      </Link>

      <div className="relative mt-auto max-w-md">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-lime/70">
          Man Matters · Mosaic Builder Round
        </div>
        <p className="mt-4 font-display text-[clamp(2rem,3.4vw,2.9rem)] leading-[1.06] tracking-tight">
          “I did not stop because it was not working. I stopped because I could not tell if it was working.”
        </p>
        <p className="mt-4 text-[12px] leading-relaxed text-paper/50">
          Raj Gandhi · 7 months on the hair routine · from a 20-minute customer conversation. The quote that started this
          build.
        </p>

        <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
          {[
            ['5/5', 'could not measure progress'],
            ['3/5', 'stopped before week 6'],
            ['12 wks', 'the honest evidence window']
          ].map(([v, k]) => (
            <div key={k}>
              <div className="font-display text-2xl leading-none text-paper">{v}</div>
              <div className="mt-1.5 text-[10.5px] leading-snug text-paper/45">{k}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-10 flex flex-wrap gap-x-5 gap-y-2 text-[10.5px] text-paper/40">
        <span className="inline-flex items-center gap-1.5">
          <Check className="h-3 w-3 text-lime" /> Real SQLite database
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Check className="h-3 w-3 text-lime" /> Live AI coach
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Check className="h-3 w-3 text-lime" /> No hardcoded dashboards
        </span>
      </div>
    </aside>

    {/* Form panel */}
    <main className="flex min-h-screen flex-col px-5 py-8 sm:px-10">
      <div className="flex items-center justify-between lg:hidden">
        <Link to="/">
          <Logo />
        </Link>
        <Link to="/" className="inline-flex items-center gap-1.5 text-[12px] text-muted">
          <ArrowLeft className="h-3.5 w-3.5" /> Home
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-10">
        <div className="hidden lg:block">
          <Link to="/" className="inline-flex items-center gap-1.5 text-[11.5px] text-muted transition hover:text-ink">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to the site
          </Link>
        </div>
        <h1 className="mt-6 font-display text-[clamp(2.1rem,4vw,2.8rem)] leading-none tracking-tightest lg:mt-10">
          {title}
        </h1>
        {sub && <p className="mt-3 text-[13px] leading-relaxed text-muted">{sub}</p>}
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-6 text-[12.5px] text-muted">{footer}</div>}
      </div>

      <p className="mx-auto w-full max-w-[400px] text-[10.5px] leading-relaxed text-muted/70">
        An independent Builder Round submission for the Mosaic Fellowship. Not an official Man Matters product.
      </p>
    </main>
  </div>
);
