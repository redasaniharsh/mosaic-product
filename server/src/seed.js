import './env.js';
import bcrypt from 'bcryptjs';
import { db } from './db.js';
import { uid, nowIso, today, addDays } from './util.js';
import { PRODUCTS } from './data/products.js';
import { RESEARCH } from './data/research.js';
import { buildRoutine } from './services/routine.js';
import { publicReviewThemes } from './data/products.js';

const mulberry32 = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const seedProducts = () => {
  PRODUCTS.forEach((p) => {
    db.run(
      `INSERT INTO products (slug, name, category, form, tagline, description, price, mrp, size, actives, concerns, step, time_of_day, cadence, instructions, cautions, rating, reviews, accent, evidence, active)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)
       ON CONFLICT(slug) DO UPDATE SET
         name=excluded.name, category=excluded.category, form=excluded.form, tagline=excluded.tagline,
         description=excluded.description, price=excluded.price, mrp=excluded.mrp, size=excluded.size,
         actives=excluded.actives, concerns=excluded.concerns, step=excluded.step,
         time_of_day=excluded.time_of_day, cadence=excluded.cadence, instructions=excluded.instructions,
         cautions=excluded.cautions, rating=excluded.rating, reviews=excluded.reviews,
         accent=excluded.accent, evidence=excluded.evidence, active=1`,
      p.slug,
      p.name,
      p.category,
      p.form,
      p.tagline,
      p.description,
      p.price,
      p.mrp,
      p.size,
      JSON.stringify(p.actives),
      JSON.stringify(p.concerns),
      p.step,
      p.timeOfDay,
      p.cadence,
      p.instructions,
      p.cautions,
      p.rating,
      p.reviews,
      p.accent,
      p.evidence
    );
  });
};

const seedReviews = () => {
  if ((db.get('SELECT COUNT(*) c FROM reviews')?.c || 0) > 0) return;
  const rows = [
    {
      product: 'advanced-hair-growth-serum',
      rating: 2,
      text: 'Used it for three weeks and my hair fall increased. Stopped because I got scared. Maybe I should have continued?',
      theme: 'shedding_panic'
    },
    {
      product: 'advanced-hair-growth-serum',
      rating: 5,
      text: 'Six months in, the crown is visibly denser. The first month was rough — lots of shedding — but the doctor told me it was normal.',
      theme: 'completed_course'
    },
    {
      product: 'advanced-hair-growth-serum',
      rating: 3,
      text: 'Bottle lasts barely three weeks if you follow what the videos show. The 5-drop dose is not clear on the label.',
      theme: 'dose_confusion'
    },
    {
      product: 'biotin-gummies',
      rating: 4,
      text: 'Taste is fine and I actually remember to take them. No idea if they are doing anything for my hair though.',
      theme: 'attribution_confusion'
    },
    {
      product: 'beard-growth-oil',
      rating: 5,
      text: 'Cheeks filled in around month three. The oil is light and does not smell like a pharmacy.',
      theme: 'completed_course'
    },
    {
      product: 'beard-growth-roller',
      rating: 3,
      text: 'Nobody explains how hard to press. I rolled daily for a week and my skin was red and angry.',
      theme: 'usage_error'
    },
    {
      product: 'anti-hairfall-shampoo',
      rating: 3,
      text: 'Good shampoo, but I bought it thinking it would fix hair fall. Two months later I learned it is only a cleanser.',
      theme: 'wrong_first_product'
    },
    {
      product: 'vitamin-c-serum',
      rating: 4,
      text: 'Marks faded after two months. Wish there was a way to compare photos properly because I can barely remember my skin before.',
      theme: 'no_progress_signal'
    }
  ];
  rows.forEach((r) => {
    db.run(
      'INSERT INTO reviews (id, source, product_slug, rating, text, theme, sentiment, created_at) VALUES (?,?,?,?,?,?,?,?)',
      uid('rev'),
      'Marketplace review (paraphrased)',
      r.product,
      r.rating,
      r.text,
      r.theme,
      r.rating >= 4 ? 'positive' : r.rating === 3 ? 'neutral' : 'negative',
      nowIso()
    );
  });
};

