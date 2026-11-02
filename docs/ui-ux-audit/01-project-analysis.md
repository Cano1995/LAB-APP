# 01 · Análisis del proyecto (arquitectura y estructura)

Auditoría del 30/10/2026 sobre el árbol de trabajo (incluye cambios sin commitear: sidebar, tema claro/oscuro, Inicio, listados GPI).
**No se modificó código.** Este documento es la base de los demás (`02`…`08`).

## 0. Cómo se hizo y qué NO se pudo comprobar

| Método | Alcance |
|---|---|
| Lectura completa de código | `App.tsx`, `ui.tsx`, `Sidebar.tsx`, `AppHeader.tsx`, `ContextoSelector.tsx`, `NotificationBell.tsx`, `Dashboard.tsx`, `Login.tsx`, `MaestraPage.tsx`, `BarraHerramientas.tsx`, `GpiLancamentoPage.tsx` (líneas 1-470 y 520-701), `tema.css`, `index.css`, `tailwind.config.ts`, `pantallas.ts`, `docs/ui-sistema-visual.md` |
| Lectura estructural (grep de layout, controles, estados, a11y) | Las otras 14 pantallas: Valores, Supervisorio, Panel, CEP, Correlación, Informes, Boletines, Metas, Listados (3), Sonda, Entrada de caña, Admin |
| App en ejecución | Web (`:3100`) y API (`:3101`) arriba. **Recorrido real con el usuario BOT en DESA** (solo lectura): 17 pantallas a 1440 y 1100 px (+768 y 390 en 5), tema oscuro en 3, con medición de anchos; ver Anexo A |
| Capturas | `docs/ui-ux-audit/capturas/` (login, Inicio, Digitación a 1440/1100/8 días, Valores, CEP oscuro, móvil) |

Consecuencia: lo marcado **[V]** se comprobó en código y, donde se indica, **también renderizado** (Anexo A). Lo marcado **[H]** depende de uso real con usuarios. Las puntuaciones de 14 pantallas siguen siendo de confianza media: se vieron cargadas pero no se operaron.

## 1. Qué es el producto y quién lo usa

Reescritura web de **GATEC** (VB6, fuente perdida) para el laboratorio y proceso industrial de AZPA (ingenio azucarero). Misma base Oracle, mismas reglas, interfaz en español.
- **Usuarios**: personal de laboratorio/proceso (digitan análisis por planilla y día, consultan valores, gráficos, CEP, boletines), balanza/entrada de caña, y administradores (permisos). Login = usuario GATEC + contraseña Oracle.
- **Contexto de uso** [hipótesis, validar]: escritorio en planta/oficina; el repo documenta "escritorio ≥ 1100 px, no se diseñó para móvil" (`docs/ui-sistema-visual.md:99`). Existe una app móvil hermana (`app-azpa-movil`) de la que se copiaron los tokens.
- **Restricción dominante de UX**: paridad con el GATEC viejo. Muchas decisiones (botones «Id/Esp/Sem/Acum», «fixar data», árbol + grilla) son deuda de paridad, no de diseño. El rediseño debe separar *comportamiento a conservar* de *presentación a modernizar* (ver `06`).

## 2. Stack

| Capa | Tecnología | Nota |
|---|---|---|
| Front | React 18.3, Vite 5.4 (SWC), TypeScript 5.6, React Router 6.30, TanStack Query 5.59 | `web/package.json` |
| Estilos | Tailwind 3.4 + variables CSS (`tema.css`) + 4 clases de componente en `index.css` | sin UI kit |
| Iconos | `lucide-react` 0.454 | un grosor (1,75) forzado en `index.css:28` |
| Fuentes | Inter 400/500/600 y Space Grotesk 600, autoalojadas (`@fontsource`) | sin Google Fonts |
| Gráficos | **Propio**: `LineChart.tsx` (322 l., SVG), `BarrasDiarias.tsx` | sin librería |
| Tablas | **Propias**: `<table>` + `.data-table`; sin ordenar/paginar/virtualizar | ver 02/03 |
| Formularios | Estado local con `useState`; sin librería; validación mínima + errores de API | |
| Excel/CSV | `lib/xlsx.ts` (escritor propio), `lib/csv.ts` | |
| Back | Node + Express + `oracledb` (thick), JWT | `api/` |
| Pruebas | `node --test` sobre utilidades (CSV, URLs, xlsx); e2e propios con Edge headless en `tools/e2e/` | **sin pruebas de componentes ni regresión visual** |

