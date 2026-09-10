/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          900: '#0a192f',
          800: '#112240',
          700: '#233554',
          600: '#172a45',
          500: '#005f73',
          400: '#0a9396',
        }
      }
    },
  },
  plugins: [],
}
