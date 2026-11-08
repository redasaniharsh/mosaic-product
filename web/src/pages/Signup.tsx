import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { AuthShell } from '../components/AuthShell';
import { Btn, Field, Input } from '../components/ui';
import { useAuth } from '../lib/auth';
import { ApiError } from '../lib/api';

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', age: '', city: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        age: form.age ? Number(form.age) : undefined,
        city: form.city.trim() || undefined
      });
      toast.success(`Account created. Let's build your plan, ${user.name.split(' ')[0]}.`);
      navigate('/onboarding', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the account. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Start your 90-day plan."
      sub="Six questions, a 13-week routine, and a coach that reads your own data. No card needed."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-ink underline underline-offset-4 hover:text-forest">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-3.5">
        <Field label="Full name">
          <Input required autoComplete="name" value={form.name} onChange={set('name')} placeholder="Harsh Redasani" />
        </Field>
        <Field label="Email">
          <Input required type="email" autoComplete="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone" hint="Optional">
            <Input inputMode="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} placeholder="98765 43210" />
          </Field>
          <Field label="Age" hint="Optional">
            <Input inputMode="numeric" value={form.age} onChange={set('age')} placeholder="24" />
          </Field>
        </div>
        <Field label="City" hint="Optional">
          <Input autoComplete="address-level2" value={form.city} onChange={set('city')} placeholder="Mumbai" />
        </Field>
        <Field label="Password" hint="At least 8 characters.">
          <Input
            required
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={form.password}
            onChange={set('password')}
            placeholder="Choose a password"
          />
        </Field>

        {error && (
          <p className="rounded-xl border border-danger/25 bg-danger/[0.05] px-3 py-2 text-[12px] leading-relaxed text-danger">
            {error}
          </p>
        )}

        <Btn type="submit" variant="lime" size="lg" loading={busy} className="w-full">
          Create account <ArrowRight className="h-4 w-4" />
        </Btn>
      </form>

      <p className="mt-4 flex items-start gap-2 text-[10.5px] leading-relaxed text-muted">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest" />
        This is a demonstration build. Photos and logs stay in a local SQLite file on the demo server and are never shared.
      </p>
    </AuthShell>
  );
}