const svgPlate = (week, tone) => {
  const tones = {
    early: ['#101311', '#1d2a20', '#2c3f31'],
    mid: ['#101311', '#23331f', '#3d5233'],
    late: ['#0f1410', '#2b3d24', '#5d7a3c']
  }[tone];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="800" viewBox="0 0 640 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${tones[0]}"/><stop offset="0.55" stop-color="${tones[1]}"/><stop offset="1" stop-color="${tones[2]}"/>
    </linearGradient>
    <radialGradient id="r" cx="0.5" cy="0.42" r="0.55">
      <stop offset="0" stop-color="#c6f24e" stop-opacity="0.20"/>
      <stop offset="1" stop-color="#0b0c0b" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="640" height="800" fill="url(#g)"/>
  <rect width="640" height="800" fill="url(#r)"/>
  ${Array.from({ length: 9 })
    .map((_, i) => `<ellipse cx="320" cy="410" rx="${90 + i * 26}" ry="${120 + i * 30}" fill="none" stroke="#c6f24e" stroke-opacity="${0.16 - i * 0.014}" stroke-width="1"/>`)
    .join('')}
  <rect x="0" y="742" width="640" height="58" fill="#0b0c0b" fill-opacity="0.62"/>
  <text x="28" y="778" font-family="Helvetica,Arial" font-size="17" letter-spacing="3" fill="#f7f5f0" fill-opacity="0.86">WEEK ${String(week).padStart(2, '0')} · CROWN</text>
  <text x="612" y="778" text-anchor="end" font-family="Helvetica,Arial" font-size="17" letter-spacing="3" fill="#c6f24e">DEMO</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const createDemo = async () => {
  const email = 'demo@manmatters.in';
  if (db.get('SELECT id FROM users WHERE email = ?', email)) return;

  const id = uid('usr');
  const hash = await bcrypt.hash('demo1234', 10);
  db.run(
    'INSERT INTO users (id, name, email, phone, password_hash, age, city, goal, concern, hair_type, skin_type, diet, sleep_hours, stress, answers, onboarded, role, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)',
    id,
    'Aditya Rao',
    email,
    '9819000000',
    hash,
    27,
    'Mumbai',
    'hair',
    'hair_fall',
    'wavy',
    'combination',
    'nonveg',
    6.8,
    4,
    JSON.stringify({
      goal: 'hair',
      concern: 'hair_fall',
      concerns: ['hair_fall', 'thinning', 'oily_scalp'],
      age: 27,
      hairType: 'wavy',
      scalp: 'oily',
      skinType: 'combination',
      diet: 'nonveg',
      sleepHours: 6.8,
      stress: 4,
      budget: 'balanced',
      routineTime: 'night',
      durationOfConcern: '1-3 years',
      reportDeficiency: false
    }),
    'demo',
    nowIso()
  );

  const answers = {
    goal: 'hair',
    concern: 'hair_fall',
    concerns: ['hair_fall', 'thinning', 'oily_scalp'],
    age: 27,
    hairType: 'wavy',
    scalp: 'oily',
    skinType: 'combination',
    diet: 'nonveg',
    sleepHours: 6.8,
    stress: 4,
    budget: 'balanced',
    routineType: 'night'
  };

  const routineId = buildRoutine({ userId: id, answers });
  const start = addDays(today(), -34);
  db.run('UPDATE routines SET start_date = ?, created_at = ? WHERE id = ?', start, nowIso(), routineId);
  db.run('UPDATE users SET plan = ? WHERE id = ?', JSON.stringify({
    headline: 'Your 13-week hair recovery protocol',
    summary:
      'Built around the 12-week growth cycle. The serum does the follicle work, the shampoo protects the scalp barrier, and biotin covers the nutritional floor. Tablets join at week 5 so you can tell what is adding what.',
    focusAreas: [
      { title: 'Protect the follicle', body: 'Nightly Redensyl + Procapil serum is the base layer for density.' },
      { title: 'Feed the raw material', body: 'Biotin plus protein at two meals covers what topicals cannot.' },
      { title: 'Make it measurable', body: 'A standardised photo every 10 days is the only honest scoreboard.' }
    ],
    expectations: [
      'Weeks 1–4: shedding may increase as resting hairs cycle out. Expected, not a reaction.',
      'Weeks 5–8: shedding settles; adherence is the only variable that matters.',
      'Weeks 9–13: density change becomes photographable at the same angle and light.'
    ],
    watchFor: [
      'Coin-sized bald patches or a painful, scaly scalp — book a doctor review.',
      'No change at all by week 12 — review the diagnosis, do not buy another serum.'
    ],
    guardrails: [
      { title: 'Never miss twice', body: 'One missed day is noise. Two is a pattern.' },
      { title: 'Sleep is part of the stack', body: 'You reported 6.8h. Under 7h, cortisol works against follicle recovery.' },
      { title: 'Stress lands on the scalp', body: 'High reported stress pushes more follicles into the shedding phase.' },
      { title: 'Protein at two meals', body: 'Hair is keratin. Under ~1g per kg of body weight, no serum compensates.' }
    ],
    generatedBy: 'rules',
    generatedAt: nowIso()
  }), id);

  const rand = mulberry32(20261108);
  const items = db.all('SELECT * FROM routine_items WHERE user_id = ?', id);
  const rateByWeek = { 1: 0.92, 2: 0.84, 3: 0.42, 4: 0.66, 5: 0.88 };
  const skipDays = new Set([19, 20, 27]);
  const checkins = [];

  for (let d = 0; d <= 34; d += 1) {
    const date = addDays(start, d);
    const week = Math.floor(d / 7) + 1;
    if (skipDays.has(d)) continue;
    const p = Math.min(0.98, rateByWeek[week] ?? 0.85);
    const available = items.filter((i) => i.week_start <= week);
    const taken = available.filter(() => rand() < p).map((i) => i.id);
    const dow = new Date(`${date}T12:00:00`).getDay();
    const washDay = [1, 3, 5].includes(dow);
    const hairFall = washDay ? Math.max(12, Math.round(48 - d * 0.62 + (rand() * 9 - 4))) : null;
    const sleep = Number((6.3 + rand() * 1.7 + (week >= 4 ? 0.25 : 0)).toFixed(1));
    const stress = week === 3 ? 5 : 2 + Math.round(rand() * 2);
    checkins.push({ date, taken, hairFall, sleep, stress, water: 4 + Math.round(rand() * 5) });
  }

  checkins.forEach((c) => {
    db.run(
      'INSERT INTO checkins (id, user_id, date, taken, hair_fall, sleep_hours, water, stress, mood, notes, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      uid('chk'),
      id,
      c.date,
      JSON.stringify(c.taken),
      c.hairFall,
      c.sleep,
      c.water,
      c.stress,
      c.stress >= 5 ? 'wired' : c.sleep >= 7.2 ? 'steady' : 'flat',
      c.hairFall && c.hairFall > 45 ? 'More strands than usual on wash day.' : null,
      nowIso()
    );
  });

  [0, 14, 28].forEach((offset) => {
    const date = addDays(start, offset);
    db.run(
      'INSERT INTO photos (id, user_id, date, week, angle, data_url, lighting, notes, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
      uid('ph'),
      id,
      date,
      Math.floor(offset / 7) + 1,
      'crown',
      svgPlate(Math.floor(offset / 7) + 1, offset === 0 ? 'early' : offset === 14 ? 'mid' : 'late'),
      76,
      offset === 0 ? 'Baseline. Bathroom light, dry hair.' : 'Same bathroom, same angle, morning light.',
      nowIso()
    );
  });

  db.run(
    'INSERT INTO insights (id, user_id, week, kind, title, body, actions, source, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
    uid('ins'),
    id,
    5,
    'weekly',
    'Habit recovered. Now build the proof.',
    'Your adherence climbed from 42% in week 3 to 88% this week — that recovery is the hardest part and most men never make it. Shedding logs are down from 47 to 28 strands per wash. The remaining gap is evidence: your last standardised photo was 6 days ago, and week 9 is when density becomes photographable.',
    JSON.stringify([
      { label: 'Take the 10-day photo', detail: 'Same bathroom, same angle, dry hair. The comparison only works if nothing else changes.' },
      { label: 'Anchor the morning dose', detail: 'Biotin after breakfast is your weakest step this week at 71%.' }
    ]),
    'gemini',
    nowIso()
  );

  const convo = [
    ['user', 'I am in week 5 and still shedding. Is the serum not working?'],
    [
      'assistant',
      'Week 5 shedding is still inside the normal window. Your logs show strands per wash falling from 47 at week 2 to 28 now, which is the direction you want. The number that worries me is not the shedding — it is that you missed two nights in week 4. Keep the dose at 5–6 drops and hold everything else identical until week 8. If shedding is still climbing after week 8, that is a doctor conversation, not a product decision.'
    ],
    ['user', 'Should I add the hair tablets now?'],
    [
      'assistant',
      'You already have them planned from week 5, so yes — start them with dinner. Do not add anything else. Three variables at once means you cannot tell what is working, and if your scalp reacts you cannot tell what caused it. At 88% adherence this week, the routine deserves a clean run to week 9 before you change the stack.'
    ]
  ];
  convo.forEach(([role, content], i) => {
    db.run(
      'INSERT INTO messages (id, user_id, role, content, meta, created_at) VALUES (?,?,?,?,?,?)',
      uid('msg'),
      id,
      role,
      content,
      role === 'assistant' ? JSON.stringify({ mode: 'gemini' }) : null,
      new Date(Date.now() - (convo.length - i) * 60000).toISOString()
    );
  });

  db.run('INSERT INTO events (id, user_id, name, props, created_at) VALUES (?,?,?,?,?)', uid('ev'), id, 'seed_demo', '{}', nowIso());
};

export const ensureSeeded = async () => {
  seedProducts();
  seedReviews();
  await createDemo();
};

const isDirect = process.argv[1] && process.argv[1].endsWith('seed.js');
if (isDirect) {
  ensureSeeded().then(() => {
    const counts = {
      products: db.get('SELECT COUNT(*) c FROM products')?.c,
      reviews: db.get('SELECT COUNT(*) c FROM reviews')?.c,
      users: db.get('SELECT COUNT(*) c FROM users')?.c,
      checkins: db.get('SELECT COUNT(*) c FROM checkins')?.c,
      photos: db.get('SELECT COUNT(*) c FROM photos')?.c,
      researchCustomers: RESEARCH.customers.length,
      reviewThemes: publicReviewThemes.length
    };
    console.log('Seeded:', counts);
    console.log('Demo login → demo@manmatters.in / demo1234');
  });
}
