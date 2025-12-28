/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        'comet': {
          bg: '#0D1117',
          surface: '#161B22',
          border: '#30363D',
          text: '#C9D1D9',
          muted: '#8B949E',
          accent: '#58A6FF',
          success: '#3FB950',
          warning: '#D29922',
          error: '#F85149',
        }
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #58A6FF, 0 0 10px #58A6FF' },
          '100%': { boxShadow: '0 0 10px #58A6FF, 0 0 20px #58A6FF' },
        }
      }
    },
  },
  plugins: [],
}
