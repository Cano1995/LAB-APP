// Cliente HTTP mínimo. El token se guarda en localStorage y se adjunta a cada pedido.

export interface Permiso {
  idForm: number;
  modulo: number;
  objeto: string;
  titulo: string;
  tipo: string;
  nivel: number;
}
export interface Grupo {
  id: number;
  nombre: string;
}
export interface Contexto {
  empresa: { cod: number; nombre: string };
  safra: number;
}
export interface Perfil {
  id: number;
  usuario: string;
  nombre: string;
  email: string | null;
  master: boolean;
  grupos: Grupo[];
  permisos: Permiso[];
  contexto: Contexto | null;
  /** Funciones de edición habilitadas en el servidor (apagadas por defecto). */
  funciones?: { gpiDigitacion: boolean };
}
export interface EmpresaOpcion {
  cod: number;
  nombre: string;
  safras: { anio: number; etiqueta: string }[];
}

const TOKEN_KEY = "lab_app_token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  code?: string;
  extra?: Record<string, unknown>;
  /** Código HTTP (0 = no hubo respuesta: servidor caído o sin red). */
  status: number;
  constructor(message: string, code?: string, extra?: Record<string, unknown>, status = 0) {
    super(message);
    this.code = code;
    this.extra = extra;
    this.status = status;
  }
}

/** Error de cliente (4xx): reintentarlo no sirve (sesión vencida, sin permiso, datos inválidos…). */
export const esErrorDeCliente = (e: unknown) => e instanceof ApiError && e.status >= 400 && e.status < 500;

// Quien administra la sesión (AuthContext) se registra aquí para enterarse de un 401 con un token guardado:
// el token venció o fue invalidado, y seguir mostrando pantallas con errores crudos sería confuso.
let alSesionVencida: (() => void) | null = null;
export const registrarSesionVencida = (fn: (() => void) | null) => { alSesionVencida = fn; };

/** Arma «?a=1&b=2» con URLSearchParams: codifica todos los valores y omite los vacíos (antes se interpolaban a mano, sin codificar). */
export const consulta = (p: Record<string, string | number | boolean | null | undefined>) => {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : "";
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new ApiError("No se pudo conectar con el servidor. Revise su conexión y reintente.", "RED");
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const d = (data || {}) as Record<string, unknown>;
    // 401 con token guardado = sesión vencida (el login mismo responde 401 por credenciales inválidas y no cuenta).
    if (res.status === 401 && token && path !== "/auth/login") {
      alSesionVencida?.();
      throw new ApiError("Su sesión venció. Ingrese nuevamente.", "SESION", d, 401);
    }
    throw new ApiError((d.error as string) || (d.msg as string) || "Error", d.code as string, d, res.status);
  }
  return data as T;
}

// --- Tablas maestras (CRUD genérico) ---------------------------------------

export interface Columna {
  col: string;
  label: string;
  tipo: "texto" | "numero" | "bool" | "fecha" | "hora" | "fechahora";
  len?: number;
  pk?: boolean;
  req?: boolean;
  lista?: boolean;
  scope?: boolean; // empresa/zafra: se completa desde el contexto, no se edita
}
export interface RecursoMeta {
  nombre: string;
  titulo: string;
  columnas: Columna[];
  nivel: number; // 1=consulta, 2=edición, 3=total
}
export interface RecursoResumen {
  nombre: string;
  titulo: string;
  modulo: number;
  idForm: number;
  nivel: number;
}
export type Fila = Record<string, string | number | boolean | null>;

