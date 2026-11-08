import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, KeyRound, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { AuthShell } from '../components/AuthShell';
import { Btn, Field, Input } from '../components/ui';
import { useAuth } from '../lib/auth';
import { ApiError } from '../lib/api';

export default function Login() {
  const { login, demo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'login' | 'demo' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoRan = useRef(false);

  const go = (onboarded: boolean) => {
    const from = (location.state as { from?: string } | null)?.from;
    navigate(from && from.startsWith('/app') ? from : onboarded ? '/app' : '/onboarding', { replace: true });
  };

  const enterDemo = async () => {
    setBusy('demo');
    setError(null);
    try {
      const user = await demo();
      toast.success('Demo account loaded — week 5, real check-ins');
      go(Boolean(user.onboarded));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not open the demo account.');
    } finally {
      setBusy(null);
    }
  };

  useEffect(() => {
    if (params.get('demo') === '1' && !autoRan.current) {
      autoRan.current = true;
      enterDemo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy('login');
    setError(null);
    try {
      const user = await login(email.trim(), password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`);
      go(Boolean(user.onboarded));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not sign in. Try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <AuthShell
      title="Welcome back."
      sub="Sign in to see today's plan, this week's adherence and the coach's read on your data."
      footer={
        <>
          New here?{' '}
          <Link to="/signup" className="font-medium text-ink underline underline-offset-4 hover:text-forest">
            Start your 90-day plan
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <Input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
        </Field>

        {error && (
          <p className="rounded-xl border border-danger/25 bg-danger/[0.05] px-3 py-2 text-[12px] leading-relaxed text-danger">
            {error}
          </p>
        )}

        <Btn type="submit" variant="primary" size="lg" loading={busy === 'login'} className="w-full">
          Sign in <ArrowRight className="h-4 w-4" />
        </Btn>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted/70">or skip the form</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <Btn variant="ghost" size="lg" className="w-full" onClick={enterDemo} loading={busy === 'demo'} icon={<Sparkles className="h-4 w-4" />}>
        Explore the demo account
      </Btn>

      <div className="mt-5 rounded-xl border border-line bg-chalk p-4">
        <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
          <KeyRound className="h-3 w-3" /> Demo credentials
        </div>
        <div className="mt-2 grid gap-1 font-mono text-[11.5px] text-ink/70">
          <span>demo@manmatters.in</span>
          <span>demo1234</span>
        </div>
        <p className="mt-2 text-[10.5px] leading-relaxed text-muted">
          Week 5 of 13, five weeks of check-ins, a shedding dip and recovery, three photos, live coach.
        </p>
      </div>
    </AuthShell>
  );
}
