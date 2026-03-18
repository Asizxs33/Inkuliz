/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary':    '#FDF5F8',
        'bg-secondary':  '#F7EBF2',
        'bg-card':       '#FFFFFF',
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
        'text-primary':  '#1C1C2E',
        'text-secondary':'#5C4A5A',
        'text-muted':    '#9C8A98',
        'border-soft':   '#EDD8E8',
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
