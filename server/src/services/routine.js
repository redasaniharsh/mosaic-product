import { db } from '../db.js';
import { uid, nowIso, today, addDays, weekOf, clamp } from '../util.js';

const DAY_INDEX = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };

export const cadenceMeta = {
  daily: { label: 'Every day', perWeek: 7, days: [0, 1, 2, 3, 4, 5, 6] },
  '5x_week': { label: '5 days a week', perWeek: 5, days: [1, 2, 3, 4, 5] },
  '3x_week': { label: '3 days a week', perWeek: 3, days: [1, 3, 5] },
  '2x_week': { label: '2 days a week', perWeek: 2, days: [2, 6] },
  weekly: { label: 'Once a week', perWeek: 1, days: [0] },
  as_needed: { label: 'As needed', perWeek: 0, days: [] }
};

export const isScheduledToday = (item, dateStr) => {
  const meta = cadenceMeta[item.cadence] || cadenceMeta.daily;
  if (item.cadence === 'as_needed') return false;
  return meta.days.includes(new Date(`${dateStr}T12:00:00`).getDay());
};

const draftFor = (answers) => {
  const concerns = new Set([answers.concern, ...(answers.concerns || [])].filter(Boolean));
  const budget = answers.budget || 'balanced';
  const items = [];
  const add = (slug, phase, overrides = {}) => {
    if (items.some((i) => i.slug === slug)) return;
    const p = db.get('SELECT * FROM products WHERE slug = ?', slug);
    if (!p) return;
    items.push({
      slug,
      name: p.name,
      step: overrides.step ?? p.step,
      timeOfDay: overrides.timeOfDay ?? p.time_of_day,
      cadence: overrides.cadence ?? p.cadence,
      phase,
      weekStart: overrides.weekStart ?? (phase === 1 ? 1 : phase === 2 ? 5 : 9),
      instructions: overrides.instructions ?? p.instructions,
      optional: overrides.optional ?? 0,
      dose: overrides.dose ?? defaultDose(p.form, p.size)
    });
  };

  const hair = ['hair_fall', 'thinning', 'receding_hairline', 'dandruff', 'oily_scalp'].some((c) => concerns.has(c));
  const beard = ['beard_patchy', 'beard_itch'].some((c) => concerns.has(c));
  const skin = ['skin_glow', 'acne', 'pigmentation', 'dark_circles', 'dull_skin', 'acne_marks', 'oily_skin', 'tired_face'].some((c) => concerns.has(c));
  const energy = ['low_energy', 'low_libido', 'poor_recovery', 'sleep'].some((c) => concerns.has(c));
  const weight = ['weight', 'belly_fat'].some((c) => concerns.has(c));
  const intimate = concerns.has('intimate_wellness');

  if (hair) {
    add('anti-hairfall-shampoo', 1, { step: 1, timeOfDay: 'AM' });
    add('advanced-hair-growth-serum', 1, { step: 3, timeOfDay: 'PM' });
    add('biotin-gummies', 1, { step: 2, timeOfDay: 'AM' });
    if (budget !== 'lean' || answers.reportDeficiency) {
      add('hair-health-tablets', 2, { step: 2, timeOfDay: 'AM' });
    }
    if (budget === 'premium' && (concerns.has('thinning') || concerns.has('receding_hairline'))) {
      add('clock-cap', 3, { cadence: '3x_week', optional: 1, step: 4, timeOfDay: 'PM' });
    }
  }
  if (beard) {
    add('beard-growth-oil', 1, { step: 3, timeOfDay: 'PM' });
    if (answers.beardType !== 'full') add('beard-growth-roller', 2, { step: 2, timeOfDay: 'PM', cadence: '2x_week' });
    add('biotin-gummies', 1, { step: 2, timeOfDay: 'AM' });
  }
  if (skin) {
    if (concerns.has('acne') || concerns.has('oily_skin') || concerns.has('acne_marks')) {
      add('acne-control-serum', 1, { step: 3, timeOfDay: 'PM', cadence: '5x_week' });
    }
    if (concerns.has('skin_glow') || concerns.has('pigmentation') || concerns.has('dull_skin')) {
      add('vitamin-c-serum', 1, { step: 2, timeOfDay: 'AM' });
    }
    if (concerns.has('dark_circles') || concerns.has('tired_face')) {
      add('under-eye-cream', 2, { step: 3, timeOfDay: 'AM' });
    }
  }
  if (energy) add('testosterone-booster', 2, { step: 2, timeOfDay: 'PM' });
  if (intimate) add('delay-spray', 1, { step: 1, timeOfDay: 'PM', cadence: 'as_needed', optional: 1 });
  if (weight) add('weight-loss-program', 1, { step: 1, timeOfDay: 'AM' });

  if (items.length === 0) {
    add('anti-hairfall-shampoo', 1, { step: 1, timeOfDay: 'AM' });
    add('advanced-hair-growth-serum', 1, { step: 3, timeOfDay: 'PM' });
    add('biotin-gummies', 1, { step: 2, timeOfDay: 'AM' });
  }

  return { items, concerns: [...concerns], hair, beard, skin, energy, weight, intimate };
};

