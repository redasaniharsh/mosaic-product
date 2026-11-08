import express from 'express';
import { z } from 'zod';
import { get, all, run, parse } from '../db.js';
import { uid, nowIso, today, addDays, weekOf, clamp } from '../util.js';
import { requireAuth } from '../auth.js';
import { buildRoutine, activeRoutine, routineItems, phaseForWeek, adherenceWindow, scheduleForDate } from '../services/routine.js';
import {
  buildOverview,
  buildSeries,
  buildHeatmap,
  buildWeeks,
  buildSignals,
  progressScore,
  monthlySpend,
  buildRefillPlan
} from '../services/progress.js';
import { narratePlan, aiEnabled } from '../services/ai.js';
import { PHASES } from '../data/products.js';

export const appRouter = express.Router();

const answersSchema = z
  .object({
    goal: z.string().min(2).max(40),
    concern: z.string().min(2).max(60),
    concerns: z.array(z.string().max(60)).max(12).optional(),
    age: z.coerce.number().int().min(13).max(100).optional(),
    hairType: z.string().max(40).optional(),
    scalp: z.string().max(40).optional(),
    beardType: z.string().max(40).optional(),
    skinType: z.string().max(40).optional(),
    sleepHours: z.coerce.number().min(0).max(16).optional(),
    stress: z.coerce.number().min(1).max(5).optional(),
    diet: z.string().max(40).optional(),
    budget: z.enum(['lean', 'balanced', 'premium']).optional(),
    routineTime: z.string().max(40).optional(),
    durationOfConcern: z.string().max(60).optional(),
    reportDeficiency: z.boolean().optional(),
    medications: z.string().max(300).optional(),
    city: z.string().max(80).optional()
  })
  .passthrough();

const guardrails = (answers) => {
  const out = [
    {
      title: 'Never miss twice',
      body: 'One missed day is noise. Two is a pattern. If today slips, tomorrow has exactly one goal: the next dose.'
    }
  ];
  if (Number(answers.sleepHours) < 7) {
    out.push({
      title: 'Sleep is part of the stack',
      body: `You reported ${answers.sleepHours}h. Under 7h, cortisol rises and the follicle repair window shrinks. Lights-out is a step, not a bonus.`
    });
  }
  if (Number(answers.stress) >= 4) {
    out.push({
      title: 'Stress lands on the scalp',
      body: 'High reported stress pushes more follicles into the shedding phase. The 20-minute walk is a hair intervention, not a wellness slogan.'
    });
  }
  out.push({
    title: 'Protein at two meals',
    body: 'Hair is keratin. If daily protein is under ~1g per kg of body weight, no serum can compensate for the missing raw material.'
  });
  return out;
};

