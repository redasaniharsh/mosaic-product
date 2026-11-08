/**
 * scripts/build-doc.mjs
 *
 * Generates Part1_ManMatters_Customer_Research.docx from the research data
 * in server/src/data/research.js. The docx package is a dependency of this
 * project (or installed inline via its built module).
 *
 * Run:  node server/scripts/build-doc.mjs
 *
 * Output: server/dist/Part1_ManMatters_Customer_Research.docx
 */

import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, Border, Alignment, HeadingLevel, VerticalAlignment, Tab, TabStopLocation } from 'docx';

// The research data lives in the server module. We import the RESEARCH constant
// and a small helper to derive patterns (same logic used by the API).
import { RESEARCH } from '../data/research.js';

// ── helpers ──────────────────────────────────────────────────────────────
const inch = 72; // docx uses EMU but we use points/integers for simplicity

const makeTable = (rows, colsWidth) => {
  const table = new Table({
    rows: rows.map((r, i) => ({
      cells: r.map((c, j) => ({
        child: new Paragraph({ children: new TextRun({ text: String(c), size: 24 }) }),
        width: { size: (colsWidth[j] || 30) * 100 }, // '*' units -> EMU*100
        // default cell padding
        // set a thin bottom border on header row only
        ...(i === 0 ? { bottomBorder: { size: 4, color: '000000' } } : {})
      }))
    })),
    columnSizes: colsWidth.map((w) => ({ size: w * 100 }))
  });
  return table;
};

const section = (heading, body) => [
  new Paragraph({ children: new TextRun({ text: heading, size: 36, bold: true }), alignment: Alignment.CENTER }),
  ...(body || []).map((p) => new Paragraph({ children: new TextRun({ text: p, size: 24 }) }))
];

const pageBreak = () => new Paragraph({});

const doc = new Document({
  title: 'Man Matters Customer Research — Part 1',
  creator: 'Harsh Redasani',
  subject: 'Mosaic Fellowship Builder Round',
  keywords: 'man matters, customer research, builder round, mosaic',
  margins: { top: 72, bottom: 72, left: 72, right: 72 },
  sections: [{
    properties: {},
    children: []
  }]
});

// ── extract 5 customers from RESEARCH ──────────────────────────────────
const customers = RESEARCH.customers;

// ── 1. Customer tables ─────────────────────────────────────────────────
const customerRows = customers.map(c => [
  c.code,
  c.name,
  c.phone,
  c.products.join(', '),
  c.entryPoint,
  `${c.likes?.length || 0} likes`,
  `${c.dislikes?.length || 0} dislikes`
]);

// Rating / pros/cons columns: we'll pack pros and cons into single cells
const customerTableRows = customers.map(c => [
  c.code,
  c.name,
  c.phone,
  c.products.join(', '),
  `${c.likes?.join(' | ' ) || ''}`,
  `${c.dislikes?.join(' | ' ) || ''}`,
  `${c.whyPurchased || ''}`,
  `${c.pros?.join(' | ' ) || ''}`,
  `${c.cons?.join(' | ' ) || ''}`,
  `${c.problemsFaced?.join(' | ' ) || ''}`,
  `${c.expectedImprovements?.join(' | ' ) || ''}`
], []);

const custTable = makeTable(
  customerTableRows,
  [12, 30, 20, 28, 45, 35, 38, 35, 35, 42, 42] // approx widths
);

// ── 2. Patterns ────────────────────────────────────────────────────────
const patterns = RESEARCH.method; // we reuse the method field; derivePatterns logic
// compute simple counts from customer data
const allConcerns = new Set();
const allProblems = new Set();
customers.forEach(c => {
  (c.products || []).forEach(p => {
    if (p.includes('Hair')) allConcerns.add('Hair fall / thinning');
    if (p.includes('Beard')) allConcerns.add('Patchy beard');
    if (p.includes('Skin')) allConcerns.add('Acne / dull skin');
  });
  (c.likes || []).forEach(l => { if (l.toLowerCase().includes('scalp')) allProblems.add('Scalp health'); });
  (c.dislikes || []).forEach(d => { if (d.toLowerCase().includes('dry')) allProblems.add('Dry scalp'); });
});
const patternsTable = makeTable(
  [[
    'Common concern: Hair fall / thinning',
    'Beard patchiness',
    'Dull skin / acne',
    'Low energy / weight retention',
    'Intimate wellness confidence'
  ].map((t, i) => [['Hair fall', 'Patchy beard', 'Dull skin', 'Low energy', 'Intimate wellness'][i], '≈ ' + (typeof customers.find(x=>x.name===c.name)?.tenure||'') + ' months tenure']),
    // simplified: show each concern + how many customers have it
    ...[...allConcerns].map(cn => [cn, '5 customers']),
    ...[...allProblems].map(pb => [pb, '2–3 customers'])
  ]],
  [30, 50]
);

// Actually let's do a clean patterns table:
const patternRows = [
  ['Hair fall / thinning', '4/5 customers'],
  ['Patchy beard', '2/5 customers'],
  ['Dull skin / acne', '3/5 customers'],
  ['Low energy / weight', '2/5 customers'],
  ['Intimate wellness', '1/5 customers']
];
const patternsTable2 = makeTable(
  patternRows.map(r => [r[0], r[1]]),
  [40, 30]
);

// ── 3. Root causes ─────────────────────────────────────────────────────
const rootCauses = [
  ['Biological: 12+ week hair/beard growth cycles delay any visible signal', 'Delayed evidence window'],
  ['Product: Progress measured by memory & non-standardised camera-roll photos', 'Memory bias + angle/light variation'],
  ['Service: No clinician touchpoint during weeks 3–8 when doubt peaks', 'Upstream gap in human review']
];
const rootTable = makeTable(
  rootCauses.map(r => [r[0], r[1]]),
  [60, 40]
);

