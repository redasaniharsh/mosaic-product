import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Load the project's .env with override:true.
 *
 * Why: many machines export a stale GEMINI_API_KEY. dotenv's default behaviour
 * never overwrites an existing process.env value, which silently sends an
 * invalid key to Google. The local .env is the source of truth for this app; on
 * hosts there is no .env file, so the platform's environment variables apply.
 */
const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, '..', '.env'), override: true });

const uniq = (arr) => [...new Set(arr.map((s) => s.trim()).filter(Boolean))];

const geminiKeys = uniq([
  ...(process.env.GEMINI_API_KEYS || '').split(','),
  process.env.GEMINI_API_KEY || '',
  // Aliases used by earlier deployment docs / Render blueprint.
  process.env.GEMINI_KEY_1 || '',
  process.env.GEMINI_KEY_2 || '',
  process.env.GEMINI_KEY_3 || '',
  process.env.GEMINI_KEY || ''
]);

export const env = {
  port: Number(process.env.PORT) || 4000,
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  geminiKeys,
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  nvidiaKey:
    process.env.NVIDIA_API_KEY ||
    process.env.NVIDIA_NEMOTOR_KEY ||
    process.env.NVIDIA_KEY ||
    '',
  nvidiaBase: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
  nvidiaModel: process.env.NVIDIA_MODEL || 'nvidia/nemotron-3-ultra-550b-a55b'
};
