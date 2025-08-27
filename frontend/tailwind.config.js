/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        barber: {
          red: '#dc2626',
          blue: '#1e40af',
          white: '#ffffff',
          cream: '#fef7ed',
          gold: '#d97706',
          dark: '#1f2937',
        },
        edge: {
          primary: '#1e293b',   // Dark slate
          secondary: '#dc2626', // Red
          accent: '#d97706',    // Gold
          light: '#f8fafc',     // Light gray
          cream: '#fef7ed',     // Cream
        }
      },
      fontFamily: {
        'serif': ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