const defaultDose = (form, size) => {
  switch (form) {
    case 'serum':
      return '5–6 drops · one bottle ≈ 6 weeks';
    case 'oil':
      return '4–5 drops · one bottle ≈ 8 weeks';
    case 'wash':
      return 'Coin-sized amount · one bottle ≈ 8 weeks';
    case 'gummy':
    case 'tablet':
      return '1 serving daily · 30-day pack';
    case 'spray':
      return '2 sprays, 10 min before · 20 ml ≈ 30 uses';
    case 'device':
      return '20 min, 3× per week';
    case 'program':
      return 'Daily log + weekly coach call';
    default:
      return size || '';
  }
};

const guardrailsFor = (answers) => {
  const g = [];
  g.push({
    title: 'Never miss twice',
    body: 'One missed day is noise. Two is a pattern. If you miss today, the only goal tomorrow is the next dose.'
  });
  if (answers.sleepHours < 7) {
    g.push({
      title: 'Sleep is part of the stack',
      body: `You reported ${answers.sleepHours}h. Below 7h raises cortisol, which works directly against follicle recovery. Treat lights-out as a step, not a bonus.`
    });
  }
  if (Number(answers.stress) >= 4) {
    g.push({
      title: 'Stress shows up on the scalp',
      body: 'High reported stress accelerates the telogen (shedding) phase. The 20-minute walk below is a hair intervention, not a wellness slogan.'
    });
  }
  g.push({
    title: 'Protein at two meals',
    body: 'Hair is keratin. If your daily protein is under ~1g per kg of body weight, no serum can compensate for the raw material.'
  });
  return g;
};

/**
 * Creates a 13-week routine. The rule engine owns safety (what to use, when to
 * introduce it). Gemini only writes the narrative layer, in `enrichPlan`.
 */
export const buildRoutine = ({ userId, answers, narrative }) => {
  const draft = draftFor(answers);
  const startDate = today();
  const routineId = uid('rt');
  const headline =
    narrative?.headline ||
    `Your 13-week ${draft.beard && !draft.hair ? 'beard' : draft.skin && !draft.hair ? 'skin' : 'hair'} protocol`;
  const rationale =
    narrative?.summary ||
    'Built around the 12-week growth cycle: foundation first, then consistency, then evidence. Products are introduced in phases so you can tell what is working.';

  return tx(() => {
    db.run('UPDATE routines SET active = 0 WHERE user_id = ?', userId);
    db.run(
      'INSERT INTO routines (id, user_id, version, start_date, duration_days, headline, rationale, active, created_at) VALUES (?,?,?,?,?,?,?,1,?)',
      routineId,
      userId,
      (db.get('SELECT COUNT(*) c FROM routines WHERE user_id = ?', userId)?.c || 0) + 1,
      startDate,
      91,
      headline,
      rationale,
      nowIso()
    );
    draft.items.forEach((item, index) => {
      db.run(
        `INSERT INTO routine_items (id, routine_id, user_id, product_slug, name, step, time_of_day, cadence, week_start, week_end, phase, instructions, optional, active)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1)`,
        uid('ri'),
        routineId,
        userId,
        item.slug,
        item.name,
        item.step,
        item.timeOfDay,
        item.cadence,
        item.weekStart,
        13,
        item.phase,
        item.instructions,
        item.optional
      );
      index;
    });
    return routineId;
  });
};

