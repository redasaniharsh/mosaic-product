/**
 * Man Matters catalogue.
 *
 * This is the single source of truth for the storefront, the routine builder
 * and the AI coach's grounding context. Prices/pack sizes mirror the public
 * Man Matters storefront at the time of writing; the routine engine never
 * depends on price — it only reads `concerns`, `cadence` and `step`.
 */
export const PRODUCTS = [
  {
    slug: 'advanced-hair-growth-serum',
    name: 'Advanced Hair Growth Serum',
    category: 'Hair',
    form: 'serum',
    tagline: 'Redensyl 3% + Procapil 1.5% + Capilia Longa',
    description:
      'A leave-in scalp serum built for early-stage hair fall and thinning. The three actives target the follicle at different points of the growth cycle, which is why it is dosed nightly rather than weekly.',
    price: 799,
    mrp: 999,
    size: '30 ml',
    actives: ['Redensyl 3%', 'Procapil 1.5%', 'Capilia Longa 1%'],
    concerns: ['hair_fall', 'thinning', 'receding_hairline'],
    step: 3,
    timeOfDay: 'PM',
    cadence: 'daily',
    instructions: '5–6 drops on a dry, clean scalp. Massage for 60 seconds. Leave overnight, wash next morning.',
    cautions: 'Expect a shedding phase in weeks 2–4 as resting hairs cycle out. Do not stop during this window.',
    rating: 4.3,
    reviews: 18420,
    accent: '#1F3D2B',
    evidence: 'Randomised trials on Redensyl and Procapil report visible density gains from week 8, with the strongest signal at week 12–16.'
  },
  {
    slug: 'anti-hairfall-shampoo',
    name: 'Anti-Hairfall Shampoo',
    category: 'Hair',
    form: 'wash',
    tagline: 'Anagain + caffeine, sulphate-free',
    description:
      'A gentle daily cleanser that removes serum build-up without stripping the scalp barrier. Caffeine and Anagain support the follicle during the washing cycle.',
    price: 399,
    mrp: 499,
    size: '200 ml',
    actives: ['Anagain 1%', 'Caffeine', 'Panthenol'],
    concerns: ['hair_fall', 'dandruff', 'oily_scalp'],
    step: 1,
    timeOfDay: 'AM',
    cadence: '3x_week',
    instructions: 'Massage into wet scalp for 60 seconds, leave for 2 minutes, rinse. 3–4 times a week.',
    cautions: 'Not a treatment on its own. Pair with a leave-in serum if the concern is density.',
    rating: 4.2,
    reviews: 9310,
    accent: '#2E4B3B',
    evidence: 'Cleansing reduces follicular obstruction; caffeine has modest in-vitro follicle stimulation data.'
  },
  {
    slug: 'biotin-gummies',
    name: 'Biotin Gummies',
    category: 'Nutrition',
    form: 'gummy',
    tagline: 'Biotin 10000 mcg + Zinc + Vitamin B5',
    description:
      'A daily micronutrient top-up for hair, skin and nails. Biotin is the co-factor your body needs to keratinise hair — it does not regrow hair on its own.',
    price: 499,
    mrp: 649,
    size: '30 gummies',
    actives: ['Biotin 10000 mcg', 'Zinc', 'Vitamin B5'],
    concerns: ['hair_fall', 'thinning', 'skin_glow', 'beard_patchy'],
    step: 2,
    timeOfDay: 'AM',
    cadence: 'daily',
    instructions: 'One gummy after breakfast. Chew, do not swallow whole.',
    cautions: 'If you have a diagnosed biotin deficiency, dose with your doctor. Stop 3 days before lab tests.',
    rating: 4.4,
    reviews: 12680,
    accent: '#8A6A1F',
    evidence: 'Useful only when intake is below requirement. Blood work is the honest way to know.'
  },
  {
    slug: 'hair-health-tablets',
    name: 'Hair Health Tablets',
    category: 'Nutrition',
    form: 'tablet',
    tagline: 'Saw Palmetto + Iron + Vitamin D3',
    description:
      'A once-daily tablet for men whose hair fall tracks with low iron, low vitamin D or DHT sensitivity. Built to be taken alongside a topical serum, not instead of one.',
    price: 649,
    mrp: 799,
    size: '30 tablets',
    actives: ['Saw Palmetto 320 mg', 'Iron', 'Vitamin D3'],
    concerns: ['hair_fall', 'thinning'],
    step: 2,
    timeOfDay: 'AM',
    cadence: 'daily',
    instructions: 'One tablet after a meal that contains fat, for better D3 absorption.',
    cautions: 'Saw palmetto may interact with blood thinners. Confirm with a doctor if you are on medication.',
    rating: 4.1,
    reviews: 5120,
    accent: '#6B4A2A',
    evidence: 'Saw palmetto has mixed but positive evidence in androgenetic alopecia over 12–24 weeks.'
  },
  {
    slug: 'beard-growth-oil',
    name: 'Beard Growth Oil',
    category: 'Beard',
    form: 'oil',
    tagline: 'Redensyl + Rosemary + Jojoba',
    description:
      'A lightweight beard oil that conditions the skin under the beard — the part most men ignore. Healthier skin means fewer patchy gaps and less itch.',
    price: 449,
    mrp: 599,
    size: '30 ml',
    actives: ['Redensyl 2%', 'Rosemary oil', 'Jojoba oil'],
    concerns: ['beard_patchy', 'beard_itch'],
    step: 3,
    timeOfDay: 'PM',
    cadence: 'daily',
    instructions: '4–5 drops into the palm, work through the beard to the skin. Do not rinse.',
    cautions: 'Patch-test behind the ear for 24 hours if you have sensitive skin.',
    rating: 4.2,
    reviews: 7640,
    accent: '#5A3B22',
    evidence: 'Rosemary oil has small-trial evidence comparable to 2% minoxidil over 6 months.'
  },
  {
    slug: 'beard-growth-roller',
    name: 'Beard Growth Roller',
    category: 'Beard',
    form: 'device',
    tagline: '0.5 mm titanium microneedles',
    description:
      'A 0.5 mm dermal roller used twice a week before oil. Micro-channels improve absorption and stimulate the skin\'s repair response in patchy zones.',
    price: 599,
    mrp: 799,
    size: '1 roller',
    actives: ['0.5 mm titanium needles'],
    concerns: ['beard_patchy'],
    step: 2,
    timeOfDay: 'PM',
    cadence: '2x_week',
    instructions: 'Roll 6–8 passes in each direction on clean, dry skin. Sanitise with 70% alcohol before and after.',
    cautions: 'Never roll over active acne, broken skin or moles. Replace every 3 months.',
    rating: 4.0,
    reviews: 3180,
    accent: '#3C3C3C',
    evidence: 'Microneedling plus topical actives outperforms either alone in several beard and scalp studies.'
  },
  {
    slug: 'vitamin-c-serum',
    name: 'Vitamin C Face Serum',
    category: 'Skin',
    form: 'serum',
    tagline: '10% Vitamin C + Ferulic acid',
    description:
      'A morning brightening serum that evens out pigmentation from sun and post-acne marks. Ferulic acid keeps the vitamin C stable in Indian humidity.',
    price: 599,
    mrp: 799,
    size: '30 ml',
    actives: ['10% Vitamin C', 'Ferulic acid 0.5%', 'Hyaluronic acid'],
    concerns: ['skin_glow', 'pigmentation', 'dull_skin'],
    step: 2,
    timeOfDay: 'AM',
    cadence: 'daily',
    instructions: '3–4 drops on damp skin, follow with sunscreen. Store away from sunlight.',
    cautions: 'Mild tingling is normal for the first week. Stop if it persists beyond 10 minutes.',
    rating: 4.3,
    reviews: 8920,
    accent: '#B35A1F',
    evidence: 'Topical vitamin C at 10%+ reduces pigmentation over 8–12 weeks in controlled studies.'
  },
  {
    slug: 'under-eye-cream',
    name: 'Under Eye Cream',
    category: 'Skin',
    form: 'cream',
    tagline: 'Caffeine + Peptides + Niacinamide',
    description:
      'A cooling cream for puffiness and dark circles driven by late nights and screen time. Best used in the morning, before sunscreen.',
    price: 549,
    mrp: 699,
    size: '15 g',
    actives: ['Caffeine 3%', 'Peptides', 'Niacinamide 4%'],
    concerns: ['dark_circles', 'puffiness', 'tired_face'],
    step: 3,
    timeOfDay: 'AM',
    cadence: 'daily',
    instructions: 'Tap a rice-grain amount under each eye with the ring finger. Do not drag.',
    cautions: 'Not for use inside the eyelid. If irritation starts, use every alternate day.',
    rating: 4.1,
    reviews: 6410,
    accent: '#3A5A70',
    evidence: 'Caffeine reduces short-term puffiness; niacinamide improves pigmentation over 8 weeks.'
  },
  {
    slug: 'acne-control-serum',
    name: 'Acne Control Serum',
    category: 'Skin',
    form: 'serum',
    tagline: 'Salicylic 2% + Zinc PCA',
    description:
      'A spot-and-zone serum for oily, acne-prone skin. Salicylic acid clears the pore lining while zinc reduces oil production and inflammation.',
    price: 499,
    mrp: 649,
    size: '30 ml',
    actives: ['Salicylic acid 2%', 'Zinc PCA 1%', 'Niacinamide 4%'],
    concerns: ['acne', 'oily_skin', 'acne_marks'],
    step: 3,
    timeOfDay: 'PM',
    cadence: '5x_week',
    instructions: 'Apply a thin layer on affected zones at night. Start 3 nights a week, build to 5.',
    cautions: 'Do not combine with a retinoid on the same night. Use sunscreen daily.',
    rating: 4.2,
    reviews: 4980,
    accent: '#2E5C4A',
    evidence: '2% salicylic acid is a first-line OTC acne active with a 6–8 week response window.'
  },
  {
    slug: 'testosterone-booster',
    name: 'Testosterone Booster',
    category: 'Performance',
    form: 'tablet',
    tagline: 'Shilajit + Ashwagandha + Zinc',
    description:
      'A daily tablet for men who report low energy, poor recovery and reduced drive. Built around adaptogens, not stimulants.',
    price: 899,
    mrp: 1099,
    size: '60 tablets',
    actives: ['Shilajit 250 mg', 'Ashwagandha 300 mg', 'Zinc'],
    concerns: ['low_energy', 'low_libido', 'poor_recovery'],
    step: 2,
    timeOfDay: 'PM',
    cadence: 'daily',
    instructions: 'Two tablets with dinner. Allow 6–8 weeks for a meaningful change in energy.',
    cautions: 'Not a treatment for clinically low testosterone. Get a blood panel first.',
    rating: 4.1,
    reviews: 7310,
    accent: '#7A4A1F',
    evidence: 'Ashwagandha shows modest cortisol and testosterone changes in small trials; shilajit data is early.'
  },
  {
    slug: 'delay-spray',
    name: 'Delay Spray',
    category: 'Intimate Wellness',
    form: 'spray',
    tagline: 'Lidocaine 7.5% metered spray',
    description:
      'A discreet metered spray for premature ejaculation. Two sprays, ten minutes before, reduces sensitivity without numbing the experience.',
    price: 499,
    mrp: 599,
    size: '20 ml',
    actives: ['Lidocaine 7.5%'],
    concerns: ['intimate_wellness'],
    step: 1,
    timeOfDay: 'PM',
    cadence: 'as_needed',
    instructions: '2 sprays on the glans 10 minutes before. Wash off before contact if numbness is too strong.',
    cautions: 'Never combine with condoms that contain benzocaine. Speak to a doctor if it persists.',
    rating: 4.0,
    reviews: 5620,
    accent: '#5B2E4A',
    evidence: 'Metered lidocaine sprays are clinically validated for PE; therapy plus spray works better than either.'
  },
  {
    slug: 'weight-loss-program',
    name: 'Man Matters Weight Loss Program',
    category: 'Programs',
    form: 'program',
    tagline: 'Doctor + coach led, 12 weeks',
    description:
      'A structured 12-week program with an Indian-diet meal plan, weekly coach calls and a doctor review every four weeks. Built for men who have tried and bounced off generic diets.',
    price: 2499,
    mrp: 3499,
    size: '12 weeks',
    actives: ['Meal plan', 'Weekly coach call', 'Doctor review'],
    concerns: ['weight', 'belly_fat', 'low_energy'],
    step: 1,
    timeOfDay: 'AM',
    cadence: 'daily',
    instructions: 'Log meals and steps daily. Coach call every Sunday. Blood panel at week 0 and week 8.',
    cautions: 'Requires a baseline blood panel. Not suitable during pregnancy or for minors.',
    rating: 4.4,
    reviews: 2140,
    accent: '#1F4A5C',
    evidence: 'Structured coaching with monthly clinician review outperforms app-only plans in retention and weight loss.'
  },
  {
    slug: 'clock-cap',
    name: 'Man Matters Clock Cap',
    category: 'Hair',
    form: 'device',
    tagline: 'Red light therapy, 650 nm',
    description:
      'A wearable low-level laser cap for androgenetic alopecia, used 20 minutes on alternate days. Works on the same follicle pathways as topical actives.',
    price: 4999,
    mrp: 6999,
    size: '1 cap',
    actives: ['650 nm red light'],
    concerns: ['thinning', 'hair_fall', 'receding_hairline'],
    step: 4,
    timeOfDay: 'PM',
    cadence: '3x_week',
    instructions: '20 minutes on a dry scalp, three days a week. Charge after every 4 sessions.',
    cautions: 'Not for use with photosensitivity conditions. Results are slow — 16 weeks minimum.',
    rating: 4.2,
    reviews: 1180,
    accent: '#7A1F1F',
    evidence: 'LLLT at 650 nm has FDA-cleared evidence in androgenetic alopecia over 16–26 weeks.'
  }
];

