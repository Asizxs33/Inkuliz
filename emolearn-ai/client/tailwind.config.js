/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary':    'var(--bg-primary)',
        'bg-secondary':  'var(--bg-secondary)',
        'bg-card':       'var(--bg-card)',
        'bg-glass':      'rgba(253,245,248,0.85)',
        'plum':          '#6B2D5E',
        'plum-light':    '#8B3D7E',
        'plum-pale':     '#F2E8F0',
        'rose':          '#E8507A',
        'rose-light':    '#F07090',
        'rose-pale':     '#FDE8EE',
        'soft-pink':     '#F9C5D5',
        'success':       '#10B981',
        'warning':       '#F59E0B',
        'danger':        '#EF4444',
        'blue':          '#3B82F6',
        'text-primary':  'var(--text-primary)',
        'text-secondary':'var(--text-secondary)',
        'text-muted':    'var(--text-muted)',
        'border-soft':   'var(--border-soft)',
      },
      fontFamily: {
        nunito: ['Nunito', 'sans-serif'],
      },
      borderRadius: {
        'xl': '16px',
      },
    },
  },
  plugins: [],
}
