/**
 * AI layer — provider chain + grounding.
 *
 * Design rules:
 * 1. The model never invents the user's numbers. Every prompt is built from
 *    rows in SQLite (adherence, week, logged hair fall, sleep, stack).
 * 2. The rule engine owns safety and plan composition. The model owns language.
 * 3. Degrade, never dead-end: Gemini (multiple keys) → NVIDIA Nemotron → a
 *    deterministic, data-driven coach. The UI always gets an answer.
 */
import { env } from '../env.js';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isTransient = (status) => status === 503 || status === 429 || status === 500;

export const providers = () => {
  const list = env.geminiKeys.map((key, i) => ({
    id: i === 0 ? 'gemini' : `gemini-${i + 1}`,
    label: env.geminiModel,
    kind: 'gemini',
    key
  }));
  if (env.nvidiaKey) {
    list.push({ id: 'nvidia', label: env.nvidiaModel, kind: 'nvidia', key: env.nvidiaKey });
  }
  return list;
};

export const aiEnabled = () => providers().length > 0;
export const aiStatus = () => ({
  enabled: aiEnabled(),
  chain: providers().map((p) => `${p.kind}:${p.label}`),
  fallback: 'rules'
});

const RED_FLAGS = [
  'sudden patchy loss',
  'painful scalp',
  'bleeding',
  'pus',
  'scaling patches',
  'rash',
  'chest pain',
  'suicidal',
  'lump',
  'fever'
];

/* ------------------------------ Scope guard ------------------------------- */
/**
 * The coach is deliberately narrow: it answers only about this user's 90-day
 * programme. These checks run before any model call, so an off-topic request
 * can never turn into a generic chatbot answer — it always returns a short,
 * on-brand reply that steers back to the routine.
 */

const GREETING = /^(hi|hey|hello|yo|hola|namaste|good\s+(morning|afternoon|evening)|thanks|thank\s+you|ok|okay|cool)\W*$/i;

const ON_TOPIC =
  /\b(hair|beard|skin|scalp|face|acne|pimple|dandruff|serum|shampoo|tablet|gumm(?:y|ies)|supplement|biotin|minoxidil|redensyl|procapil|retinol|sunscreen|moisturi[sz]|routine|plan|programme|week|phase|dose|step|refill|product|stack|order|delivery|adherence|streak|check[- ]?in|progress|photo|sleep|stress|diet|food|protein|water|workout|gym|energy|tired|itch|burn|irritat|side[- ]?effect|rash|patch|bleed|pus|pain|lump|fever|doctor|clinician|derm|review|escalat|man\s+matters|companion|coach|shedding|growth|density|thinning|receding|bald|moustache|shave|weight|belly|fat|testosterone|performance|intimate|delay|wash|apply|morning|night)\b/i;

