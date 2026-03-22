/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef8ff',
          100: '#d7ecff',
          200: '#b7ddff',
          300: '#84c7ff',
          400: '#4dabff',
          500: '#228cff',
          600: '#156de0',
          700: '#1556b5',
          800: '#194893',
          900: '#1b3e76'
        }
      },
      boxShadow: {
        panel: '0 10px 30px -14px rgba(15, 23, 42, 0.28)'
      }
    }
  },
  plugins: []
};
