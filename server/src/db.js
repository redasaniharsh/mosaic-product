import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(process.env.DB_DIR || path.join(__dirname, '..', 'data'));
fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(process.env.DB_PATH || path.join(dataDir, 'companion.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  age INTEGER,
  city TEXT,
  goal TEXT,
  concern TEXT,
  hair_type TEXT,
  skin_type TEXT,
  beard_type TEXT,
  diet TEXT,
  sleep_hours INTEGER,
  stress INTEGER,
  answers TEXT,
  plan TEXT,
  onboarded INTEGER
`);