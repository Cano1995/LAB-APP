// Catálogo de tablas maestras (ABM). Cada definición declara solo lo específico
// (tabla, PK lógica, rótulos, columnas a listar); la metadata de columnas
// —tipos, longitudes, obligatoriedad— se carga en vivo desde la base al arrancar
// (initRecursos), para que sea siempre fiel al esquema real.
//
// Mapeo de tablas confirmado por análisis del catálogo GATEC_AGR (2026-10-22):
// el patrón "Padrão" = tabla _COPER (padrón Copersucar); "Usina" = tabla propia.
// Las divisiones y variedade-usina reales son las tablas con sufijo _2.
const { query } = require("../../db");
const config = require("../../config");

const G = config.gatecSchema;

// --- Definiciones (lo único que hay que escribir para sumar una tabla) -------
// pk: clave lógica (puede no estar declarada en la BD). bool: columnas 0/1.
// sn: columnas booleanas guardadas como 'S'/'N'. hora: columnas DATE que solo guardan hora.
// fechahora: columnas DATE con fecha y hora. soloLectura: la pantalla solo consulta (tiene reglas aún no replicadas).
// lista: columnas que se muestran en la grilla. labels: rótulos amigables.
// safraScoped: la tabla filtra por empresa/safra. scope: columnas de scope explícitas
// (ej. ["COD_EMPR"] para tablas que filtran solo por empresa).
const DEFINICIONES = [
  { nombre: "estagio-corte-usina", tabla: "GA_ESTAG_USINA", titulo: "Etapa de corte (Usina)", modulo: 15, idForm: 9770,
    pk: ["COD_ESTAG_USINA"], bool: ["ESU_UZA_PRECO"],
    lista: ["COD_ESTAG_USINA", "DSC_ESTAG_USINA", "ABV_ESTAG_USINA"],
    labels: { COD_ESTAG_USINA: "Código", DSC_ESTAG_USINA: "Descripción", ABV_ESTAG_USINA: "Abreviatura", COD_ESTAG_COPER: "Cód. Padrón" } },

  { nombre: "estagio-corte-padrao", tabla: "GA_ESTAG_COPER", titulo: "Etapa de corte (Padrón)", modulo: 15, idForm: 9768,
    pk: ["COD_ESTAG_COPER"], lista: ["COD_ESTAG_COPER", "DSC_ESTAG_COPER", "ABV_ESTAG_COPER"],
    labels: { COD_ESTAG_COPER: "Código", DSC_ESTAG_COPER: "Descripción", ABV_ESTAG_COPER: "Abreviatura" } },

  { nombre: "variedade-padrao", tabla: "GA_VARIE_COPER", titulo: "Variedad (Padrón)", modulo: 15, idForm: 9773,
    pk: ["COD_VARIE_COPER"], lista: ["COD_VARIE_COPER", "DSC_VARIE", "ABV_VARIE"],
    labels: { COD_VARIE_COPER: "Código", DSC_VARIE: "Descripción", ABV_VARIE: "Abreviatura" } },

  { nombre: "variedade-usina", tabla: "GA_VARIE_USINA_2", titulo: "Variedad (Usina)", modulo: 15, idForm: 9775,
    pk: ["COD_VARIE_USINA"], lista: ["COD_VARIE_USINA", "COD_VARIE_COPER", "DSC_VARIE"],
    labels: { COD_VARIE_USINA: "Código", COD_VARIE_COPER: "Cód. Padrón", DSC_VARIE: "Descripción" } },

  { nombre: "solos-padrao", tabla: "GA_SOLOS_COPER", titulo: "Suelos (Padrón)", modulo: 15, idForm: 9778,
    pk: ["COD_SOLO_COPER"], lista: ["COD_SOLO_COPER", "DSC_SOLO", "ABV_SOLO"],
    labels: { COD_SOLO_COPER: "Código", DSC_SOLO: "Descripción", ABV_SOLO: "Abreviatura" } },

  { nombre: "textura-solo", tabla: "GA_TEXTURA_SOLO", titulo: "Texturas de suelo", modulo: 15, idForm: 9782,
    pk: ["COD_TEXTURA"], lista: ["COD_TEXTURA", "DSC_TEXTURA", "ABV_TEXTURA"],
    labels: { COD_TEXTURA: "Código", DSC_TEXTURA: "Descripción", ABV_TEXTURA: "Abreviatura" } },

  { nombre: "proprietarios", tabla: "GA_PROPRIETARIO", titulo: "Propietarios", modulo: 15, idForm: 9760,
    pk: ["COD_PROP"], lista: ["COD_PROP", "PRO_NOME", "PRO_ABREV"],
    labels: { COD_PROP: "Código", PRO_NOME: "Nombre", PRO_ABREV: "Abreviatura", PRO_CPF: "CPF", PRO_CGC: "CGC/RUC" } },

  { nombre: "caracteristicas-fundo", tabla: "GA_CARAC_FUNDO", titulo: "Características de la finca", modulo: 15, idForm: 9764,
    pk: ["ID_CARAC"], lista: ["ID_CARAC", "DSC_CARAC", "ABV_CARAC"],
    labels: { ID_CARAC: "Código", DSC_CARAC: "Descripción", ABV_CARAC: "Abreviatura" } },

  { nombre: "fundo-agricola", tabla: "GA_FUNDO_AGRIC", titulo: "Finca agrícola", modulo: 15, idForm: 9762, safraScoped: true,
    pk: ["ID_FUNDO_AGRIC"], lista: ["COD_FUNDO_AGRIC", "FAG_NOME", "FAG_ABREV"],
    labels: { COD_FUNDO_AGRIC: "Código", FAG_NOME: "Nombre", FAG_ABREV: "Abreviatura", COD_PROP: "Propietario" } },

  { nombre: "mudanca-estagio", tabla: "GA_MUDAN_ESTAG", titulo: "Cambio de etapa", modulo: 15, idForm: 9784,
    pk: ["COD_ESTAG_USINA"], lista: ["COD_ESTAG_USINA"],
    labels: { COD_ESTAG_USINA: "Etapa Usina" } },

  { nombre: "tipo-embalagem", tabla: "GA_POP_EMBALAGEM", titulo: "Tipos de embalaje", modulo: 91, idForm: 10034,
    pk: ["COD_EMBAL"], lista: ["COD_EMBAL", "DSC_EMBAL", "ABV_EMBAL"],
    labels: { COD_EMBAL: "Código", DSC_EMBAL: "Descripción", ABV_EMBAL: "Abreviatura" } },

  // Divisiones agrícolas (jerarquía setor→fazenda→lote→talhão). Scopadas por empresa/zafra.
  { nombre: "divisao-1", tabla: "GA_DIVI1_2", titulo: "División 1 (Sector)", modulo: 15, idForm: 9787, safraScoped: true,
    pk: ["COD_EMPR", "SAF_ANO_SAFRA", "COD_DIVI1"], lista: ["COD_DIVI1", "DSC_DIVI1", "ABV_DIVI1"],
    labels: { COD_DIVI1: "Código", DSC_DIVI1: "Descripción", ABV_DIVI1: "Abreviatura" } },

  { nombre: "divisao-2", tabla: "GA_DIVI2_2", titulo: "División 2 (Finca)", modulo: 15, idForm: 9789, safraScoped: true,
    pk: ["COD_EMPR", "SAF_ANO_SAFRA", "COD_DIVI1", "COD_DIVI2"], lista: ["COD_DIVI1", "COD_DIVI2", "DSC_DIVI2", "ABV_DIVI2"],
    labels: { COD_DIVI1: "Sector", COD_DIVI2: "Código", DSC_DIVI2: "Descripción", ABV_DIVI2: "Abreviatura" } },

  { nombre: "divisao-3", tabla: "GA_DIVI3_2", titulo: "División 3 (Lote)", modulo: 15, idForm: 9791, safraScoped: true,
    pk: ["COD_EMPR", "SAF_ANO_SAFRA", "COD_DIVI1", "COD_DIVI2", "COD_DIVI3"], lista: ["COD_DIVI2", "COD_DIVI3", "DSC_DIVI3"],
    labels: { COD_DIVI3: "Código", DSC_DIVI3: "Descripción" } },

  { nombre: "divisao-4", tabla: "GA_DIVI4_2", titulo: "División 4 (Parcela)", modulo: 15, idForm: 9793, safraScoped: true,
    pk: ["ID_DIVI4"], lista: ["COD_DIVI4", "COD_ESTAG_USINA", "DI4_AREA_TOTAL"],
    labels: { COD_DIVI4: "Código", COD_ESTAG_USINA: "Etapa", DI4_AREA_TOTAL: "Área total" } },

  // --- Módulo 1 (Cadastros Básicos) — mapeo en docs/analisis/mapeo-modulo-1.md ---
  // Básico
  { nombre: "empresa", tabla: "GA_EMPR", titulo: "Empresa", modulo: 1, idForm: 9684,
    pk: ["COD_EMPR"], lista: ["COD_EMPR", "DSC_EMPR", "ABV_EMPR", "EMP_CIDAD"],
    labels: { COD_EMPR: "Código", DSC_EMPR: "Descripción", ABV_EMPR: "Abreviatura", EMP_ENDER: "Dirección", EMP_BAIRR: "Barrio",
      EMP_CIDAD: "Ciudad", EMP_UF: "UF", EMP_CEP: "CEP", EMP_EMAIL: "E-mail", EMP_CGC: "CGC/RUC", EMP_INSC_ESTAD: "Inscr. estadual" } },

  { nombre: "safra", tabla: "GA_SAFRAS", titulo: "Zafra", modulo: 1, idForm: 9686, scope: ["COD_EMPR"],
    pk: ["COD_EMPR", "SAF_ANO_SAFRA"], hora: ["SAF_HR_INI_HOR_ALTER", "SAF_HR_FIM_HOR_ALTER"],
    lista: ["SAF_ANO_SAFRA", "SAF_SAFRA_EDIT", "SAF_DT_INICIO", "SAF_DT_FIM"],
    labels: { SAF_ANO_SAFRA: "Año", SAF_SAFRA_EDIT: "Zafra", SAF_DT_INICIO: "Inicio", SAF_DT_FIM: "Fin", SAF_UNID_MEDID: "Unidad de medida" } },

  { nombre: "cultura-agricola", tabla: "GA_CULTU_AGRIC", titulo: "Culturas Agrícolas", modulo: 1, idForm: 9688,
    pk: ["COD_CULTU_AGRIC"], lista: ["COD_CULTU_AGRIC", "DSC_CULTU_AGRIC", "ABV_CULTU_AGRIC"],
    labels: { COD_CULTU_AGRIC: "Código", DSC_CULTU_AGRIC: "Descripción", ABV_CULTU_AGRIC: "Abreviatura", COD_CULTU_AGRIC_PADRAO: "Cód. Padrón" } },

  { nombre: "unidade-medida", tabla: "GA_UNIDADE", titulo: "Unidad de medida", modulo: 1, idForm: 9692,
    pk: ["ID_UNIDADE"], lista: ["ID_UNIDADE", "DSC_UNIDADE", "ABV_UNIDADE"],
    labels: { ID_UNIDADE: "Código", DSC_UNIDADE: "Descripción", ABV_UNIDADE: "Abreviatura" } },

  { nombre: "municipio", tabla: "GA_CEP_MUNIC", titulo: "Municipios", modulo: 1, idForm: 9694,
    pk: ["MUN_CEP"], lista: ["MUN_CEP", "MUN_MUNIC", "MUN_CODIGO"],
    labels: { MUN_CEP: "CEP", MUN_MUNIC: "Municipio", MUN_AGLUT: "Aglutinador", MUN_CODIGO: "Código", MUN_COD_ORPLANA: "Cód. Orplana" } },

  { nombre: "turno-carregamento", tabla: "GA_TURNO_TRABALHO", titulo: "Turno de carga", modulo: 1, idForm: 9696,
    pk: ["COD_TURNO"], hora: ["TUR_HR_INICIO", "TUR_HR_FIM"], lista: ["COD_TURNO", "DSC_TURNO", "TUR_HR_INICIO", "TUR_HR_FIM"],
    labels: { COD_TURNO: "Código", DSC_TURNO: "Descripción", ABV_TURNO: "Abreviatura", TUR_HR_INICIO: "Hora inicio", TUR_HR_FIM: "Hora fin" } },

  { nombre: "moeda", tabla: "GA_TABGR_MOEDA", titulo: "Moneda", modulo: 1, idForm: 9698,
    pk: ["ID_MOEDA"], bool: ["MOE_LOCAL"], lista: ["ID_MOEDA", "DSC_MOEDA", "ABV_MOEDA", "MOE_LOCAL"],
    labels: { ID_MOEDA: "Código", DSC_MOEDA: "Descripción", ABV_MOEDA: "Abreviatura", MOE_LOCAL: "Moneda local" } },

  { nombre: "tipo-composicao", tabla: "GA_TIPO_COMPOSICAO", titulo: "Tipo de composición", modulo: 1, idForm: 9700,
    pk: ["COD_COMP"], lista: ["COD_COMP", "DSC_COMP", "ABV_COMP"],
    labels: { COD_COMP: "Código", DSC_COMP: "Descripción", ABV_COMP: "Abreviatura" } },

  { nombre: "transbordo", tabla: "GA_COMP_TRANSBORDO", titulo: "Transbordo (Composición)", modulo: 1, idForm: 9704,
    pk: ["COD_FRENTE", "COD_COMP"], lista: ["COD_FRENTE", "COD_COMP", "NRO_TRANSBORDO"],
    labels: { COD_FRENTE: "Frente", COD_COMP: "Composición", NRO_TRANSBORDO: "Nº transbordos" } },

  // Liberação
  { nombre: "tipo-frente", tabla: "GA_TIPO_FRENTE", titulo: "Tipo de frente", modulo: 1, idForm: 9708,
    pk: ["COD_TIP_FRENTE", "TIP_FRENTE"], lista: ["COD_TIP_FRENTE", "TIP_FRENTE", "DSC_FRENTE", "ABV_FRENTE"],
    labels: { COD_TIP_FRENTE: "Código", TIP_FRENTE: "Tipo", DSC_FRENTE: "Descripción", ABV_FRENTE: "Abreviatura" } },

  { nombre: "frente-trabalho", tabla: "GA_FRENT_TRABA", titulo: "Frente de trabajo", modulo: 1, idForm: 9710,
    pk: ["COD_FRENTE"], lista: ["COD_FRENTE", "DSC_FRENTE", "ABV_FRENTE", "COD_TIPO_FRENTE"],
    labels: { COD_FRENTE: "Código", DSC_FRENTE: "Descripción", ABV_FRENTE: "Abreviatura", COD_TIPO_FRENTE: "Tipo de frente",
      FRE_META_TON: "Meta (t)", FRE_JORNADA: "Jornada", FRE_DATA_PLANE: "Fecha planeamiento", FRE_TOTAL_CANA: "Total caña" } },

  { nombre: "finalidade", tabla: "GA_FINALID_COPER", titulo: "Finalidad", modulo: 1, idForm: 9712,
    pk: ["COD_FINALID"], bool: ["FIN_STATUS"], lista: ["COD_FINALID", "DSC_FINALID", "ABV_FINALID", "FIN_STATUS"],
    labels: { COD_FINALID: "Código", DSC_FINALID: "Descripción", ABV_FINALID: "Abreviatura", FIN_STATUS: "Activa" } },

  { nombre: "caracteristica-cana", tabla: "GA_CARAC_CANA_2", titulo: "Característica de la caña", modulo: 1, idForm: 9714,
    pk: ["ID_CARAC"], sn: ["CAR_TEMPO_QUEIM", "CAR_TEMPO_PERCU"],
    lista: ["ID_CARAC", "DSC_CARAC", "CAR_TEMPO_QUEIM", "CAR_TEMPO_PERCU"],
    labels: { ID_CARAC: "Código", DSC_CARAC: "Descripción", ABV_CARAC: "Abreviatura",
      CAR_TEMPO_QUEIM: "Controla tiempo de quema", CAR_TEMPO_PERCU: "Controla tiempo de recorrido" } },

  { nombre: "motivo-liberacao", tabla: "GA_MOTIV_LIBER", titulo: "Motivos de liberación", modulo: 1, idForm: 9716,
    pk: ["ID_MOTIVO"], lista: ["ID_MOTIVO", "DSC_MOTIVO", "ABV_MOTIVO"],
    labels: { ID_MOTIVO: "Código", DSC_MOTIVO: "Descripción", ABV_MOTIVO: "Abreviatura", ID_COM_QUEIMA: "Con quema" } },

  { nombre: "servicos", tabla: "GA_CODIG_SERVI", titulo: "Servicios", modulo: 1, idForm: 9718,
    pk: ["COD_SERVI"], lista: ["COD_SERVI", "DSC_SERVI", "ABV_SERVI", "COD_SERV_AGLUT"],
    labels: { COD_SERVI: "Código", DSC_SERVI: "Descripción", ABV_SERVI: "Abreviatura", COD_SERV_AGLUT: "Aglutinador" } },

  // Incluye ID_S4 (operación agrícola asociada), que en el VB6 se editaba en frmAssociaOperacao.
  { nombre: "tipo-corte", tabla: "GA_TIPO_CORTE_2", titulo: "Tipo de corte", modulo: 1, idForm: 9720,
    pk: ["COD_TIP_CORTE"], lista: ["COD_TIP_CORTE", "DSC_TIP_CORTE", "COD_AGREG", "ID_CARAC"],
    labels: { COD_TIP_CORTE: "Código", DSC_TIP_CORTE: "Descripción", ABV_TIP_CORTE: "Abreviatura", COD_AGREG: "Agregado",
      ID_CARAC: "Característica", COD_TIP_CALC_TC: "Tipo cálculo TC", ID_S4: "Operación asociada (S4)" } },

  // Administrativo
  { nombre: "cargos", tabla: "GA_CARGOS", titulo: "Cargos", modulo: 1, idForm: 9725,
    pk: ["ID_CARGO"], lista: ["ID_CARGO", "DSC_CARGO", "ABV_CARGO"],
    labels: { ID_CARGO: "Código", DSC_CARGO: "Descripción", ABV_CARGO: "Abreviatura" } },

  { nombre: "funcionarios", tabla: "GA_FUNCIONARIO", titulo: "Funcionarios", modulo: 1, idForm: 9727, scope: ["COD_EMPR"],
    pk: ["COD_EMPR", "COD_FUNC"], lista: ["COD_FUNC", "DSC_FUNC", "ID_CARGO", "FUN_ATIVO"],
    labels: { COD_FUNC: "Código", DSC_FUNC: "Nombre", ABV_FUNC: "Abreviatura", FUN_DT_ADM: "Admisión", FUN_DT_DESL: "Desvinculación",
      ID_CARGO: "Cargo", FUN_ATIVO: "Activo", COD_EMPREIT: "Contratista", CC_CODIGO: "Centro de costo" } },

  { nombre: "classe-funcionario", tabla: "GA_CLASSE_FUN", titulo: "Clase por funcionario", modulo: 1, idForm: 9730,
    pk: ["COD_FUNC", "ID_CLAS_EQUIP", "CLF_DT_INICIO"], lista: ["COD_FUNC", "ID_CLAS_EQUIP", "CLF_DT_INICIO", "CLF_DT_FIM"],
    labels: { COD_FUNC: "Funcionario", ID_CLAS_EQUIP: "Clase equipo", CLF_DT_INICIO: "Desde", CLF_DT_FIM: "Hasta" } },

  { nombre: "ccusto-funcionario", tabla: "GA_FUNC_CCUSTO", titulo: "Centro de costo por funcionario", modulo: 1, idForm: 9732,
    scope: ["COD_EMPR"], pk: ["COD_CENTR_CUSTO", "COD_FUNC", "CCU_DATA_INI"],
    lista: ["COD_FUNC", "COD_CENTR_CUSTO", "CCU_DATA_INI", "CCU_DATA_FIM"],
    labels: { COD_FUNC: "Funcionario", COD_CENTR_CUSTO: "Centro de costo", CCU_DATA_INI: "Desde", CCU_DATA_FIM: "Hasta", COD_CCUSTO_AGR: "C. costo agregado" } },

  { nombre: "tipo-empreiteiro", tabla: "GA_TIPO_EMPREITEIRO", titulo: "Tipo de contratista", modulo: 1, idForm: 9735,
    pk: ["COD_TIPO_EMPREIT"], lista: ["COD_TIPO_EMPREIT", "DSC_TIPO_EMPREIT", "ABV_TIPO_EMPREIT"],
    labels: { COD_TIPO_EMPREIT: "Código", DSC_TIPO_EMPREIT: "Descripción", ABV_TIPO_EMPREIT: "Abreviatura" } },

  { nombre: "empreiteiros", tabla: "GA_EMPREIT", titulo: "Contratistas", modulo: 1, idForm: 9737,
    pk: ["COD_EMPREIT"], lista: ["COD_EMPREIT", "DSC_EMPREIT", "ABV_EMPREIT", "COD_TIPO_EMPREIT"],
    labels: { COD_EMPREIT: "Código", DSC_EMPREIT: "Nombre", ABV_EMPREIT: "Abreviatura", EMPR_CGC: "CGC/RUC", EMPR_CPF: "CPF",
      COD_TIPO_EMPREIT: "Tipo", MUN_CEP: "Municipio (CEP)", COD_EMPREIT_INT: "Cód. integración" } },

  { nombre: "frente-empreiteiro", tabla: "GA_FRENTE_EMPREIT", titulo: "Frente de trabajo por contratista", modulo: 1, idForm: 9739,
    pk: ["COD_FRENTE", "COD_EMPREIT"], lista: ["COD_FRENTE", "COD_EMPREIT"],
    labels: { COD_FRENTE: "Frente", COD_EMPREIT: "Contratista" } },

  { nombre: "centro-custo", tabla: "GA_CENTR_CUSTO", titulo: "Centro de costo", modulo: 1, idForm: 9742, scope: ["COD_EMPR"],
    pk: ["COD_EMPR", "COD_CENTR_CUSTO"], lista: ["COD_CENTR_CUSTO", "DSC_CENTR_CUSTO", "ABV_CENTR_CUSTO", "COD_CCUSTO_AGR"],
    labels: { COD_CENTR_CUSTO: "Código", DSC_CENTR_CUSTO: "Descripción", ABV_CENTR_CUSTO: "Abreviatura", COD_CCUSTO_AGR: "Agregado" } },

  { nombre: "centro-custo-agregado", tabla: "GA_CENTR_CUSTO_AGREG", titulo: "Centro de costo agregado", modulo: 1, idForm: 9744,
    pk: ["COD_CCUSTO_AGR"], lista: ["COD_CCUSTO_AGR", "DSC_CCUSTO_AGR", "ABV_CCUSTO_AGR"],
    labels: { COD_CCUSTO_AGR: "Código", DSC_CCUSTO_AGR: "Descripción", ABV_CCUSTO_AGR: "Abreviatura" } },

  // Equipamento
  { nombre: "proprietario-equipamento", tabla: "GA_TABGR_PROP_EQUIP", titulo: "Propietarios de equipo", modulo: 1, idForm: 9747,
    pk: ["COD_PROP_EQUIP"], lista: ["COD_PROP_EQUIP", "DSC_PROP_EQUIP", "PROP_EQUIP_TIPO"],
    labels: { COD_PROP_EQUIP: "Código", DSC_PROP_EQUIP: "Nombre", PROP_EQUIP_TIPO: "Tipo (F/J)", PROP_EQUIP_CGC: "CGC/RUC",
      PROP_EQUIP_CPF: "CPF", MUN_CEP: "Municipio (CEP)", PROP_ENDERECO: "Dirección", PROP_BAIRRO: "Barrio", PROP_UF: "UF", PROP_EQP_RG: "RG" } },

  { nombre: "equipamentos", tabla: "GI_MEQ_MIS", titulo: "Equipos", modulo: 1, idForm: 9749,
    pk: ["COD_MIS"], lista: ["COD_MIS", "DSC_MIS", "MIS_PLACA", "MIS_STATU"],
    labels: { COD_MIS: "Código", DSC_MIS: "Descripción", ABV_MIS: "Abreviatura", MIS_STATU: "Estado", MIS_PLACA: "Placa",
      MIS_ANO: "Año", MIS_CHASSI: "Chasis", COD_PROP_EQUIP: "Propietario", COD_CENTR_CUSTO: "Centro de costo" } },

  { nombre: "classe-equipamento", tabla: "GA_CPMIS_CLAS_EQUIP", titulo: "Clase de equipo", modulo: 1, idForm: 9751,
    pk: ["ID_CLAS_EQUIP"], lista: ["ID_CLAS_EQUIP", "DSC_CLAS_EQUIP", "ABV_CLAS_EQUIP"],
    labels: { ID_CLAS_EQUIP: "Código", DSC_CLAS_EQUIP: "Descripción", ABV_CLAS_EQUIP: "Abreviatura" } },

  { nombre: "subclasse-equipamento", tabla: "GA_CPMIS_SUBCL_EQUIP", titulo: "Subclase de equipo", modulo: 1, idForm: 9751,
    pk: ["ID_CLAS_EQUIP", "ID_SUBCL_EQUIP"], lista: ["ID_CLAS_EQUIP", "ID_SUBCL_EQUIP", "DSC_SUBCL_EQUIP"],
    labels: { ID_CLAS_EQUIP: "Clase", ID_SUBCL_EQUIP: "Código", DSC_SUBCL_EQUIP: "Descripción", ABV_SUBCL_EQUIP: "Abreviatura" } },

  // Utilitários — límites de análisis por empresa/zafra (los usan GAtec_Lab y GAtec_Lat).
  { nombre: "parametros", tabla: "GA_PARAM_EMPR_SAFRA", titulo: "Parámetros (empresa/zafra)", modulo: 1, idForm: 9754, safraScoped: true,
    pk: ["COD_EMPR", "SAF_ANO_SAFRA"], lista: ["PAR_BRIX_MINIM", "PAR_BRIX_MAXIM", "PAR_POL_CALDO_MINIM", "PAR_POL_CALDO_MAXIM", "PAR_PUREZ_MINIM", "PAR_PUREZ_MAXIM"] },

  // --- Módulo 90 (GPI) · Tablas — esquema GATEC_GPI_NEW (el que usa GATEC_GPI.exe) ---
  { nombre: "gpi-unidade", esquema: "GATEC_GPI_NEW", tabla: "GI_LAB_UNIDADE", titulo: "Unidad de medida (GPI)", modulo: 90, idForm: 8491,
    pk: ["ID_UNIDADE"], lista: ["ID_UNIDADE", "UNI_DESC", "UNI_ABV"],
    labels: { ID_UNIDADE: "Código", UNI_DESC: "Descripción", UNI_ABV: "Abreviatura" } },

  { nombre: "gpi-constantes", esquema: "GATEC_GPI_NEW", tabla: "GI_LAB_CONST", titulo: "Constantes", modulo: 90, idForm: 8493,
    pk: ["ID_CONST"], lista: ["ID_CONST", "CON_DESC", "CON_ABV", "CON_VALOR"],
    labels: { ID_CONST: "Código", CON_DESC: "Descripción", CON_ABV: "Abreviatura", CON_VALOR: "Valor", CON_TP_VALOR: "Tipo de valor" } },

  { nombre: "gpi-metodologia", esquema: "GATEC_GPI_NEW", tabla: "GI_LAB_METODO", titulo: "Metodologías", modulo: 90, idForm: 8495,
    pk: ["ID_METODO"], lista: ["ID_METODO", "MET_DESCRICAO"],
    labels: { ID_METODO: "Código", MET_DESCRICAO: "Descripción", MET_TEXTO: "Texto", MET_ARQUIVO: "Archivo" } },

  { nombre: "gpi-me-alcool", esquema: "GATEC_GPI_NEW", tabla: "GI_LAB_TAB_ME_ALCOOL", titulo: "Masa específica del alcohol", modulo: 90, idForm: 8497,
    pk: ["MEA_INPM"], lista: ["MEA_INPM", "MEA_ME15", "MEA_ME20", "MEA_D20_20", "MEA_V15"],
    labels: { MEA_INPM: "INPM", MEA_ME15: "ME 15°", MEA_ME15_56: "ME 15,56°", MEA_ME20: "ME 20°", MEA_D15_15: "D 15/15",
      MEA_D15_56_15_56: "D 15,56/15,56", MEA_D20_20: "D 20/20", MEA_V15: "V 15°" } },

  { nombre: "gpi-dens-brix", esquema: "GATEC_GPI_NEW", tabla: "GI_LAB_TAB_DENS_BRIX", titulo: "Densidad del Brix", modulo: 90, idForm: 8499,
    pk: ["TDB_BRIX"], lista: ["TDB_BRIX", "TDB_DENSIDADE"],
    labels: { TDB_BRIX: "Brix", TDB_DENSIDADE: "Densidad" } },

  { nombre: "gpi-tab-generica-conf", esquema: "GATEC_GPI_NEW", tabla: "GI_LAB_TAB_GENERICA_CAD", titulo: "Tablas Genéricas · Configuración", modulo: 90, idForm: 8502,
    pk: ["GEN_CODIGO"], sn: ["GEC_USA_EMPR"], lista: ["GEN_CODIGO", "GEC_NOME_TAB", "GEC_DESC_CAMPO1", "GEC_DESC_CAMPO2"],
    labels: { GEN_CODIGO: "Código", GEC_NOME_TAB: "Nombre", GEC_USA_EMPR: "Usa empresa", GEC_DESC_CAMPO1: "Campo 1", GEC_TIPO_CAMPO1: "Tipo campo 1 (N/S)",
      GEC_DESC_CAMPO2: "Campo 2", GEC_TIPO_CAMPO2: "Tipo campo 2 (N/S)", GEC_MAT_PROCESSO: "Material en proceso" } },

  // Sin PK declarada; clave lógica verificada única en DESA (COD_EMPR siempre nulo).
  { nombre: "gpi-tab-generica", esquema: "GATEC_GPI_NEW", tabla: "GI_LAB_TAB_GENERICA", titulo: "Tablas Genéricas · Mantenimiento", modulo: 90, idForm: 8504,
    pk: ["GEN_CODIGO", "GEN_CAMPO1", "GEN_DATA_VIGENCIA"], lista: ["GEN_CODIGO", "GEN_CAMPO1", "GEN_CAMPO2", "GEN_DATA_VIGENCIA"],
    labels: { GEN_CODIGO: "Tabla", GEN_CAMPO1: "Campo 1", GEN_CAMPO2: "Campo 2", GEN_DATA_VIGENCIA: "Vigencia", COD_EMPR: "Empresa" } },

  { nombre: "gpi-granulometria", esquema: "GATEC_GPI_NEW", tabla: "GI_LAB_TAB_GRANULOMETRIA", titulo: "Granulometría (peso y abertura de tamices)", modulo: 90, idForm: 9582,
    scope: ["COD_EMPR"], pk: ["COD_EMPR"], lista: ["PESO_14", "ABERTURA_14", "PESO_20", "ABERTURA_20", "PESO_FUNDO"] },

  // --- Módulo 90 (GPI) · Sprint 4: paradas, reducción de moagem, materiales, tanques, productos ---
  // Laboratorio de recepción / Pós-Colheita (módulo 6): único catálogo con datos (Pré-Colheita e Impurezas están vacíos en DESA).
  { nombre: "lab-motivo-cancelacion", tabla: "GA_MOTIV_CANCEL_ANA", titulo: "Motivo de Cancelación de Análisis", modulo: 6, idForm: 9912,
    pk: ["COD_MOT_CAN"], lista: ["COD_MOT_CAN", "DSC_MOT_CAN", "ABV_MOT_CAN"],
    labels: { COD_MOT_CAN: "Código", DSC_MOT_CAN: "Descripción", ABV_MOT_CAN: "Abreviatura", COD_MOT_CAN_CONSECANA: "Código Consecana" } },

  // Paradas de moagem (Movimentos > Parada). Grupo/Local/Motivo tienen su historial de estado en tablas *_STATUS.
  { nombre: "gpi-parada-grupo", esquema: "GATEC_GPI_NEW", tabla: "GI_LAB_GRUPO_PARADA", titulo: "Parada · Grupo", modulo: 90, idForm: 8431,
    pk: ["ID_GRUPO_PARADA"], lista: ["ID_GRUPO_PARADA", "GRP_DESC"],
    labels: { ID_GRUPO_PARADA: "Código", GRP_DESC: "Descripción" } },
  { nombre: "gpi-parada-grupo-estado", esquema: "GATEC_GPI_NEW", tabla: "GI_LAB_GRUPO_PARADA_STATUS", titulo: "Parada · Grupo · Historial de estado", modulo: 90, idForm: 8431,
    pk: ["ID_GRUPO_PARADA", "PST_DATA_STATUS"], bool: ["PST_STATUS"], orden: "ID_GRUPO_PARADA, PST_DATA_STATUS DESC",
    lista: ["ID_GRUPO_PARADA", "PST_DATA_STATUS", "PST_STATUS"],
    labels: { ID_GRUPO_PARADA: "Grupo", PST_DATA_STATUS: "Desde", PST_STATUS: "Activo" } },

  { nombre: "gpi-parada-local", esquema: "GATEC_GPI_NEW", tabla: "GI_LAB_LOCAL_PARADA", titulo: "Parada · Local", modulo: 90, idForm: 8433,
    pk: ["ID_GRUPO_PARADA", "ID_LOCAL"], lista: ["ID_GRUPO_PARADA", "ID_LOCAL", "LOP_DESC"],
    labels: { ID_GRUPO_PARADA: "Grupo", ID_LOCAL: "Código", LOP_DESC: "Descripción" } },
  { nombre: "gpi-parada-local-estado", esquema: "GATEC_GPI_NEW", tabla: "GI_LAB_LOCAL_PARADA_STATUS", titulo: "Parada · Local · Historial de estado", modulo: 90, idForm: 8433,
    pk: ["ID_GRUPO_PARADA", "ID_LOCAL", "PST_DATA_STATUS"], bool: ["PST_STATUS"], orden: "ID_GRUPO_PARADA, ID_LOCAL, PST_DATA_STATUS DESC",
    lista: ["ID_GRUPO_PARADA", "ID_LOCAL", "PST_DATA_STATUS", "PST_STATUS"],
    labels: { ID_GRUPO_PARADA: "Grupo", ID_LOCAL: "Local", PST_DATA_STATUS: "Desde", PST_STATUS: "Activo" } },

  { nombre: "gpi-parada-motivo", esquema: "GATEC_GPI_NEW", tabla: "GI_LAB_MOT_PARADA", titulo: "Parada · Motivo", modulo: 90, idForm: 8435,
    pk: ["ID_MOTIVO"], lista: ["ID_MOTIVO", "MOT_DESC", "MOT_ABV"],
    labels: { ID_MOTIVO: "Código", MOT_DESC: "Descripción", MOT_ABV: "Abreviatura" } },
  { nombre: "gpi-parada-motivo-estado", esquema: "GATEC_GPI_NEW", tabla: "GI_LAB_MOT_PARADA_STATUS", titulo: "Parada · Motivo · Historial de estado", modulo: 90, idForm: 8435,
    pk: ["ID_MOTIVO", "PST_DATA_STATUS"], bool: ["PST_STATUS"], orden: "ID_MOTIVO, PST_DATA_STATUS DESC",
    lista: ["ID_MOTIVO", "PST_DATA_STATUS", "PST_STATUS"],
    labels: { ID_MOTIVO: "Motivo", PST_DATA_STATUS: "Desde", PST_STATUS: "Activo" } },

  // Lançamento de paradas: SOLO CONSULTA. El VB6 calcula MPL_HORAS_PARADAS (HH:MM) y valida solapamientos.
  { nombre: "gpi-parada-lanc", esquema: "GATEC_GPI_NEW", tabla: "GI_MOT_PARADA_LANC", titulo: "Parada · Digitación (consulta)", modulo: 90, idForm: 8437,
    scope: ["COD_EMPR"], soloLectura: true, fechahora: ["MPL_DATA_INICIO", "MPL_DATA_FINAL"], hora: ["MPL_HORAS_PARADAS_OLD"],
    pk: ["ID_MOTIVO", "ID_GRUPO_PARADA", "ID_LOCAL", "COD_EMPR", "MPL_DATA_INICIO", "MPL_DATA_FINAL"], orden: "MPL_DATA_INICIO DESC",
    lista: ["MPL_DATA_INICIO", "MPL_DATA_FINAL", "ID_GRUPO_PARADA", "ID_LOCAL", "ID_MOTIVO", "MPL_HORAS_PARADAS"],
    labels: { MPL_DATA_INICIO: "Inicio", MPL_DATA_FINAL: "Fin", ID_GRUPO_PARADA: "Grupo", ID_LOCAL: "Local", ID_MOTIVO: "Motivo",
      MPL_HORAS_PARADAS: "Horas paradas", MPL_HORAS_PARADAS_OLD: "Horas (formato anterior)", MPL_OBS: "Observación", MPL_PROG: "Programada",
      MPL_ID_TURNO: "Turno" } },

  // Redução de moagem.
  { nombre: "gpi-redu-grupo", esquema: "GATEC_GPI_NEW", tabla: "GI_LAB_REDU_MOAGEM_GRUPO", titulo: "Reducción de molienda · Grupo", modulo: 90, idForm: 10112,
    pk: ["ID_GRUPO"], lista: ["ID_GRUPO", "RMG_DESC"], labels: { ID_GRUPO: "Código", RMG_DESC: "Descripción" } },
  { nombre: "gpi-redu-local", esquema: "GATEC_GPI_NEW", tabla: "GI_LAB_REDU_MOAGEM_LOCAL", titulo: "Reducción de molienda · Local solicitante", modulo: 90, idForm: 10114,
    pk: ["ID_LOCAL"], lista: ["ID_LOCAL", "ID_GRUPO", "RML_DESC"], labels: { ID_LOCAL: "Código", ID_GRUPO: "Grupo", RML_DESC: "Descripción" } },
  { nombre: "gpi-redu-motivo", esquema: "GATEC_GPI_NEW", tabla: "GI_LAB_REDU_MOAGEM_MOTIVO", titulo: "Reducción de molienda · Motivo", modulo: 90, idForm: 10116,
    pk: ["ID_MOTIVO"], lista: ["ID_MOTIVO", "RMM_DESC", "RMM_ABV"], labels: { ID_MOTIVO: "Código", RMM_DESC: "Descripción", RMM_ABV: "Abreviatura" } },
  { nombre: "gpi-redu-equipo", esquema: "GATEC_GPI_NEW", tabla: "GI_LAB_REDU_MOAGEM_EQPTO", titulo: "Reducción de molienda · Equipo", modulo: 90, idForm: 10110,
    scope: ["COD_EMPR"], pk: ["COD_EMPR", "ID_EQPTO", "DATA"], bool: ["RME_STATUS"], orden: "ID_EQPTO, DATA DESC",
    lista: ["ID_EQPTO", "RME_DESC", "DATA", "RME_STATUS"],
    labels: { ID_EQPTO: "Código", RME_DESC: "Descripción", DATA: "Vigencia desde", RME_STATUS: "Activo", RME_ROTACAO_PADRAO: "Rotación estándar",
      RME_TONELADAS_HORA: "Toneladas/hora", RME_TIPO: "Tipo", RME_MOAGEM_TOTAL_VAR: "Variable de molienda total", RME_HORAS_DIA: "Horas por día" } },
  { nombre: "gpi-redu-lanc", esquema: "GATEC_GPI_NEW", tabla: "GI_LAB_REDU_MOAGEM_LANC", titulo: "Reducción de molienda · Digitación (consulta)", modulo: 90, idForm: 10118,
    scope: ["COD_EMPR"], soloLectura: true, fechahora: ["RLA_DATA_INICIO", "RLA_DATA_FIM"],
    pk: ["COD_EMPR", "ID_EQPTO", "ID_MOTIVO", "ID_GRUPO", "ID_LOCAL", "RLA_DATA_INICIO", "RLA_DATA_FIM"], orden: "RLA_DATA_INICIO DESC",
    lista: ["RLA_DATA_INICIO", "RLA_DATA_FIM", "ID_EQPTO", "ID_MOTIVO", "RLA_ROTACAO_REDUZIDA", "RLA_MOAGEM_PERDIDA", "RLA_TEMPO_REDUCAO"],
    labels: { RLA_DATA_INICIO: "Inicio", RLA_DATA_FIM: "Fin", ID_EQPTO: "Equipo", ID_MOTIVO: "Motivo", ID_GRUPO: "Grupo", ID_LOCAL: "Local",
      RLA_ROTACAO_REDUZIDA: "Rotación reducida", RLA_MOAGEM_PERDIDA: "Molienda perdida", RLA_TEMPO_REDUCAO: "Tiempo de reducción", RLA_OBSERVACAO: "Observación" } },

  // Material en proceso (configuración) y tanques.
  { nombre: "gpi-material", esquema: "GATEC_GPI_NEW", tabla: "GI_LAB_CAD_MATER_PROCESSO_GEN", titulo: "Registro de materiales", modulo: 90, idForm: 8481,
    pk: ["MPG_CODIGO"], lista: ["MPG_CODIGO", "MPG_DESCRICAO", "MPG_TIPO"],
    labels: { MPG_CODIGO: "Código", MPG_DESCRICAO: "Descripción", MPG_TIPO: "Tipo", MPG_UTILIZA_ENTRE_SAFRA: "Utiliza en entre zafra (S/N)" } },
  // Configuración por equipo con vigencia: el VB6 la maneja con reglas (fórmulas, variables Pol/Brix/GL) → solo consulta.
  { nombre: "gpi-material-config", esquema: "GATEC_GPI_NEW", tabla: "GI_LAB_CAD_MATER_PROCESSO", titulo: "Configuración de materiales (consulta)", modulo: 90, idForm: 8483,
    scope: ["COD_EMPR"], soloLectura: true, pk: ["COD_EMPR", "MPR_PRODUTO", "MPR_COD_EQP", "MPR_DATA"],
    orden: "MPR_PRODUTO, MPR_ORDEM, MPR_COD_EQP, MPR_DATA DESC",
    lista: ["MPR_PRODUTO", "MPR_COD_EQP", "MPR_DESC", "MPR_DESC_MATERIAL", "MPR_CAPACIDADE", "MPR_DATA"],
    labels: { MPR_PRODUTO: "Producto", MPR_COD_EQP: "Equipo", MPR_ORDEM: "Orden", MPR_DESC: "Descripción", MPR_DESC_MATERIAL: "Material",
      MPR_CAPACIDADE: "Capacidad", MPR_LT_CM: "Litros por cm", MPR_TIPO_DIG: "Tipo de digitación", ID_VAR_POL: "Variable Pol",
      ID_VAR_BRIX: "Variable Brix", ID_VAR_GL: "Variable GL", MPR_FORMULA: "Fórmula", MPR_ORI_DADOS: "Origen de datos", MPR_DATA: "Vigencia desde" } },
  { nombre: "gpi-tanque-medicion", esquema: "GATEC_GPI_NEW", tabla: "GI_LAB_TANQUE_MED", titulo: "Tanques · Medición", modulo: 90, idForm: 8486,
    scope: ["COD_EMPR"], pk: ["COD_EMPR", "ID_TANQUE"], lista: ["ID_TANQUE", "DSC_TANQUE", "TAN_CAPAC", "TAN_FATOR"],
    labels: { ID_TANQUE: "Código", DSC_TANQUE: "Descripción", TAN_CAPAC: "Capacidad", TAN_FATOR: "Factor" } },
  { nombre: "gpi-tanque-estocagem", esquema: "GATEC_GPI_NEW", tabla: "GI_LAB_TANQUE_EST", titulo: "Tanques · Almacenamiento", modulo: 90, idForm: 8488,
    scope: ["COD_EMPR"], pk: ["COD_EMPR", "ID_TANQUE"], lista: ["ID_TANQUE", "DSC_TANQUE", "TAN_CAPAC", "TAN_FATOR"],
    labels: { ID_TANQUE: "Código", DSC_TANQUE: "Descripción", TAN_CAPAC: "Capacidad", TAN_FATOR: "Factor" } },

  // Productos (azúcar).
  { nombre: "gpi-producto-categoria", esquema: "GATEC_GPI_NEW", tabla: "GI_LAB_PRODUTO_CATEG", titulo: "Productos · Categorías", modulo: 90, idForm: 8474,
    pk: ["COD_CATEG"], lista: ["COD_CATEG", "CAT_DESC", "CAT_ABV"], labels: { COD_CATEG: "Código", CAT_DESC: "Descripción", CAT_ABV: "Abreviatura" } },
  { nombre: "gpi-producto", esquema: "GATEC_GPI_NEW", tabla: "GI_LAB_CAD_ACUCAR", titulo: "Productos", modulo: 90, idForm: 8476,
    pk: ["COD_CATEG", "CAC_CODIGO"], lista: ["COD_CATEG", "CAC_CODIGO", "CAC_DESCRICAO", "CAC_ABREVIADO", "CAC_ORDEM"],
    labels: { COD_CATEG: "Categoría", CAC_CODIGO: "Código", CAC_DESCRICAO: "Descripción", CAC_ABREVIADO: "Abreviatura", CAC_ORDEM: "Orden" } },
];

