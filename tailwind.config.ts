import type { Config } from "tailwindcss";

// Color tokens derived from the circle logo (see UI/UX spec §1).
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FBF1DE",
        card: "#FFFAF0",
        ink: "#33200D",
        meta: "#8A6F52",
        line: "#E8D9BC",
        brown: "#5F2B00",
        brown2: "#4A2100",
        cream: "#FAD290",
        amber: "#E98C1D",
        "amber-ink": "#3A1E00",
        ok: "#2D7F5A",
        okbg: "#DFF0E6",
        teal: "#3FD0A7",
        tealdeep: "#1F8A6B",
        tealbg: "#DDF5EC",
        warn: "#B7791F",
        warnbg: "#FBF0D3",
        danger: "#D6452A",
        dangerbg: "#FBE3DD",
      },
      fontFamily: {
        display: ['"Baloo 2"', "ui-rounded", "system-ui", "-apple-system", "sans-serif"],
      },
      maxWidth: {
        app: "480px",
      },
    },
  },
  plugins: [],
};

export default config;
