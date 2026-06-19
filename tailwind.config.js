/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        brand: {
          dark: '#1a1a2e',
          navy: '#16213e',
          deep: '#0f3460',
          accent: '#e94560',
          green: '#53d8a8',
          amber: '#f0a500',
          surface: '#0d1b2a',
          card: '#1b2838',
          border: '#2a3a4e',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Noto Sans SC', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
