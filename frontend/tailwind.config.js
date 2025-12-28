const tokens = require('./src/styles/tokens/tailwind.tokens.js');

module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Merge new token colors first
        // ...tokens.theme.extend.colors,

        // Website specific colors (Gold/Matte) - These should override or define the brand
        matte: '#0B0B0B',
        gold: '#C9A94F',
        ivory: '#F7F2EA',
        emerald: '#0F4D4D',

        // Redefine primary/secondary to match Website Theme (Gold/Matte)
        // This overrides the purple/pink from the redesign package tokens
        primary: {
          DEFAULT: '#C9A94F', // gold
          50: '#FBF8F1',
          100: '#F7F2EA',
          200: '#EBDDBF',
          300: '#DFC894',
          400: '#D4B86F',
          500: '#C9A94F',
          600: '#A68A3D',
          700: '#846D2E',
          800: '#635122',
          900: '#453817',
          950: '#2A220D',
        },
        secondary: {
          DEFAULT: '#0F4D4D', // emerald as secondary
          50: '#F2F9F9',
          100: '#E6F3F3',
          500: '#0F4D4D',
          900: '#062C2C',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#0B0B0B',
          ground: '#F7F2EA',
        },
      },
      fontFamily: {
        display: ['"Louis Vuitton Web"', '"Louis Vuitton Web Fallback"', 'serif'],
        body: ['"Louis Vuitton Web"', '"Louis Vuitton Web Fallback"', 'sans-serif'],
        ...tokens.theme.extend.fontFamily,
      },
      fontSize: tokens.theme.extend.fontSize,
      borderRadius: tokens.theme.extend.borderRadius,
      boxShadow: tokens.theme.extend.boxShadow,
      spacing: {
        ...tokens.theme.extend.spacing,
        // Preserve any custom spacing if strictly needed, otherwise tokens win
      }
    }
  },
  plugins: []
};

