/**
 * Part 1 — primary research.
 *
 * Five conversations with Man Matters customers, captured with permission to
 * share name, phone and feedback with Mosaic for this application.
 * `themes` are the tags used to compute cross-customer patterns at runtime,
 * so the insight layer is derived from the raw conversations rather than
 * being written by hand in the UI.
 */
export const RESEARCH = {
  brand: 'Man Matters',
  category: "Men's hair, beard and skin",
  conductedAt: 'October–November 2026',
  method: '20–30 minute phone conversations, unstructured with a fixed topic guide',
  customers: [
    {
      code: 'C1',
      name: 'Raj Gandhi',
      avatar: '/avatars/raj-gandhi.jpg',
      phone: '7410500109',
      age: 26,
      city: 'Ahmedabad',
      tenure: '7 months',
      products: ['Advanced Hair Growth Serum', 'Anti-Hairfall Shampoo', 'Biotin Gummies'],
      entryPoint: 'Instagram ad after noticing hair on his pillow',
      likes: [
        'Serum is non-sticky and absorbs in under a minute',
        'Shampoo does not dry out the scalp in Ahmedabad water',
        'Refill subscription means he never runs out'
      ],
      dislikes: [
        'Could not tell whether the serum or the gummies were doing the work',
        'Shedding in week 3 scared him into nearly stopping',
        'No one told him how much serum is one dose'
      ],
      problems: [
        'Stopped for 9 days in month one because shedding increased',
        'Uses 12–14 drops instead of 5–6, so a bottle lasts 3 weeks not 6',
        'Takes progress photos in different rooms and cannot compare them'
      ],
      wants: [
        'A clear "this is normal" explanation inside the app at the moment it happens',
        'A way to see week 1 vs week 10 in the same frame and light',
        'Dose guidance that adapts to bottle size'
      ],
      quote:
        'I did not stop because it was not working. I stopped because I could not tell if it was working, and my scalp was itching.',
      themes: ['shedding_panic', 'no_progress_signal', 'dose_confusion', 'photo_inconsistency', 'attribution_confusion'],
      sentiment: 3
    },
    {
      code: 'C2',
      name: 'Shreyans Jain',
      avatar: '/avatars/shreyans-jain.jpg',
      phone: '9518705240',
      age: 24,
      city: 'Indore',
      tenure: '4 months',
      products: ['Beard Growth Oil', 'Beard Growth Roller', 'Biotin Gummies'],
      entryPoint: 'Friend recommended the beard oil for patchy cheeks',
      likes: [
        'Beard feels softer within two weeks',
        'Roller plus oil combo feels like a real routine, not a gimmick',
        'Cheaper than a dermatologist visit for a first opinion'
      ],
      dislikes: [
        'Rolling is painful and he does not know if he is doing it right',
        'No guidance on how often to replace the roller',
        'Instagram content is generic, not about his patch pattern'
      ],
      problems: [
        'Used the roller daily for 10 days instead of twice a week, causing redness',
        'Skipped oil on days he was travelling and felt the routine had "reset"',
        'Never took a baseline photo, so he judges progress by memory'
      ],
      wants: [
        'A visual guide for roller pressure and frequency',
        'A routine that survives travel and missed days instead of breaking',
        'Honest expectation setting: "this area will take 12 weeks"'
      ],
      quote:
        'On day 12 my cheek was red and I thought I was allergic. Nobody told me twice a week means twice a week.',
      themes: ['usage_error', 'no_progress_signal', 'photo_inconsistency', 'generic_guidance', 'all_or_nothing'],
      sentiment: 3
    },
    {
      code: 'C3',
      name: 'Manan Sancheti',
      avatar: '/avatars/manan-sancheti.jpg',
      phone: '7058607951',
      age: 27,
      city: 'Pune',
      tenure: '11 months',
      products: ['Advanced Hair Growth Serum', 'Hair Health Tablets', 'Anti-Hairfall Shampoo', 'Clock Cap'],
      entryPoint: 'Doctor consultation on the Man Matters app, then a 6-month plan',
      likes: [
        'The doctor review felt legitimate and specific',
        'Crown density is visibly better in month 5 photos',
        'Customer support replaced a leaking bottle without friction'
      ],
      dislikes: [
        'The first 8 weeks were a black box — no feedback at all',
        'No single place to see routine, order history and doctor notes together',
        'Reminders are dumb: they fire at 9 pm even on days he already applied'
      ],
      problems: [
        'Bought the cap at month 4 without a clear answer on whether it adds anything on top of the serum',
        'Nearly dropped the tablets because his blood report showed normal biotin',
        'Has 3 apps open to manage one routine (shop, consultation, reminders)'
      ],
      wants: [
        'One dashboard that says "you are 62% through the cycle, here is what changed"',
        'A cost-per-week view of the full stack so he can decide what to keep',
        'Smart reminders that know what he already did today'
      ],
      quote:
        'I am spending about 3,000 rupees a month. I do not need motivation, I need a receipt that says it is working.',
      themes: ['no_progress_signal', 'stack_bloat', 'siloed_experience', 'dumb_reminders', 'cost_visibility'],
      sentiment: 4
    },
    {
      code: 'C4',
      name: 'Harsh Redasani',
      avatar: '/avatars/harsh-redasani.jpg',
      phone: '7709563712',
      age: 23,
      city: 'Surat',
      tenure: '2 months',
      products: ['Anti-Hairfall Shampoo', 'Biotin Gummies'],
      entryPoint: 'Bought the cheapest entry products to "test the brand"',
      likes: [
        'Affordable entry price compared to a clinic',
        'Gummies taste good, so he actually takes them',
        'Delivery was two days'
      ],
      dislikes: [
        'Not sure if the shampoo alone can do anything for hair fall',
        'No diagnosis before buying — he guessed',
        'WhatsApp support replied with a product link instead of an answer'
      ],
      problems: [
        'Bought shampoo first because the serum felt expensive, then read that shampoo is not a treatment',
        'Does not know whether to upgrade or stop',
        'No idea what "early stage" means for his own scalp'
      ],
      wants: [
        'A 60-second assessment that tells him the right starting product',
        'A cheaper starter routine that is honest about what it can and cannot do',
        'A clear upgrade path with a reason for each step'
      ],
      quote:
        'I bought the shampoo because it was the cheapest thing on the page. Two months later I still do not know if I have a real problem.',
      themes: ['wrong_first_product', 'no_diagnosis', 'generic_support', 'no_progress_signal'],
      sentiment: 3
    },
    {
      code: 'C5',
      name: 'Chandan Singh',
      avatar: '/avatars/chandan-singh.jpg',
      phone: '7400116050',
      age: 29,
      city: 'Lucknow',
      tenure: '14 months',
      products: ['Advanced Hair Growth Serum', 'Hair Health Tablets', 'Testosterone Booster', 'Weight Loss Program'],
      entryPoint: 'Weight loss program, then added hair products after a doctor call',
      likes: [
        'Weekly coach call is the only thing that kept him consistent',
        'Meal plan uses food his family already cooks',
        'Lost 7 kg in 14 weeks and kept 5 off'
      ],
      dislikes: [
        'The hair routine and the weight program live in different places',
        'Coach changes every 6 weeks, so he repeats his history',
        'Blood test reports are shared over email, not in the app'
      ],
      problems: [
        'Misses the hair routine on gym days because both happen at night',
        'Cannot see how weight, sleep and hair fall trend together',
        'Wants to continue but the renewal conversation is a sales call, not a review'
      ],
      wants: [
        'A single weekly review across all his goals',
        'Trend lines for sleep, weight and adherence on one screen',
        'A renewal that is a clinical review with a recommendation, not a discount'
      ],
      quote:
        'The coach call worked. The app did not. Give me the coach call inside the app and I will never leave.',
      themes: ['siloed_experience', 'no_progress_signal', 'dumb_reminders', 'retention_risk', 'coaching_gap'],
      sentiment: 4
    }
  ],
  problemsConsidered: [
    {
      id: 'P1',
      title: 'Too many products, no diagnosis',
      evidence: 'C4 bought shampoo as a first product; C2 guessed between oil and roller; C3 stacked four products without a clear additive rationale.',
      whyNot:
        'A recommendation quiz is a solved pattern and sits on the pre-purchase side. It improves conversion but does not fix the experience once the product is in the bathroom cabinet — and the churn happens after purchase.'
    },
    {
      id: 'P2',
      title: 'Dose and usage errors',
      evidence: 'C1 uses 2x the recommended serum; C2 rolled daily instead of twice weekly; C3 does not know if the cap is additive.',
      whyNot:
        'Real, but it is a symptom of something larger: there is no feedback loop that catches the error. Instruction copy alone does not change behaviour; a two-week check-in does.'
    },
    {
      id: 'P3',
      title: 'Fragmented experience across shop, consult and reminders',
      evidence: 'C3 runs three apps for one routine; C5 has hair and weight programs in separate places.',
      whyNot:
        'This is an organisational and platform problem. A fellowship prototype cannot unify Mosaic\'s order and consultation backends, and solving it would not by itself stop week-4 abandonment.'
    },
    {
      id: 'P4',
      title: 'The 90-day proof gap',
      evidence: 'All five customers could not tell whether the product was working; three stopped or nearly stopped before week 6; all five wanted standardised comparison.',
      chosen: true,
      whyChosen:
        'It is the only problem that is present in every conversation, causally upstream of churn, and solvable with software that reads data the customer already generates. It also explains the other problems: dose confusion and product stacking only matter because nobody can see whether they are working.'
    }
  ],
  rootCauses: [
    {
      layer: 'Biological',
      cause: 'Hair and beard growth cycles run 12+ weeks. Any honest signal is delayed by design, so the brain receives no reward in the exact window where habit formation is weakest.'
    },
    {
      layer: 'Product',
      cause: 'Progress is measured by memory and camera-roll photos taken at different angles, lighting and hair lengths. Memory is a biased instrument: it under-reports change and over-reports loss.'
    },
    {
      layer: 'Service',
      cause: 'Clinician contact is front-loaded at purchase and back-loaded at renewal. Weeks 3–8 — the abandonment window — have no human touchpoint at all.'
    },
    {
      layer: 'Behavioural',
      cause: 'The routine is all-or-nothing. Miss two days and the mental model becomes "I have failed the course", which is a stronger quit trigger than the missed doses themselves.'
    },
    {
      layer: 'Commercial',
      cause: 'Subscription refills keep arriving on schedule even when adherence has dropped, so the business sees revenue retention while the customer has already disengaged.'
    }
  ],
  chosenProblem: {
    title: 'The 90-day proof gap',
    statement:
      'Men on a Man Matters hair or beard routine abandon it between weeks 3 and 6 — not because the product failed, but because the product cannot show evidence of working inside the window where doubt peaks. With no standardised progress signal and no clinician touchpoint in that window, a normal shedding phase reads as failure, a missed week reads as a failed course, and the customer churns before the active ingredients have had time to act.',
    whyTechnology:
      'The data needed to close the gap is already being generated: dose timestamps, selfies, sleep, stress, order history and doctor notes. The missing piece is a system that standardises the input, visualises the trend against the expected 12-week curve, and puts a grounded coach in the moment of doubt. That is a software problem, not a packaging problem.',
    successMetric:
      'Week-6 retention of the routine (target: +18 percentage points vs baseline) and the share of users who can answer "is it working?" with a comparison rather than a feeling.'
  },
  solutionLink: {
    name: 'Man Matters Companion',
    oneLiner: 'A 90-day routine OS that turns the proof gap into a guided, measurable, doctor-backed program.',
    pillars: [
      'Personalised 13-week plan generated from a 6-step assessment, not a product page',
      'One-tap daily check-in with a standardised photo protocol (angle, light, distance)',
      'A coach grounded in the user\'s own adherence data, with clinical escalation when the data says stop guessing',
      'A weekly review that names the next single action instead of showing a dashboard of guilt'
    ]
  }
};

