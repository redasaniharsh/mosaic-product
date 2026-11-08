import type { ChatMessage, Insight, Overview, Product, SiteData, User } from './types';

const TOKEN_KEY = 'mm.token';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY)
};

type Options = {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
};

export async function request<T>(path: string, opts: Options = {}): Promise<T> {
  const token = tokenStore.get();
  const res = await fetch(`/api${path}`, {
    method: opts.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    signal: opts.signal
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text };
  }
  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/auth')) tokenStore.clear();
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { signal }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' })
};

export const authApi = {
  login: (email: string, password: string) => api.post<{ token: string; user: User }>('/auth/login', { email, password }),
  register: (payload: { name: string; email: string; password: string; phone?: string; age?: number; city?: string }) =>
    api.post<{ token: string; user: User }>('/auth/register', payload),
  demo: () => api.post<{ token: string; user: User }>('/auth/demo'),
  me: () => api.get<{ user: User; overview: Overview }>('/auth/me'),
  logout: () => tokenStore.clear()
};

export const appApi = {
  overview: () =>
    api.get<{ overview: Overview; signals: any[]; recent: any[]; insight: Insight | null; spend: any; plan: any }>(
      '/app/overview'
    ),
  onboard: (answers: Record<string, unknown>) =>
    api.post<{ overview: Overview; plan: any; aiEnabled: boolean }>('/app/onboarding', answers),
  routine: () => api.get<any>('/app/routine'),
  addItem: (slug: string, cadence?: string) => api.post<any>('/app/routine/items', { slug, cadence }),
  removeItem: (id: string) => api.del<any>(`/app/routine/items/${id}`),
  checkin: (payload: Record<string, unknown>) => api.post<any>('/app/checkins', payload),
  toggle: (itemId: string, date?: string) => api.post<{ taken: string[] }>('/app/checkins/toggle', { itemId, date }),
  progress: () => api.get<any>('/app/progress'),
  savePhoto: (payload: { dataUrl: string; angle: string; notes?: string; lighting?: number }) =>
    api.post<{ id: string; week: number }>('/app/photos', payload),
  photo: (id: string) => api.get<any>(`/app/photos/${id}`),
  deletePhoto: (id: string) => api.del<any>(`/app/photos/${id}`),
  products: (params?: { concern?: string; category?: string; q?: string }) => {
    const qs = new URLSearchParams();
    if (params?.concern) qs.set('concern', params.concern);
    if (params?.category) qs.set('category', params.category);
    if (params?.q) qs.set('q', params.q);
    return api.get<{ products: Product[] }>(`/app/products${qs.toString() ? `?${qs}` : ''}`);
  },
  product: (slug: string) => api.get<{ product: Product; reviews: any[] }>(`/app/products/${slug}`),
  review: (refresh = false) => api.post<{ insight: Insight; signals?: any[] }>('/app/ai/review', { refresh }),
  weeklyInsight: () => api.get<{ insight: Insight | null }>('/app/insights/weekly'),
  escalate: (payload: { reason: string; detail?: string }) =>
    api.post<{ id: string; status: string; sla: string; prep: string[] }>('/app/escalations', payload),
  export: () => api.get<any>('/app/export')
};

export const aiApi = {
  status: () => api.get<{ enabled: boolean; chain: string[]; fallback: string }>('/ai/status'),
  history: () => api.get<{ messages: ChatMessage[] }>('/ai/history'),
  clear: () => api.del<{ ok: boolean }>('/ai/history')
};

export const publicApi = {
  site: () => api.get<SiteData>('/public/site'),
  health: () => api.get<any>('/public/health')
};

type StreamHandlers = {
  onMeta?: (m: { week: number; adherence7: number; model: string }) => void;
  onToken?: (t: string) => void;
  onDone?: (d: { mode: string; provider: string; redFlag: boolean; content: string }) => void;
  onError?: (err: Error) => void;
};

/** SSE reader for the coach. Returns an abort function. */
export function streamChat(message: string, history: ChatMessage[], handlers: StreamHandlers) {
  const controller = new AbortController();

  (async () => {
    const token = tokenStore.get();
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({
        message,
        history: history.slice(-10).map((m) => ({ role: m.role, content: m.content }))
      }),
      signal: controller.signal
    });

    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => '');
      let msg = 'The coach is unavailable right now.';
      try {
        msg = JSON.parse(text).error || msg;
      } catch {
        /* noop */
      }
      handlers.onError?.(new Error(msg));
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split('\n\n');
      buffer = frames.pop() || '';
      for (const frame of frames) {
        const event = /event: (.*)/.exec(frame)?.[1]?.trim();
        const raw = /data: (.*)/.exec(frame)?.[1];
        if (!event || !raw) continue;
        try {
          const data = JSON.parse(raw);
          if (event === 'meta') handlers.onMeta?.(data);
          if (event === 'token') handlers.onToken?.(data.t);
          if (event === 'done') handlers.onDone?.(data);
        } catch {
          /* partial */
        }
      }
    }
  })().catch((err) => {
    if (err.name !== 'AbortError') handlers.onError?.(err);
  });

  return () => controller.abort();
}
