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
        bg:       "#F0F2F8",
        surface:  "#FFFFFF",
        surface2: "#F4F6FC",
        surface3: "#EBEFF8",
        accent:   "#F07030",
        "accent-light": "#F59050",
        warm:     "#00C8A0",
        blue:     "#5E80F8",
        danger:   "#E83050",
        text: {
          primary:   "#16141F",
          secondary: "#5A5570",
          muted:     "#9D98B4",
        },
      },
      fontFamily: {
        display: ["var(--font-chakra)", "system-ui", "sans-serif"],
        mono:    ["var(--font-ibm-plex-mono)", "monospace"],
        sans:    ["var(--font-outfit)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
        "card-sm": "12px",
      },
      boxShadow: {
        glow: "0 0 24px rgba(240, 112, 48, 0.35)",
        "glow-sm": "0 0 12px rgba(240, 112, 48, 0.25)",
        glass: "0 1px 3px rgba(20,16,50,0.06), 0 4px 24px rgba(20,16,50,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
