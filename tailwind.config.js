/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16283F",
        registrar: "#2C4A73",
        registrarSoft: "#5A7CA8",
        stamp: "#A23B2E",
        stampSoft: "#C97A6D",
        approved: "#3D6B4F",
        approvedSoft: "#CFE3D6",
        amber: "#A9781F",
        amberSoft: "#F1E3C1",
        paper: "#F4F1E7",
        paperDeep: "#ECE7D8",
        line: "#DAD3BE",
        lineSoft: "#EAE5D5",
        ink2: "#4A5568",
        textFaint: "#9A927F",
      },
      fontFamily: {
        display: ["Georgia", "Iowan Old Style", "Palatino Linotype", "Book Antiqua", "serif"],
        body: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Helvetica", "Arial", "sans-serif"],
        mono: ["ui-monospace", "SF Mono", "Roboto Mono", "Menlo", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