export const derivePatterns = (customers) => {
  const map = new Map();
  customers.forEach((c) => {
    c.themes.forEach((t) => {
      const entry = map.get(t) || { theme: t, count: 0, customers: [] };
      entry.count += 1;
      entry.customers.push(c.code);
      map.set(t, entry);
    });
  });
  const labels = {
    shedding_panic: 'Shedding phase mistaken for product failure',
    no_progress_signal: 'No trustworthy way to see whether it is working',
    photo_inconsistency: 'Photos not comparable (angle, light, length)',
    dose_confusion: 'Dose / quantity confusion',
    usage_error: 'Frequency and technique errors',
    generic_guidance: 'Advice is generic, not about my pattern',
    all_or_nothing: 'A missed day feels like a failed course',
    attribution_confusion: 'Cannot tell which product is doing the work',
    stack_bloat: 'Too many products, no additive logic',
    siloed_experience: 'Routine split across app, shop, email, WhatsApp',
    dumb_reminders: 'Reminders ignore what was already done',
    cost_visibility: 'No view of cost per week of the stack',
    wrong_first_product: 'Bought the cheapest product, not the right one',
    no_diagnosis: 'No assessment before purchase',
    generic_support: 'Support replies with a link, not an answer',
    coaching_gap: 'Human coaching works but lives outside the product',
    retention_risk: 'Renewal feels like sales, not review'
  };
  return [...map.values()]
    .map((v) => ({ ...v, label: labels[v.theme] || v.theme, share: v.count / customers.length }))
    .sort((a, b) => b.count - a.count);
};
