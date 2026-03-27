import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-up': 'slideUp 0.25s ease-out',
      },
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
          subtle: "var(--border-subtle)",
          hover: "var(--border-hover)",
        },
        surface: {
          hover: "var(--surface-hover)",
        },
        text: {
          primary: "var(--text-primary)",
          body: "var(--text-body)",
          secondary: "var(--text-secondary)",
          label: "var(--text-label)",
          subtle: "var(--text-subtle)",
          muted: "var(--text-muted)",
          dim: "var(--text-dim)",
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
