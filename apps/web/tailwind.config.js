/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "var(--bg-base)",
        surface: {
          DEFAULT: "var(--bg-surface)",
          raised: "var(--bg-surface-raised)",
          glass: "var(--bg-surface-glass)",
        },
        brand: {
          DEFAULT: "#C026D3",
          hover: "#D946EF",
          light: "#F0ABFC",
          subtle: "rgba(192, 38, 211, 0.15)",
        },
        brand2: {
          DEFAULT: "#6366F1",
          hover: "#818CF8",
          light: "#A5B4FC",
          subtle: "rgba(99, 102, 241, 0.15)",
        },
        live: {
          DEFAULT: "#F5B83D",
          subtle: "rgba(245, 184, 61, 0.15)",
        },
        sold: {
          DEFAULT: "#3DDC84",
          subtle: "rgba(61, 220, 132, 0.15)",
        },
        unsold: {
          DEFAULT: "#8893A6",
          subtle: "rgba(136, 147, 166, 0.15)",
        },
        danger: {
          DEFAULT: "#E3564B",
          subtle: "rgba(227, 86, 75, 0.15)",
        },
        muted: {
          DEFAULT: "var(--text-muted)",
          foreground: "var(--text-secondary)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        glow: "0 0 30px rgba(192, 38, 211, 0.25)",
        "glow-lg": "0 0 50px rgba(192, 38, 211, 0.35)",
        "glow-live": "0 0 30px rgba(245, 184, 61, 0.25)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out forwards",
        "slide-up": "slideUp 0.5s ease-out forwards",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(245, 184, 61, 0.2)" },
          "50%": { boxShadow: "0 0 35px rgba(245, 184, 61, 0.45)" },
        },
      },
    },
  },
  plugins: [],
};
