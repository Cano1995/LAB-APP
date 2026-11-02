import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    port: 3100,
    proxy: {
      "/api": "http://localhost:3101",
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Las librerías cambian poco: en un archivo aparte el navegador las conserva en caché aunque cambie el código de la aplicación.
        manualChunks: (id) => (id.includes("node_modules") ? "vendor" : undefined),
      },
    },
  },
});
