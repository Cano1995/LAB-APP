# Glosario y guía de estilo (interfaz en español)

La interfaz de lab-app está **toda en español**. El GATEC viejo y la base están en portugués; la base no se toca (la comparte el VB6), así que la traducción se aplica en la aplicación.

## Dónde vive cada traducción

| Qué | Dónde | Cómo se mantiene |
|---|---|---|
| Textos de la web (menús, botones, mensajes, encabezados de CSV) | escritos en español en `web/src` | directo en el código |
| Títulos y rótulos de los catálogos | `api/src/modules/maestras/recursos.js` | directo en el código |
| Títulos de pantallas y menús que vienen de la base (`GAM_MODULOS_FORMS`) | `api/src/i18n/glosario-es.json` (frases y palabras) y `api/src/i18n/titulos-es.json` (traducciones puntuales por `ID_FORM`) | se traducen al leer, en `traducir.js`; si queda portugués se registra `[i18n] título sin traducir` una sola vez |
| Números y fechas | `web/src/lib/formato.ts` (`es-PY`: `1.234,5`) | un solo locale para toda la web |

## Control automático

- `node tools/verificar-idioma.js` — falla si hay portugués en los textos de `web/src` y `api/src`, o un locale distinto de `es-PY`. Las excepciones (palabras clave de las fórmulas del VB6, rutas de la API, nombres de tablas) están documentadas dentro del propio script.
- `node tools/verificar-titulos.js` — consulta los títulos de la base (solo lectura) y falla si alguno, ya traducido, todavía parece portugués. Estado actual: 551 títulos, 0 pendientes.
- `cd api && npm test` incluye `test/i18n.test.js` (casos del glosario).

## Para agregar un término

1. Palabra suelta → `palabras` de `glosario-es.json` (clave sin tildes y en minúsculas).
2. Dos o más palabras que juntas se traducen distinto → `frases`.
3. Un título que no se arregla con el glosario → `titulos-es.json` con `{ "<ID_FORM>": "Texto" }`.
4. Correr `node tools/verificar-titulos.js`.

## Términos adoptados

| Portugués | Español | Nota |
|---|---|---|
| Safra | Zafra | |
| Lançamento | Digitación | «Lançamento diário» → «Digitación diaria» |
| Colheita / Pré- / Pós-Colheita | Cosecha / Precosecha / Poscosecha | |
| Talhão · Fazenda · Setor · Lote | Parcela · Finca · Sector · Lote | |
| Fundo (agrícola) | Finca | |
| Estágio (de corte) | Etapa (de corte) | |
| Empreiteiro | Contratista | |
| Frente de trabalho · Moagem · Redução | Frente de trabajo · Molienda · Reducción | |
| Moenda | Molino | |
| Turma (de corte) | Cuadrilla | |
| Peneiras | Tamices | coincide con el texto en español de la base |
| Painel · Boletim · Relatório · Listagem | Panel · Boletín · Informe · Listado | |
| Cadastro | Registro | |
| Padrão (Copersucar) | Padrón | convención que ya usaba el proyecto |
| Fechamento | Cierre | |
| Equipamento | Equipo | |

**Pendiente de confirmar con un usuario del GATEC:** «Digitación» (vs. «Carga» o «Lanzamiento»), «Finca» y «Parcela» para Fundo/Talhão, «Cuadrilla» para Turma y «Molino» para Moenda.

## Guía de estilo

- Español neutro, trato impersonal («Seleccione», no «Seleccioná»); ortografía de la RAE.
- No mezclar portugués ni anglicismos innecesarios.
- Los datos que cargan los usuarios (nombres de variables, planillas, cañeros) no se traducen.
- Los mensajes de la API salen siempre en español y sin detalles internos.
