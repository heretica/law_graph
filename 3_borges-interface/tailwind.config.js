/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'borges-dark': '#0a0a0a',
        'borges-light': '#f5f5f5',
        'borges-accent': '#d4af37',
        'borges-secondary': '#2a2a2a',
      },
      fontFamily: {
        'borges': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}