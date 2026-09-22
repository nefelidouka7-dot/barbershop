import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(22px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "ken-burns-soft": {
          from: { transform: "scale(1.02)" },
          to: { transform: "scale(1.06)" },
        },
        shimmer: {
          from: { transform: "translateX(-140%)" },
          to: { transform: "translateX(140%)" },
        },
        glow: {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "0.7" },
        },
        "hero-line": {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(1)" },
        },
        "hero-rule": {
          from: { transform: "scaleY(0)", opacity: "0" },
          to: { transform: "scaleY(1)", opacity: "1" },
        },
        "scroll-cue": {
          "0%, 100%": { opacity: "0.25", transform: "translateY(0)" },
          "50%": { opacity: "0.85", transform: "translateY(5px)" },
        },
        "step-in": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "select-pop": {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(0.96)" },
          "100%": { transform: "scale(1)" },
        },
        "slot-in": {
          from: { opacity: "0", transform: "scale(0.94)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up":
          "fade-up 1.05s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "fade-in": "fade-in 0.9s ease-out forwards",
        "ken-burns-soft": "ken-burns-soft 42s ease-out forwards",
        shimmer: "shimmer 1.1s cubic-bezier(0.22, 1, 0.36, 1)",
        glow: "glow 4.5s ease-in-out infinite",
        "hero-line":
          "hero-line 1s cubic-bezier(0.22, 1, 0.36, 1) 0.35s forwards",
        "hero-rule":
          "hero-rule 1.1s cubic-bezier(0.22, 1, 0.36, 1) 0.2s forwards",
        "scroll-cue": "scroll-cue 2.4s ease-in-out infinite",
        "step-in": "step-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "select-pop": "select-pop 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
        "slot-in": "slot-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards",
      },
      transitionTimingFunction: {
        soft: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
