import type { Perfil } from "@/lib/api";

// Catálogo ÚNICO de las pantallas de la aplicación y de su permiso. Lo usan el Inicio (para mostrar solo los enlaces permitidos)
// y las rutas (para no abrir por URL lo que el usuario no puede ver). La API vuelve a exigir el permiso en cada pedido: esto es
// solo para no mostrar pantallas vacías llenas de errores.
// El permiso sale del formulario equivalente del GATEC viejo (GAM_MODULOS_FORMS); varios códigos = vale el de cualquiera.

export type GrupoPantalla = "gpi" | "lab" | "admin";

export interface Pantalla {
  to: string;
  titulo: string;
  detalle: string;
  grupo: GrupoPantalla;
  /** Formulario(s) del GATEC con nivel de consulta o más. */
  idForm?: number | number[];
  /** Solo administradores (o acceso TOTAL a «Controle de Accesos», 9680). */
  admin?: boolean;
}

export const PANTALLAS: Pantalla[] = [
  { to: "/gpi/lancamento", titulo: "Digitación diaria", detalle: "Consulta de análisis por día", grupo: "gpi", idForm: 8420 },
  { to: "/gpi/valores", titulo: "Valores de variables", detalle: "Resultado diario o acumulado, con gráfico", grupo: "gpi", idForm: 8507 },
  { to: "/gpi/supervisorio", titulo: "Supervisorio", detalle: "Gráficos por variable con sus límites", grupo: "gpi", idForm: 8524 },
  { to: "/gpi/panel", titulo: "Panel de información", detalle: "Sus variables, especificaciones y gráficos CEP", grupo: "gpi", idForm: 9234 },
  { to: "/gpi/cep", titulo: "Control estadístico (CEP)", detalle: "Cartas de control y capacidad del proceso", grupo: "gpi", idForm: [8510, 10149] },
  { to: "/gpi/correlacion", titulo: "Correlación", detalle: "Correlación entre variables", grupo: "gpi", idForm: [9995, 10143] },
  { to: "/gpi/informes", titulo: "Informes", detalle: "Informes configurables: variables por día", grupo: "gpi", idForm: [8445, 10050] },
  { to: "/gpi/boletines", titulo: "Boletines", detalle: "Resumen del día y acumulado de zafra", grupo: "gpi", idForm: 8453 },
  { to: "/gpi/metas", titulo: "Real x Metas", detalle: "Resultado contra la meta de cada variable", grupo: "gpi", idForm: [9984, 10054, 9990] },
  { to: "/gpi/listados/variables", titulo: "Listado de variables", detalle: "Variables de cada planilla con su tipo y especificación", grupo: "gpi", idForm: 8457 },
  { to: "/gpi/listados/falta-digitacion", titulo: "Listado de falta de digitación", detalle: "Variables digitadas sin valor en un día", grupo: "gpi", idForm: [8978, 10078] },
  { to: "/gpi/listados/fuera-especificacion", titulo: "Listado fuera de especificación", detalle: "Resultados del día fuera del mínimo o máximo", grupo: "gpi", idForm: [10126, 10107] },
  { to: "/gpi/listados/anotaciones", titulo: "Listado de anotaciones", detalle: "Anotaciones de cada planilla por día", grupo: "gpi", idForm: 8455 },
  { to: "/gpi/listados/historico-valor", titulo: "Histórico de valor", detalle: "Altas, cambios y bajas de los valores de una variable", grupo: "gpi", idForm: 8648 },
  { to: "/gpi/listados/historico-variables", titulo: "Histórico de variables", detalle: "Cambios en la definición de las variables", grupo: "gpi", idForm: 10130 },
  { to: "/gpi/listados/historico-especificacion", titulo: "Histórico de especificación", detalle: "Límites mínimo y máximo vigentes por fecha", grupo: "gpi", idForm: 10122 },
  { to: "/lab/sonda", titulo: "Análisis de caña (sonda)", detalle: "Resultados por comprobante de balanza", grupo: "lab", idForm: [9905, 9903] },
  { to: "/lab/entrada-cana", titulo: "Entrada de caña", detalle: "Pesadas de balanza con el análisis del acumulado", grupo: "lab", idForm: [9905, 9903] },
  { to: "/admin", titulo: "Usuarios, grupos y permisos", detalle: "Consulta de accesos y conexiones (solo lectura)", grupo: "admin", admin: true },
];

export const ACCESO_TOTAL_CONTROL_ACCESOS = 9680;

