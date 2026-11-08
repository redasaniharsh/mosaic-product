/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F5F3EC',
        chalk: '#FBFAF6',
        ink: '#0B0C0E',
        soot: '#16181A',
        lime: { DEFAULT: '#C8F169', deep: '#A8D544', pale: '#EAFBC4' },
        forest: '#15351F',
        moss: '#2E4B3B',
        clay: '#E4DFD2',
        line: '#E2DDD0',
        muted: '#6F6E64',
        danger: '#A62B20',
        amber: '#A56A0B'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      },
      boxShadow: {
        soft: '0 1px 2px rgba(11,12,14,0.04), 0 12px 32px -18px rgba(11,12,14,0.22)',
        lift: '0 2px 4px rgba(11,12,14,0.05), 0 24px 60px -30px rgba(11,12,14,0.35)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.5)'
      },
      borderRadius: {
        xl2: '1.25rem',
        '4xl': '2rem'
      },
      letterSpacing: {
        tightest: '-0.045em'
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.55' },
          '50%': { transform: 'scale(1.08)', opacity: '1' }
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' }
        },
        'draw-line': {
          '0%': { strokeDashoffset: '600' },
          '100%': { strokeDashoffset: '0' }
        }
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fade-in 0.5s ease both',
        shimmer: 'shimmer 1.8s linear infinite',
        breathe: 'breathe 4.5s ease-in-out infinite',
        blink: 'blink 1s step-end infinite',
        'draw-line': 'draw-line 1.6s ease-out both'
      }
    }
  },
  plugins: []
};
