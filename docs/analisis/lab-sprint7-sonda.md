# Sprint 7 — Laboratorio de recepción (módulo 6 «Pré/Pós-Colheita» + `GAtec_Lat`)

## Qué hay en DESA (filas, 26/10/2026)

| Área | Tablas (esquema `GATEC_AGR`) | Filas | Decisión |
|---|---|---|---|
| **Análisis de caña (sonda, Pós-Colheita)** | `GA_ANALI_SONDA` / `GA_ANALI_SONDA_PRIMARIA` | **883.962** / 9.547 | ✅ **Consulta hecha** (`/lab/sonda`) |
| Motivos de cancelación de análisis | `GA_MOTIV_CANCEL_ANA` | 3 | ✅ CRUD genérico (`lab-motivo-cancelacion`, form 9912) |
| Parámetros del laboratorio | `GA_LAB_PARAM`, `GA_CONF_CPC`, `GA_CONF_TRD` | 1 / 13 / 1 | ⬜ Sin pantalla (el form que los edita es de configuración del lab, de `GAtec_Lat`) |
| **Pré-Colheita**: pre-análisis, áreas, prova em branco, tipos | `GA_PRE_ANALI`, `GA_MOV_PRE_ANALI`, `GA_PRE_ANALI_CADASTRO`, `GA_PRE_ANALI_OUTRAS_AREAS`, `GA_IMPUREZA_*` | **0** | ⏸ Vacío: no se recrea (como el módulo 91) |
| Equipos / aparato serial (lectura de balanza y sonda) | `GA_CONF_APARELHO_SERIAL`, `GA_EQP_LAB` | 0 | ⏸ Vacío y de hardware local (puerto serie): no aplica a una web |
| Código de barras, impresión de BA, correo interno | formularios de `GAtec_Lat` | — | ⏸ Escritura/hardware; se ven con la digitación |

Una **digitación de análisis de sonda** (`frmLancSonda`, `frmLancSondaBarra`, `frmLancSondaPrimaria`) escribiría en `GA_ANALI_SONDA`, tabla compartida con el
VB6 que sigue en uso, y lee de un aparato serial: queda fuera hasta definir la convivencia con el VB6.

## Análisis de caña (`/lab/sonda`, permisos 9905 o 9903 — `frmPesqPosAna` / `frmLancSonda`)

- **Un análisis por comprobante de balanza y acoplado** (PK empresa, zafra, `NRO_COMPROBANTE`, `NRO_ACOPLADO`). El registro nace vacío al pesar el camión y el laboratorio completa
  Brix, LS, PBU, Pol, fibra, pureza, AR y ATR (calculados por el VB6 al digitar; aquí se leen tal como están guardados).
- Estados: **completa** (`PAN_BRIX` con valor), **cancelada** (`COD_MOT_CAN` ≠ 0, motivo en `GA_MOTIV_CANCEL_ANA`), **acoplado** (acoplado 2 o más sin resultado) y **sin resultado**
  (acoplado 1 sin Brix). Hallazgo: los acoplados casi nunca tienen análisis propio (35 de 2.275 en 2022, 1 de 1.889 en 2026) y desde 2024 solo ~60 % de los camiones tiene resultado
  (en 2022 era 99 %), por eso no se los llama «pendientes».
- Filtros: rango de fechas (por defecto el último día con análisis completados), comprobante y estado. Resumen del período (conteos y promedios de Brix, Pol, fibra y ATR) sobre
  **todos** los análisis filtrados; la tabla muestra los 500 más recientes. El detalle trae todos los campos con valor y las lecturas de la sonda primaria.
- Solo lectura. Los nombres de campo del detalle sin rótulo conocido se muestran con su código de columna.
