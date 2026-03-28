/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0a0a0f',
          secondary: '#13131a',
          card: '#1a1a24',
          hover: '#22222e',
        },
        accent: {
          blue: '#3b82f6',
          'blue-dim': '#1d4ed8',
        },
        correction: {
          green: '#22c55e',
          'green-bg': '#052e16',
        },
        expression: {
          yellow: '#eab308',
          'yellow-bg': '#1c1400',
        },
        text: {
          primary: '#f1f5f9',
          secondary: '#94a3b8',
          muted: '#475569',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'monospace'],
      },
      animation: {
        'wave-1': 'wave 1.2s ease-in-out infinite',
        'wave-2': 'wave 1.2s ease-in-out 0.15s infinite',
        'wave-3': 'wave 1.2s ease-in-out 0.3s infinite',
        'wave-4': 'wave 1.2s ease-in-out 0.45s infinite',
        'wave-5': 'wave 1.2s ease-in-out 0.6s infinite',
        'pulse-ring': 'pulseRing 1.5s ease-out infinite',
      },
      keyframes: {
        wave: {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%': { transform: 'scaleY(1)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '100%': { transform: 'scale(1.8)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