appRouter.post('/onboarding', requireAuth, async (req, res) => {
  const parsed = answersSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Answer the assessment to continue.' });
  }
  const answers = parsed.data;
  const userId = req.user.id;

  const routineId = buildRoutine({ userId, answers });
  const items = routineItems(userId, 13).map((i) => ({
    name: i.name,
    cadence: i.cadence,
    time: i.time_of_day,
    phase: i.phase
  }));

  const narrative = await narratePlan({ answers, proposed: items });
  const plan = {
    headline: narrative?.headline || (answers.goal === 'beard' ? 'Your 13-week beard density protocol' : 'Your 13-week hair recovery protocol'),
    summary:
      narrative?.summary ||
      'Built around the 12-week growth cycle: foundation first, then consistency, then evidence. Products enter in phases so you can tell what is working.',
    focusAreas:
      narrative?.focusAreas ||
      [
        { title: 'Protect the follicle', body: 'A nightly topical plus a gentle cleanse is the base layer for density.' },
        { title: 'Feed the raw material', body: 'Biotin and protein cover the nutritional floor that topicals cannot fix.' },
        { title: 'Make it measurable', body: 'A photo every 10 days, same light and angle, is the only honest scoreboard.' }
      ],
    expectations:
      narrative?.expectations ||
      [
        'Weeks 1–4: scalp may shed more as resting hairs cycle out. This is expected.',
        'Weeks 5–8: shedding settles; adherence is the only variable that matters.',
        'Weeks 9–13: density change becomes photographable at the same angle and light.'
      ],
    watchFor:
      narrative?.watchFor ||
      [
        'Coin-sized bald patches or a painful, scaly scalp — book a doctor review.',
        'No change at all by week 12 — review the diagnosis, do not buy another serum.'
      ],
    guardrails: guardrails(answers),
    generatedBy: narrative?._provider || 'rules',
    generatedAt: nowIso()
  };

  run(
    'UPDATE users SET goal = ?, concern = ?, age = COALESCE(?, age), city = COALESCE(?, city), hair_type = COALESCE(?, hair_type), skin_type = COALESCE(?, skin_type), beard_type = COALESCE(?, beard_type), diet = COALESCE(?, diet), sleep_hours = COALESCE(?, sleep_hours), stress = COALESCE(?, stress), answers = ?, plan = ?, onboarded = 1 WHERE id = ?',
    answers.goal,
    answers.concern,
    answers.age || null,
    answers.city || null,
    answers.hairType || null,
    answers.skinType || null,
    answers.beardType || null,
    answers.diet || null,
    answers.sleepHours ?? null,
    answers.stress ?? null,
    JSON.stringify(answers),
    JSON.stringify(plan),
    userId
  );

  const routine = activeRoutine(userId);
  if (routine && narrative) {
    run('UPDATE routines SET headline = ?, rationale = ? WHERE id = ?', plan.headline, plan.summary, routineId);
  }
  run('INSERT INTO events (id, user_id, name, props, created_at) VALUES (?,?,?,?,?)', uid('ev'), userId, 'onboarding_complete', JSON.stringify({ goal: answers.goal, concern: answers.concern }), nowIso());

  res.json({ overview: buildOverview(get('SELECT * FROM users WHERE id = ?', userId)), plan, aiEnabled: aiEnabled() });
});

appRouter.get('/overview', requireAuth, (req, res) => {
  const user = get('SELECT * FROM users WHERE id = ?', req.user.id);
  const overview = buildOverview(user);
  if (!overview.routine) return res.json({ overview, signals: [], recent: [], insight: null });
  const week = overview.routine.week;
  const insight = get(
    "SELECT * FROM insights WHERE user_id = ? AND week = ? AND kind = 'weekly'",
    user.id,
    week
  );
  res.json({
    overview,
    signals: buildSignals(user),
    recent: buildSeries(user.id, 14),
    insight: insight
      ? { ...insight, actions: parse(insight.actions, []), cached: true }
      : null,
    spend: monthlySpend(user),
    plan: parse(user.plan, null)
  });
});

appRouter.get('/routine', requireAuth, (req, res) => {
  const user = req.user;
  const routine = activeRoutine(user.id);
  if (!routine) return res.json({ routine: null, items: [], weeks: [] });
  const week = clamp(weekOf(routine.start_date, today()), 1, 13);
  const phase = { ...PHASES[phaseForWeek(week) - 1], index: phaseForWeek(week) };
  res.json({
    routine: {
      id: routine.id,
      headline: routine.headline,
      rationale: routine.rationale,
      startDate: routine.start_date,
      durationDays: routine.duration_days,
      week,
      day: weekOf(routine.start_date, today()),
      phase
    },
    week,
    phase: { ...PHASES[phaseForWeek(week) - 1], index: phaseForWeek(week) },
    items: routineItems(user.id, week),
    allItems: routineItems(user.id, 13),
    weeks: buildWeeks(user.id),
    plan: parse(user.plan, null),
    todaySchedule: scheduleForDate(user.id, today(), routine.start_date)
  });
});

