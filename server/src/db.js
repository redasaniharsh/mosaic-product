import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(process.env.DB_DIR || path.join(__dirname, '..', 'data'));
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = process.env.DB_PATH || path.join(dataDir, 'companion.db');

let rawDb;

try {
  const nodeSqlite = await import('node:sqlite');
  rawDb = new nodeSqlite.DatabaseSync(dbPath);
} catch {
  const { default: Database } = await import('better-sqlite3');
  rawDb = new Database(dbPath);
}

rawDb.exec('PRAGMA journal_mode = WAL');
rawDb.exec('PRAGMA foreign_keys = ON');

rawDb.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  age INTEGER,
  city TEXT,
  goal TEXT,
  concern TEXT,
  hair_type TEXT,
  skin_type TEXT,
  beard_type TEXT,
  diet TEXT,
  sleep_hours REAL,
  stress INTEGER,
  answers TEXT,
  plan TEXT,
  onboarded INTEGER NOT NULL DEFAULT 0,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  form TEXT,
  tagline TEXT,
  description TEXT,
  price INTEGER,
  mrp INTEGER,
  size TEXT,
  actives TEXT,
  concerns TEXT,
  step INTEGER,
  time_of_day TEXT,
  cadence TEXT,
  instructions TEXT,
  cautions TEXT,
  rating REAL,
  reviews INTEGER,
  accent TEXT,
  evidence TEXT,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS routines (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  start_date TEXT NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 90,
  headline TEXT,
  rationale TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS routine_items (
  id TEXT PRIMARY KEY,
  routine_id TEXT NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  step INTEGER,
  time_of_day TEXT,
  cadence TEXT,
  week_start INTEGER,
  week_end INTEGER,
  phase INTEGER,
  instructions TEXT,
  optional INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS checkins (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  taken TEXT NOT NULL DEFAULT '[]',
  hair_fall INTEGER,
  sleep_hours REAL,
  water INTEGER,
  stress INTEGER,
  mood TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  week INTEGER,
  angle TEXT,
  data_url TEXT NOT NULL,
  lighting INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  meta TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS insights (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week INTEGER NOT NULL,
  kind TEXT NOT NULL,
  title TEXT,
  body TEXT,
  actions TEXT,
  source TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(user_id, week, kind)
);

CREATE TABLE IF NOT EXISTS escalations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  detail TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL,
  props TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  source TEXT,
  product_slug TEXT,
  rating INTEGER,
  text TEXT,
  theme TEXT,
  sentiment TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON checkins(user_id, date);
CREATE INDEX IF NOT EXISTS idx_items_user ON routine_items(user_id, active);
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_photos_user ON photos(user_id, date);
`);

export const all = (sql, ...params) => rawDb.prepare(sql).all(...params);
export const get = (sql, ...params) => rawDb.prepare(sql).get(...params);
export const run = (sql, ...params) => rawDb.prepare(sql).run(...params);

export const parse = (value, fallback) => {
  if (value == null) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const tx = (fn) => {
  rawDb.exec('BEGIN');
  try {
    const result = fn();
    rawDb.exec('COMMIT');
    return result;
  } catch (err) {
    rawDb.exec('ROLLBACK');
    throw err;
  }
};

rawDb.all = all;
rawDb.get = get;
rawDb.run = run;
rawDb.parse = parse;
rawDb.tx = tx;

export const db = rawDb;
