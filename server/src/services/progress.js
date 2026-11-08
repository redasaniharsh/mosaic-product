import { get, all, parse } from '../db.js';
import { today, addDays, diffDays, weekOf, clamp, pct } from '../util.js';
import { activeRoutine, scheduleForDate, routineItems, phaseForWeek, adherenceWindow, adherenceRange, cadenceMeta } from './routine.js';
import { PHASES } from '../data/products.js';

const PACK_WEEKS = { serum: 6, oil: 8, wash: 8, gummy: 4.3, tablet: 4.3, spray: 6, device: 999, program: 13 };

const sum = (arr) => arr.reduce((a, b) => a + b, 0);
const avg = (arr) => (arr.length ? sum(arr) / arr.length : 0);

const checkinMap = (userId, from, to) => {
  const rows = all(
    'SELECT * FROM checkins WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date ASC',
    userId,
    from,
    to
  );
  return new Map(
    rows.map((r) => [
      r.date,
      {
        ...r,
        taken: parse(r.taken, []),
        mood: r.mood || null
      }
    ])
  );
};

export const progressScore = (user, routine) => {
  if (!routine) return { score: 0, parts: [] };
  const a30 = adherenceWindow(user.id, routine.start_date, 30);
  const last7 = checkinMap(user.id, addDays(today(), -6), today());
  const loggedDays = last7.size;
  const photos = all(
    'SELECT * FROM photos WHERE user_id = ? AND date >= ?',
    user.id,
    addDays(today(), -28)
  );
  const sleepAvg = avg([...last7.values()].map((c) => c.sleep_hours).filter(Boolean));

  const parts = [
    { key: 'adherence', label: 'Routine adherence', weight: 45, value: a30.adherence },
    { key: 'logging', label: 'Daily check-ins', weight: 20, value: pct(loggedDays, 7) },
    { key: 'photos', label: 'Progress photos', weight: 15, value: pct(photos.length, 4) },
    { key: 'sleep', label: 'Sleep (7h target)', weight: 10, value: sleepAvg ? clamp(Math.round((sleepAvg / 7) * 100), 0, 100) : 0 },
    {
      key: 'consistency',
      label: 'Weekly cadence items',
      weight: 10,
      value: (() => {
        const weekly = routineItems(user.id, weekOf(routine.start_date, today())).filter((i) => i.cadence !== 'daily' && i.cadence !== 'as_needed');
        if (!weekly.length) return 100;
        const taken = new Set(all('SELECT taken FROM checkins WHERE user_id = ? AND date >= ?', user.id, addDays(today(), -6)).flatMap((r) => parse(r.taken, [])));
        const done = weekly.filter((w) => taken.has(w.id)).length;
        return pct(done, weekly.length);
      })()
    }
  ];
  const score = Math.round(sum(parts.map((p) => (p.value * p.weight) / 100)));
  return { score: clamp(score, 0, 100), parts };
};

