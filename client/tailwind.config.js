/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        xp: ["Tahoma", "MS Sans Serif", "Segoe UI", "Verdana", "sans-serif"],
      },
      colors: {
        xpblue: {
          light: "#3b8ef5",
          DEFAULT: "#1552c9",
          dark: "#0a2e82",
        },
        xpface: "#ece9d8",
        xpgray: "#c0c0c0",
      },
      boxShadow: {
        xpwin: "2px 2px 6px rgba(0,0,0,0.4)",
        xpbevel: "inset -1px -1px 0 #6b8fc9, inset 1px 1px 0 #ffffff",
      },
    },
  },
  plugins: [],
};
