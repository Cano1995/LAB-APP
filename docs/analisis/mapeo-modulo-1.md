# Mapeo de formularios → tablas Oracle (módulo 1, Cadastros Básicos)

Base del Sprint 2. Formularios según `GATEC_AGR.GAM_MODULOS_FORMS` (`MOD_MODULO = 1`).
Tablas verificadas contra `all_tab_columns` / constraints y conteos en vivo (2026-10-22).

## Origen del mapeo

Igual que el módulo 15, **los formularios del módulo 1 no están en ninguno de los 9 ejecutables**
(el exe que los contenía no está en `C:\Gatec\Gatec`), así que no hay SQL incrustado que confirme
la tabla. El mapeo sale del nombre del formulario/menú ↔ nombre y columnas de la tabla.

A diferencia del módulo 91, el módulo 1 **sí se recrea**: varias de sus tablas las usan los
ejecutables vigentes (`GA_EMPR`, `GA_SAFRAS`, `GA_TABGR_MOEDA`, `GA_PARAM_EMPR_SAFRA`) y el resto
son catálogos que referencian el GPI/Lab. La mayoría está **vacía en DESA** (ver columna Filas).

## Formularios implementados

Todos usan el CRUD genérico (`api/src/modules/maestras/recursos.js`).

| Form VB | idForm | Pantalla | Tabla | PK (lógica) | Filas DESA | Recurso | Confianza |
|---|---|---|---|---|---|---|---|
| frmEmpresa | 9684 | Empresa | `GA_EMPR` | COD_EMPR | 1 | empresa | alta |
| frmSafra | 9686 | Safra | `GA_SAFRAS` | COD_EMPR, SAF_ANO_SAFRA | 21 | safra (scope empresa) | alta |
| frmCultAgric | 9688 | Culturas Agrícolas | `GA_CULTU_AGRIC` | COD_CULTU_AGRIC | 0 | cultura-agricola | alta |
| frmUnidadeMedida | 9692 | Unidade de medida | `GA_UNIDADE` | ID_UNIDADE | 0 | unidade-medida | alta |
| frmMunicipio | 9694 | Municípios | `GA_CEP_MUNIC` | MUN_CEP | 0 | municipio | alta (FKs desde fundo, proprietário y prest. servicio) |
| frmTurnoCarregamento | 9696 | Turno de carregamento | `GA_TURNO_TRABALHO` | COD_TURNO | 0 | turno-carregamento | alta (FK desde impureza; GAtec_Lab lee la hora) |
| frmMoeda | 9698 | Moeda | `GA_TABGR_MOEDA` | ID_MOEDA | 0 | moeda | alta |
| frmTipoComp | 9700 | Tipo de Composição | `GA_TIPO_COMPOSICAO` | COD_COMP (sin PK en BD) | 0 | tipo-composicao | media (sin FKs ni SQL) |
| frmCompTrans | 9704 | Transbordo | `GA_COMP_TRANSBORDO` | COD_FRENTE, COD_COMP (sin PK en BD) | 0 | transbordo | media (sin FKs ni SQL) |
| frmTipoFrente | 9708 | Tipo de Frente | `GA_TIPO_FRENTE` | COD_TIP_FRENTE, TIP_FRENTE | 0 | tipo-frente | alta |
| frmFreTraba | 9710 | Frente | `GA_FRENT_TRABA` | COD_FRENTE | 0 | frente-trabalho | alta |
| frmFinalidades | 9712 | Finalidade | `GA_FINALID_COPER` | COD_FINALID | 1 | finalidade | alta |
| frmCaracCana | 9714 | Característica da cana | `GA_CARAC_CANA_2` | ID_CARAC (sin PK en BD) | 5 | caracteristica-cana | alta |
| frmMotivLiber | 9716 | Motivos de Liberações | `GA_MOTIV_LIBER` | ID_MOTIVO | 0 | motivo-liberacao | alta |
| frmServico | 9718 | Serviços | `GA_CODIG_SERVI` | COD_SERVI | 0 | servicos | alta (FK desde `GA_LIBERACAO`) |
| frmTipoCorte | 9720 | Tipo de Corte | `GA_TIPO_CORTE_2` | COD_TIP_CORTE (sin PK en BD) | 23 | tipo-corte | alta |
| frmCargos | 9725 | Cargos | `GA_CARGOS` | ID_CARGO | 0 | cargos | alta |
| frmFuncionario | 9727 | Funcionários | `GA_FUNCIONARIO` | COD_EMPR, COD_FUNC | 0 | funcionarios (scope empresa) | alta |
| frmClasseFun | 9730 | Classe por Funcionário | `GA_CLASSE_FUN` | COD_FUNC, ID_CLAS_EQUIP, CLF_DT_INICIO | 0 | classe-funcionario | alta |
| frmCCustoFun | 9732 | Centro de Custo por Func. | `GA_FUNC_CCUSTO` | COD_CENTR_CUSTO, COD_FUNC, CCU_DATA_INI | 0 | ccusto-funcionario (scope empresa) | alta |
| frmTipoEmpreit | 9735 | Tipo de Empreiteiro | `GA_TIPO_EMPREITEIRO` | COD_TIPO_EMPREIT (sin PK en BD) | 0 | tipo-empreiteiro | alta |
| frmEmpreiteiro | 9737 | Empreiteiros | `GA_EMPREIT` | COD_EMPREIT | 0 | empreiteiros | alta |
| frmFrenteEmpreit | 9739 | Frente por Empreiteiro | `GA_FRENTE_EMPREIT` | COD_FRENTE, COD_EMPREIT | 0 | frente-empreiteiro | alta |
| frmCCusto | 9742 | Centro de Custo | `GA_CENTR_CUSTO` | COD_EMPR, COD_CENTR_CUSTO | 0 | centro-custo (scope empresa) | alta |
| frmCCustoAgr | 9744 | Centro de Custo Agregado | `GA_CENTR_CUSTO_AGREG` | COD_CCUSTO_AGR | 0 | centro-custo-agregado | alta |
| frmProprietario | 9747 | Proprietários (de equipo) | `GA_TABGR_PROP_EQUIP` | COD_PROP_EQUIP | 0 | proprietario-equipamento | alta |
| frmEquipamento | 9749 | Equipamentos | `GI_MEQ_MIS` | COD_MIS | 0 | equipamentos | alta (11 FKs por `COD_MIS`) |
| frmClasseSubClasse | 9751 | Classe/Sub-Classe | `GA_CPMIS_CLAS_EQUIP` + `GA_CPMIS_SUBCL_EQUIP` | ID_CLAS_EQUIP (+ ID_SUBCL_EQUIP) | 0 | classe-equipamento, subclasse-equipamento | alta |
| frmParam | 9754 | Parametros | `GA_PARAM_EMPR_SAFRA` | COD_EMPR, SAF_ANO_SAFRA | 21 | parametros (scope empresa/zafra) | alta (la usan GAtec_Lab y GAtec_Lat: límites Brix/Pol/Pureza) |

