import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/AgenticMeetingScheduler",
  root: ".",
  build: {
    outDir: "dist", // Ensure this is set to "dist"
  },

  plugins: [react()],
  server: {
    port: 3000, // or any preferred port
  },
});
