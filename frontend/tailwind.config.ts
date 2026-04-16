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
        navy: {
          DEFAULT: "#15274a",
          light: "#1e3a6e",
          dark: "#0d1a33",
        },
        brass: {
          DEFAULT: "#b5821a",
          light: "#d4a845",
          pale: "#f5edd8",
        },
        parchment: {
          DEFAULT: "#f5f2ec",
          dark: "#ede9e0",
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
