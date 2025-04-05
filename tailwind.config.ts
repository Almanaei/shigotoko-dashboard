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
        primary: "#2D3E50", // Navy blue
        secondary: "#1ABC9C", // Teal
        background: "#F5F6FA", // Light gray
      },
      fontFamily: {
        sans: ['var(--font-roboto)', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 8px 0 rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
};
export default config; 