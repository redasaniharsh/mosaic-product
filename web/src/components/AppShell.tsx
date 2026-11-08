import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Camera,
  LayoutGrid,
  ListChecks,
  LogOut,
  Menu,
  Rocket,
  ShoppingBag,
  Sparkles,
  X
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useAuth } from '../lib/auth';
import { cn, initials } from '../lib/utils';
import { Chip, Logo } from './ui';

const NAV = [
  { to: '/app', label: 'Today', icon: LayoutGrid, end: true },
  { to: '/app/routine', label: 'Routine', icon: ListChecks },
  { to: '/app/progress', label: 'Progress', icon: Camera },
  { to: '/app/assistant', label: 'Coach', icon: Sparkles },
  { to: '/app/products', label: 'Shop', icon: ShoppingBag },
  { to: '/app/science', label: 'Science', icon: BookOpen }
];

const MOBILE = NAV.slice(0, 5);

export const AppShell = ({ children }: { children: ReactNode }) => {
  const { user, overview, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const week = overview?.routine?.week;

  const signOut = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-paper">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[258px] flex-col border-r border-line bg-paper px-4 py-5 lg:flex">
        <Link to="/app" className="px-2">
          <Logo />
        </Link>

        <div className="mt-7 flex-1">
          <div className="eyebrow mb-2 px-3">The program</div>
          <nav className="space-y-0.5">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => cn('nav-link', isActive && 'nav-link-active')}
              >
                <Icon className="h-[15px] w-[15px]" strokeWidth={1.9} />
                {label}
                {to === '/app/assistant' && (
                  <span className="ml-auto rounded-full bg-lime px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-forest">
                    AI
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {week && (
            <div className="mt-7 rounded-xl border border-line bg-white/50 p-3.5">
              <div className="flex items-center justify-between">
                <span className="eyebrow">Cycle</span>
                <Chip tone="lime">Week {week}/13</Chip>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink/[0.07]">
                <div className="h-full rounded-full bg-forest" style={{ width: `${(week / 13) * 100}%` }} />
              </div>
              <p className="mt-2.5 text-[11.5px] leading-relaxed text-muted">
                {overview?.routine?.phase?.summary}
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-line bg-white/50 p-2.5">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink font-display text-[13px] text-lime">
              {initials(user?.name || 'You')}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-medium">{user?.name}</div>
              <div className="truncate text-[10.5px] text-muted">{user?.role === 'demo' ? 'Demo account' : user?.email}</div>
            </div>
            <button onClick={signOut} className="rounded-lg p-1.5 text-muted transition hover:bg-ink/5 hover:text-ink" aria-label="Sign out">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-paper/85 px-4 py-3 backdrop-blur-md lg:hidden">
        <Link to="/app">
          <Logo compact />
        </Link>
        <div className="flex items-center gap-2">
          {week && <Chip tone="lime">Week {week}/13</Chip>}
          <button onClick={() => setOpen(true)} className="rounded-lg border border-line p-1.5" aria-label="Menu">
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-[280px] animate-fade-up bg-paper p-5 shadow-lift">
            <div className="flex items-center justify-between">
              <Logo />
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="mt-6 space-y-1">
              {NAV.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) => cn('nav-link', isActive && 'nav-link-active')}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
            <button onClick={signOut} className="mt-6 flex w-full items-center gap-2 rounded-xl border border-line px-3 py-2 text-[13px] text-muted">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      )}

      <main className="lg:pl-[258px]">
        <div className="mx-auto w-full max-w-[1120px] px-4 pb-28 pt-5 sm:px-7 sm:pt-7 lg:pb-14">
          {location.pathname !== '/app' && (
            <div className="mb-4 hidden items-center gap-2 text-[11px] text-muted lg:flex">
              <Link to="/app" className="hover:text-ink">
                Today
              </Link>
              <span>/</span>
              <span className="text-ink">{NAV.find((n) => location.pathname.startsWith(n.to) && n.to !== '/app')?.label || 'Overview'}</span>
            </div>
          )}
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
          {MOBILE.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center gap-1 py-2.5 text-[9.5px] font-medium transition',
                  isActive ? 'text-ink' : 'text-muted/70'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className={cn('grid h-7 w-9 place-items-center rounded-full transition', isActive && 'bg-ink text-lime')}>
                    <Icon className="h-[15px] w-[15px]" strokeWidth={2} />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export const PageHeader = ({
  eyebrow,
  title,
  sub,
  action
}: {
  eyebrow?: string;
  title: ReactNode;
  sub?: ReactNode;
  action?: ReactNode;
}) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div>
      {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
      <h1 className="font-display text-[clamp(2rem,4.6vw,2.9rem)] leading-none tracking-tightest">{title}</h1>
      {sub && <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted">{sub}</p>}
    </div>
    {action}
  </div>
);

export const FooterNote = () => (
  <div className="mt-10 flex items-center gap-2 text-[10.5px] text-muted/80">
    <Rocket className="h-3 w-3" />
    Man Matters Companion · built for the Mosaic Fellowship Builder Round
  </div>
);