const maestras = {
  listar: () => request<{ recursos: RecursoResumen[] }>("/maestras"),
  tabla: (recurso: string, q?: string) =>
    request<{ recurso: RecursoMeta; filas: Fila[] }>(`/maestras/${encodeURIComponent(recurso)}${consulta({ q })}`),
  crear: (recurso: string, data: Fila) =>
    request<{ ok: true; registro: Fila }>(`/maestras/${recurso}`, { method: "POST", body: JSON.stringify(data) }),
  actualizar: (recurso: string, id: string, data: Fila) =>
    request<{ ok: true; registro: Fila }>(`/maestras/${recurso}/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  eliminar: (recurso: string, id: string) =>
    request<{ ok: true }>(`/maestras/${recurso}/${encodeURIComponent(id)}`, { method: "DELETE" }),
};

// --- GPI (módulo 90) --------------------------------------------------------

export interface NodoGpi {
  id: number;
  padre: number | null;
  nombre: string;
  activo: boolean;
  variables: number;
  habilitado: boolean;
}
export interface VariableGpi {
  id: number;
  orden: number | null;
  nombre: string;
  analisis: string;
  unidad: string | null;
  calculada: boolean;
  tipoDig: number;
  tipoMedia: number;
  ponderadaPor: number | null;
  decimales: number | null;
  formula: string | null;
  especMin: number | null;
  especMax: number | null;
  activa: boolean;
}
export interface ConfigPlanilla {
  divisao: number; // 0 = horas, 1 = bateladas
  nvezes: number;
  ini: string;
  fim: string;
  activa: boolean;
}
export interface LancamentoGpi {
  configuracion: ConfigPlanilla | null;
  columnas: { col: number; titulo: string }[];
  variables: VariableGpi[];
  safraGpi: { INICIO: string; FIM: string | null; DIA_ACTUAL: string | null; FECHA_REAL: string | null; ENCERRADA: number } | null;
  idLanc: number | null;
  valores: Record<string, Record<string, string>>;
  /** Acumulado de zafra por variable (solo si se pidió `acum`). */
  acumulado?: Record<string, string>;
  /** Resultado de los 7 días que terminan en la fecha (solo si se pidió `sem`; provisorio). */
  semanal?: Record<string, string>;
  aviso?: string;
  /** ¿Puede el usuario editar este día? (interruptor del servidor, permiso total y día abierto). */
  edicion?: { permitida: boolean; motivo: string | null };
}
/** Una celda digitada: `anterior` es el valor que el usuario vio (control de concurrencia) y `nuevo` el que escribió ('' = borrar). */
export interface CambioCelda { idVar: number; col: number; anterior: string | null; nuevo: string }
// Listados del menú Informes (solo lectura)
export interface FilaListadoVariable {
  id: number; plan: number; planNombre: string; orden: number; nombre: string; analisis: string; unidad: string | null;
  calculada: boolean; tipoMedia: number; decimales: number | null; especMin: number | null; especMax: number | null; activa: boolean;
}
export interface ListadoVariables { total: number; truncado: boolean; planillas: { id: number; nombre: string }[]; filas: FilaListadoVariable[] }
export interface ListadoFalta {
  fecha: string; aviso?: string; planillasConDatos?: number;
  planillas: { id: number; nombre: string; sinDatos: boolean; digitadas: number; faltantes: { id: number; orden: number; nombre: string; unidad: string | null }[] }[];
}
export interface ListadoFuera {
  desde: string; hasta: string; aviso?: string; total?: number; truncado?: boolean;
  filas: { fecha: string; plan: number; planNombre: string; id: number; nombre: string; unidad: string | null; valor: string; min: number | null; max: number | null; motivo: "bajo" | "alto" }[];
}
export interface ListadoAnotaciones {
  desde: string; hasta: string; total: number; truncado: boolean; planillas: { id: number; nombre: string }[];
  filas: { fecha: string; plan: number; planNombre: string; texto: string }[];
}
export interface ListadoHistoricoValor {
  desde: string; hasta: string; aviso?: string; truncado?: boolean; variable?: { id: number; nombre: string; planNombre: string; unidad: string | null };
  filas: { fecha: string; hora: string; usuario: string; columna: number; valor: string; operacion: string; comentario: string | null }[];
}
export interface ListadoHistoricoVariables {
  desde: string; hasta: string; total: number; truncado: boolean;
  filas: { hora: string; usuario: string; id: number; nombre: string; planNombre: string; operacion: string; formula: string; formulaAlterada: string; activa: boolean }[];
}
export interface ListadoHistoricoEspecificacion {
  desde: string; hasta: string; total: number; truncado: boolean;
  filas: { desde: string; id: number; nombre: string; planNombre: string; unidad: string | null; min: string | null; max: string | null; minInclusive: boolean; maxInclusive: boolean }[];
}
export interface ResultadoGrabacion {
  ok: true; idLanc: number | null; cambios: number;
  filas: { idVar: number; col: number; valor: string | null; derivada: boolean }[];
  calculadasDesactualizadas: boolean;
}
export interface ConflictoCelda { idVar: number; col: number; actual: string | null }

// Consultas y supervisorio
export interface VariableMeta {
  id: number;
  plan: number;
  planNombre: string;
  nombre: string;
  analisis: string;
  unidad: string | null;
  decimales: number | null;
  tipoMedia: number;
  calculada: boolean;
}
export interface ConsultaGuardada {
  codigo: number;
  descripcion: string;
  media: string | null;
  desde: string | null;
  hasta: string | null;
  variables: number[];
}
export interface ValoresGpi {
  variables: VariableMeta[];
  acumulado?: boolean;
  filas: { fecha: string; valores: Record<string, string> }[];
  aviso?: string;
}
export interface SupervisorioResumen {
  codigo: string;
  descripcion: string;
  minutos: number;
  variables: number;
}
export interface SerieSupervisorio {
  orden: number;
  id: number;
  descripcion: string;
  min: number | null;
  max: number | null;
  tipoGrafico: number | null;
  limiteInf: number | null;
  limiteSup: number | null;
  habilitada: boolean;
  unidad: string | null;
  porHoras?: boolean;
  puntos: { t: string; y: number }[];
}
export interface SerieSupervisorioRespuesta {
  supervisorio: { codigo: string; descripcion: string; minutos: number };
  series: SerieSupervisorio[];
}

export interface EspecificacionVar { min: number | null; max: number | null; minIncl: boolean; maxIncl: boolean }
export interface PanelGpi {
  configurado: boolean;
  preferencias: { abreAlInicio: boolean; segundosActualiza: number; fechaPadron: string } | null;
  variables: VariableMeta[];
  fueraEspecificacion: (VariableMeta & { especificacion: EspecificacionVar | null })[];
  diagnostico: VariableMeta[];
  cep: { variable: VariableMeta; lse: number | null; lie: number | null; muestras: number | null }[];
  reportes: { tipo: string; codigo: number; titulo: string | null }[];
}
export interface CartaControl {
  n: number;
  tam?: number;
  subgrupos?: number;
  error?: string;
  media?: number | null;
  desvio?: number | null;
  min?: number;
  max?: number;
  sigma?: number | null;
  x?: { puntos: (number | null)[]; lc: number | null; lcs: number | null; lci: number | null; fuera: number[] };
  r?: { puntos: (number | null)[]; lc: number | null; lcs: number | null; lci: number | null };
  capacidad?: { cp?: number | null; cpl?: number | null; cpu?: number | null; cpk?: number | null };
}
export interface CepGpi {
  variable: VariableMeta;
  hasta: string;
  muestras: number;
  lse: number | null;
  lie: number | null;
  serie: { fecha: string; y: number }[];
  carta: CartaControl;
}
export interface CorrelacionGpi {
  variables: VariableMeta[];
  desde: string;
  hasta: string;
  dias: number;
  matriz: { r: number | null; n: number }[][];
  aviso?: string;
}

export interface InformeResumen { id: number; titulo: string; subtitulo: string | null; variables: number }
export interface LineaInforme {
  seq: number;
  tipo: "variable" | "seccion" | "subtitulo" | "espacio";
  texto: string;
  color: string | null;
  colorFuente: string | null;
  negrita: boolean;
  quiebre: boolean;
  variable?: VariableMeta | null;
  habilitada?: boolean;
  valores?: Record<string, string>;
}
export interface InformeGpi { id: number; titulo: string; subtitulo: string | null; fechas: string[]; lineas: LineaInforme[] }

export interface BoletinResumen { id: number; titulo: string; columnas: number; variables: number }
export interface ItemBoletin {
  tipo: "variable" | "division" | "subdivision";
  texto: string;
  variable?: VariableMeta | null;
  habilitada?: boolean;
  dia?: string | null;
  acumulado?: string | null;
}
export interface BoletinGpi { id: number; titulo: string; fecha: string; columnas: ItemBoletin[][] }
export type PeriodoMeta = "diario" | "quincenal" | "mensual" | "acumulado";
export interface FilaMeta {
  variable: VariableMeta;
  vigencia: string;
  ideal: "superior" | "inferior";
  obs: string | null;
  meta: number | null;
  real: number | null;
  cumplimiento: number | null;
  cumple: boolean | null;
}
export interface MetasGpi { fecha: string; periodo: PeriodoMeta; desde: string; filas: FilaMeta[]; sinMeta: number }

const gpi = {
  boletines: () => request<{ boletines: BoletinResumen[] }>("/gpi/boletines"),
  boletin: (id: number, fecha: string) => request<BoletinGpi>(`/gpi/boletines/${id}${consulta({ fecha })}`),
  metas: (fecha: string, periodo: PeriodoMeta) => request<MetasGpi>(`/gpi/metas${consulta({ fecha, periodo })}`),
  informes: () => request<{ informes: InformeResumen[] }>("/gpi/informes"),
  informe: (id: number, desde: string, hasta: string) => request<InformeGpi>(`/gpi/informes/${id}${consulta({ desde, hasta })}`),
  panel: (fecha?: string) => request<PanelGpi>(`/gpi/panel${consulta({ fecha })}`),
  cep: (p: { id: number; hasta: string; muestras: number; tam: number; lse?: string; lie?: string }) =>
    request<CepGpi>(`/gpi/cep${consulta({ id: p.id, hasta: p.hasta, muestras: p.muestras, tam: p.tam, lse: p.lse, lie: p.lie })}`),
  correlacion: (ids: number[], desde: string, hasta: string) =>
    request<CorrelacionGpi>(`/gpi/correlacion${consulta({ ids: ids.join(","), desde, hasta })}`),
  buscarVariables: (q: string) => request<{ variables: VariableMeta[] }>(`/gpi/variaveis${consulta({ q })}`),
  variablesPorIds: (ids: number[]) => request<{ variables: VariableMeta[] }>(`/gpi/variaveis${consulta({ ids: ids.join(",") })}`),
  consultas: () => request<{ consultas: ConsultaGuardada[] }>("/gpi/consultas"),
  valores: (ids: number[], desde: string, hasta: string, acumulado: boolean) =>
    request<ValoresGpi>(`/gpi/valores${consulta({ ids: ids.join(","), desde, hasta, acumulado: acumulado ? 1 : 0 })}`),
  supervisorios: () => request<{ supervisorios: SupervisorioResumen[] }>("/gpi/supervisorios"),
  serieSupervisorio: (codigo: string, desde: string, hasta: string) =>
    request<SerieSupervisorioRespuesta>(`/gpi/supervisorios/${encodeURIComponent(codigo)}/serie${consulta({ desde, hasta })}`),
  arbol: () => request<{ nodos: NodoGpi[] }>("/gpi/arbol"),
  lancamento: (idPlan: number, data: string, extra: { acum?: boolean; sem?: boolean } = {}) =>
    request<LancamentoGpi>(`/gpi/planilhas/${idPlan}/lancamento${consulta({ data, acum: extra.acum ? "1" : undefined, sem: extra.sem ? "1" : undefined })}`),
  grabarLancamento: (idPlan: number, data: string, cambios: CambioCelda[]) =>
    request<ResultadoGrabacion>(`/gpi/planilhas/${idPlan}/lancamento`, { method: "PUT", body: JSON.stringify({ data, cambios }) }),
  safra: () => request<{ safra: number; parametros: LancamentoGpi["safraGpi"] }>("/gpi/safra"),
  listadoVariables: (f: { q?: string; plan?: number; tipo?: string; activas?: boolean }) =>
    request<ListadoVariables>(`/gpi/listados/variables${consulta({ q: f.q, plan: f.plan, tipo: f.tipo, activas: f.activas ? "1" : undefined })}`),
  listadoFalta: (fecha: string) => request<ListadoFalta>(`/gpi/listados/falta-digitacion${consulta({ fecha })}`),
  listadoAnotaciones: (desde: string, hasta: string, plan?: number) => request<ListadoAnotaciones>(`/gpi/listados/anotaciones${consulta({ desde, hasta, plan })}`),
  listadoHistoricoValor: (id: number, desde: string, hasta: string) => request<ListadoHistoricoValor>(`/gpi/listados/historico-valor${consulta({ id, desde, hasta })}`),
  listadoHistoricoVariables: (desde: string, hasta: string, id?: number) => request<ListadoHistoricoVariables>(`/gpi/listados/historico-variables${consulta({ id, desde, hasta })}`),
  listadoHistoricoEspecificacion: (desde: string, hasta: string, id?: number) => request<ListadoHistoricoEspecificacion>(`/gpi/listados/historico-especificacion${consulta({ id, desde, hasta })}`),
  listadoFuera: (desde: string, hasta: string) => request<ListadoFuera>(`/gpi/listados/fuera-especificacion${consulta({ desde, hasta })}`),
  dias: (idPlan: number, mes: string) => request<{ dias: string[] }>(`/gpi/planilhas/${idPlan}/dias${consulta({ mes })}`),
};

export type EstadoSonda = "todos" | "completas" | "sinresultado" | "acoplados" | "canceladas";
export interface FilaSonda {
  id: number;
  fecha: string;
  comprobante: number;
  acoplado: number;
  brix: number | null;
  pol: number | null;
  fibra: number | null;
  pureza: number | null;
  ar: number | null;
  atr: number | null;
  pesoMuestra: number | null;
  operador: string | null;
  motivoCancelacion: { codigo: number; descripcion: string | null } | null;
}
export interface SondaGpi {
  desde: string | null;
  hasta: string | null;
  ultimoDia?: string;
  estado?: EstadoSonda;
  resumen: { total: number; completas?: number; sinResultado?: number; acoplados?: number; canceladas?: number; brix?: number | null; pol?: number | null; fibra?: number | null; pureza?: number | null; atr?: number | null };
  truncado: boolean;
  filas: FilaSonda[];
}
export interface DetalleSonda {
  id: number;
  fecha: string;
  fechaDigitacion: string | null;
  comprobante: number;
  acoplado: number;
  motivoCancelacion: { codigo: number; descripcion: string | null } | null;
  campos: Record<string, string | number>;
  sondaPrimaria: { fecha: string | null; brix: number | null; ls: number | null; pbu: number | null; pbuMuestra: number | null; ph: number | null; operador: string | null; estado: number | null; noConfirmada: boolean }[];
}

export interface FilaEntrada {
  comprobante: number;
  salida: string;
  canero: string | null;
  codCanero: string | null;
  finca: string | null;
  parcela: string | null;
  variedad: string | null;
  tipoCorte: string | null;
  toneladas: number | null;
  tiempoCorte: number | null;
  acumulado: number | null;
  analisis: { cantidad: number; brix: number | null; pol: number | null; atr: number | null } | null;
}
export interface EntradaCanaGpi {
  desde: string | null;
  hasta: string | null;
  ultimoDia?: string;
  resumen: { camiones: number; toneladas: number; caneros?: number };
  truncado: boolean;
  filas: FilaEntrada[];
}

export interface AccesoAdmin { codigo: number; texto: string }
export interface UsuarioAdmin { id: number; usuario: string; nombre: string | null; ramal: string | null; activo: boolean; master: boolean; bloqueado: boolean; grupos?: string }
export interface PermisoUsuarioAdmin { idForm: number; modulo: number; objeto: string; titulo: string; tipo: string; directo: AccesoAdmin | null; grupo: AccesoAdmin | null; efectivo: AccesoAdmin | null }
export interface UsuarioAdminDetalle {
  id: number; usuario: string; nombre: string | null; ramal: string | null; activo: boolean; master: boolean; bloqueado: boolean;
  grupos: { id: number; nombre: string }[];
  permisos: PermisoUsuarioAdmin[];
  historial: { fecha: string; idForm: number; titulo: string | null; acceso: AccesoAdmin | null; responsable: string | null }[];
  conexiones: { inicio: string; fin: string | null; modulo: number; equipo: string | null }[];
}
export interface GrupoAdmin { id: number; nombre: string; miembros: number; pantallas: number }
export interface GrupoAdminDetalle { id: number; nombre: string; miembros: UsuarioAdmin[]; permisos: { idForm: number; modulo: number; titulo: string; tipo: string; acceso: AccesoAdmin | null }[] }
export interface PantallaAdmin { idForm: number; modulo: number; objeto: string; titulo: string; tipo: string }
export interface PermisosPantallaAdmin {
  pantalla: { idForm: number; modulo: number; objeto: string; titulo: string };
  usuarios: (UsuarioAdmin & { efectivo: AccesoAdmin | null; origen: "directo" | "grupo" })[];
  grupos: { id: number; nombre: string; acceso: AccesoAdmin | null }[];
}
export interface ConexionAdmin { idUsuario: number; usuario: string | null; modulo: number; inicio: string; fin: string | null; equipo: string | null; usuarioSo: string | null }

export interface Marca {
  nombre: string; nombre_corto: string; empresa: string; lema: string; descripcion: string; pais: string;
  imagenes: { logo_claro: string | null; logo_oscuro: string | null; emblema: string | null; favicon: string | null };
}
export interface ImagenConfig {
  clave: string; titulo: string; mimes: string[]; max: number;
  actual: { mime: string; nombre: string | null; tamano: number | null; url: string } | null;
}
export interface ConfiguracionAdmin {
  textos: Record<string, string>;
  campos: Record<string, { max: number; obligatorio: boolean }>;
  imagenes: ImagenConfig[];
}

const admin = {
  configuracion: () => request<ConfiguracionAdmin>("/admin/configuracion"),
  guardarConfiguracion: (textos: Record<string, string>) => request<{ ok: true; cambios: number }>("/admin/configuracion", { method: "PUT", body: JSON.stringify(textos) }),
  subirImagen: (clave: string, p: { mime: string; nombre: string; datos: string }) =>
    request<{ ok: true }>(`/admin/configuracion/assets/${clave}`, { method: "PUT", body: JSON.stringify(p) }),
  quitarImagen: (clave: string) => request<{ ok: true }>(`/admin/configuracion/assets/${clave}`, { method: "DELETE" }),
  usuarios: (q: string, estado: string) => request<{ truncado: boolean; usuarios: UsuarioAdmin[] }>(`/admin/usuarios${consulta({ estado, q })}`),
  usuario: (id: number) => request<UsuarioAdminDetalle>(`/admin/usuarios/${id}`),
  grupos: () => request<{ grupos: GrupoAdmin[] }>("/admin/grupos"),
  grupo: (id: number) => request<GrupoAdminDetalle>(`/admin/grupos/${id}`),
  pantallas: (q: string) => request<{ pantallas: PantallaAdmin[] }>(`/admin/pantallas${consulta({ q })}`),
  permisosPantalla: (id: number) => request<PermisosPantallaAdmin>(`/admin/pantallas/${id}/permisos`),
  conexiones: (desde: string, hasta: string, usuario: string) =>
    request<{ desde: string; hasta: string; truncado: boolean; conexiones: ConexionAdmin[] }>(`/admin/conexiones${consulta({ desde, hasta, usuario })}`),
};

const lab = {
  entradaCana: (p: { desde?: string; hasta?: string; comprobante?: string; canero?: string }) =>
    request<EntradaCanaGpi>(`/lab/entrada-cana${consulta({ desde: p.desde, hasta: p.hasta, comprobante: p.comprobante, canero: p.canero })}`),
  sonda: (p: { desde?: string; hasta?: string; comprobante?: string; estado: EstadoSonda }) =>
    request<SondaGpi>(`/lab/sonda${consulta({ estado: p.estado, desde: p.desde, hasta: p.hasta, comprobante: p.comprobante })}`),
  sondaDetalle: (id: number) => request<DetalleSonda>(`/lab/sonda/${id}`),
};

export interface MenuGatec {
  carpetas: { id: number; padre: number | null; nombre: string }[];
  programas: { id: number; carpeta: number; nombre: string; exe: string }[];
  favoritos: number[];
}

export interface Notificacion {
  id: number;
  fecha: string;
  tipo: "info" | "exito" | "aviso" | "error";
  titulo: string;
  mensaje: string | null;
  enlace: string | null;
  leida: boolean;
}

export interface InicioDatos {
  /** Si el usuario tiene acceso al laboratorio de recepción (balanza y sonda). */
  lab: boolean;
  /** null = no se pudo leer; undefined = sin permiso. */
  balanza?: { ultimoDia: string | null; dias: { fecha: string; camiones: number; toneladas: number; caneros: number }[] } | null;
  analisis?: { fecha: string | null; total: number; completas: number; sinResultado: number; brix: number | null; pol: number | null; atr: number | null } | null;
}

export const api = {
  marca: () => request<Marca>("/branding"),
  inicio: () => request<InicioDatos>("/inicio"),
  notificaciones: {
    listar: () => request<{ pendientes: number; notificaciones: Notificacion[] }>("/notificaciones"),
    marcarLeida: (id: number) => request<{ ok: true }>(`/notificaciones/${id}/leida`, { method: "POST" }),
    marcarTodas: () => request<{ ok: true }>("/notificaciones/leidas", { method: "POST" }),
  },
  menu: () => request<MenuGatec>("/menu"),
  admin,
  lab,
  gpi,
  login: (usuario: string, senha: string) =>
    request<{ token: string; perfil: Perfil }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ usuario, senha }),
    }),
  me: () => request<{ perfil: Perfil }>("/auth/me"),
  maestras,
  contexto: {
    opciones: () => request<{ empresas: EmpresaOpcion[] }>("/contexto/opciones"),
    seleccionar: (codEmpr: number, safra: number) =>
      request<{ ok: true; contexto: Contexto }>("/contexto", {
        method: "POST",
        body: JSON.stringify({ codEmpr, safra }),
      }),
  },
};