export const streakInfo = (userId) => {
  const rows = all('SELECT date, taken FROM checkins WHERE user_id = ? ORDER BY date DESC LIMIT 400', userId);
  const byDate = new Map(rows.map((r) => [r.date, parse(r.taken, [])]));
  let streak = 0;
  let cursor = today();
  if (!byDate.has(cursor)) cursor = addDays(cursor, -1);
  while (byDate.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  let best = 0;
  let run = 0;
  let prev = null;
  [...byDate.keys()].sort().forEach((d) => {
    run = prev && diffDays(d, prev) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  });
  return { current: streak, best };
};

export const buildOverview = (user) => {
  const routine = activeRoutine(user.id);
  if (!routine) {
    return { onboarded: Boolean(user.onboarded), routine: null };
  }
  const week = clamp(weekOf(routine.start_date, today()), 1, 13);
  const day = diffDays(today(), routine.start_date) + 1;
  const scheduled = scheduleForDate(user.id, today(), routine.start_date);
  const todayCheckin = get('SELECT * FROM checkins WHERE user_id = ? AND date = ?', user.id, today());
  const taken = todayCheckin ? parse(todayCheckin.taken, []) : [];
  const todayItems = scheduled.map((item) => ({ ...item, done: taken.includes(item.id) }));
  const a7 = adherenceWindow(user.id, routine.start_date, 7);
  const a30 = adherenceWindow(user.id, routine.start_date, 30);
  const aAll = adherenceWindow(user.id, routine.start_date, 400);
  const score = progressScore(user, routine);
  const photos = all('SELECT id, date, week, angle, data_url, lighting, notes FROM photos WHERE user_id = ? ORDER BY date DESC LIMIT 24', user.id);
  const phase = PHASES[phaseForWeek(week) - 1];
  const items = routineItems(user.id, week);

  const refills = items
    .filter((i) => (PACK_WEEKS[productForm(i.product_slug)] || 99) < 30)
    .map((i) => {
      const perWeek = (cadenceMeta[i.cadence] || cadenceMeta.daily).perWeek;
      const packWeeks = PACK_WEEKS[productForm(i.product_slug)] || 6;
      const daysLeft = Math.round(packWeeks * 7 * (a7.adherence / 100 || 0.7));
      return { slug: i.product_slug, name: i.name, daysLeft };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 3);

  return {
    onboarded: Boolean(user.onboarded),
    user: {
      name: user.name,
      goal: user.goal,
      concern: user.concern,
      city: user.city
    },
    routine: {
      id: routine.id,
      headline: routine.headline,
      rationale: routine.rationale,
      startDate: routine.start_date,
      durationDays: routine.duration_days,
      week,
      day: clamp(day, 1, 91),
      phase: { ...phase, index: phaseForWeek(week) },
      items
    },
    today: {
      date: today(),
      items: todayItems,
      doneCount: todayItems.filter((i) => i.done).length,
      total: todayItems.length,
      completed: todayItems.length > 0 && todayItems.every((i) => i.done),
      checkin: todayCheckin
        ? {
            hairFall: todayCheckin.hair_fall,
            sleepHours: todayCheckin.sleep_hours,
            water: todayCheckin.water,
            stress: todayCheckin.stress,
            mood: todayCheckin.mood,
            notes: todayCheckin.notes
          }
        : null
    },
    stats: {
      adherence7: a7.adherence,
      adherence30: a30.adherence,
      adherenceAll: aAll.adherence,
      streak: streakInfo(user.id),
      score,
      refills,
      photoCount: photos.length,
      lastPhoto: photos[0] ? photos[0].date : null
    },
    photos
  };
};

const productForm = (slug) => get('SELECT form FROM products WHERE slug = ?', slug)?.form || 'serum';

export const buildSeries = (userId, days = 30) => {
  const routine = activeRoutine(userId);
  if (!routine) return [];
  const end = today();
  const windowStart = addDays(end, -(days - 1));
  // Never chart days before the plan existed — they are not "missed doses".
  const start = windowStart < routine.start_date ? routine.start_date : windowStart;
  const span = diffDays(end, start) + 1;
  const map = checkinMap(userId, start, end);
  const out = [];
  for (let i = 0; i < span; i += 1) {
    const date = addDays(start, i);
    const scheduled = scheduleForDate(userId, date, routine.start_date);
    const checkin = map.get(date);
    const taken = checkin?.taken || [];
    const done = scheduled.filter((s) => taken.includes(s.id)).length;
    out.push({
      date,
      label: date.slice(5),
      adherence: scheduled.length ? Math.round((done / scheduled.length) * 100) : null,
      hairFall: checkin?.hair_fall ?? null,
      sleep: checkin?.sleep_hours ?? null,
      stress: checkin?.stress ?? null,
      logged: Boolean(checkin),
      expected: scheduled.length,
      done
    });
  }
  return out;
};

export const buildHeatmap = (userId, days = 91) => {
  const routine = activeRoutine(userId);
  if (!routine) return [];
  const end = today();
  // The map is the plan's 13-week cycle, not the last 91 calendar days.
  const start = routine.start_date;
  const map = checkinMap(userId, start, end);
  const cells = [];
  for (let i = 0; i < days; i += 1) {
    const date = addDays(start, i);
    const scheduled = scheduleForDate(userId, date, routine.start_date);
    const taken = map.get(date)?.taken || [];
    const done = scheduled.filter((s) => taken.includes(s.id)).length;
    const ratio = scheduled.length ? done / scheduled.length : 0;
    const level = !map.get(date) ? -1 : ratio === 1 ? 4 : ratio >= 0.66 ? 3 : ratio >= 0.33 ? 2 : ratio > 0 ? 1 : 0;
    cells.push({ date, level, done, expected: scheduled.length, future: date > today() });
  }
  return cells;
};

export const buildWeeks = (userId) => {
  const routine = activeRoutine(userId);
  if (!routine) return [];
  const current = clamp(weekOf(routine.start_date, today()), 1, 13);
  const weeks = [];
  for (let w = 1; w <= 13; w += 1) {
    const start = addDays(routine.start_date, (w - 1) * 7);
    const end = addDays(start, 6);
    const map = checkinMap(userId, start > today() ? start : start, end > today() ? today() : end);
    let expected = 0;
    let done = 0;
    for (const [, c] of map) {
      const scheduled = scheduleForDate(userId, c.date, routine.start_date);
      expected += scheduled.length;
      done += scheduled.filter((s) => c.taken.includes(s.id)).length;
    }
    const fallVals = [...map.values()].map((c) => c.hair_fall).filter((v) => v != null);
    weeks.push({
      week: w,
      start,
      end,
      phase: phaseForWeek(w),
      state: w < current ? 'past' : w === current ? 'current' : 'upcoming',
      adherence: expected ? Math.round((done / expected) * 100) : null,
      hairFall: fallVals.length ? Math.round(avg(fallVals)) : null,
      logged: map.size,
      photos: get('SELECT COUNT(*) c FROM photos WHERE user_id = ? AND week = ?', userId, w)?.c || 0
    });
  }
  return weeks;
};

/**
 * Signal engine. Every card on the dashboard comes from a rule evaluated
 * against this user's own data — nothing is written into the UI by hand.
 */
export const buildSignals = (user) => {
  const routine = activeRoutine(user.id);
  if (!routine) return [];
  const week = clamp(weekOf(routine.start_date, today()), 1, 13);
  const a7 = adherenceWindow(user.id, routine.start_date, 7);
  const thisWeek = adherenceRange(user.id, routine.start_date, addDays(today(), -6), today());
  const lastWeek = adherenceRange(user.id, routine.start_date, addDays(today(), -13), addDays(today(), -7));
  const series = buildSeries(user.id, 14).filter((d) => d.logged);
  const signals = [];

  const trend = thisWeek.adherence - lastWeek.adherence;
  if (a7.adherence >= 80) {
    signals.push({
      id: 'adherence-strong',
      tone: 'good',
      title: `${a7.adherence}% this week — the habit is holding`,
      body: 'At this adherence you are in the top quartile of routines that reach week 12. The next lever is photo consistency, not more products.',
      action: { label: 'Take this week\'s photo', href: '/app/progress' }
    });
  } else if (a7.adherence < 50) {
    signals.push({
      id: 'adherence-low',
      tone: 'warn',
      title: `You hit ${a7.adherence}% this week`,
      body: 'Missing more than half the doses is the single strongest predictor of quitting by week 8. Shrink the routine: do the serum only, at the same time as brushing your teeth.',
      action: { label: 'Rebuild a smaller routine', href: '/app/routine' }
    });
  } else {
    signals.push({
      id: 'adherence-mid',
      tone: 'neutral',
      title: `${a7.adherence}% adherence — one step from the safe zone`,
      body: '70% is the threshold where week-12 results stop being luck. You are close. Pick one anchor time and stack the serum onto it.',
      action: { label: 'See today\'s plan', href: '/app/routine' }
    });
  }

  if (trend < -12) {
    signals.push({
      id: 'trend-down',
      tone: 'warn',
      title: 'Your routine slipped this week',
      body: `Down ${Math.abs(trend)} points from last week. This is the exact pattern we saw in the customer conversations — the drop usually happens before the quit, not after.`,
      action: { label: 'Talk it through', href: '/app/assistant' }
    });
  }

  if (week >= 2 && week <= 4) {
    signals.push({
      id: 'shedding-window',
      tone: 'good',
      title: 'You are in the shedding window (weeks 2–4)',
      body: 'More strands now means resting hairs are cycling out to make room for the new growth phase. This is expected, not a reaction. Stopping here is the most common mistake.',
      action: { label: 'Why this happens', href: '/app/science' }
    });
  }

  if (week >= 9) {
    signals.push({
      id: 'evidence-window',
      tone: 'good',
      title: 'Evidence window open',
      body: 'Density change becomes photographable from week 9. Compare the same angle, same light, same hair length — or the comparison will lie to you.',
      action: { label: 'Compare photos', href: '/app/progress' }
    });
  }

  const lastPhoto = get('SELECT date FROM photos WHERE user_id = ? ORDER BY date DESC LIMIT 1', user.id);
  if (!lastPhoto || diffDays(today(), lastPhoto.date) >= 10) {
    signals.push({
      id: 'photo-due',
      tone: 'neutral',
      title: lastPhoto ? `Last photo: ${diffDays(today(), lastPhoto.date)} days ago` : 'No baseline photo yet',
      body: 'Memory is a biased instrument — it under-reports change and over-reports loss. A standardised photo every 10 days is what makes week 12 judgeable.',
      action: { label: 'Capture baseline', href: '/app/progress' }
    });
  }

  if (series.length >= 4) {
    const fall = series.map((d) => d.hairFall).filter((v) => v != null);
    if (fall.length >= 4) {
      const recent = avg(fall.slice(-2));
      const earlier = avg(fall.slice(0, 2));
      if (recent > earlier * 1.3) {
        signals.push({
          id: 'hairfall-up',
          tone: 'clinical',
          title: 'Logged hair fall is trending up',
          body: `Your last two logged washes averaged ${Math.round(recent)} strands vs ${Math.round(earlier)} earlier. In weeks 2–4 this is expected. After week 8, it is worth a doctor review rather than a new product.`,
          action: { label: 'Request a review', href: '/app/assistant' }
        });
      } else if (recent < earlier * 0.85) {
        signals.push({
          id: 'hairfall-down',
          tone: 'good',
          title: 'Logged hair fall is coming down',
          body: `Down from ${Math.round(earlier)} to ${Math.round(recent)} strands per wash. Keep the routine identical for two more weeks before changing anything.`,
          action: { label: 'See the trend', href: '/app/progress' }
        });
      }
    }
  }

  const sleepAvg = avg(series.map((d) => d.sleep).filter(Boolean));
  if (sleepAvg && sleepAvg < 6.5) {
    signals.push({
      id: 'sleep-low',
      tone: 'neutral',
      title: `Sleep is averaging ${sleepAvg.toFixed(1)}h`,
      body: 'Below 7h, cortisol rises and the follicle repair window shrinks. This shows up in the data before it shows up in the mirror.',
      action: { label: 'Add a wind-down', href: '/app/routine' }
    });
  }

  return signals.slice(0, 4);
};

export const buildRefillPlan = (user) => {
  const routine = activeRoutine(user.id);
  if (!routine) return [];
  return routineItems(user.id, 13)
    .filter((i) => (PACK_WEEKS[productForm(i.product_slug)] || 99) < 30)
    .map((i) => {
      const packWeeks = PACK_WEEKS[productForm(i.product_slug)] || 6;
      return {
        slug: i.product_slug,
        name: i.name,
        packWeeks,
        perWeek: (cadenceMeta[i.cadence] || cadenceMeta.daily).perWeek,
        monthlyCost: Math.round(((get('SELECT price FROM products WHERE slug = ?', i.product_slug)?.price || 0) * 4.3) / packWeeks)
      };
    });
};

export const monthlySpend = (user) => {
  const items = buildRefillPlan(user);
  const total = sum(items.map((i) => i.monthlyCost));
  return { items, total };
};
