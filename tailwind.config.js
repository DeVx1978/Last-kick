/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    screens: {
      sm: "390px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
    },

    extend: {
      colors: {
        neonGreen: "#00C853",
        neonRed: "#FF0033",
        live: "#00FF88",
        jackpot: "#FFD700",
        bgDeep: "#0A0A0A",
        panel: "#111111",
        borderGlow: "#1a1a1a",
      },

      fontFamily: {
        display: ["Anton", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },

      boxShadow: {
        neon: "0 0 12px rgba(0,255,136,.45)",
        red: "0 0 12px rgba(255,0,51,.45)",
      },
    },
  },

  plugins: [],
}