export const esAdmin = (perfil: Perfil) => perfil.master || perfil.permisos.some((p) => p.idForm === ACCESO_TOTAL_CONTROL_ACCESOS && p.nivel >= 3);

export function puedeVer(perfil: Perfil, p: Pantalla): boolean {
  if (p.admin) return esAdmin(perfil);
  if (perfil.master) return true;
  if (p.idForm === undefined) return true;
  return [p.idForm].flat().some((f) => perfil.permisos.some((x) => x.idForm === f && x.nivel >= 1));
}

export const pantallaDe = (ruta: string) => PANTALLAS.find((p) => p.to === ruta);

// Programa del menú del GATEC (.exe) → grupo de pantallas de esta aplicación que lo reemplaza.
export const GRUPO_DE_EXE: Record<string, GrupoPantalla> = { "gatec_gpi.exe": "gpi", "gatec_lab.exe": "lab", "gatec_senha.exe": "admin" };
export const pantallasDeExe = (exe: string, visibles: Pantalla[]) => {
  const g = GRUPO_DE_EXE[exe.toLowerCase()];
  return g ? visibles.filter((x) => x.grupo === g) : [];
};

// Barra de menús del GPI viejo (mdiPrincipal de GATEC_GPI.exe) en el mismo orden. `pantallas` son rutas ya recreadas;
// `pendientes` son opciones del GATEC que todavía no existen aquí (se muestran en gris); `tablas` agrega los catálogos del módulo 90.
// Los nombres de las opciones pendientes se tradujeron de los menús del inventario (docs/inventario/GATEC_GPI.md); confirmar con un usuario del GATEC.
export const MODULO_GPI = 90;
export type ItemMenuGpi = { to: string; titulo?: string } | { pendiente: string } | { submenu: string; items: ItemMenuGpi[] };
export const MENU_GPI: { titulo: string; pantallas?: string[]; pendientes?: string[]; tablas?: boolean; items?: ItemMenuGpi[] }[] = [
  { titulo: "Entrada diaria", pantallas: ["/gpi/lancamento"] },
  {
    // Submenú «Movimientos» del GATEC. Lo que hay dentro de «Parada» está por confirmar (solo se conoce «Lanzamiento de paradas»).
    titulo: "Movimientos",
    items: [
      { pendiente: "Material en proceso" },
      { submenu: "Parada", items: [{ pendiente: "Lanzamiento de paradas" }] },
      { pendiente: "Lanzamiento por período" },
    ],
  },
  { titulo: "Cierre", pendientes: ["Cierre del día", "Control de cierre", "Verificación de variables del cierre"] },
  {
    // Submenú «Informes» del GATEC, en su orden. «General» se tomó como los Informes configurables (por confirmar).
    titulo: "Informes",
    items: [
      { to: "/gpi/informes", titulo: "General" },
      { pendiente: "General (multiempresa)" },
      { pendiente: "General (multizafra)" },
      { pendiente: "Mapas" },
      { to: "/gpi/metas", titulo: "Realizado x Metas" },
      { to: "/gpi/boletines", titulo: "Boletín" },
      { to: "/gpi/listados/anotaciones", titulo: "Listado de anotaciones" },
      { to: "/gpi/listados/falta-digitacion", titulo: "Listado de falta de digitación" },
      { to: "/gpi/listados/fuera-especificacion", titulo: "Listado fuera de especificación" },
      { to: "/gpi/listados/historico-valor", titulo: "Listado del histórico de valor" },
      { to: "/gpi/listados/historico-variables", titulo: "Listado del histórico de variables" },
      { to: "/gpi/listados/historico-especificacion", titulo: "Listado del histórico de especificación" },
      { to: "/gpi/listados/variables", titulo: "Listado de variables" },
      { pendiente: "Verificación de informes" },
      { pendiente: "Listado de paradas de equipos" },
      { pendiente: "Listado de lanzamiento de acción" },
    ],
  },
  { titulo: "Tablas", tablas: true },
  { titulo: "Configuración", pendientes: ["Parámetros del sistema", "Configuración general", "Curva de Brix"] },
  { titulo: "Consultas", pantallas: ["/gpi/valores", "/gpi/cep", "/gpi/correlacion"] },
  { titulo: "Supervisor", pantallas: ["/gpi/supervisorio", "/gpi/panel"] },
  { titulo: "Utilitarios", pendientes: ["Importar lanzamientos", "Exportar análisis", "Registros de actividad"] },
];
