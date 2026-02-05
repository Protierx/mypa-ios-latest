/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // MYPA Living Background Colors
        'space': {
          'deep': '#0A0A1A',
          'violet': '#1A1030',
          'midnight': '#0D1B2A',
        },
        // Brand Colors
        'brand': {
          'purple': '#7C3AED',
          'secondary': '#A78BFA',
          'tertiary': '#C4B5FD',
          'muted': '#4C1D95',
        },
        // Surface Colors
        'surface': {
          '1': '#0D0D0D',
          '2': '#161616',
          '3': '#1C1C1E',
          '4': '#2C2C2E',
        },
        // Semantic Colors
        'success': '#22C55E',
        'warning': '#EAB308',
        'error': '#EF4444',
        'info': '#3B82F6',
      },
      fontFamily: {
        'sans': ['SF Pro Display', 'System'],
        'mono': ['SF Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

