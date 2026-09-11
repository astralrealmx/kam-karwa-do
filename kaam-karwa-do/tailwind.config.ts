import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0F766E", // teal - trust
          dark: "#0B5A54",
          light: "#14B8A6",
        },
        accent: {
          DEFAULT: "#F97316", // saffron/orange accent
          dark: "#C2410C",
        },
        ink: "#0F172A",
        surface: "#F8FAFC",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 2px 10px rgba(15, 23, 42, 0.06)",
        cardHover: "0 8px 24px rgba(15, 23, 42, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
