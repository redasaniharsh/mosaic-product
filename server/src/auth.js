import jwt from 'jsonwebtoken';
import { db } from './db.js';
import { env } from './env.js';

const SECRET = env.jwtSecret;

export const signToken = (user) =>
  jwt.sign({ sub: user.id, email: user.email }, SECRET, { expiresIn: '30d' });

export const publicUser = (u) => {
  if (!u) return null;
  const { password_hash, answers, plan, ...rest } = u;
  return {
    ...rest,
    onboarded: Boolean(rest.onboarded),
    answers: answers ? JSON.parse(answers) : null,
    plan: plan ? JSON.parse(plan) : null
  };
};

export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Sign in to continue.' });
  try {
    const payload = jwt.verify(token, SECRET);
    const user = db.get('SELECT * FROM users WHERE id = ?', payload.sub);
    if (!user) return res.status(401).json({ error: 'Session no longer valid.' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired. Sign in again.' });
  }
};

export const optionalAuth = (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      const payload = jwt.verify(token, SECRET);
      req.user = db.get('SELECT * FROM users WHERE id = ?', payload.sub) || null;
    } catch {
      req.user = null;
    }
  }
  next();
};
