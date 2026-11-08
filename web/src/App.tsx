import { useEffect } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './lib/auth';
import { AppShell } from './components/AppShell';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Routine from './pages/Routine';
import Progress from './pages/Progress';
import Assistant from './pages/Assistant';
import Products from './pages/Products';
import Science from './pages/Science';
import NotFound from './pages/NotFound';

const ScrollTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
};

const Booting = () => (
  <div className="grid min-h-screen place-items-center bg-paper">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink/10 border-t-forest" />
      <span className="text-[11px] uppercase tracking-[0.18em] text-muted">Loading your program</span>
    </div>
  </div>
);

const Protected = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Booting />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <>{children}</>;
};

const AppLayout = () => {
  const { user, loading } = useAuth();
  if (loading) return <Booting />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.onboarded) return <Navigate to="/onboarding" replace />;
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
};

const PublicOnly = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (user) return <Navigate to={user.onboarded ? '/app' : '/onboarding'} replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <>
      <ScrollTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/login"
          element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnly>
              <Signup />
            </PublicOnly>
          }
        />
        <Route
          path="/onboarding"
          element={
            <Protected>
              <Onboarding />
            </Protected>
          }
        />

        <Route element={<AppLayout />}>
          <Route path="/app" element={<Dashboard />} />
          <Route path="/app/routine" element={<Routine />} />
          <Route path="/app/progress" element={<Progress />} />
          <Route path="/app/assistant" element={<Assistant />} />
          <Route path="/app/products" element={<Products />} />
          <Route path="/app/science" element={<Science />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
