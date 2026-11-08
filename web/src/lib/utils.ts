import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export const compact = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(n);
};

export const prettyDate = (d: string | Date, opts?: Intl.DateTimeFormatOptions) =>
  new Date(`${typeof d === 'string' ? d : d.toISOString().slice(0, 10)}T12:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    ...opts
  });

export const weekday = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'short' });

export const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export const pctLabel = (n?: number | null) => (n == null ? '—' : `${Math.round(n)}%`);

export const cadenceLabel = (c: string) =>
  ({
    daily: 'Daily',
    '5x_week': '5× / week',
    '3x_week': '3× / week',
    '2x_week': '2× / week',
    weekly: 'Weekly',
    as_needed: 'As needed'
  })[c] || c;

export const toneClasses = (tone: string) =>
  ({
    good: 'tone-good',
    warn: 'tone-warn',
    clinical: 'tone-clinical',
    neutral: 'tone-neutral'
  })[tone] || 'tone-neutral';

export const toneDot = (tone: string) =>
  ({ good: 'bg-forest', warn: 'bg-amber', clinical: 'bg-danger', neutral: 'bg-muted' })[tone] || 'bg-muted';

export const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');

export const scoreBand = (score: number) => {
  if (score >= 80) return { label: 'Compounding', tone: 'good' as const };
  if (score >= 60) return { label: 'Holding', tone: 'good' as const };
  if (score >= 40) return { label: 'Fragile', tone: 'warn' as const };
  return { label: 'At risk', tone: 'clinical' as const };
};

export const downloadJson = (data: unknown, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
