/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base:         '#050d1a',
        surface:      '#0a1628',
        surfaceAlt:   '#0f1e35',
        surfaceHover: '#132038',
        accent:       '#63b3ed',
        accentTeal:   '#4fd1c5',
        accentGlow:   'rgba(99,179,237,0.15)',
        textPrimary:   '#e2e8f0',
        textSecondary: '#94a3b8',
        textMuted:     '#475569',
        borderSubtle: 'rgba(99,179,237,0.15)',
        borderMid:    'rgba(99,179,237,0.30)',
        borderStrong: 'rgba(99,179,237,0.60)',
        politics:    '#3B82F6',
        economy:     '#F59E0B',
        conflict:    '#EF4444',
        society:     '#14B8A6',
        technology:  '#8B5CF6',
        sports:      '#22C55E',
        environment: '#84CC16',
        live:        '#EF4444',
        breaking:    '#F59E0B',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
        mono:    ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      keyframes: {
        slideIn: {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        markerPulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.5', transform: 'scale(1.5)' },
        },
      },
      animation: {
        'slide-in':     'slideIn 0.3s ease-out',
        'marker-pulse': 'markerPulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
