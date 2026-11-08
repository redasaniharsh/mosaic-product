export type Role = 'user' | 'assistant';

export interface UserPlan {
  headline: string;
  summary: string;
  focusAreas: { title: string; body: string }[];
  expectations: string[];
  watchFor: string[];
  guardrails: { title: string; body: string }[];
  generatedBy?: string;
  generatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  age?: number | null;
  city?: string | null;
  goal?: string | null;
  concern?: string | null;
  onboarded: boolean;
  plan?: UserPlan | null;
  role?: string;
}

export interface RoutineItem {
  id: string;
  product_slug: string;
  name: string;
  step: number | null;
  time_of_day: 'AM' | 'PM' | string;
  cadence: string;
  week_start: number;
  week_end: number;
  phase: number;
  instructions: string;
  optional: boolean;
  dose?: string;
  done?: boolean;
  image?: string;
  accent?: string;
}

export interface Routine {
  id: string;
  headline: string;
  rationale: string;
  startDate: string;
  durationDays: number;
  week: number;
  day: number;
  phase: { week: number; name: string; range: string; summary: string; expectation: string; signal: string; index: number };
  items: RoutineItem[];
}

export interface DayItem extends RoutineItem {
  done: boolean;
}

export interface Stats {
  adherence7: number;
  adherence30: number;
  adherenceAll: number;
  streak: { current: number; best: number };
  score: { score: number; parts: { key: string; label: string; weight: number; value: number }[] };
  refills: { slug: string; name: string; daysLeft: number }[];
  photoCount: number;
  lastPhoto: string | null;
}

export interface PhotoMeta {
  id: string;
  date: string;
  week: number;
  angle: string;
  lighting?: number | null;
  notes?: string | null;
  data_url?: string;
}

export interface Overview {
  onboarded: boolean;
  user?: { name: string; goal: string; concern: string; city?: string };
  routine?: Routine | null;
  today?: {
    date: string;
    items: DayItem[];
    doneCount: number;
    total: number;
    completed: boolean;
    checkin: {
      hairFall: number | null;
      sleepHours: number | null;
      water: number | null;
      stress: number | null;
      mood: string | null;
      notes: string | null;
    } | null;
  };
  stats?: Stats;
  photos?: PhotoMeta[];
  plan?: UserPlan | null;
}

export interface Signal {
  id: string;
  tone: 'good' | 'warn' | 'clinical' | 'neutral';
  title: string;
  body: string;
  action?: { label: string; href: string };
}

export interface Insight {
  id?: string;
  week: number;
  title?: string;
  headline?: string;
  body: string;
  actions: { label: string; detail: string }[];
  source?: string;
  verdict?: string;
  coachNote?: string;
  cached?: boolean;
}

export interface Product {
  slug: string;
  name: string;
  category: string;
  form: string;
  tagline: string;
  description: string;
  price: number;
  mrp: number;
  size: string;
  actives: string[];
  concerns: string[];
  step: number;
  time_of_day: string;
  cadence: string;
  instructions: string;
  cautions: string;
  rating: number;
  reviews: number;
  accent: string;
  evidence: string;
  image?: string;
  reviewsList?: Review[];
}

export interface Review {
  id: string;
  rating: number;
  text: string;
  source: string;
  theme: string;
}

export interface SeriesPoint {
  date: string;
  label: string;
  adherence: number | null;
  hairFall: number | null;
  sleep: number | null;
  stress: number | null;
  logged: boolean;
  expected: number;
  done: number;
}

export interface HeatCell {
  date: string;
  level: number;
  done: number;
  expected: number;
  future: boolean;
}

export interface WeekRow {
  week: number;
  start: string;
  end: string;
  phase: number;
  state: 'past' | 'current' | 'upcoming';
  adherence: number | null;
  hairFall: number | null;
  logged: number;
  photos: number;
}

export interface SiteData {
  brand: { name: string; category: string; method: string; conductedAt: string };
  stats: { customers: number; products: number; checkins: number; routines: number; ai: boolean };
  patterns: { theme: string; label: string; count: number; share: number; customers: string[] }[];
  quotes: { name: string; city: string; tenure: string; quote: string; themes: string[]; sentiment: number }[];
  chosenProblem: {
    title: string;
    statement: string;
    whyTechnology: string;
    successMetric: string;
  };
  problemsConsidered: { id: string; title: string; evidence: string; whyNot: string; chosen?: boolean; whyChosen?: string }[];
  rootCauses: { layer: string; cause: string }[];
  solution: { name: string; oneLiner: string; pillars: string[] };
  phases: { week: number; name: string; range: string; summary: string; expectation: string; signal: string }[];
  concerns: { id: string; label: string; blurb: string }[];
  reviewThemes: { source: string; theme: string; detail: string; sentiment: string; weight: number }[];
  featured: {
    slug: string;
    name: string;
    category: string;
    tagline: string;
    price: number;
    mrp: number;
    rating: number;
    reviews: number;
    accent: string;
    form: string;
  }[];
}

export interface ChatMessage {
  role: Role;
  content: string;
  meta?: { mode?: string; redFlag?: boolean } | null;
  streaming?: boolean;
}