Decisión de arquitectura sana: **no hay dependencias pesadas**, el bundle se parte por pantalla (`React.lazy` en `App.tsx:15-28`). Cualquier rediseño debe conservarlo; no hay justificación para cambiar de framework.

## 3. Arquitectura del front

```
web/src
├─ main.tsx            QueryClient + Router + AuthProvider
├─ App.tsx             auth gate → Login | (Sidebar + <Routes>) ; Protegida() por permiso
├─ auth/AuthContext    perfil, contexto empresa/zafra, token
├─ components/         ui.tsx (Button, Input, Select, Field, Alert, Badge, Modal, …),
│                      Sidebar, AppHeader, BarraHerramientas, LineChart, BarrasDiarias,
│                      ContextoSelector, NotificationBell, TemaToggle, BuscadorVariables
├─ lib/                api.ts (cliente + tipos), pantallas.ts (catálogo + MENU_GPI), tema.ts,
│                      menuLateral.ts, recientes.ts, fecha/formato/num/csv/xlsx
└─ pages/              16 archivos (15 pantallas + Login)
```

### Mapa de layout (el hallazgo estructural más importante)
Cada página arma **su propia carcasa**; no existe un `Layout` compartido:

```
App: <div flex h-screen> <Sidebar w-64 hidden md:flex/>  <div overflow-y-auto> <Routes/> </div> </div>
Página tipo "herramienta" (10 pantallas):
   <AppHeader/>                       48 px, casi vacío (empresa/zafra, tema, campana)
   <div flex>
      <aside w-72|80|96 shrink-0/>    lista/árbol/filtros, ancho FIJO
      <main>
         <BarraHerramientas/>         ≥ 52 px, flex-wrap, controles
         <div overflow-auto p-4/>     contenido
Página tipo "contenido" (Inicio, Maestras): AppHeader + <main max-w-6xl px-6 py-6>
```
Implicaciones: (a) 100+ px de cromo antes del contenido; (b) cada página decide su propio título (dos estilos, ver 02); (c) anchos fijos sumados al sidebar de 256 px (ver 02 §Composición); (d) un cambio de cromo requiere tocar ~15 archivos.

### Flujo de autenticación y permisos
Login → `GET /auth/me` → `perfil` con `permisos[idForm→nivel]`. `pantallas.ts` es el catálogo único (`PANTALLAS` + `MENU_GPI`) y `Protegida()` redirige al Inicio con aviso. El menú (`Sidebar.tsx:64-113`) se **construye cruzando** el menú del GATEC (`/api/menu`), `PANTALLAS`, `MENU_GPI` y las maestras. Es potente pero es la pieza más compleja del front (ver U5/U12 en `03`).

## 4. Sistema de diseño existente

