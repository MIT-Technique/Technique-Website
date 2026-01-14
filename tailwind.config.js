/** @type {import('tailwindcss').Config} */
const { fontFamily } = require("tailwindcss/defaultTheme");
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-primary": "#FFFCFC",
        "bg-secondary": "#fff9f9ff",
        "bg-tertiary": "#FFF0F0",
        surface: "#FFFAFA",
        "text-primary": "#1A1A1A",
        "text-secondary": "#666666",
        "text-muted": "#999999",
        accent: "#750014",
        "accent-hover": "#5C0010",
        border: "#E5E5E5",
        "border-dark": "#D0D0D0",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      fontFamily: {
        sans: ["var(--font-raleway)", ...fontFamily.sans],
      },
      screens: {
        xs: "380px",
      },
      maxWidth: {
        content: "1200px",
        text: "720px",
        narrow: "560px",
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
    },
  },
  plugins: [],
};
