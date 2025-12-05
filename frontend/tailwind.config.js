/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        matte: '#0B0B0B',
        gold: '#C9A94F',
        ivory: '#F7F2EA',
        emerald: '#0F4D4D'
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['Inter', 'sans-serif']
      }
    }
  },
  plugins: []
};

