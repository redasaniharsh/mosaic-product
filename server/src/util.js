import crypto from 'node:crypto';

export const uid = (prefix = 'id') => `${prefix}_${crypto.randomBytes(9).toString('hex')}`;

export const nowIso = () => new Date().toISOString();

/** Local-date YYYY-MM-DD (not UTC — a check-in at 11pm IST belongs to today). */
export const today = (d = new Date()) => {
  const copy = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return copy.toISOString().slice(0, 10);
};

export const addDays = (dateStr, days) => {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + days);
  return today(d);
};

export const diffDays = (a, b) => {
  const ms = new Date(`${a}T12:00:00`) - new Date(`${b}T12:00:00`);
  return Math.round(ms / 86400000);
};

export const weekOf = (startDate, dateStr) => Math.max(1, Math.floor(diffDays(dateStr, startDate) / 7) + 1);

/** ISO-ish week key used for weekly AI reviews (year-week). */
export const isoWeek = (dateStr) => {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
};

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export const pct = (n, d) => (d === 0 ? 0 : Math.round((n / d) * 100));

export const safeInt = (v) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : null);
