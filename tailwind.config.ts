import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["var(--font-mono)", "IBM Plex Mono", "monospace"],
        sans: ["var(--font-sans)", "IBM Plex Sans", "sans-serif"],
      },
      colors: {
        bg: {
          primary: "var(--bg-primary)",
          card: "var(--bg-card)",
          elevated: "var(--bg-elevated)",
        },
        border: {
          DEFAULT: "var(--border)",
          hover: "var(--border-hover)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        petron: "var(--accent-petron)",
        shell: "var(--accent-shell)",
        chevron: "var(--accent-chevron)",
        phoenix: "var(--accent-phoenix)",
        seaoil: "var(--accent-seaoil)",
        status: {
          green: "var(--status-green)",
          yellow: "var(--status-yellow)",
          red: "var(--status-red)",
        },
        ph: {
          blue: "var(--ph-blue)",
          red: "var(--ph-red)",
          yellow: "var(--ph-yellow)",
        },
      },
    },
  },
  plugins: [],
};
export default config;
