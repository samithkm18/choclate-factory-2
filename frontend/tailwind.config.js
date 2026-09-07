/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          maroon: '#4A0E17',
          maroonDark: '#2E090E',
          maroonLight: '#6A1924',
          gold: '#D4AF37',
          goldDark: '#AA841C',
          goldLight: '#F3E5AB',
          darkBg: '#0D0506',
          panelBg: '#1A0E10',
          panelBorder: '#30181B'
        }
      },
      fontFamily: {
        serif: ['Cinzel', 'Cormorant Garamond', 'serif'],
        sans: ['Outfit', 'Inter', 'sans-serif']
      },
      backgroundImage: {
        'gold-metallic': 'linear-gradient(135deg, #BF953F 0%, #FCF6BA 25%, #B38728 50%, #FBF5B7 75%, #AA771C 100%)',
        'dark-metallic': 'linear-gradient(180deg, #1A0D0E 0%, #0D0506 100%)'
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }
    },
  },
  plugins: [],
}
