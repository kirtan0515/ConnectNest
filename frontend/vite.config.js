import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The source files use JSX inside .js files, so tell esbuild to parse them as JSX.
// REACT_APP_* is kept as the env prefix so existing .env files keep working.
export default defineConfig({
  plugins: [react({ include: /\.(js|jsx)$/ })],
  envPrefix: ["REACT_APP_", "VITE_"],
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: { loader: { ".js": "jsx" } },
  },
  build: {
    // Keep the CRA output folder so the CDK Hosting stack path is unchanged.
    outDir: "build",
    sourcemap: false,
  },
  server: { port: 3000 },
});