// Columnas que definen el scope empresa/zafra (se completan desde el contexto).
const SCOPE_COLS = ["COD_EMPR", "SAF_ANO_SAFRA"];
const scopeDe = (def) => def.scope || (def.safraScoped ? SCOPE_COLS : []);

// --- Carga de metadata de columnas desde la base ---------------------------

function inferirTipo(dataType, def, col) {
  if ((def.bool && def.bool.includes(col)) || (def.sn && def.sn.includes(col))) return "bool";
  if (def.hora && def.hora.includes(col)) return "hora";
  if (def.fechahora && def.fechahora.includes(col)) return "fechahora";
  if (dataType === "NUMBER" || dataType === "FLOAT") return "numero";
  if (dataType === "DATE" || dataType.startsWith("TIMESTAMP")) return "fecha";
  return "texto";
}

function prettify(col) {
  return col.replace(/^(COD|DSC|ABV|ID|FAG|PRO|ESU|ECO|EMB|PAR)_/, "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

const _recursos = {}; // nombre -> recurso resuelto (con columnas)

const esquemaDe = (def) => def.esquema || G;

async function initRecursos() {
  // Una consulta por esquema (GATEC_AGR por defecto; el GPI vive en GATEC_GPI_NEW).
  const porTabla = {}; // "ESQUEMA.TABLA" -> columnas
  for (const esquema of [...new Set(DEFINICIONES.map(esquemaDe))]) {
    const tablas = DEFINICIONES.filter((d) => esquemaDe(d) === esquema).map((d) => d.tabla);
    const binds = {};
    tablas.forEach((t, i) => { binds[`t${i}`] = t; });
    const inList = tablas.map((_, i) => `:t${i}`).join(", ");
    const r = await query(
      `SELECT table_name, column_name, data_type, data_length, data_precision, data_scale, nullable, column_id
         FROM all_tab_columns WHERE owner = :o AND table_name IN (${inList})
        ORDER BY table_name, column_id`,
      { o: esquema, ...binds },
    );
    for (const c of r.rows) (porTabla[`${esquema}.${c.TABLE_NAME}`] ||= []).push(c);
  }

  let ok = 0;
  const faltantes = [];
  for (const def of DEFINICIONES) {
    const cols = porTabla[`${esquemaDe(def)}.${def.tabla}`];
    if (!cols || !cols.length) { faltantes.push(def.tabla); continue; }
    const columnas = cols.map((c) => {
      const tipo = inferirTipo(c.DATA_TYPE, def, c.COLUMN_NAME);
      const esPk = def.pk.includes(c.COLUMN_NAME);
      const esScope = scopeDe(def).includes(c.COLUMN_NAME);
      return {
        col: c.COLUMN_NAME,
        label: def.labels?.[c.COLUMN_NAME] || prettify(c.COLUMN_NAME),
        tipo,
        sn: (def.sn && def.sn.includes(c.COLUMN_NAME)) || undefined, // bool guardado como 'S'/'N'
        len: tipo === "texto" && c.DATA_LENGTH ? c.DATA_LENGTH : undefined,
        fixedLen: c.DATA_TYPE === "CHAR" ? c.DATA_LENGTH : undefined, // CHAR = ancho fijo con padding
        // NUMBER(p,s): dígitos enteros permitidos (p - s), para validar antes de Oracle (ORA-01438).
        enteros: tipo === "numero" && c.DATA_PRECISION ? c.DATA_PRECISION - (c.DATA_SCALE || 0) : undefined,
        pk: esPk || undefined,
        req: (c.NULLABLE === "N" || esPk) || undefined,
        lista: def.lista.includes(c.COLUMN_NAME) || undefined,
        scope: esScope || undefined, // se completa desde el contexto empresa/zafra
      };
    });
    _recursos[def.nombre] = {
      esquema: esquemaDe(def), tabla: def.tabla, titulo: def.titulo, modulo: def.modulo, idForm: def.idForm,
      scoped: scopeDe(def).length > 0,
      soloLectura: !!def.soloLectura,
      orden: def.orden || def.pk.filter((c) => !scopeDe(def).includes(c)).join(", ") || def.pk.join(", "),
      columnas,
    };
    ok++;
  }
  console.log(`[recursos] ${ok}/${DEFINICIONES.length} tablas maestras cargadas` +
    (faltantes.length ? ` (sin columnas: ${faltantes.join(", ")})` : ""));
}

function getRecurso(nombre) {
  return _recursos[nombre] || null;
}

function listarRecursos() {
  return Object.entries(_recursos).map(([nombre, r]) => ({
    nombre, titulo: r.titulo, modulo: r.modulo, idForm: r.idForm,
  }));
}

module.exports = { initRecursos, getRecurso, listarRecursos };
