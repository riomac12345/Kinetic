import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base:     "#07051a",
        surface:  "#0e0b24",
        elevated: "#15122d",
        accent: {
          DEFAULT: "#7c5af6",
          hover:   "#6646e0",
          subtle:  "rgba(124,90,246,0.12)",
        },
        text: {
          primary:   "#ffffff",
          secondary: "rgba(255,255,255,0.5)",
          muted:     "rgba(255,255,255,0.25)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        pill: "9999px",
        card: "1rem",
      },
      boxShadow: {
        card:     "0 1px 2px rgba(0,0,0,0.6), 0 4px 24px rgba(0,0,0,0.5)",
        elevated: "0 2px 4px rgba(0,0,0,0.7), 0 8px 40px rgba(0,0,0,0.6)",
        accent:   "0 0 24px rgba(124,90,246,0.35), 0 4px 16px rgba(0,0,0,0.5)",
        glow:     "0 0 50px rgba(124,90,246,0.3)",
      },
      backgroundImage: {
        "radial-subtle": "radial-gradient(ellipse at 50% 0%, rgba(124,90,246,0.18) 0%, transparent 65%)",
        "radial-card":   "radial-gradient(ellipse at 50% -20%, rgba(124,90,246,0.07) 0%, transparent 60%)",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.25,0.46,0.45,0.94)",
      },
    },
  },
  plugins: [],
};

export default config;
