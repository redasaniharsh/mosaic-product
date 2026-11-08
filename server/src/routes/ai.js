import express from 'express';
import rateLimit from 'express-rate-limit';
import { db } from '../db.js';
import { uid, nowIso, today, weekOf, clamp } from '../util.js';
import { requireAuth } from '../auth.js';
import { buildOverview, buildSeries, buildSignals } from '../services/progress.js';
import { activeRoutine } from '../services/routine.js';
import { env } from '../env.js';
import { streamChat, weeklyReview, fallbackCoach, aiEnabled, aiStatus, buildRecent } from '../services/ai.js';

export const aiRouter = express.Router();

const limiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many messages in a minute. The routine is patient; try again shortly.' }
});

aiRouter.use(limiter);

const contextFor = (user) => {
  const overview = buildOverview(user);
  const recent = buildSeries(user.id, 14);
  return { ctx: { ...overview, recent: buildRecent(recent) }, overview, recent };
};

aiRouter.db.get('/status', (_req, res) => {
  res.json({ ...aiStatus(), model: env.geminiModel, mode: aiEnabled() ? 'live' : 'rules' });
});

aiRouter.db.get('/history', requireAuth, (req, res) => {
  const rows = db.all('SELECT id, role, content, meta, created_at FROM messages WHERE user_id = ? ORDER BY created_at ASC LIMIT 100', req.user.id);
  res.json({ messages: rows.map((m) => ({ ...m, meta: parse(m.meta, null) })) });
});

aiRouter.delete('/history', requireAuth, (req, res) => {
  db.run('DELETE FROM messages WHERE user_id = ?', req.user.id);
  res.json({ ok: true });
});

/**
 * Streamed coach. SSE so the answer appears at reading speed, which matters
 * for a product whose job is to reduce anxiety in the moment of doubt.
 */
aiRouter.post('/chat', requireAuth, async (req, res) => {
  const { message, history } = req.body || {};
  if (!message || String(message).trim().length < 2) {
    return res.status(400).json({ error: 'Ask something specific — even one line works.' });
  }
  if (String(message).length > 1200) return res.status(400).json({ error: 'That message is too long.' });

  const user = req.user;
  const { ctx, overview } = contextFor(user);

  db.run(
    'INSERT INTO messages (id, user_id, role, content, meta, created_at) VALUES (?,?,?,?,?,?)',
    uid('msg'),
    user.id,
    'user',
    String(message).slice(0, 2000),
    null,
    nowIso()
  );

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  send('meta', {
    week: overview.routine?.week ?? 1,
    adherence7: overview.stats?.adherence7 ?? 0,
    model: aiEnabled() ? env.geminiModel : 'rules'
  });

  const trimmed = (Array.isArray(history) ? history : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }));

  let full = '';
  let mode = 'live';
  let usedProvider = 'rules';

  try {
    if (!aiEnabled()) throw new Error('no-key');
    const result = await streamChat({
      history: trimmed,
      message: String(message),
      ctx,
      onToken: (t) => send('token', { t })
    });
    full = result.text;
    usedProvider = result.provider;
    if (!full.trim()) throw new Error('empty-completion');
  } catch (err) {
    mode = 'rules';
    console.warn('[ai] falling back to rules:', err.message);
    full = fallbackCoach(String(message), ctx);
    for (const chunk of full.match(/.{1,36}(\s|$)/g) || [full]) {
      send('token', { t: chunk });
    }
  }

  const redFlag = /(patch|bleed|pus|pain|rash|chest|lump|fever|suicid)/i.test(String(message)) && /(sudden|bleed|pus|pain|rash|chest|lump|fever|suicid)/i.test(String(message));
  const meta = { mode, redFlag, provider: usedProvider };
  db.run(
    'INSERT INTO messages (id, user_id, role, content, meta, created_at) VALUES (?,?,?,?,?,?)',
    uid('msg'),
    user.id,
    'assistant',
    full,
    JSON.stringify(meta),
    nowIso()
  );

  send('done', { mode, redFlag, provider: usedProvider, content: full, escalationPrompt: redFlag ? 'Book a clinician review' : null });
  res.end();
  res.on('close', () => {
    if (!res.writableEnded) res.end();
  });
});

/** Weekly review: cached per ISO week so the dashboard is instant on reload. */
aiRouter.post('/review', requireAuth, async (req, res) => {
  const user = req.user;
  const routine = activeRoutine(user.id);
  if (!routine) return res.status(400).json({ error: 'Complete onboarding first.' });
  const week = clamp(weekOf(routine.start_date, today()), 1, 13);
  const force = Boolean(req.body?.refresh);
  const existing = db.get("SELECT * FROM insights WHERE user_id = ? AND week = ? AND kind = 'weekly'", user.id, week);
  if (existing && !force) {
    return res.json({ insight: { ...existing, actions: parse(existing.actions, []) }, cached: true });
  }

  const { ctx } = contextFor(user);
  let data = null;
  let source = 'live';
  try {
    if (!aiEnabled()) throw new Error('no-key');
    data = await weeklyReview({ ctx });
    if (!data) throw new Error('empty');
  } catch (err) {
    source = 'rules';
    console.warn('[ai] review falling back to rules:', err.message);
    const a7 = ctx.stats?.adherence7 ?? 0;
    const a30 = ctx.stats?.adherence30 ?? 0;
    const trend = a7 - a30;
    const weekNo = ctx.routine?.week ?? 1;
    data = {
      headline:
        a7 >= 75
          ? 'Habit is holding. Next lever is proof.'
          : a7 >= 50
            ? 'You are one anchor away from the safe zone.'
            : 'The routine is losing to the week.',
      body:
        a7 >= 75
          ? `${a7}% adherence this week, ${a30}% across the month. At this rate week 12 will be judgeable. The gap is not effort, it is evidence: your last standardised photo is ${ctx.stats?.lastPhoto || 'missing'}.`
          : a7 >= 50
            ? `${a7}% this week against ${a30}% for the month. You are completing the serum but dropping the ${weekNo >= 5 ? 'weekly cadence steps' : 'morning steps'}. Pick one fixed time and attach it to something you already do.`
            : `${a7}% this week. That is below the 70% line where results stop being luck. Do not add products — shrink the routine to the single nightly serum until it is automatic again.`,
      verdict: a7 >= 75 ? 'on_track' : a7 >= 50 ? 'at_risk' : 'needs_review',
      actions: [
        {
          label: 'Anchor the next dose',
          detail: 'Pick an existing habit — brushing at night — and place the serum immediately after it.'
        },
        {
          label: 'Take the 10-day photo',
          detail: 'Same room, same light, same angle. Without it, week 12 is a feeling, not a result.'
        }
      ],
      coachNote:
        trend < -10
          ? 'The drop before the quit is the pattern. Catch it this week.'
          : 'Consistency is the active ingredient nobody puts on the label.'
    };
  }

  const id = existing?.id || uid('ins');
  const provider = data._provider || source;
  if (existing) {
    db.run('UPDATE insights SET title = ?, body = ?, actions = ?, source = ?, created_at = ? WHERE id = ?', data.headline, data.body, JSON.stringify(data.actions || []), provider, nowIso(), id);
  } else {
    db.run(
      'INSERT INTO insights (id, user_id, week, kind, title, body, actions, source, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
      id,
      user.id,
      week,
      'weekly',
      data.headline,
      data.body,
      JSON.stringify(data.actions || []),
      provider,
      nowIso()
    );
  }
  res.json({ insight: { ...data, actions: data.actions || [], week, source: provider }, signals: buildSignals(user) });
});
