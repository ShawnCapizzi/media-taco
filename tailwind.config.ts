import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        masa: "var(--masa)",
        raised: "var(--raised)",
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        line: "var(--line)",
        verde: "var(--verde)",
        "verde-deep": "var(--verde-deep)",
        "verde-soft": "var(--verde-soft)",
        avocado: "var(--avocado)",
        "avocado-deep": "var(--avocado-deep)",
        "avocado-soft": "var(--avocado-soft)",
        mango: "var(--mango)",
        "mango-deep": "var(--mango-deep)",
        "mango-soft": "var(--mango-soft)",
        chile: "var(--chile)",
        "chile-soft": "var(--chile-soft)",
        blue: "var(--blue)",
        "blue-deep": "var(--blue-deep)",
        violet: "var(--violet)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        meta: ["var(--font-meta)"],
        note: ["var(--font-note)"],
      },
      borderRadius: {
        card: "10px",
      },
      boxShadow: {
        lift: "0 14px 34px -14px rgba(34, 30, 24, 0.28)",
      },
    },
  },
  plugins: [],
};
export default config;
