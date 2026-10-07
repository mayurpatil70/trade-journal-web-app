/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      dropShadow: {
        'glow-green': '0 0 10px rgba(16,185,129,0.7)',
        'glow-red': '0 0 10px rgba(239,68,68,0.7)',
      },
      colors: {
        journalDark: "#0d0f11",
        journalEmerald: "#10b981",
      },
    },
  },
  plugins: [],
};
