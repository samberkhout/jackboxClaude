/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#8b5cf6',
        secondary: '#ec4899',
        dark: {
          100: '#1e1e2e',
          200: '#181825',
          300: '#11111b'
        }
      }
    },
  },
  plugins: [],
}
