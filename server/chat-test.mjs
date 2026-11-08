const base = 'http://localhost:4000';

const login = await fetch(`${base}/api/auth/demo`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
const { token } = await login.json();
const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };

const res = await fetch(`${base}/api/ai/chat`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ message: 'I am in week 5 and still shedding. Is the serum failing?' })
});

console.log('status', res.status);
const reader = res.body.getReader();
const dec = new TextDecoder();
let buf = '';
let text = '';
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buf += dec.decode(value, { stream: true });
  const frames = buf.split('\n\n');
  buf = frames.pop() || '';
  for (const f of frames) {
    const ev = /event: (.*)/.exec(f)?.[1];
    const data = /data: (.*)/.exec(f)?.[1];
    if (ev === 'token') text += JSON.parse(data).t;
    if (ev === 'done') console.log('\nDONE meta:', data);
  }
}
console.log('\n--- streamed ---\n' + text);
