# Mapeo de formularios ABM → tablas Oracle (módulos 15 y 91)

Mapeo de las pantallas de mantenimiento de tablas maestras del GATEC viejo a sus
tablas reales en `GATEC_AGR`. Base del Sprint 1. Verificado contra el catálogo
(`db/catalogo/GATEC_AGR.json`) y conteos en vivo (2026-10-22).

## Patrones confirmados

- **"Padrão" vs "Usina":** *Padrão* = tabla con sufijo `_COPER` (padrón Copersucar);
  *Usina* = tabla propia de la usina que referencia al COPER por FK.
- **Tablas `_2`:** las canónicas `GA_DIVI1..4`, `GA_VARIE_USINA`, `GA_SOLOS_USINA`
  **no existen**; las reales son las de sufijo `_2` (sin PK declarada; clave lógica compuesta).
- **Scope empresa/zafra:** las divisiones y el fundo se filtran por `COD_EMPR` + `SAF_ANO_SAFRA`.
  En las `_2`, `COD_EMPR` es `CHAR(2)` con padding (`'01'`) y `SAF_ANO_SAFRA` es `VARCHAR2`.
- **Datos en DESA:** la parte agrícola solo tiene datos para la **zafra 2009**.

## Módulo 15 (Tablas) — implementado

| Form VB | Pantalla | Tabla | PK lógica | Recurso lab-app | Estado |
|---|---|---|---|---|---|
| frmEstCorteU | Estágio Corte (Usina) | `GA_ESTAG_USINA` | COD_ESTAG_USINA | estagio-corte-usina | ✅ |
| frmEstCorteP | Estágio Corte (Padrón) | `GA_ESTAG_COPER` | COD_ESTAG_COPER | estagio-corte-padrao | ✅ |
| frmVarP | Variedade (Padrón) | `GA_VARIE_COPER` | COD_VARIE_COPER | variedade-padrao | ✅ |
| frmVarU | Variedade (Usina) | `GA_VARIE_USINA_2` | COD_VARIE_USINA | variedade-usina | ✅ (79 filas) |
| frmSoloP | Solos (Padrón) | `GA_SOLOS_COPER` | COD_SOLO_COPER | solos-padrao | ✅ |
| frmTextSolo | Texturas de Solo | `GA_TEXTURA_SOLO` | COD_TEXTURA | textura-solo | ✅ |
| frmProp | Proprietarios | `GA_PROPRIETARIO` | COD_PROP | proprietarios | ✅ |
| frmCadCaracFundo | Características do Fundo | `GA_CARAC_FUNDO` | ID_CARAC | caracteristicas-fundo | ✅ |
| frmFundoAgric | Fundo Agrícola | `GA_FUNDO_AGRIC` | ID_FUNDO_AGRIC | fundo-agricola | ✅ (safraScoped) |
| frmMudEstCort | Mudança de Estágio | `GA_MUDAN_ESTAG` | COD_ESTAG_USINA | mudanca-estagio | ✅ |
| frmSetor | División 1 (Setor) | `GA_DIVI1_2` | COD_EMPR,SAF,COD_DIVI1 | divisao-1 | ✅ (safraScoped) |
| frmFazenda | División 2 (Fazenda) | `GA_DIVI2_2` | …+COD_DIVI2 | divisao-2 | ✅ (safraScoped) |
| frmLote | División 3 (Lote) | `GA_DIVI3_2` | …+COD_DIVI3 | divisao-3 | ✅ (safraScoped) |
| frmTalhao | División 4 (Talhão) | `GA_DIVI4_2` | ID_DIVI4 | divisao-4 | ✅ (safraScoped) |
| frmParam | Parametros | `GA_PARAM_EMPR_SAFRA` | COD_EMPR,SAF | parametros | ✅ (Sprint 2, ver `mapeo-modulo-1.md`) |

## Módulo 91 (Cadastros / Expedición) — NO implementado

Solo `tipo-embalagem` (`GA_POP_EMBALAGEM`) quedó implementado. El resto **no se recrea**:
sus formularios **no están en ninguno de los 9 ejecutables** y sus tablas están **vacías en DESA**.
Ver `decisiones-y-notas.md`.

| Form VB | Pantalla | Tabla candidata | Confianza | Estado |
|---|---|---|---|---|
| FrmTipoEmbala | Tipos de Embalagem | `GA_POP_EMBALAGEM` | alta | ✅ |
| FrmCadClientes | Clientes | `GA_OPR_CLIFOR` / `EXP_CLIENTE` | media | ❌ no recreado |
| FrmTipoProdutos | Tipos de Produtos | `GA_OPR_PRODUTO` | media | ❌ no recreado |
| FrmLocaisArmazena | Locais de Armazenamento | `GA_OPR_LOCAL` | media | ❌ no recreado |
| FrmCertificados | Certificados | `GA_CERTIFICADOS` (transaccional) | baja | ❌ no recreado |
| FrmValidades | Validade | sin tabla clara | baja | ❌ no recreado |
| FrmCadParametros | Parâmetros | `GA_OPR_CONFIG` | baja | ❌ no recreado |
| frmClientEcqGuarani | Relaciona Cliente ECQ | integración (no existe en la base) | baja | ❌ no recreado |
| frmProdutoEcqGuarani | Relaciona Produto ECQ | integración (no existe en la base) | baja | ❌ no recreado |