// Unambiguous requests outside the product. These win over any stray keyword.
const HARD_OFF_TOPIC = [
  /\b(write|give|make|generate|create|build)\b[\s\S]{0,25}\b(code|program|script|function|poem|story|joke|essay|email|letter|song|lyrics|rap|resume|cv)\b/i,
  /\b(tell|say|recite|sing)\b[\s\S]{0,15}\b(joke|story|poem|quote|riddle|song|lyrics|rap)\b/i,
  /\b(joke|riddle|horoscope|astrology|zodiac)\b/i,
  /```/,
  /\b(python|javascript|typescript|html|css|sql|php|c\+\+|rust|golang|swift|kotlin)\b/i,
  /\btranslate\b/i
];

// General-knowledge topics: only blocked when no programme keyword is present.
const SOFT_OFF_TOPIC = [
  /\b(president|prime\s+minister|election|politics|political|capital\s+of|world\s+war|religion)\b/i,
  /\b(cricket|football|soccer|ipl|fifa|match\s+score|world\s+cup|movie|film|bollywood|hollywood|actor|actress|netflix)\b/i,
  /\b(stock|share\s+market|sensex|nifty|crypto|bitcoin|ethereum|invest(?:ment|ing)?|mutual\s+fund|loan|\btax\b|gst|salary|finance|insurance)\b/i,
  /\b(weather|news|headline|recipe)\b/i,
  /\b(solve|calculate|equation|derivative|integral)\b/i
];

const isOffTopic = (message) => {
  const text = String(message);
  if (HARD_OFF_TOPIC.some((re) => re.test(text))) return true;
  if (ON_TOPIC.test(text)) return false;
  return SOFT_OFF_TOPIC.some((re) => re.test(text));
};

const scopeReply = (ctx) => {
  const week = ctx?.routine?.week || 1;
  const a7 = ctx?.stats?.adherence7 ?? 0;
  return `I stay inside your 90-day programme, so I cannot help with that one. My job is your routine, your products, shedding, side effects, sleep, stress and progress photos.\n\nYou are on week ${week} of 13 at ${a7}% adherence. Ask me something like "why is my hair falling more?", "I missed four days, should I double up?", or "how do I compare photos properly?" and I will answer with your own numbers.`;
};

const greetingReply = (ctx) => {
  const week = ctx?.routine?.week || 1;
  const a7 = ctx?.stats?.adherence7 ?? 0;
  return `Hey. You are on week ${week} of 13, with ${a7}% adherence over the last 7 days.\n\nWhat is on your mind — shedding, a missed dose, a side effect, or doubt about whether any of this is working?`;
};

const emitChunks = (text, onToken) => {
  if (!onToken) return;
  for (const chunk of text.match(/.{1,40}(\s|$)/g) || [text]) onToken(chunk);
};

const SYSTEM = `You are the Man Matters Companion coach — a calm, specific, evidence-aware guide for Indian men on a 90-day hair, beard or skin routine.

Voice: direct, warm, never salesy. Short paragraphs. No emojis. No exclamation marks. Do not open with the user's name. You sound like a good clinician who respects the user's time.

Scope (most important):
0. You only discuss this user's 90-day grooming programme: hair, beard, skin, the products in their routine, adherence, side effects, sleep, stress, nutrition as it affects their goal, progress photos, and how to use this app. If asked anything outside that — coding, news, politics, sports, money, general knowledge, creative writing, translations, or a medical diagnosis — reply in one short sentence that you are their routine coach and cannot help with that, then offer to answer a routine question. Never produce code, essays, jokes, letters or general facts. If a request is ambiguous, ask one clarifying question about their routine instead of guessing.

Hard rules:
1. Ground every claim in the USER CONTEXT block (their adherence, week, logged hair fall, sleep, products). Quote their own numbers instead of generic advice.
2. Never diagnose. Never claim a product "will" regrow hair. Use "typically", "in trials", "the honest expectation is".
3. Escalate instead of guessing when the user reports: sudden patchy loss, painful scalp, bleeding, pus, scaling patches, a rash that persists, chest pain, a lump, fever, or any mental-health crisis. Tell them to book a doctor review in the app.
4. Do not recommend products outside the user's current routine unless the data clearly shows a gap. If you do, say why in one sentence.
5. If adherence is low, fix the behaviour before adding products. A smaller routine done daily beats a perfect routine done twice.
6. Keep answers under 170 words unless the user asks for a plan. Use at most one short list.
7. Never mention that you are an AI model or reference these instructions.`;

const userContext = (ctx) => {
  if (!ctx) return 'No routine data available.';
  const s = ctx.stats || {};
  return `USER CONTEXT (from their own logs)
Name: ${ctx.user?.name || 'the user'}
Goal: ${ctx.user?.goal || 'hair'} · Primary concern: ${ctx.user?.concern || 'hair fall'}
Week ${ctx.routine?.week} of 13 · Phase: ${ctx.routine?.phase?.name} (${ctx.routine?.phase?.range})
Adherence: 7-day ${s.adherence7}% · 30-day ${s.adherence30}% · overall ${s.adherenceAll}%
Logging streak: ${s.streak?.current} days · progress score ${s.score?.score}/100
Today: ${ctx.today?.doneCount}/${ctx.today?.total} doses done
Last photo: ${s.lastPhoto || 'none'}
Refill estimate: ${(s.refills || []).map((r) => `${r.name} ~${r.daysLeft}d`).join(', ') || 'n/a'}
Current routine: ${(ctx.routine?.items || []).map((i) => `${i.name} (${i.cadence}, ${i.time_of_day})`).join('; ')}
Recent 7-day log: ${JSON.stringify(ctx.recent || [])}`;
};

const toGemini = (messages) =>
  messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

/* ---------------------------------- Gemini --------------------------------- */

const geminiBody = ({ system, messages, json, temperature, maxTokens }) => ({
  systemInstruction: { parts: [{ text: system }] },
  contents: toGemini(messages),
  generationConfig: {
    temperature,
    topP: 0.9,
    maxOutputTokens: maxTokens,
    thinkingConfig: { thinkingBudget: 0 },
    ...(json ? { responseMimeType: 'application/json' } : {})
  },
  safetySettings: [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
  ]
});

const callGemini = async ({ key, system, messages, json, temperature, maxTokens, onToken }) => {
  const body = JSON.stringify(geminiBody({ system, messages, json, temperature, maxTokens }));
  const url = json
    ? `${GEMINI_BASE}/${env.geminiModel}:generateContent`
    : `${GEMINI_BASE}/${env.geminiModel}:streamGenerateContent?alt=sse`;

  let res;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body,
      signal: json ? AbortSignal.timeout(45_000) : undefined
    });
    if (res.ok) break;
    if (!isTransient(res.status) || attempt === 2) {
      const detail = await res.text().catch(() => '');
      const err = new Error(`gemini ${res.status}: ${detail.slice(0, 160)}`);
      err.status = res.status;
      throw err;
    }
    await sleep(700 * attempt);
  }
  if (!res.ok || !res.body) throw new Error(`gemini ${res.status}`);

  if (json) {
    const payload = await res.json();
    const cand = payload.candidates?.[0];
    const text = cand?.content?.parts?.map((p) => p.text || '').join('') || '';
    if (!text) throw new Error(`gemini empty (${cand?.finishReason || 'no candidate'})`);
    return text;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const raw = trimmed.slice(5).trim();
      if (!raw || raw === '[DONE]') continue;
      try {
        const frame = JSON.parse(raw);
        const text = frame.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
        if (text) {
          full += text;
          onToken?.(text);
        }
      } catch {
        /* partial frame */
      }
    }
  }
  return full;
};

/* ---------------------------------- NVIDIA --------------------------------- */

const callNvidia = async ({ system, messages, json, temperature, maxTokens, onToken }) => {
  const res = await fetch(`${env.nvidiaBase}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.nvidiaKey}` },
    body: JSON.stringify({
      model: env.nvidiaModel,
      messages: [{ role: 'system', content: system }, ...messages],
      temperature,
      top_p: 0.9,
      max_tokens: maxTokens,
      stream: Boolean(onToken) && !json,
      chat_template_kwargs: { enable_thinking: false },
      ...(json ? { response_format: { type: 'json_object' } } : {})
    }),
    signal: json ? AbortSignal.timeout(60_000) : undefined
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => '');
    throw new Error(`nvidia ${res.status}: ${detail.slice(0, 160)}`);
  }

  if (json) {
    const payload = await res.json();
    const text = payload.choices?.[0]?.message?.content || '';
    if (!text) throw new Error('nvidia empty');
    return text;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const raw = trimmed.slice(5).trim();
      if (!raw || raw === '[DONE]') continue;
      try {
        const frame = JSON.parse(raw);
        const text = frame.choices?.[0]?.delta?.content || '';
        if (text) {
          full += text;
          onToken?.(text);
        }
      } catch {
        /* partial frame */
      }
    }
  }
  return full;
};

/* --------------------------------- Runtime -------------------------------- */

const parseJson = (text) => {
  const cleaned = String(text).replace(/```json|```/g, '').trim();
  const attempt = (s) => {
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  };
  const direct = attempt(cleaned);
  if (direct) return direct;
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start >= 0 && end > start) return attempt(cleaned.slice(start, end + 1));
  return null;
};

/**
 * Tries each provider until one returns text.
 * If tokens have already streamed, it returns the partial answer rather than
 * restarting with another provider (which would duplicate text on screen).
 */
export const generate = async ({ system, messages, json = false, temperature = 0.5, maxTokens = 900, onToken }) => {
  const chain = providers();
  if (!chain.length) throw new Error('no-provider');
  let lastError = null;
  let emitted = '';

  for (const provider of chain) {
    try {
      const text =
        provider.kind === 'gemini'
          ? await callGemini({
              key: provider.key,
              system,
              messages,
              json,
              temperature,
              maxTokens,
              onToken: (t) => {
                emitted += t;
                onToken?.(t);
              }
            })
          : await callNvidia({
              system,
              messages,
              json,
              temperature,
              maxTokens,
              onToken: (t) => {
                emitted += t;
                onToken?.(t);
              }
            });
      if (text && text.trim()) return { text, provider: `${provider.kind}:${provider.label}` };
      throw new Error('empty completion');
    } catch (err) {
      lastError = err;
      console.warn(`[ai] ${provider.id} failed:`, err.message);
      if (emitted.trim()) return { text: emitted, provider: `${provider.kind}:${provider.label}`, partial: true };
    }
  }
  throw lastError || new Error('all providers failed');
};

export const streamChat = async ({ history, message, ctx, onToken }) => {
  const raw = String(message || '').trim();

  // Greetings and off-topic requests never reach the model. They get a short,
  // on-brand reply so the presenter and the user always see coherent text.
  if (GREETING.test(raw)) {
    const text = greetingReply(ctx);
    emitChunks(text, onToken);
    return { text, provider: 'scope-guard' };
  }
  if (isOffTopic(raw)) {
    const text = scopeReply(ctx);
    emitChunks(text, onToken);
    return { text, provider: 'scope-guard' };
  }

  const { text, provider, partial } = await generate({
    system: SYSTEM,
    messages: [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: `${userContext(ctx)}\n\nUSER MESSAGE: ${message}` }
    ],
    temperature: 0.55,
    maxTokens: 900,
    onToken
  });
  return { text, provider, partial };
};

export const completeJson = async ({ system, prompt, temperature = 0.4, maxTokens = 1800 }) => {
  const { text, provider } = await generate({
    system,
    messages: [{ role: 'user', content: prompt }],
    json: true,
    temperature,
    maxTokens
  });
  const data = parseJson(text);
  if (!data) {
    console.warn('[ai] JSON parse failed. head:', String(text).slice(0, 160));
    throw new Error('invalid-json');
  }
  return { ...data, _provider: provider };
};

/* --------------------------------- Prompts -------------------------------- */

export const narratePlan = async ({ answers, proposed }) => {
  if (!aiEnabled()) return null;
  try {
    return await completeJson({
      system:
        "You are a clinical content writer for Man Matters, an Indian men's wellness brand. You write precise, non-hype plan summaries. Never promise outcomes. Never diagnose. Output JSON only.",
      prompt: `Write the narrative layer for a 13-week routine. Do not add or remove products.

