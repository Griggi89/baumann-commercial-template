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
        navy: {
          50:  '#EFF3FF',
          100: '#DBE4FF',
          200: '#BAC8FF',
          300: '#91A7FF',
          400: '#748FFC',
          500: '#5C7CFA',
          600: '#4C6EF5',
          700: '#3B5BDB',
          800: '#1E3A5F',
          900: '#0F172A',
          950: '#07101F',
        },
        teal: {
          50:  '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
        gold: {
          50:  '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,.06), 0 1px 2px -1px rgba(0,0,0,.06)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,.10), 0 2px 4px -1px rgba(0,0,0,.06)',
        'sidebar': '2px 0 8px 0 rgba(0,0,0,.12)',
      },
      backgroundImage: {
        'gradient-navy': 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)',
        'gradient-teal': 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
        'gradient-gold': 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      },
    },
  },
  plugins: [],
}

export default config
