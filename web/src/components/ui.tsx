import { forwardRef, useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import { Check, Loader2, X } from 'lucide-react';
import { cn } from '../lib/utils';

/* ---------------------------------- Logo ---------------------------------- */

export const Logo = ({ light = false, compact = false }: { light?: boolean; compact?: boolean }) => (
  <div className={cn('flex items-center gap-2.5', light ? 'text-paper' : 'text-ink')}>
    <span
      className={cn(
        'relative grid h-8 w-8 place-items-center rounded-[10px]',
        light ? 'bg-paper text-ink' : 'bg-ink text-lime'
      )}
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="7.2" stroke="currentColor" strokeWidth="1.6" opacity="0.55" />
        <circle cx="12" cy="12" r="3.2" fill="currentColor" />
        <path d="M12 1.5v3.2M12 19.3v3.2M1.5 12h3.2M19.3 12h3.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
      </svg>
    </span>
    {!compact && (
      <span className="leading-none">
        <span className="block text-[10px] font-medium uppercase tracking-[0.16em] opacity-55">Man Matters</span>
        <span className="mt-0.5 block font-display text-[19px] leading-none tracking-tight">Companion</span>
      </span>
    )}
  </div>
);

/* --------------------------------- Buttons -------------------------------- */

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'lime' | 'ghost' | 'quiet';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
};

export const Btn = forwardRef<HTMLButtonElement, BtnProps>(function Btn(
  { variant = 'primary', size = 'md', loading, icon, className, children, disabled, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        variant === 'primary' && 'btn-primary',
        variant === 'lime' && 'btn-lime',
        variant === 'ghost' && 'btn-ghost',
        variant === 'quiet' && 'btn-quiet',
        size === 'sm' && 'px-3.5 py-1.5 text-xs',
        size === 'lg' && 'px-7 py-3.5 text-sm',
        className
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
});

/* --------------------------------- Surfaces ------------------------------- */

export const Card = ({
  className,
  children,
  as: Tag = 'div',
  ...rest
}: { className?: string; children: ReactNode; as?: any } & Record<string, any>) => (
  <Tag className={cn('card', className)} {...rest}>
    {children}
  </Tag>
);

export const SectionLabel = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('eyebrow', className)}>{children}</div>
);

export const Divider = ({ className }: { className?: string }) => <div className={cn('hairline', className)} />;

export const Chip = ({ children, tone = 'default', className }: { children: ReactNode; tone?: 'default' | 'lime' | 'ink' | 'warn' | 'danger'; className?: string }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium',
      tone === 'default' && 'border border-line bg-white/70 text-ink/70',
      tone === 'lime' && 'bg-lime/60 text-forest',
      tone === 'ink' && 'bg-ink text-paper',
      tone === 'warn' && 'bg-amber/10 text-amber',
      tone === 'danger' && 'bg-danger/10 text-danger',
      className
    )}
  >
    {children}
  </span>
);

/* ---------------------------------- Forms --------------------------------- */

export const Field = ({ label, hint, children, className }: { label?: string; hint?: string; children: ReactNode; className?: string }) => (
  <label className={cn('block', className)}>
    {label && <span className="field-label">{label}</span>}
    {children}
    {hint && <span className="mt-1.5 block text-[11.5px] leading-relaxed text-muted">{hint}</span>}
  </label>
);

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cn('field', className)} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={cn('field min-h-[92px] resize-y', className)} {...rest} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...rest }, ref) {
  return (
    <select ref={ref} className={cn('field appearance-none pr-9', className)} {...rest}>
      {children}
    </select>
  );
});

export const CheckBox = ({ checked, onChange, label, sub, disabled }: { checked: boolean; onChange: () => void; label: ReactNode; sub?: ReactNode; disabled?: boolean }) => (
  <button
    type="button"
    onClick={onChange}
    disabled={disabled}
    className={cn('toggle-row group', checked && 'border-forest/30 bg-forest/[0.045]', disabled && 'cursor-not-allowed opacity-60')}
  >
    <span
      className={cn(
        'grid h-5 w-5 shrink-0 place-items-center rounded-md border transition',
        checked ? 'border-forest bg-forest text-lime' : 'border-ink/20 bg-white group-hover:border-ink/40'
      )}
    >
      {checked && <Check className="h-3 w-3" strokeWidth={3} />}
    </span>
    <span className="min-w-0 flex-1">
      <span className={cn('block truncate text-[13.5px] font-medium', checked && 'text-forest')}>{label}</span>
      {sub && <span className="mt-0.5 block truncate text-[11.5px] text-muted">{sub}</span>}
    </span>
  </button>
);

/* --------------------------------- Feedback ------------------------------- */

export const Spinner = ({ className }: { className?: string }) => <Loader2 className={cn('h-4 w-4 animate-spin', className)} />;

export const Skeleton = ({ className }: { className?: string }) => <div className={cn('skeleton', className)} />;

export const Empty = ({ title, body, action }: { title: string; body?: string; action?: ReactNode }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line px-6 py-14 text-center">
    <p className="font-display text-2xl tracking-tight">{title}</p>
    {body && <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-muted">{body}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

/* ---------------------------------- Modal --------------------------------- */

export const Modal = ({
  open,
  onClose,
  title,
  children,
  width = 'max-w-lg'
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  width?: string;
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-ink/45 backdrop-blur-[3px] animate-fade-in" onClick={onClose} />
      <div
        className={cn(
          'relative w-full animate-fade-up rounded-t-3xl border border-line bg-chalk p-5 shadow-lift sm:rounded-3xl sm:p-6',
          width
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          {title && <div className="font-display text-2xl leading-tight tracking-tight">{title}</div>}
          <button onClick={onClose} className="rounded-full p-1.5 text-muted transition hover:bg-ink/5 hover:text-ink" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
};

/* ---------------------------------- Ring ---------------------------------- */

export const Ring = ({
  value,
  size = 128,
  stroke = 9,
  label,
  sub,
  tone = 'lime',
  track = 'rgba(11,12,14,0.08)'
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: ReactNode;
  sub?: ReactNode;
  tone?: string;
  track?: string;
}) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-display text-[clamp(1.5rem,4vw,2.1rem)] leading-none tracking-tight">{label ?? `${Math.round(value)}%`}</div>
          {sub && <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted">{sub}</div>}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------- Utilities ------------------------------- */

export const Meter = ({ value, tone = 'bg-forest', className }: { value: number; tone?: string; className?: string }) => (
  <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-ink/[0.07]', className)}>
    <div className={cn('h-full rounded-full transition-all duration-700', tone)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
);

export const StatTile = ({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: string }) => (
  <div className="rounded-xl border border-line bg-white/50 p-3.5">
    <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted">{label}</div>
    <div className={cn('mt-1.5 font-display text-2xl leading-none tracking-tight', tone)}>{value}</div>
    {sub && <div className="mt-1 text-[11px] text-muted">{sub}</div>}
  </div>
);

export const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={cn('relative h-6 w-11 rounded-full transition', checked ? 'bg-forest' : 'bg-ink/15')}
    aria-label={label}
    aria-pressed={checked}
  >
    <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
  </button>
);
