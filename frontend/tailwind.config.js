/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#f59e0b',
          light:   '#fbbf24',
          dark:    '#d97706',
        },
        surface: {
          DEFAULT: '#171717',
          raised:  '#1c1c1c',
          overlay: '#222222',
        },
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
        'fade-in':   'fadeIn 0.25s ease-out',
        'slide-up':  'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0', transform: 'translateY(8px)'  }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      backgroundImage: {
        'amber-glow': 'radial-gradient(ellipse at center, rgba(245,158,11,0.15) 0%, transparent 70%)',
      },
    },
  },
  plugins: [],
};