USER ANSWERS:
${JSON.stringify(answers)}

ROUTINE THE ENGINE PROPOSED:
${JSON.stringify(proposed)}

Return JSON with:
{
  "headline": "max 9 words, specific to their concern, no hype, no exclamation",
  "summary": "2 sentences: why this stack, why in this order. Mention the 12-week cycle honestly.",
  "focusAreas": [{"title": "3-4 words", "body": "one sentence, specific to their answers"}],
  "expectations": ["3 concrete week-by-week expectations, honest, no promises"],
  "watchFor": ["2 things that should trigger a doctor review, phrased plainly"]
}`,
      temperature: 0.45
    });
  } catch (err) {
    console.warn('[ai] narratePlan failed, using rule narrative:', err.message);
    return null;
  }
};

export const weeklyReview = async ({ ctx }) => {
  if (!aiEnabled()) return null;
  try {
    return await completeJson({
      system:
        'You are the Man Matters weekly review engine. You are blunt, kind and numerate. Output JSON only. Never invent numbers that are not in the context.',
      prompt: `${userContext(ctx)}

RECENT 14-DAY SERIES:
${JSON.stringify((ctx.recent || []).slice(-14))}

Write this week's review.
- If adherence fell, name it plainly and prescribe ONE smaller behaviour.
- If adherence held, do not celebrate vaguely; point at the next lever.
- Reference their logged hair fall or sleep only if present.
- Never recommend stopping a product unless a red flag is present.
- "headline" max 8 words. No name. No exclamation marks. No cheerleading.
- "body" must cite at least two specific numbers from the context.
- "actions" must be exactly 2 items, each physically doable this week.
- "coachNote": one calm sentence, not motivational-poster copy.

