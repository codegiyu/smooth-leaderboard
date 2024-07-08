/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        primary: "#f2d1ce",
        success: "#d9f193",
        error: "#f03c3c"
      },
      fontFamily: {
        montserrat: ["'Montserrat'", "sans-serif"]
      }
    },
  },
  plugins: [],
}

