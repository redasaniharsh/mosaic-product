import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './lib/auth';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              borderRadius: '14px',
              border: '1px solid #E2DDD0',
              background: '#FBFAF6',
              color: '#0B0C0E',
              fontSize: '13px',
              boxShadow: '0 2px 4px rgba(11,12,14,0.05), 0 24px 60px -30px rgba(11,12,14,0.35)'
            }
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
