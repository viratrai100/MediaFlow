/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#07080d',
          800: '#0d0f18',
          700: '#141824',
          600: '#1e2436',
          500: '#2b344d',
        },
        brand: {
          purple: '#8b5cf6',
          violet: '#7c3aed',
          cyan: '#06b6d4',
          blue: '#3b82f6',
          emerald: '#10b981',
          rose: '#f43f5e'
        }
      },
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-purple': '0 0 30px -5px rgba(139, 92, 246, 0.35)',
        'glow-cyan': '0 0 30px -5px rgba(6, 182, 212, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}
