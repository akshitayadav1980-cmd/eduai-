/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // Warm Ivory Tonal Scale
        ivory: {
          DEFAULT: '#F6F5F1',
          main: '#F6F5F1',       // Main background
          section: '#F1F1EE',    // Secondary sections
          surface: '#FAFAF8',    // Elevated surfaces & cards
          white: '#FFFFFF',      // Pure white accents
        },
        // Editorial Graphite Neutrals
        graphite: {
          DEFAULT: '#171717',
          primary: '#171717',
          secondary: '#6F6F6A',
          subtle: '#A3A39E',
          border: 'rgba(0, 0, 0, 0.05)',
        },
        // Dark Mode Specs
        charcoal: {
          DEFAULT: '#0A0A0C',
          950: '#060608',
          900: '#0A0A0C',
          850: '#111114',
          800: '#141418',
          700: '#23232A',
        },
        // Accents
        accent: {
          cyan: '#06b6d4',
          blue: '#2563eb',
          violet: '#8b5cf6',
          indigo: '#6366f1',
        },
      },
      boxShadow: {
        subtle: '0 4px 20px -4px rgba(0, 0, 0, 0.04), 0 2px 6px -2px rgba(0, 0, 0, 0.02)',
        editorial: '0 10px 30px -10px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
        'editorial-hover': '0 16px 36px -10px rgba(0, 0, 0, 0.07), 0 6px 12px -3px rgba(0, 0, 0, 0.03)',
        'glow-cyan-subtle': '0 0 20px rgba(6, 182, 212, 0.18)',
      },
    },
  },
  plugins: [],
}
