/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    // Constitution Principle VIII: Mobile-First Responsive Breakpoints
    screens: {
      'xs': '375px',      // Small phones
      'sm': '640px',      // Large phones
      'md': '768px',      // Tablets
      'lg': '1024px',     // Desktop
      'xl': '1280px',     // Large desktop
      '2xl': '1536px',    // Extra large
    },
    extend: {
      colors: {
        // Heretica Brand Colors - "Research is young and daring"
        'heretica-blue': '#0066FF',        // Primary accent (royal blue from logo)
        'heretica-blue-light': '#3388FF',  // Lighter blue for hover states
        'heretica-blue-dark': '#0052CC',   // Darker blue for active states
        'heretica-cyan': '#00BFFF',        // Secondary accent (slogan color)
        'heretica-white': '#ffffff',       // Primary background
        'heretica-cream': '#fafafa',       // Elevated surfaces
        'heretica-panel': '#ffffff',       // Panel background
        'heretica-text': '#1a1a2e',        // Primary text (deep navy-black)
        'heretica-text-muted': '#4a4a6a',  // Secondary text
        'heretica-gray': '#6b7280',        // Muted text
        // Semantic aliases (backwards compatibility)
        'datack-yellow': '#0066FF',
        'datack-yellow-bright': '#3388FF',
        'datack-black': '#ffffff',
        'datack-dark': '#fafafa',
        'datack-panel': '#ffffff',
        'datack-light': '#1a1a2e',
        'datack-light-muted': '#4a4a6a',
        'datack-gray': '#6b7280',
        'datack-accent': '#0066FF',
        'datack-secondary': '#f0f4ff',     // Light blue tint
        'datack-muted': '#6b7280',
        'datack-border': '#e0e7ff',        // Blue-tinted border
        'datack-hover': '#3388FF',
        'datack-black-hover': '#f0f4ff',   // Hover state with blue tint
      },
      fontFamily: {
        'heretica-serif': ['var(--font-heretica-serif)', 'Playfair Display', 'Georgia', 'Times New Roman', 'serif'],
        'heretica-sans': ['var(--font-heretica-sans)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        'datack': ['var(--font-heretica-sans)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        // Mobile-first responsive typography (min 16px body)
        'display': ['2.5rem', { lineHeight: '1.2', fontWeight: '700' }],
        'display-mobile': ['1.75rem', { lineHeight: '1.2', fontWeight: '700' }],
        'h1': ['2rem', { lineHeight: '1.3', fontWeight: '600' }],
        'h1-mobile': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
        'h2': ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }],
        'h2-mobile': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
        'h3': ['1.25rem', { lineHeight: '1.4', fontWeight: '500' }],
        'h3-mobile': ['1.125rem', { lineHeight: '1.4', fontWeight: '500' }],
        'body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
      },
      borderRadius: {
        'datack-sm': '4px',
        'datack-md': '8px',
        'datack-lg': '12px',
      },
      boxShadow: {
        // Heretica theme shadows - blue tinted
        'datack-sm': '0 1px 2px rgba(0,102,255,0.08)',
        'datack-md': '0 4px 6px rgba(0,102,255,0.1)',
        'datack-lg': '0 10px 15px rgba(0,102,255,0.12)',
        'datack-glow': '0 0 20px rgba(0,102,255,0.3)',
        'heretica-glow': '0 0 30px rgba(0,102,255,0.25)',
        'heretica-ring': '0 0 0 3px rgba(0,102,255,0.2)',
      },
      // Touch-friendly spacing (Constitution Principle VIII: 44x44px touch targets)
      spacing: {
        'touch': '44px',
        'touch-sm': '36px',
      },
      minWidth: {
        'touch': '44px',
      },
      minHeight: {
        'touch': '44px',
      },
    },
  },
  plugins: [],
}
