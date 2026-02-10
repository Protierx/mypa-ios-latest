/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // MYPA Living Background Colors
        space: {
          deep: '#0A0A1A',
          violet: '#1A1030',
          midnight: '#0D1B2A',
          rich: '#12082A',
        },
        // Brand Colors (MYPA Design Spec Section 1.2)
        brand: {
          purple: '#7C3AED',
          secondary: '#A78BFA',
          tertiary: '#C4B5FD',
          muted: '#4C1D95',
        },
        // Surface Colors (Section 1.1)
        surface: {
          1: '#0D0D0D',
          2: '#161616',
          3: '#1C1C1E',
          4: '#2C2C2E',
        },
        // Text colors (Section 1.3) — use as text-ink-primary, bg-ink-secondary, etc.
        ink: {
          primary: '#FFFFFF',
          secondary: '#A1A1AA',
          tertiary: '#71717A',
          disabled: '#52525B',
        },
        // Semantic (Section 1.4)
        success: '#22C55E',
        warning: '#EAB308',
        error: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['SF Pro Display', 'System'],
        mono: ['SF Mono', 'monospace'],
      },
      fontSize: {
        // MYPA Design Spec Section 2.2
        'display-large': ['48px', { lineHeight: '56px' }],
        display: ['34px', { lineHeight: '40px' }],
        'title-1': ['28px', { lineHeight: '34px' }],
        'title-2': ['22px', { lineHeight: '28px' }],
        'title-3': ['20px', { lineHeight: '24px' }],
        headline: ['17px', { lineHeight: '22px' }],
        body: ['17px', { lineHeight: '24px' }],
        callout: ['16px', { lineHeight: '21px' }],
        subhead: ['15px', { lineHeight: '20px' }],
        footnote: ['13px', { lineHeight: '18px' }],
        'caption-1': ['12px', { lineHeight: '16px' }],
        'caption-2': ['11px', { lineHeight: '13px' }],
      },
      spacing: {
        // Spec Section 3.1 — space-1 through space-10
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        7: '32px',
        8: '40px',
        9: '48px',
        10: '64px',
      },
      borderRadius: {
        // Spec Section 4 — override so rounded-lg = 14px etc.
        none: '0px',
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
        '2xl': '28px',
        full: '9999px',
      },
      boxShadow: {
        // Spec Section 5.1 & 5.2
        sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
        md: '0 4px 6px rgba(0, 0, 0, 0.4)',
        lg: '0 10px 25px rgba(0, 0, 0, 0.5)',
        xl: '0 20px 40px rgba(0, 0, 0, 0.6)',
        'glow-button': '0 4px 14px rgba(124, 58, 237, 0.4)',
        'glow-orb-idle': '0 0 40px rgba(124, 58, 237, 0.3), 0 0 80px rgba(124, 58, 237, 0.15)',
        'glow-orb-active': '0 0 60px rgba(124, 58, 237, 0.5), 0 0 120px rgba(124, 58, 237, 0.3), 0 0 180px rgba(124, 58, 237, 0.15)',
      },
    },
  },
  plugins: [],
};
