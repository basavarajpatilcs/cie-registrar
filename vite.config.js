import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// If deploying to GitHub Pages at https://<user>.github.io/<repo>/,
// set base to "/<repo>/". For a custom domain or Vercel/Netlify, use "/".
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || "/",
});
