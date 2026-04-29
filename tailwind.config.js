/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        wood: {
          900: '#3E2723', // Koyu Arka Plan
          800: '#4E342E',
          700: '#5D4037', // Tahta Zemin
          600: '#6D4C41',
          500: '#795548',
          400: '#8D6E63', // Butonlar
          300: '#A1887F',
          200: '#BCAAA4',
          100: '#D7CCC8', // Harf taşları
          50: '#EFEBE9',
        },
        gold: '#FFC107',
        accent: '#FF9800'
      }
    },
  },
  plugins: [],
}
