/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        journalDark: "#0d0f11",
        journalEmerald: "#10b981",
      },
    },
  },
  plugins: [],
};