- **Tokens** como variables RGB por tema (`tema.css`), consumidos por Tailwind con `rgb(var(--x) / <alpha>)` (`tailwind.config.ts:5`). Claro y oscuro con un mismo nombre de clase. Es una base **buena**.
- **Trampa de mantenimiento**: la escala `slate/red/green/amber/blue` está **re-mapeada por tema** (`tailwind.config.ts:32-37`). `text-slate-700` es oscuro en claro y *claro* en oscuro; `bg-slate-100` es gris claro / gris oscuro. Funciona, pero el nombre de la clase miente (ver `02` §Tokens).
- **Documento de reglas**: `docs/ui-sistema-visual.md`. Está **desactualizado** en tres puntos verificables: dice «solo tema claro» (existe tema oscuro, línea 7), `ui.tsx:15` comenta «foco con anillo verde» (es azul), y declara «no se diseñó para móvil» sin decidir qué pasa en móvil.
- **Componentes base** (`ui.tsx`, 365 l.): `Button`, `IconButton`, `Input`, `SearchInput`, `Select`, `Checkbox`, `Field`, `Alert`, `Badge`, `EmptyState`, `Modal` (foco atrapado, Esc, restaura foco: **bien hecho**), `FormActions`, `Dato`, `Spinner`.
- **Componentes que faltan** y se reimplementan a mano en cada página: ver `05` §Inventario de patrones repetidos.

## 5. Funcionalidad: hecho vs incompleto

- Implementado (lectura): Digitación diaria (**con edición**, Sprint 18, tras interruptor de servidor `ESCRITURA_GPI_DIGITACION`), Valores, Supervisorio, Panel, CEP, Correlación, Informes, Boletines, Metas, 3 listados, Sonda, Entrada de caña, Admin (solo lectura), Maestras (CRUD genérico con permisos), Inicio, notificaciones.
- Incompleto **y visible al usuario**: el menú del GPI muestra ~23 opciones «Pend.» (Cierre, Utilitarios, Configuración, buena parte de Informes y Movimientos) frente a ~11 pantallas funcionales (`pantallas.ts:62-97`). Es una decisión consciente (paridad con el menú viejo) pero domina visualmente el menú (U5).
- Fuera de alcance por decisión: módulo 91 (Expedición/Certificados).

## 6. Estados, validaciones y errores (patrones reales)

- **Carga**: `<div className="p-8 text-center"><Spinner/></div>` copiado en ≥ 15 sitios; el `Spinner` es `aria-hidden` y no hay texto → un lector de pantalla no recibe nada (verificado). Skeletons solo en Inicio y Maestras.
- **Error**: `<Alert>{(error as Error).message}</Alert>` en ~30 sitios. La API no filtra mensajes internos (bien); el texto es el de la API. Sin acción de reintento en pantallas (solo App en el arranque).
- **Vacío**: `EmptyState` = una línea de texto centrada, sin ícono, sin acción siguiente.
- **Validación**: fechas con `<input type=date>` nativo, regla «fecha final anterior a inicial» repetida como `Alert` por página; formularios de Maestras validan `required` solo en servidor (la UI marca `*` pero no bloquea ni resalta el campo faltante — **[hipótesis]**: confirmar en pantalla que `aria-invalid` se aplica al devolver el error).
- **Confirmaciones**: `Modal` en Maestras; `window.confirm` nativo ×3 en Digitación (`GpiLancamentoPage.tsx:22,331`).

## 7. Superficie de calidad

- 0 usos de `aria-live` fuera de `Alert`; 0 `scope=` en `<th>`; 0 enlaces «saltar al contenido». 
- `aria-*`/`role` por archivo: CEP 0, Correlación 0, Panel 0, Login 0.
- Responsive: prefijos `sm:/md:/lg:/xl:` en 3 de las 15 pantallas de datos solo para cuadrículas internas; ninguna reordena el layout de paneles.
- Sin pruebas de UI automatizadas más allá de scripts e2e manuales con Edge.

## 8. Limitaciones reales a respetar en el rediseño

1. **Paridad con GATEC**: no se pueden quitar funciones; sí reubicarlas (ej.: «Id/Esp/Sem/Acum» a un menú «Columnas»).
2. **La edición de GPI es la única escritura sensible** (auditoría, concurrencia por celda); cualquier cambio en esa grilla necesita re-ejecutar `tools/e2e/sprint18.js`.
3. **Sin credenciales/entorno de pruebas visuales**: hace falta un usuario de DESA de solo lectura para capturas y para la regresión visual propuesta.
4. **Impresión** (`index.css:91-98`, `ImpresionPlanilla`) es una función real del GATEC; el rediseño del cromo no debe romperla.
5. **Dos temas**: todo cambio de color debe pasar por tokens y probarse en ambos.


