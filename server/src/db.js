import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(process.env.DB_DIR || path.join(__dirname, '..', 'data'));
fs.mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(process.env.DB_PATH || path.join(dataDir, 'companion.db'));

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
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
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS checkins (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  hair_fall INTEGER,
  sleep_quality INTEGER,
  stress_level INTEGER,
  water_logging INTEGER,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS routine_items (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  week_number INTEGER,
  active BOOLEAN DEFAULT true,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  role TEXT,
  content TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  image_path TEXT,
  date TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  form TEXT NOT NULL,
  accent TEXT,
  price REAL,
  rating REAL,
  review_count INTEGER,
  description TEXT,
  how_to_use TEXT,
  key_benefits TEXT,
  key_ingredients TEXT,
  sustainability TEXT,
  category TEXT,
  gender TEXT,
  season TEXT,
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS insight (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  weekly_adherence REAL,
  total_checkins INTEGER,
  average_hair_fall REAL,
  average_sleep REAL,
  average_stress REAL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS weekly_reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  week_number INTEGER,
  adherence_percentage REAL,
  summary_text TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON checkins(user_id, date);
CREATE INDEX IF NOT EXISTS idx_items_user ON routine_items(user_id, active);
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_photos_user ON photos(user_id, date);
`);

function migrateProductsTable() {
  // SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we try and ignore errors if column exists
  try {
    const stmt = db.prepare('ALTER TABLE products ADD COLUMN image TEXT');
    stmt.run();
    console.log('Products table migration: image column added');
  } catch (e) {
    // Column may already exist - that's fine
    console.log('Products table: image column already exists or migration skipped');
  }
  try {
    const stmt = db.prepare('ALTER TABLE products ADD COLUMN slug TEXT');
    stmt.run();
    console.log('Products table migration: slug column added');
  } catch (e) {
    // Column may already exist - that's fine
    console.log('Products table: slug column already exists or migration skipped');
  }
}

// Run migration on module load
migrateProductsTable();

export const all = (sql, ...params) => db.prepare(sql).all(...params);
export const get = (sql, ...params) => db.prepare(sql).get(...params);
export const run = (sql, ...params) => db.prepare(sql).run(...params);

export const parse = (value, fallback) => {
  if (value == null) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const tx = (fn) => {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
};