import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--bg)",
        blue: { glow: "#3b82f6", deep: "#1e3a8a" },
      },
      fontFamily: { sans: ["var(--font-geist)", "Arial", "sans-serif"] },
      letterSpacing: { widest: ".24em" },
      boxShadow: { blue: "0 0 54px rgba(59, 130, 246, .12)" },
    },
  },
  plugins: [],
};

export default config;
