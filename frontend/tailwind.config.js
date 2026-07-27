/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          400: "#3b9dfb",
          500: "#1a7ff0",
          600: "#0f65cc",
          700: "#0d4f9f",
        },
      },
    },
  },
  plugins: [],
};