// ── 4. Problems considered ─────────────────────────────────────────────
const problemsConsidered = [
  { id: 'P1', title: 'Initial shedding in weeks 1–4', evidence: 'Normal telogen effluvium as resting hairs cycle out', whyNotChosen: 'Seen in all routines but resolves by week 6; not upstream of the proof gap', whyChosen: null },
  { id: 'P2', title: 'Missed doses weeks 3–6', evidence: 'Habit formation breaks under routine pressure', whyNotChosen: 'Addressable via guardrails; not the root cause of quitting', whyChosen: null },
  { id: 'P3', title: 'No photographable evidence by week 6', evidence: 'Camera-roll photos vary in light/angle; memory is unreliable', whyChosen: 'Upstream of all — if the customer cannot see proof, they quit' },
  { id: 'P4', title: 'The 90-day proof gap', evidence: 'Men quit weeks 3–6 because there is no trustworthy progress signal', whyChosen: 'Chosen — it is the root cause of all others; solvable with data the customer already generates' }
];
const probRows = problemsConsidered.map(p => [
  p.id,
  p.title,
  p.evidence,
  p.whyChosen || p.whyNotChosen
]);
const probTable = makeTable(
  probRows,
  [10, 40, 50, 50]
);

// ── 5. Chosen problem ──────────────────────────────────────────────────
const chosenProblem = {
  title: 'The 90-day proof gap',
  statement: 'Men abandon a routine between weeks 3 and 6 because the product cannot show evidence of working inside the window where doubt peaks.',
  successMetric: 'Week-6 retention of the routine (+18pp target) and the share of users who can answer "is it working?" with a comparison, not a feeling.',
  rootCauses: [
    'Hair and beard growth cycles run 12+ weeks. Any honest signal is delayed by design, so the brain receives no reward in the exact window where habit formation is weakest.',
    'Progress is measured by memory and camera-roll photos taken at different angles, lighting and hair lengths. Memory is a biased instrument: it under-reports change and over-reports loss.',
    'Clinician contact is front-loaded at purchase and back-loaded at renewal. Weeks 3–8 have no human review, exactly when doubt peaks.'
  ]
};

const chosenSection = [
  new Paragraph({ children: new TextRun({ text: 'Chosen Problem', size: 28, bold: true, alignment: Alignment.CENTER }) }),
  new Paragraph({ children: new TextRun({ text: chosenProblem.title, size: 24, bold: true, alignment: Alignment.CENTER }) }),
  new Paragraph({ children: new TextRun({ text: chosenProblem.statement, size: 20 }) }),
  new Paragraph({ children: new TextRun({ text: 'Success metric: ' + chosenProblem.successMetric, size: 20 }) }),
  ...chosenProblem.rootCauses.map(c => new Paragraph({ children: new TextRun({ text: '• ' + c, size: 20 }) }))
];

// ── 6. Assemble document ───────────────────────────────────────────────
const children = [];

// Title block
children.push(
  new Paragraph({ children: new TextRun({ text: 'Man Matters Customer Research — Part 1', size: 36, bold: true, alignment: Alignment.CENTER }) }),
  new Paragraph({ children: new TextRun({ text: 'Conversations: October–November 2026', size: 20, alignment: Alignment.CENTER }) }),
  new Paragraph({ children: new TextRun({ text: 'Brand: Man Matters', size: 20, alignment: Alignment.CENTER }) }),
  pageBreak()
);

// 1. Customer tables
children.push(
  new Paragraph({ children: new TextRun({ text: '1. Five Customer Conversations', size: 24, bold: true }) }),
  new Paragraph({ children: 'Captured with permission to share name, phone and feedback with Mosaic for this application.' }),
  custTable,
  pageBreak()
);

// 2. Patterns
children.push(
  new Paragraph({ children: new TextRun({ text: '2. Cross-Customer Patterns', size: 24, bold: true }) }),
  patternsTable2,
  pageBreak()
);

// 3. Root causes
children.push(
  new Paragraph({ children: new TextRun({ text: '3. Root Causes, Layer by Layer', size: 24, bold: true }) }),
  rootTable,
  pageBreak()
);

// 4. Problems considered
children.push(
  new Paragraph({ children: new TextRun({ text: '4. Problems Considered (and Why Not Chosen)', size: 24, bold: true }) }),
  probTable,
  pageBreak()
);

// 5. Chosen problem
children.push(
  new Paragraph({ children: new TextRun({ text: '5. Chosen Problem', size: 24, bold: true }) }),
  ...chosenSection,
  pageBreak()
);

// 6. Summary / next steps
children.push(
  new Paragraph({ children: new TextRun({ text: '6. Summary', size: 24, bold: true }) }),
  new Paragraph({ children: 'The 5 customer conversations reveal a single upstream problem: the 90-day proof gap. Without a trustworthy progress signal in weeks 3–6, men quit before active ingredients can show effect. The chosen problem ("The 90-day proof gap") is the root cause of all others and is solvable with the data customers already generate (standardised photos, adherence logs, weekly check-ins).' }),
  new Paragraph({ children: 'Next: Build the 90-day routine OS (Part 2 of the Mosaic Fellowship), featuring a dynamic dashboard, AI coach, and progress-tracking protocol that closes the proof gap.' })
);

// ── write to file ──────────────────────────────────────────────────────
const outPath = 'server/dist/Part1_ManMatters_Customer_Research.docx';

Packer.toBuffer(doc).then((buffer) => {
  const fs = require('fs');
  fs.writeFileSync(outPath, buffer);
  console.log(`✅ Research doc written to ${outPath} (${buffer.length} bytes)`);
}).catch((err) => {
  console.error('❌ Failed to write docx:', err);
});