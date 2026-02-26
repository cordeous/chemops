/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1a2e5a', light: '#243b73' },
        accent: { DEFAULT: '#f07c1e', hover: '#d96c10' },
      },
    },
  },
  plugins: [],
}