export const CONCERNS = [
  { id: 'hair_fall', label: 'Hair fall', blurb: 'More strands on the pillow, shower or comb than last year.' },
  { id: 'thinning', label: 'Thinning & density', blurb: 'Scalp visible under light, crown feels lighter.' },
  { id: 'receding_hairline', label: 'Receding hairline', blurb: 'Temples moving back, M-shape forming.' },
  { id: 'beard_patchy', label: 'Patchy beard', blurb: 'Cheeks or chin that will not fill in.' },
  { id: 'skin_glow', label: 'Dull skin', blurb: 'Tired, uneven tone, no glow.' },
  { id: 'acne', label: 'Acne & oiliness', blurb: 'Breakouts that return every few weeks.' },
  { id: 'pigmentation', label: 'Dark spots', blurb: 'Post-acne marks and sun patches that linger.' },
  { id: 'dark_circles', label: 'Dark circles', blurb: 'Under-eye shadows that sleep does not fix.' },
  { id: 'low_energy', label: 'Low energy', blurb: 'Afternoon crashes, poor recovery.' },
  { id: 'weight', label: 'Weight & belly fat', blurb: 'The same 4 kg that keeps coming back.' },
  { id: 'intimate_wellness', label: 'Intimate wellness', blurb: 'Confidence and control.' },
  { id: 'sleep', label: 'Sleep quality', blurb: 'Waking up unrefreshed.' }
];

