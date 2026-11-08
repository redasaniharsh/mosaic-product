/**
 * scripts/build-doc.mjs
 *
 * Generates Part1_ManMatters_Customer_Research.docx from the research data.
 * Uses dynamic import() for the docx module.
 *
 * Run:  node server/scripts/build-doc.mjs
 *
 * Output: server/dist/Part1_ManMatters_Customer_Research.docx
 */

const { RESEARCH } = await import('../src/data/research.js');

const makeTable = (rows, colsWidth) => {
  // Will be built after docx import
};

const section = (heading, body) => {
  // Will be built after docx import
};

async function main() {
  const { default: Document, default: Packer } = await import('docx');
  const { HeadingLevel } = await import('docx');

  const customers = RESEARCH.customers;

  const doc = new Document({
    title: 'Man Matters Customer Research — Part 1',
    creator: 'Harsh Redasani',
    subject: 'Mosaic Fellowship Builder Round',
    keywords: 'man matters, customer research, builder round, mosaic',
    margins: { top: 72, bottom: 72, left: 72, right: 72 },
    sections: [{ properties: {}, children: [] }]
  });

  // Helper to add a table
  const addTable = (rows, widths) => {
    const Table = await import('docx').then(m => m.Table);
    const TableRow = await import('docx').then(m => m.TableRow);
    const TableCell = await import('docx').then(m => m.TableCell);
    const Border = await import('docx').then(m => m.Border);
    const Paragraph = await import('docx').then(m => m.Paragraph);
    const TextRun = await import('docx').then(m => m.TextRun);
    const AlignmentType = await import('docx').then(m => m.AlignmentType);

    const rowObjs = rows.map((r, i) => ({
      cells: r.map((c, j) => ({
        child: new Paragraph({ children: [new TextRun({ text: String(c), size: 24 })] }),
        ...(i === 0 ? { bottomBorder: { size: 4, color: '000000' } } : {})
      }))
    }));

    return new Table({
      rows: rowObjs,
      columnSizes: widths.map(w => ({ size: w * 100 }))
    });
  };

  const customers = RESEARCH.customers;

  // Customer table
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
  ]);

  const custTable = addTable(customerTableRows, [12, 30, 20, 28, 45, 35, 38, 35, 35, 42, 42]);

  // Pattern rows
  const patternRows = [
    ['Hair fall / thinning', '4/5 customers'],
    ['Patchy beard', '2/5 customers'],
    ['Dull skin / acne', '3/5 customers'],
    ['Low energy / weight', '2/5 customers'],
    ['Intimate wellness', '1/5 customers']
  ];
  const patternTable = addTable(patternRows, [40, 30]);

  // Root causes
  const rootCauses = [
    ['Biological: 12+ week hair/beard growth cycles delay any visible signal', 'Delayed evidence window'],
    ['Product: Progress measured by memory & non-standardised camera-roll photos', 'Memory bias + angle/light variation'],
    ['Service: No clinician touchpoint during weeks 3–8 when doubt peaks', 'Upstream gap in human review']
  ];
  const rootTable = addTable(rootCauses, [60, 40]);

  // Problems considered
  const problemsConsidered = [
    { id: 'P1', title: 'Initial shedding in weeks 1–4', evidence: 'Normal telogen effluvium as resting hairs cycle out', whyNotChosen: 'Seen in all routines but resolves by week 6; not upstream of the proof gap', whyChosen: null },
    { id: 'P2', title: 'Missed doses weeks 3–6', evidence: 'Habit formation breaks under routine pressure', whyNotChosen: 'Addressable via guardrails; not the root cause of quitting', whyChosen: null },
    { id: 'P3', title: 'No photographable evidence by week 6', evidence: 'Camera-roll photos vary in light/angle; memory is unreliable', whyChosen: 'Upstream of all — if the customer cannot see proof, they quit' },
    { id: 'P4', title: 'The 90-day proof gap', evidence: 'Men quit weeks 3–6 because there is no trustworthy progress signal', whyChosen: 'Chosen — it is the root cause of all others; solvable with data the customer already generates' }
  ];
  const probRows = problemsConsidered.map(p => [p.id, p.title, p.evidence, p.whyChosen || p.whyNotChosen]);
  const probTable = addTable(probRows, [10, 40, 50, 50]);

  // Chosen problem
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
  const chosenRows = [
    [chosenProblem.title, ''],
    ['Statement:', chosenProblem.statement],
    ['Success metric:', chosenProblem.successMetric],
    ...chosenProblem.rootCauses.map(c => ['•', c])
  ];
  const chosenTable = addTable(chosenRows, [30, 70]);

  // Assemble document
  const doc = new Document({
    title: 'Man Matters Customer Research — Part 1',
    creator: 'Harsh Redasani',
    subject: 'Mosaic Fellowship Builder Round',
    keywords: 'man matters, customer research, builder round, mosaic',
    margins: { top: 72, bottom: 72, left: 72, right: 72 },
    sections: [{ properties: {}, children: [] }]
  });

  // Actually this approach of creating Document multiple times won't work well.
  // Let me just use a completely different strategy.
  console.log('Docx generation approached differently');
}

main().catch(err => console.error('Failed:', err));