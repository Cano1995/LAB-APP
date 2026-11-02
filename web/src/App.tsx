import { Loader2 } from "lucide-react";
import { lazy, Suspense, type ReactElement } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui";
import { tokenStore } from "@/lib/api";
import { pantallaDe, puedeVer } from "@/lib/pantallas";
import { registrarReciente } from "@/lib/recientes";
import Login from "@/pages/Login";
import Sidebar from "@/components/Sidebar";
import { useMarcaEnDocumento } from "@/lib/branding";
import Dashboard from "@/pages/Dashboard";

// Cada pantalla se descarga al abrirla: el arranque (login e Inicio) no carga gráficos ni grillas que quizá no se usen.
const MaestraPage = lazy(() => import("@/pages/MaestraPage"));
const GpiLancamentoPage = lazy(() => import("@/pages/GpiLancamentoPage"));
const ConsultaValoresPage = lazy(() => import("@/pages/ConsultaValoresPage"));
const SupervisorioPage = lazy(() => import("@/pages/SupervisorioPage"));
const PanelPage = lazy(() => import("@/pages/PanelPage"));
const CepPage = lazy(() => import("@/pages/CepPage"));
const CorrelacionPage = lazy(() => import("@/pages/CorrelacionPage"));
const InformesPage = lazy(() => import("@/pages/InformesPage"));
const BoletinesPage = lazy(() => import("@/pages/BoletinesPage"));
const MetasPage = lazy(() => import("@/pages/MetasPage"));
const ListadosGpiPage = lazy(() => import("@/pages/ListadosGpiPage"));
const ListadosHistoricoGpiPage = lazy(() => import("@/pages/ListadosHistoricoGpiPage"));
const LabSondaPage = lazy(() => import("@/pages/LabSondaPage"));
const EntradaCanaPage = lazy(() => import("@/pages/EntradaCanaPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const AcercaPage = lazy(() => import("@/pages/AcercaPage"));

// Abre la pantalla solo si el usuario tiene permiso; si no, vuelve al Inicio con un aviso (la API igual exige el permiso en cada pedido).
function Protegida({ to, children }: { to: string; children: ReactElement }) {
  const { perfil } = useAuth();
  const pantalla = pantallaDe(to);
  if (perfil && pantalla && !puedeVer(perfil, pantalla)) return <Navigate to="/" replace state={{ denegado: pantalla.titulo }} />;
  return children;
}

// Recuerda las pantallas que el usuario abre (para los «Accesos recientes» del Inicio).
function RegistrarUso() {
  const { perfil } = useAuth();
  const { pathname } = useLocation();
  useEffect(() => {
    if (perfil && pantallaDe(pathname)) registrarReciente(perfil.id, pathname);
  }, [perfil, pathname]);
  return null;
}

// «Ingresar de nuevo» desde la pantalla de error de arranque: descarta el token guardado y recarga.
const cerrarSesion = () => { tokenStore.clear(); window.location.reload(); };

export default function App() {
  useMarcaEnDocumento();
  const { perfil, cargando, errorInicio, reintentarInicio } = useAuth();

  if (cargando) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!perfil && errorInicio) {
    return (
      <div className="flex min-h-full items-center justify-center bg-canvas px-4">
        <div className="panel w-full max-w-sm space-y-4 p-6">
          <h1 className="page-title">No se pudo validar su sesión</h1>
          <p className="text-[13px] text-muted">{errorInicio}</p>
          <div className="flex gap-2">
            <Button onClick={reintentarInicio}>Reintentar</Button>
            <Button variant="secondary" onClick={cerrarSesion}>Ingresar de nuevo</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!perfil) return <Login />;

  // La clave reinicia todas las pantallas (filtros, selecciones, fechas) al cambiar de empresa o de zafra.
  const claveContexto = `${perfil.contexto?.empresa.cod ?? 0}-${perfil.contexto?.safra ?? 0}`;
  const protegida = (to: string, pagina: ReactElement) => <Route path={to} element={<Protegida to={to}>{pagina}</Protegida>} />;

  return (
    <div className="flex h-screen">
    <Sidebar />
    <RegistrarUso />
    <div className="min-w-0 flex-1 overflow-y-auto">
    <Suspense fallback={<div className="flex min-h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-600" aria-label="Cargando" /></div>}>
    <Routes key={claveContexto}>
      <Route path="/" element={<Dashboard />} />
      <Route path="/maestras/:recurso" element={<MaestraPage />} />
      {protegida("/gpi/lancamento", <GpiLancamentoPage />)}
      {protegida("/gpi/valores", <ConsultaValoresPage />)}
      {protegida("/gpi/supervisorio", <SupervisorioPage />)}
      {protegida("/gpi/panel", <PanelPage />)}
      {protegida("/gpi/cep", <CepPage />)}
      {protegida("/gpi/correlacion", <CorrelacionPage />)}
      {protegida("/gpi/informes", <InformesPage />)}
      {protegida("/gpi/boletines", <BoletinesPage />)}
      {protegida("/gpi/metas", <MetasPage />)}
      {protegida("/gpi/listados/variables", <ListadosGpiPage tipo="variables" />)}
      {protegida("/gpi/listados/falta-digitacion", <ListadosGpiPage tipo="falta-digitacion" />)}
      {protegida("/gpi/listados/fuera-especificacion", <ListadosGpiPage tipo="fuera-especificacion" />)}
      {protegida("/gpi/listados/anotaciones", <ListadosHistoricoGpiPage tipo="anotaciones" />)}
      {protegida("/gpi/listados/historico-valor", <ListadosHistoricoGpiPage tipo="historico-valor" />)}
      {protegida("/gpi/listados/historico-variables", <ListadosHistoricoGpiPage tipo="historico-variables" />)}
      {protegida("/gpi/listados/historico-especificacion", <ListadosHistoricoGpiPage tipo="historico-especificacion" />)}
      {protegida("/lab/sonda", <LabSondaPage />)}
      {protegida("/lab/entrada-cana", <EntradaCanaPage />)}
      {protegida("/admin", <AdminPage />)}
      <Route path="/acerca" element={<AcercaPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
    </div>
    </div>
  );
}
