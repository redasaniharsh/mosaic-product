import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToF } from 'node:url';

const __dirname = path.dirname(fileURLToF(import.meta.url));
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
  tagline TEXT,
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
  mrp REAL,
  size TEXT,
  actives TEXT,
  concerns TEXT,
  step TEXT,
  time_of_day TEXT,
  cadence TEXT,
  instructions TEXT,
  cautions TEXT,
  reviews TEXT,
  evidence TEXT,
  image TEXT,
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
  try {
    const stmt = db.prepare('ALTER TABLE products ADD COLUMN image TEXT');
    stmt.run();
    console.log('Products table migration: image column added');
  } catch (e) {
    console.log('Products table: image column already exists or migration skipped');
  }
  try {
    const stmt = db.prepare('ALTER TABLE products ADD COLUMN slug TEXT');
    stmt.run();
    console.log('Products table migration: slug column added');
  } catch (e) {
    console.log('Products table: slug column already exists or migration skipped');
  }
  try {
    const stmt = db.prepare('ALTER TABLE products ADD COLUMN tagline TEXT');
    stmt.run();
    console.log('Products table migration: tagline column added');
  } catch (e) {
    console.log('Products table: tagline column already exists or migration skipped');
  }
  try {
    const stmt = db.prepare('ALTER TABLE products ADD COLUMN mrp REAL');
    stmt.run();
    console.log('Products table migration: mrp column added');
  } catch (e) {
    console.log('Products table: mrp column already exists or migration skipped');
  }
  try {
    const stmt = db.prepare('ALTER TABLE products ADD COLUMN size TEXT');
    stmt.run();
    console.log('Products table migration: size column added');
  } catch (e) {
    console.log('Products table: size column already exists or migration skipped');
  }
  try {
    const stmt = db.prepare('ALTER TABLE products ADD COLUMN actives TEXT');
    stmt.run();
    console.log('Products table migration: actives column added');
  } catch (e) {
    console.log('Products table: actives column already exists or migration skipped');
  }
  try {
    const stmt = db.prepare('ALTER TABLE products ADD COLUMN concerns TEXT');
    stmt.run();
    console.log('Products table migration: concerns column added');
  } catch (e) {
    console.log('Products table: concerns column already exists or migration skipped');
  }
  try {
    const stmt = db.prepare('ALTER TABLE products ADD COLUMN step TEXT');
    stmt.run();
    console.log('Products table migration: step column added');
  } catch (e) {
    console.log('Products table: step column already exists or migration skipped');
  }
  try {
    const stmt = db.prepare('ALTER TABLE products ADD COLUMN time_of_day TEXT');
    stmt.run();
    console.log('Products table migration: time_of_day column added');
  } catch (e) {
    console.log('Products table: time_of_day column already exists or migration skipped');
  }
  try {
    const stmt = db.prepare('ALTER TABLE products ADD COLUMN cadence TEXT');
    stmt.run();
    console.log('Products table migration: cadence column added');
  } catch (e) {
    console.log('Products table: cadence column already exists or migration skipped');
  }
  try {
    const stmt = db.prepare('ALTER TABLE products ADD COLUMN instructions TEXT');
    stmt.run();
    console.log('Products table migration: instructions column added');
  } catch (e) {
    console.log('Products table: instructions column already exists or migration skipped');
  }
  try {
    const stmt = db.prepare('ALTER TABLE products ADD COLUMN cautions TEXT');
    stmt.run();
    console.log('Products table migration: cautions column added');
  } catch (e) {
    console.log('Products table: cautions column already exists or migration skipped');
  }
  try {
    const stmt = db.prepare('ALTER TABLE products ADD COLUMN reviews TEXT');
    stmt.run();
    console.log('Products table migration: reviews column added');
  } catch (e) {
    console.log('Products table: reviews column already exists or migration skipped');
  }
  try {
    const stmt = db.prepare('ALTER TABLE products ADD COLUMN evidence TEXT');
    stmt.run();
    console.log('Products table migration: evidence column added');
  } catch (e) {
    console.log('Products table: evidence column already exists or migration skipped');
  }
}

// Run migrations on module load
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