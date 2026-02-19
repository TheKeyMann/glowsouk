import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        glowsouk: {
          rose: '#C2748A',
          'rose-light': '#E8B4C0',
          'rose-dark': '#9B5268',
          gold: '#C9A84C',
          'gold-light': '#E8D09A',
          'gold-dark': '#A08430',
          plum: '#6B2D5E',
          'plum-light': '#9B5D8E',
          'plum-dark': '#4A1E42',
          cream: '#FAF6F1',
          'cream-dark': '#F0E9E0',
          dark: '#1A0F0F',
          'dark-muted': '#3D2828',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        serif: ['var(--font-playfair)', 'serif'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #FAF6F1 0%, #F0E9E0 50%, #E8D09A20 100%)',
      },
    },
  },
  plugins: [],
}

export default config