appRouter.post('/routine/items', requireAuth, (req, res) => {
  const { slug, cadence } = req.body || {};
  const product = get('SELECT * FROM products WHERE slug = ?', String(slug));
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  const routine = activeRoutine(req.user.id);
  if (!routine) return res.status(400).json({ error: 'Complete onboarding first.' });
  const existing = get(
    'SELECT * FROM routine_items WHERE user_id = ? AND product_slug = ? AND active = 1',
    req.user.id,
    slug
  );
  if (existing) return res.status(409).json({ error: `${product.name} is already in your routine.` });
  const week = clamp(weekOf(routine.start_date, today()), 1, 13);
  run(
    `INSERT INTO routine_items (id, routine_id, user_id, product_slug, name, step, time_of_day, cadence, week_start, week_end, phase, instructions, optional, active)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0,1)`,
    uid('ri'),
    routine.id,
    req.user.id,
    slug,
    product.name,
    product.step,
    product.time_of_day,
    cadence || product.cadence,
    week,
    13,
    phaseForWeek(week),
    product.instructions
  );
  res.status(201).json({ items: routineItems(req.user.id, week) });
});

appRouter.delete('/routine/items/:id', requireAuth, (req, res) => {
  const item = get('SELECT * FROM routine_items WHERE id = ? AND user_id = ?', req.params.id, req.user.id);
  if (!item) return res.status(404).json({ error: 'Item not found.' });
  run('UPDATE routine_items SET active = 0 WHERE id = ?', item.id);
  res.json({ ok: true });
});

const checkinSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  taken: z.array(z.string()).max(40).optional(),
  hairFall: z.coerce.number().int().min(0).max(2000).nullable().optional(),
  sleepHours: z.coerce.number().min(0).max(16).nullable().optional(),
  water: z.coerce.number().int().min(0).max(30).nullable().optional(),
  stress: z.coerce.number().int().min(1).max(5).nullable().optional(),
  mood: z.string().max(30).nullable().optional(),
  notes: z.string().max(600).nullable().optional()
});

appRouter.post('/checkins', requireAuth, (req, res) => {
  const parsed = checkinSchema.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid check-in.' });
  const data = parsed.data;
  const date = data.date || today();
  if (date > today()) return res.status(400).json({ error: 'You cannot log the future.' });
  const existing = get('SELECT * FROM checkins WHERE user_id = ? AND date = ?', req.user.id, date);
  const validIds = new Set(all('SELECT id FROM routine_items WHERE user_id = ?', req.user.id).map((r) => r.id));
  const taken = (data.taken || (existing ? parse(existing.taken, []) : [])).filter((id) => validIds.has(id));

  if (existing) {
    run(
      'UPDATE checkins SET taken = ?, hair_fall = COALESCE(?, hair_fall), sleep_hours = COALESCE(?, sleep_hours), water = COALESCE(?, water), stress = COALESCE(?, stress), mood = COALESCE(?, mood), notes = COALESCE(?, notes) WHERE id = ?',
      JSON.stringify(taken),
      data.hairFall ?? null,
      data.sleepHours ?? null,
      data.water ?? null,
      data.stress ?? null,
      data.mood ?? null,
      data.notes ?? null,
      existing.id
    );
  } else {
    run(
      'INSERT INTO checkins (id, user_id, date, taken, hair_fall, sleep_hours, water, stress, mood, notes, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      uid('chk'),
      req.user.id,
      date,
      JSON.stringify(taken),
      data.hairFall ?? null,
      data.sleepHours ?? null,
      data.water ?? null,
      data.stress ?? null,
      data.mood ?? null,
      data.notes ?? null,
      nowIso()
    );
  }
  run('INSERT INTO events (id, user_id, name, props, created_at) VALUES (?,?,?,?,?)', uid('ev'), req.user.id, 'checkin', JSON.stringify({ date }), nowIso());
  res.json({ ok: true, checkin: get('SELECT * FROM checkins WHERE user_id = ? AND date = ?', req.user.id, date) });
});