export const PHASES = [
  {
    week: 1,
    name: 'Foundation',
    range: 'Week 1–4',
    summary: 'Build the habit before you judge the result.',
    expectation: 'Scalp may shed more in weeks 2–4. This is the cycle resetting, not the product failing.',
    signal: 'Your only job: hit 5 of 7 days.'
  },
  {
    week: 5,
    name: 'Consistency',
    range: 'Week 5–8',
    summary: 'The habit is load-bearing now. This is where most routines die.',
    expectation: 'Shedding should settle. Baby hairs may appear at the hairline.',
    signal: 'Adherence above 70% is the strongest predictor of a visible result at week 12.'
  },
  {
    week: 9,
    name: 'Evidence',
    range: 'Week 9–13',
    summary: 'Compare like-for-like photos, not memory.',
    expectation: 'Density changes become photographable at the same angle and light.',
    signal: 'If there is no change at all by week 12, escalate to a doctor — do not buy another serum.'
  }
];

export const publicReviewThemes = [
  {
    source: 'Marketplace reviews (paraphrased)',
    theme: 'Shedding panic in month one',
    detail:
      'A recurring review pattern across the hair serum listing: buyers report more hair fall in the first 3–4 weeks and stop using it, then rate it 1 star. The packaging explains the shedding cycle, but it is on the carton, not in the habit.',
    sentiment: 'negative',
    weight: 0.28
  },
  {
    source: 'Marketplace reviews (paraphrased)',
    theme: 'No way to know if it is working',
    detail:
      'Long-tenure buyers ask for a way to compare photos because "you forget what your hair looked like in month one". Several say they finished a 3-month course without being able to tell whether anything changed.',
    sentiment: 'neutral',
    weight: 0.24
  },
  {
    source: 'Marketplace reviews (paraphrased)',
    theme: 'Great results, terrible consistency',
    detail:
      'The 5-star reviews are usually from people who finished the full course. The 2-star reviews are usually from people who stopped at week 3. The product is the same; the routine is what differed.',
    sentiment: 'positive',
    weight: 0.2
  },
  {
    source: 'Marketplace reviews (paraphrased)',
    theme: 'Which serum is actually for me?',
    detail:
      'Buyers compare the hair serum, tablets and shampoo in the question section, unsure which one matches their stage. Support answers are generic ("suitable for all hair types"), which pushes people to buy all three.',
    sentiment: 'negative',
    weight: 0.16
  },
  {
    source: 'Marketplace reviews (paraphrased)',
    theme: 'Refills arrive, routine drifts',
    detail:
      'Subscription buyers say the refill arrives before the previous bottle is empty, which quietly signals they are behind. Nobody tells them what to do about the gap.',
    sentiment: 'negative',
    weight: 0.12
  }
];