## Anexo A · Verificación con la app real (30/10/2026)

**Cómo**: Edge headless con el token de prueba de BOT que ya usa `tools/e2e/lib.js` (firmado con el secreto local, sin probar contraseñas) y **un único login real por la interfaz** (BOT entra en ≈ 4 s; la clave no se guardó en ningún archivo). Solo lectura contra DESA (`oradesa`). Scripts temporales fuera del repo.

**Confirmado renderizado** (capturas en `capturas/`):
| Hallazgo | Medición / observación |
|---|---|
| **R2** ancho útil | Ancho del `<main>` medido: Digitación **864 px a 1440** y **524 px a 1100**; Valores 800 / **460**; Informes y Boletines 896 / 556; Digitación a 768 px: **192 px**; a 390 px: **70 px** (título «Di…», texto partido palabra por palabra, `m_gpi_lancamento.png`); Valores a 390 px: **6 px** |
| **R1** móvil | A 390 px el menú no existe. Además **el header se desborda**: en `m_inicio.png` solo caben logo, empresa y selector de zafra; **tema, campana y «Salir» quedan fuera de pantalla** → en móvil ni siquiera se puede cerrar sesión |
| **G1** barra de Digitación | A 1100 px la barra ocupa **4 filas (~190 px)** (`plan-l.png`). Con una planilla abierta hay **14 botones** en `main` |
| Sin jerarquía de acción | «Fijar fecha» está **encendido por defecto** y los toggles activos (`Id/Esp/Sem/Acum`) usan el mismo azul sólido que una acción primaria: en reposo puede haber hasta 5 botones «primarios» a la vez (`plan-8dias.png`) → contradice «una sola acción primaria por pantalla» (**U16, P2**) |
| Tema oscuro | Consistente y legible (`o_gpi_cep.png`). **H-e mitigada**; faltan ratios medidos |
| Inicio | Buena jerarquía (`d_inicio.png`). En móvil el gráfico de barras tiene rótulos de eje ≈ 7 px ilegibles (**V6, P3**) |
| Login | Flujo correcto y rápido (`login-lleno.png`) |

**Hallazgos nuevos que el código no mostraba**
- **U17 (P2) · La fecha del día queda invisible al desplazar.** El rótulo de fecha está centrado sobre *todas* las columnas del día y no es `sticky`: en una planilla horaria la barra verde aparece **sin texto** hasta desplazarse al centro de ese día (`plan-d.png`, `plan-8dias.png`).
- **U18 (P1) · La vista «8 días» es inmanejable en planillas horarias.** Con Id/Esp/Sem/Acum activos, una planilla «cada 1 h» mide **14.832 px de ancho** (≈ 17 pantallas de 864 px) a 1440 px. Sin agrupación, zoom ni resumen por día. Es función heredada del GATEC (`−7`, `+7`), pero con 24 columnas por día pierde su sentido.
- **U19 (P3)** · Motivo de «no editable» («El día 2026-10-22 ya está cerrado…») en gris 12 px, con fecha ISO (el resto usa dd/mm/aaaa) y sin ícono. El badge cambia entre «Edición habilitada» y «Solo consulta» según el día sin explicarlo.
- **Tabulación**: con una planilla de 9 variables se midieron **9 tab-stops** de fila (uno por `<tr>`), confirmando el patrón; la cifra de ≈ 500 para 60×8 sigue siendo extrapolación.
- **Navegación**: en Digitación conviven el menú global (con «Entrada diaria › Digitación diaria» abierto) y el árbol «Análisis»: ≈ 576 px de dos paneles de navegación (`plan-d.png`).
- Las 17 pantallas cargaron sin ningún `role=alert` al abrirse. La cuenta BOT (grupo Consulta) ve en el Inicio solo balanza y sonda, sin datos de proceso: confirma `03` F2.