export const activeRoutine = (userId) =>
  db.get('SELECT * FROM routines WHERE user_id = ? AND active = 1 ORDER BY created_at DESC LIMIT 1', userId);

export const routineItems = (userId, week) => {
  const rows = db.all(
    'SELECT * FROM routine_items WHERE user_id = ? AND active = 1 ORDER BY step ASC, name ASC',
    userId
  );
  return rows
    .filter((r) => r.week_start <= week)
    .map((r) => ({ ...r, optional: Boolean(r.optional), dose: doseFor(r.product_slug) }));
};

const doseFor = (slug) => {
  const p = db.get('SELECT form, size FROM products WHERE slug = ?', slug);
  return p ? defaultDose(p.form, p.size) : '';
};

export const planItemsForWeek = (userId, week) => routineItems(userId, week);

export const scheduleForDate = (userId, dateStr, startDate) => {
  const week = weekOf(startDate, dateStr);
  return routineItems(userId, week).filter((item) => isScheduledToday(item, dateStr));
};

export const weekProgress = (userId, startDate, week) => {
  const weekStart = addDays(startDate, (week - 1) * 7);
  const days = [];
  let expected = 0;
  let done = 0;
  for (let i = 0; i < 7; i += 1) {
    const date = addDays(weekStart, i);
    if (date > today()) break;
    const scheduled = scheduleForDate(userId, date, startDate);
    const checkin = db.get('SELECT * FROM checkins WHERE user_id = ? AND date = ?', userId, date);
    const taken = checkin ? parse(checkin.taken, []) : [];
    const completed = scheduled.filter((s) => taken.includes(s.id)).length;
    expected += scheduled.length;
    done += completed;
    days.push({ date, expected: scheduled.length, done: completed, logged: Boolean(checkin) });
  }
  return { week, days, expected, done, adherence: expected ? Math.round((done / expected) * 100) : 0 };
};

export const rebalanceRoutine = (userId) => {
  const routine = activeRoutine(userId);
  if (!routine) return null;
  const week = Math.min(13, weekOf(routine.start_date, today()));
  const items = routineItems(userId, week);
  return { routine, week, items };
};

export const phaseForWeek = (week) => {
  if (week <= 4) return 1;
  if (week <= 8) return 2;
  return 3;
};

export const adherenceWindow = (userId, startDate, days) => {
  const end = today();
  return adherenceRange(userId, startDate, addDays(end, -(days - 1)), end);
};

export const adherenceRange = (userId, startDate, from, to) => {
  const rows = db.all(
    `SELECT date, taken FROM checkins WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date ASC`,
    userId,
    from,
    to
  );
  const byDate = new Map(rows.map((r) => [r.date, parse(r.taken, [])]));
  let expected = 0;
  let done = 0;
  for (let date = from; date <= to; date = addDays(date, 1)) {
    if (date < startDate || date > today()) continue;
    const scheduled = scheduleForDate(userId, date, startDate);
    if (!scheduled.length) continue;
    const taken = byDate.db.get(date) || [];
    expected += scheduled.length;
    done += scheduled.filter((s) => taken.includes(s.id)).length;
  }
  return { expected, done, adherence: expected ? clamp(Math.round((done / expected) * 100), 0, 100) : 0 };
};
