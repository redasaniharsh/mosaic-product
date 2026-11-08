import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { Logo } from '../components/ui';

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-paper px-5">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center">
          <Logo />
        </div>
        <div className="mx-auto mt-10 grid h-12 w-12 place-items-center rounded-2xl bg-forest/10 text-forest">
          <Compass className="h-6 w-6" />
        </div>
        <div className="mt-5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted">404 · off the protocol</div>
        <h1 className="mt-2 font-display text-4xl leading-none tracking-tightest">This page is not on the plan.</h1>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">
          The link is wrong or the page moved. Your routine, logs and photos are untouched.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link to="/" className="btn-ghost">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <Link to="/app" className="btn-primary">
            Open my plan
          </Link>
        </div>
      </div>
    </div>
  );
}