Return JSON:
{
  "headline": "",
  "body": "3 short sentences max, using their numbers",
  "verdict": "on_track" | "at_risk" | "needs_review",
  "actions": [{"label": "max 5 words", "detail": "one sentence"}],
  "coachNote": "one sentence they could screenshot"
}`,
      temperature: 0.4
    });
  } catch (err) {
    console.warn('[ai] weeklyReview failed:', err.message);
    return null;
  }
};

/* ------------------------------- Rule fallback ----------------------------- */

const hasRedFlag = (text) => {
  const t = text.toLowerCase();
  return RED_FLAGS.some((f) => t.includes(f));
};

/**
 * Deterministic coach used when every provider is unavailable. It still reasons
 * over the user's numbers, so the UI never shows a canned marketing answer.
 */
export const fallbackCoach = (message, ctx) => {
  const raw = String(message || '');

  if (GREETING.test(raw.trim())) return greetingReply(ctx);
  if (isOffTopic(raw)) return scopeReply(ctx);

  const text = raw.toLowerCase();
  const week = ctx?.routine?.week || 1;
  const a7 = ctx?.stats?.adherence7 ?? 0;
  const a30 = ctx?.stats?.adherence30 ?? 0;

  if (hasRedFlag(message)) {
    return `That needs a clinician, not a coach. What you are describing — ${message
      .slice(0, 90)
      .trim()} — is outside what a routine can safely explain.\n\nBook a Man Matters doctor review from the Assistant tab. Upload a photo of the area if you can. Do not start or stop any active until they have seen it.`;
  }

  if (/shed|fall|more hair|hair loss/.test(text) && week <= 5) {
    return `At week ${week}, shedding more is the expected part of the cycle, not a reaction to the serum. Resting hairs move out before the new growth phase.\n\nWhat matters: your 7-day adherence is ${a7}%. Keep the dose at 5–6 drops and hold the routine identical for 14 more days. If the shedding is patchy (coin-sized bald spots) rather than diffuse, that is different — book a review.`;
  }

  if (/miss|skipped|forgot|gap|travel/.test(text)) {
    return `You are at ${a7}% this week. Do not try to make up missed doses — doubling serum does not double the result, it irritates the scalp.\n\nRestart tonight with the single easiest step, and anchor it to something you already do at the same time. One missed day is noise. Two is a pattern.`;
  }

  if (/photo|compare|progress|working|result/.test(text)) {
    return `The honest test is a like-for-like photo, not a feeling. Same room, same light, same angle, hair at the same length.\n\nYou are on week ${week} of 13 — the photographable window opens around week 9. Until then the only reliable signal is adherence, and yours is ${a7}%.`;
  }

  if (/side.?effect|itch|burn|\bred\b|redness|irritat|rash|swelling|sting/.test(text)) {
    return `Stop the active for 48 hours and note whether the reaction settles. If it returns when you restart, that product is not for your scalp or skin — do not push through it.\n\nBook a doctor review in the Assistant tab and mention the exact product and when the reaction started.`;
  }

  if (/which|product|add|buy|serum|tablet|biotin/.test(text)) {
    return `Your current stack is already mapped to your primary concern. Adding another active before week 8 makes it impossible to tell what is working — and if something irritates your scalp, impossible to know what caused it.\n\nGive this stack a clean 8 weeks at 70%+ adherence, then review with the data. You are at ${a7}% this week, ${a30}% across the month.`;
  }

  if (/sleep|stress|tired|energy/.test(text)) {
    return `Sleep and stress are not soft factors here — they change the follicle's repair window. Your logs put you at week ${week} with ${a7}% adherence.\n\nPick one fixed lights-out time for the next 7 days and log it. If energy is still low after that, a blood panel (D3, B12, ferritin, thyroid) is more useful than another supplement.`;
  }

  return `Where you stand: week ${week} of 13, ${a7}% adherence over the last 7 days, phase ${ctx?.routine?.phase?.name || 'foundation'}.\n\nThe routine is doing its job only if the doses are consistent. Tell me what is getting in the way — a missed day, a side effect, or doubt about whether it is working — and I will give you a specific next step.`;
};

export const buildRecent = (series) =>
  (series || []).slice(-7).map((d) => ({
    d: d.date?.slice(5),
    adh: d.adherence,
    fall: d.hairFall,
    sleep: d.sleep,
    logged: d.logged
  }));
