import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/auth/AuthContext";
import { esErrorDeCliente } from "@/lib/api";
import App from "@/App";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/space-grotesk/latin-600.css";
import "@/index.css";

const queryClient = new QueryClient({
  // Un error de cliente (sesión vencida, sin permiso, datos inválidos) no se arregla reintentando; solo se reintentan fallas de red o del servidor.
  defaultOptions: { queries: { retry: (cantidad, error) => !esErrorDeCliente(error) && cantidad < 1, refetchOnWindowFocus: false } },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
