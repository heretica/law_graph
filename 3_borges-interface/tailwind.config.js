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
        'borges-accent': '#7dd3fc',
        'borges-secondary': '#2a2a2a',
        'borges-muted': '#666666',
        'borges-dark-hover': '#1a1a1a',
        'borges-light-muted': '#a0a0a0',
        'borges-border': '#333333',
      },
      fontFamily: {
        'borges': ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      fontSize: {
        'display': ['2.5rem', { lineHeight: '1.2', fontWeight: '300' }],
        'h1': ['2rem', { lineHeight: '1.3', fontWeight: '400' }],
        'h2': ['1.5rem', { lineHeight: '1.4', fontWeight: '500' }],
        'h3': ['1.25rem', { lineHeight: '1.4', fontWeight: '500' }],
      },
      borderRadius: {
        'borges-sm': '4px',
        'borges-md': '8px',
        'borges-lg': '12px',
      },
      boxShadow: {
        'borges-sm': '0 1px 2px rgba(0,0,0,0.3)',
        'borges-md': '0 4px 6px rgba(0,0,0,0.4)',
        'borges-lg': '0 10px 15px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
}