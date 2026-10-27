/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        'squircle-sm': '12px',
        'squircle-md': '18px',
        'squircle-lg': '24px',
        'squircle-xl': '32px',
        'squircle-2xl': '40px',
      },
      boxShadow: {
        'apple-card': '0 8px 30px rgba(0, 0, 0, 0.04)',
        'apple-card-dark': '0 12px 35px rgba(0, 0, 0, 0.35)',
        'apple-float': '0 20px 50px -10px rgba(0, 0, 0, 0.08), 0 10px 20px -8px rgba(0, 0, 0, 0.04)',
        'apple-float-dark': '0 25px 60px -15px rgba(0, 0, 0, 0.6), 0 10px 25px -10px rgba(0, 0, 0, 0.4)',
        'apple-glow-emerald': '0 0 25px -3px rgba(16, 185, 129, 0.35)',
        'apple-glow-rose': '0 0 25px -3px rgba(239, 68, 68, 0.35)',
        'apple-inner': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.12)',
        'apple-inner-light': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.85)',
      },
      dropShadow: {
        'glow-green': '0 0 10px rgba(16,185,129,0.7)',
        'glow-red': '0 0 10px rgba(239,68,68,0.7)',
        'apple-icon': '0 4px 12px rgba(0,0,0,0.15)',
      },
      colors: {
        journalDark: "#0d0f11",
        journalEmerald: "#10b981",
        mac: {
          lightBg: "#F5F6F9",
          lightPaper: "#FAFAFC",
          lightBorder: "rgba(0, 0, 0, 0.07)",
          lightCard: "rgba(255, 255, 255, 0.75)",
          darkBg: "#0A0C10",
          darkPaper: "#10131B",
          darkBorder: "rgba(255, 255, 255, 0.08)",
          darkCard: "rgba(18, 21, 30, 0.65)",
        },
      },
      backdropBlur: {
        'xs': '2px',
        '3xl': '40px',
      },
    },
  },
  plugins: [],
};
