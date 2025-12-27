import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ✅ Clean config for React 18 + Vite 5
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Remove any wrong "react/index.js" expansion
      react: "react",
      "react-dom": "react-dom",
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "react-hot-toast"],
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