## Formularios no implementados como pantalla propia

| Form VB | Motivo |
|---|---|
| frmIntervalo (Intervalo) | No hay tabla candidata en ningún esquema GATEC. |
| frmTipoXMis (Tipo Comp. X Equipamento) | Sin tabla clara (`GA_CPMIS_COMPL_MIS.CPL_TIPO_COMP` es la candidata más cercana, pero es el complemento de equipo, no una relación). |
| frmAssociaOperacao | Subformulario de Tipo de Corte: asocia la operación agrícola (`GA_TIPO_CORTE_2.ID_S4`). Se edita como campo en `tipo-corte`. |
| frmPesqFunc | Buscador de funcionarios: lo cubre la búsqueda de la grilla de `funcionarios`. |

## Trampas

- **`GA_EQUIP` no es el registro de equipos:** son los equipos en tránsito (movimiento). El registro es `GI_MEQ_MIS`
  (su complemento agrícola, `GA_CPMIS_COMPL_MIS`, queda para cuando se haga la parte de transporte).
- **Proprietários (mód. 1) ≠ Proprietarios (mód. 15):** el del módulo 1 es el dueño de equipos (`GA_TABGR_PROP_EQUIP`);
  el del 15 es el dueño de fundos (`GA_PROPRIETARIO`).
- **`GA_CARAC_CANA_2`:** las banderas `CAR_TEMPO_QUEIM` / `CAR_TEMPO_PERCU` son `'S'`/`'N'` (no 0/1).
- **Horas solas** (`GA_TURNO_TRABALHO.TUR_HR_*`, `GA_SAFRAS.SAF_HR_*`): se guardan como `DATE` sobre la fecha cero
  de VB6 (`1899-12-30 HH:MI`). No había filas para confirmarlo; es la convención del runtime VB6.
- **Precisiones chicas:** muchos códigos son `NUMBER(2)` (ej. `COD_TURNO`, `ID_CLAS_EQUIP`); el CRUD ya valida dígitos.
- Validación: `validacion-sprints-1-2.md`.
