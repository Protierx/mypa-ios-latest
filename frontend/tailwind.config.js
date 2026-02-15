/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // ── Backgrounds ──────────────────────────────────────
        bg: {
          primary:   '#F8F8FA',
          secondary: '#F2F2F7',
          card:      '#FFFFFF',
          elevated:  '#FFFFFF',
          input:     '#F2F2F7',
          hover:     '#E8E8ED',
        },
        // ── Brand ────────────────────────────────────────────
        brand: {
          primary:   '#7C3AED',
          secondary: '#A78BFA',
          tertiary:  '#C4B5FD',
          muted:     '#F5F0FF',
          surface:   '#EDE5FF',
        },
        // ── Text ─────────────────────────────────────────────
        ink: {
          primary:   '#1C1C1E',
          secondary: '#48484A',
          tertiary:  '#8E8E93',
          disabled:  '#C7C7CC',
          inverse:   '#FFFFFF',
        },
        // ── Borders ──────────────────────────────────────────
        line: {
          primary:   '#E5E5EA',
          secondary: '#F2F2F7',
          focus:     '#7C3AED',
        },
        // ── Semantic ─────────────────────────────────────────
        success: '#34C759',
        warning: '#FF9F0A',
        error:   '#FF3B30',
        info:    '#007AFF',
        // ── Living Background (light glassmorphic aurora) ────
        aurora: {
          white:    '#FFFFFF',
          lavender: '#F5F0FF',
          blue:     '#EFF6FF',
          peach:    '#FFF7ED',
        },
        // ── Legacy surface aliases (kept for dark Login) ─────
        surface: {
          1: '#0D0D0D',
          2: '#161616',
          3: '#1C1C1E',
          4: '#2C2C2E',
        },
        space: {
          deep:     '#0A0A1A',
          violet:   '#1A1030',
          midnight: '#0D1B2A',
          rich:     '#12082A',
        },
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
        none: '0px',
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '24px',
        '2xl': '28px',
        full: '9999px',
      },
      boxShadow: {
        // Light-mode shadows
        sm: '0 1px 3px rgba(0, 0, 0, 0.08)',
        md: '0 4px 12px rgba(0, 0, 0, 0.08)',
        lg: '0 8px 24px rgba(0, 0, 0, 0.12)',
        purple: '0 4px 14px rgba(124, 58, 237, 0.15)',
        // Legacy dark aliases
        xl: '0 20px 40px rgba(0, 0, 0, 0.6)',
        'glow-button': '0 4px 14px rgba(124, 58, 237, 0.4)',
        'glow-orb-idle': '0 0 40px rgba(124, 58, 237, 0.3), 0 0 80px rgba(124, 58, 237, 0.15)',
        'glow-orb-active': '0 0 60px rgba(124, 58, 237, 0.5), 0 0 120px rgba(124, 58, 237, 0.3), 0 0 180px rgba(124, 58, 237, 0.15)',
      },
    },
  },
  plugins: [],
};