appRouter.post('/checkins/toggle', requireAuth, (req, res) => {
  const { itemId, date } = req.body || {};
  const targetDate = date || today();
  const item = get('SELECT * FROM routine_items WHERE id = ? AND user_id = ? AND active = 1', String(itemId), req.user.id);
  if (!item) return res.status(404).json({ error: 'That step is not part of your routine.' });
  const existing = get('SELECT * FROM checkins WHERE user_id = ? AND date = ?', req.user.id, targetDate);
  const taken = existing ? parse(existing.taken, []) : [];
  const next = taken.includes(item.id) ? taken.filter((id) => id !== item.id) : [...taken, item.id];
  if (existing) {
    run('UPDATE checkins SET taken = ? WHERE id = ?', JSON.stringify(next), existing.id);
  } else {
    run(
      'INSERT INTO checkins (id, user_id, date, taken, created_at) VALUES (?,?,?,?,?)',
      uid('chk'),
      req.user.id,
      targetDate,
      JSON.stringify(next),
      nowIso()
    );
  }
  res.json({ ok: true, date: targetDate, taken: next });
});

appRouter.get('/checkins', requireAuth, (req, res) => {
  const days = clamp(Number(req.query.days) || 30, 1, 365);
  const rows = all(
    'SELECT * FROM checkins WHERE user_id = ? AND date >= ? ORDER BY date ASC',
    req.user.id,
    addDays(today(), -(days - 1))
  );
  res.json({
    checkins: rows.map((r) => ({ ...r, taken: parse(r.taken, []) })),
    series: buildSeries(req.user.id, days)
  });
});

appRouter.get('/progress', requireAuth, (req, res) => {
  const user = req.user;
  const routine = activeRoutine(user.id);
  if (!routine) return res.json({ routine: null });
  const photos = all(
    'SELECT id, date, week, angle, lighting, notes FROM photos WHERE user_id = ? ORDER BY date DESC LIMIT 40',
    user.id
  );
  res.json({
    routine: { id: routine.id, startDate: routine.start_date, durationDays: routine.duration_days },
    series: buildSeries(user.id, 30),
    series90: buildSeries(user.id, 91),
    heatmap: buildHeatmap(user.id, 91),
    weeks: buildWeeks(user.id),
    photos,
    score: progressScore(user, routine),
    spend: monthlySpend(user),
    refills: buildRefillPlan(user),
    streak: buildOverview(user).stats.streak,
    phases: PHASES
  });
});

appRouter.post('/photos', requireAuth, (req, res) => {
  const { dataUrl, angle, notes, lighting, date } = req.body || {};
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
    return res.status(400).json({ error: 'Photo must be an image.' });
  }
  if (dataUrl.length > 2_400_000) return res.status(413).json({ error: 'Photo is too large. Keep it under 1.6 MB.' });
  const routine = activeRoutine(req.user.id);
  if (!routine) return res.status(400).json({ error: 'Complete onboarding first.' });
  const photoDate = date || today();
  const week = clamp(weekOf(routine.start_date, photoDate), 1, 13);
  const id = uid('ph');
  run(
    'INSERT INTO photos (id, user_id, date, week, angle, data_url, lighting, notes, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
    id,
    req.user.id,
    photoDate,
    week,
    String(angle || 'front'),
    dataUrl,
    Number(lighting) || null,
    notes ? String(notes).slice(0, 300) : null,
    nowIso()
  );
  run('INSERT INTO events (id, user_id, name, props, created_at) VALUES (?,?,?,?,?)', uid('ev'), req.user.id, 'photo_capture', JSON.stringify({ week, angle }), nowIso());
  res.status(201).json({ id, week, date: photoDate });
});

