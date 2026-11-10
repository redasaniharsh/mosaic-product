import './env.js';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { authRouter } from './routes/auth.js';
import { appRouter } from './routes/app.js';
import { aiRouter } from './routes/ai.js';
import { publicRouter } from './routes/public.js';
import { ensureSeeded } from './seed.js';
import { env } from './env.js';
import { providers } from './services/ai.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = env.port;

app.set('trust proxy', 1);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '3mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, status: 'healthy' }));

app.use('/api/auth', authRouter);
app.use('/api/app', appRouter);
app.use('/api/ai', aiRouter);
app.use('/api/public', publicRouter);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint not found.' }));

// In production the API also serves the built React app (one deploy, one URL).
const webDist = path.resolve(__dirname, '..', '..', 'web', 'dist');
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist, { maxAge: '1h', index: false }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    // Missing files must 404 instead of receiving the SPA shell. An <img> that
    // gets HTML with a 200 never fires onError, so the branded image fallbacks
    // would silently never appear.
    if (/\.[a-z0-9]{2,5}$/i.test(req.path)) return res.status(404).type('text').send('Not found');
    res.sendFile(path.join(webDist, 'index.html'));
  });
}

app.use((err, _req, res, _next) => {
  console.error('[api]', err);
  res.status(err.status || 500).json({ error: err.message || 'Something broke on our side.' });
});

await ensureSeeded();

app.listen(PORT, () => {
  console.log(`\n  Man Matters Companion API → http://localhost:${PORT}`);
  const chain = providers().map((p) => `${p.kind}:${p.label}`);
  console.log(`  AI chain: ${chain.length ? chain.join(' → ') : 'rules only'} → rules`);
  console.log(`  Web: ${fs.existsSync(webDist) ? webDist : 'run npm run dev:web for the Vite dev server'}\n`);
});
