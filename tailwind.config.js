
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#248b65',
        'primary-dark': '#1c6d4f',
        bg: '#f3f4f6',
        surface: '#ffffff',
      }
    },
  },
  plugins: [],
}
