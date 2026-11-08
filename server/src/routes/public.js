import express from 'express';
import { RESEARCH, derivePatterns } from '../data/research.js';
import { PRODUCTS, PHASES, CONCERNS, publicReviewThemes } from '../data/products.js';
import { all, get, run } from '../db.js';
import { aiStatus } from '../services/ai.js';

export const publicRouter = express.Router();

publicRouter.get('/site', (_req, res) => {
  const patterns = derivePatterns(RESEARCH.customers);
  const featuredSlugs = ['advanced-hair-growth-serum', 'biotin-gummies', 'beard-growth-oil', 'vitamin-c-serum'];
  const featured = all('SELECT * FROM products WHERE active = 1').filter((p) => featuredSlugs.includes(p.slug));

  res.json({
    brand: {
      name: RESEARCH.brand,
      category: RESEARCH.category,
      method: RESEARCH.method,
      conductedAt: RESEARCH.conductedAt
    },
    stats: {
      customers: RESEARCH.customers.length,
      products: get('SELECT COUNT(*) c FROM products WHERE active = 1')?.c || 0,
      checkins: get('SELECT COUNT(*) c FROM checkins')?.c || 0,
      routines: get('SELECT COUNT(*) c FROM routines')?.c || 0,
      ai: aiStatus().enabled
    },
    patterns: patterns.slice(0, 6),
    quotes: RESEARCH.customers.map((c) => ({
      code: c.code,
      name: `${c.name.split(' ')[0]} ${c.name.split(' ').slice(1).map((p) => `${p[0]}.`).join(' ')}`.trim(),
      avatar: c.avatar,
      city: c.city,
      tenure: c.tenure,
      quote: c.quote,
      themes: c.themes,
      sentiment: c.sentiment
    })),
    chosenProblem: RESEARCH.chosenProblem,
    problemsConsidered: RESEARCH.problemsConsidered,
    rootCauses: RESEARCH.rootCauses,
    solution: RESEARCH.solutionLink,
    phases: PHASES,
    concerns: CONCERNS,
    reviewThemes: publicReviewThemes,
    featured: featured.map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      tagline: p.tagline,
      price: p.price,
      mrp: p.mrp,
      rating: p.rating,
      reviews: p.reviews,
      accent: p.accent,
      form: p.form,
      image: p.image
    }))
  });
});

publicRouter.get('/health', (_req, res) => {
  res.json({
    ok: true,
    time: new Date().toISOString(),
    ai: aiStatus(),
    users: get('SELECT COUNT(*) c FROM users')?.c || 0,
    products: get('SELECT COUNT(*) c FROM products')?.c || 0
  });
});

publicRouter.get('/products', (_req, res) => {
  res.json({ products: PRODUCTS });
});