appRouter.get('/photos/:id', requireAuth, (req, res) => {
  const photo = get('SELECT * FROM photos WHERE id = ? AND user_id = ?', req.params.id, req.user.id);
  if (!photo) return res.status(404).json({ error: 'Photo not found.' });
  res.json(photo);
});

appRouter.delete('/photos/:id', requireAuth, (req, res) => {
  run('DELETE FROM photos WHERE id = ? AND user_id = ?', req.params.id, req.user.id);
  res.json({ ok: true });
});

appRouter.get('/products', (req, res) => {
  const { concern, category, q } = req.query;
  let rows = all('SELECT * FROM products WHERE active = 1 ORDER BY category, price ASC');
  rows = rows.map((p) => ({ ...p, actives: parse(p.actives, []), concerns: parse(p.concerns, []) }));
  if (concern) rows = rows.filter((p) => p.concerns.includes(String(concern)));
  if (category) rows = rows.filter((p) => p.category === String(category));
  if (q) {
    const needle = String(q).toLowerCase();
    rows = rows.filter((p) => `${p.name} ${p.tagline} ${p.description}`.toLowerCase().includes(needle));
  }
  res.json({ products: rows });
});

appRouter.get('/products/:slug', (req, res) => {
  const p = get('SELECT * FROM products WHERE slug = ?', req.params.slug);
  if (!p) return res.status(404).json({ error: 'Product not found.' });
  const reviews = all('SELECT * FROM reviews WHERE product_slug = ? ORDER BY created_at DESC LIMIT 6', p.slug);
  res.json({ product: { ...p, actives: parse(p.actives, []), concerns: parse(p.concerns, []) }, reviews });
});

appRouter.get('/insights/weekly', requireAuth, (req, res) => {
  const routine = activeRoutine(req.user.id);
  if (!routine) return res.json({ insight: null });
  const week = clamp(weekOf(routine.start_date, today()), 1, 13);
  const insight = get("SELECT * FROM insights WHERE user_id = ? AND week = ? AND kind = 'weekly'", req.user.id, week);
  if (!insight) return res.json({ insight: null });
  res.json({ insight: { ...insight, actions: parse(insight.actions, []) } });
});

appRouter.get('/escalations', requireAuth, (req, res) => {
  res.json({
    escalations: all('SELECT * FROM escalations WHERE user_id = ? ORDER BY created_at DESC', req.user.id)
  });
});

appRouter.post('/escalations', requireAuth, (req, res) => {
  const { reason, detail } = req.body || {};
  if (!reason) return res.status(400).json({ error: 'Tell us what to review.' });
  const id = uid('esc');
  run(
    'INSERT INTO escalations (id, user_id, reason, detail, status, created_at) VALUES (?,?,?,?,?,?)',
    id,
    req.user.id,
    String(reason).slice(0, 120),
    String(detail || '').slice(0, 1200),
    'queued',
    nowIso()
  );
  run('INSERT INTO events (id, user_id, name, props, created_at) VALUES (?,?,?,?,?)', uid('ev'), req.user.id, 'escalation', JSON.stringify({ reason }), nowIso());
  res.status(201).json({
    id,
    status: 'queued',
    sla: 'A Man Matters clinician reviews this within 24 hours on weekdays.',
    prep: [
      'Photograph the area in daylight, no flash.',
      'Note the exact product and the date the symptom started.',
      'Do not start or stop any prescription medicine in the meantime.'
    ]
  });
});

appRouter.get('/export', requireAuth, (req, res) => {
  const user = req.user;
  res.json({
    exportedAt: nowIso(),
    profile: { name: user.name, email: user.email, goal: user.goal, concern: user.concern },
    routine: activeRoutine(user.id) || null,
    checkins: all('SELECT * FROM checkins WHERE user_id = ? ORDER BY date', user.id).map((c) => ({ ...c, taken: parse(c.taken, []) })),
    photos: all('SELECT id, date, week, angle, notes FROM photos WHERE user_id = ?', user.id)
  });
});
