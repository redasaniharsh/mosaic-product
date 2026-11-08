import express from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { get, run, all } from '../db.js';
import { uid, nowIso } from '../util.js';
import { signToken, publicUser, requireAuth } from '../auth.js';
import { buildOverview } from '../services/progress.js';

export const authRouter = express.Router();

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(120),
  phone: z.string().min(8).max(20).optional(),
  age: z.coerce.number().int().min(13).max(100).optional(),
  city: z.string().max(80).optional()
});

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Check your details.' });
  }
  const { name, email, password, phone, age, city } = parsed.data;
  const existing = get('SELECT id FROM users WHERE lower(email) = lower(?)', email);
  if (existing) return res.status(409).json({ error: 'That email already has an account. Sign in instead.' });
  const id = uid('usr');
  const hash = await bcrypt.hash(password, 10);
  run(
    'INSERT INTO users (id, name, email, phone, password_hash, age, city, created_at) VALUES (?,?,?,?,?,?,?,?)',
    id,
    name.trim(),
    email.toLowerCase(),
    phone || null,
    hash,
    age || null,
    city || null,
    nowIso()
  );
  const user = get('SELECT * FROM users WHERE id = ?', id);
  run('INSERT INTO events (id, user_id, name, props, created_at) VALUES (?,?,?,?,?)', uid('ev'), id, 'signup', '{}', nowIso());
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  const user = get('SELECT * FROM users WHERE lower(email) = lower(?)', String(email));
  if (!user) return res.status(401).json({ error: 'No account with that email.' });
  const ok = await bcrypt.compare(String(password), user.password_hash);
  if (!ok) return res.status(401).json({ error: 'That password is not right.' });
  res.json({ token: signToken(user), user: publicUser(user) });
});

authRouter.post('/demo', (_req, res) => {
  const user = get("SELECT * FROM users WHERE email = 'demo@manmatters.in'");
  if (!user) return res.status(503).json({ error: 'Demo account is not seeded. Run npm run seed.' });
  run('INSERT INTO events (id, user_id, name, props, created_at) VALUES (?,?,?,?,?)', uid('ev'), user.id, 'demo_login', '{}', nowIso());
  res.json({ token: signToken(user), user: publicUser(user) });
});

authRouter.get('/me', requireAuth, (req, res) => {
  const overview = buildOverview(req.user);
  res.json({ user: publicUser(req.user), overview });
});

authRouter.patch('/me', requireAuth, (req, res) => {
  const { name, phone, city, age } = req.body || {};
  run(
    'UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), city = COALESCE(?, city), age = COALESCE(?, age) WHERE id = ?',
    name || null,
    phone || null,
    city || null,
    age ? Number(age) : null,
    req.user.id
  );
  res.json({ user: publicUser(get('SELECT * FROM users WHERE id = ?', req.user.id)) });
});

authRouter.get('/sessions', requireAuth, (req, res) => {
  res.json({ events: all('SELECT name, created_at FROM events WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', req.user.id) });
});
