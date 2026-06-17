/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#08110E',
          deep: '#050B09',
          raised: '#0D1B16',
          line: '#16291F',
        },
        jade: {
          DEFAULT: '#34D399',
          soft: '#6EE7B7',
          deep: '#0F7A57',
        },
        amber: {
          DEFAULT: '#FBBF24',
          soft: '#FCD34D',
        },
        coral: {
          DEFAULT: '#FB7185',
          soft: '#FDA4AF',
        },
        offwhite: {
          DEFAULT: '#F4F7F4',
          dim: '#AFC2B8',
          faint: '#6E8478',
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        body: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"Spline Sans Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(52, 211, 153, 0.45)',
        'glow-amber': '0 0 40px -8px rgba(251, 191, 36, 0.4)',
        'glow-coral': '0 0 40px -8px rgba(251, 113, 133, 0.4)',
        drawer: '-24px 0 60px -20px rgba(0, 0, 0, 0.7)',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.08)' },
        },
        'drift-in': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        'edge-flow': {
          '0%': { strokeDashoffset: '0' },
          '100%': { strokeDashoffset: '-24' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
        'drift-in': 'drift-in 0.5s ease-out both',
        shimmer: 'shimmer 1.6s linear infinite',
        'edge-flow': 'edge-flow 1.2s linear infinite',
        'spin-slow': 'spin-slow 2.4s linear infinite',
      },
    },
  },
  plugins: [],
};
