CREATE OR REPLACE Procedure BuscaFilhos(PR_ID_DIVI4 IN NUMBER) IS

/*=======================================================================*/
/* Declaracao de variaveis                                               */
/*=======================================================================*/
VR_NOMETABELA	USER_CONS_COLUMNS.TABLE_NAME%TYPE;

/*=======================================================================*/
/* Declaracao de cursores                                                */
/*=======================================================================*/

CURSOR SEL_TABELA is
SELECT TABLE_NAME FROM USER_TAB_COLUMNS
WHERE COLUMN_NAME = 'ID_DIVI4';

/*=======================================================================*/
/* Inicio da procedure                                                   */
/*=======================================================================*/
Begin

 /*======================================================================*/
 /* Limpa a tabela de busca                                              */
 /*======================================================================*/
 Delete GA_DIVI4_FILHOS;

 Open SEL_TABELA;

  /*=====================================================================*/
  /* Monta um LOOP para se processar todas as linhas do cursor.          */
  /*=====================================================================*/
  LOOP

   Fetch SEL_TABELA into VR_NOMETABELA;
   EXIT When SEL_TABELA%NOTFOUND;

   /*====================================================================*/
   /* Monta a tabela de busca com existencia da coluna 'ID_DIVI4'        */
   /* Obs: caso vc encontre algum nome sem descrição na tabela, crie     */
   /*      um comando insert logo abaixo na lista com a devida descrição */
   /*====================================================================*/

   IF VR_NOMETABELA = 'GA_ACUM_D4' THEN
     INSERT INTO GA_DIVI4_FILHOS VALUES (VR_NOMETABELA, 'ACUMULADOS');

   ELSIF VR_NOMETABELA = 'GA_AGRUP' THEN
     INSERT INTO GA_DIVI4_FILHOS VALUES (VR_NOMETABELA, 'AGRUPAMENTOS DINÂMICOS');

   ELSIF VR_NOMETABELA = 'GA_AREAS_AUTORIZ' THEN
     INSERT INTO GA_DIVI4_FILHOS VALUES (VR_NOMETABELA, 'ÁREAS AUTORIZADAS');

   ELSIF VR_NOMETABELA = 'GA_AREA_LIBER' THEN
     INSERT INTO GA_DIVI4_FILHOS VALUES (VR_NOMETABELA, 'ÁREAS LIBERADAS');

   ELSIF VR_NOMETABELA = 'GA_ARRENDAMENTOS' THEN
     INSERT INTO GA_DIVI4_FILHOS VALUES (VR_NOMETABELA, 'ARRENDAMENTOS');

   ELSIF VR_NOMETABELA = 'GA_CCM_MOV_DEST_PLANTIO' THEN
     INSERT INTO GA_DIVI4_FILHOS VALUES (VR_NOMETABELA, 'DEST. PLANTIO CANA-MUDA');

   ELSIF VR_NOMETABELA = 'GA_CCM_MOV_ORIGEM' THEN
     INSERT INTO GA_DIVI4_FILHOS VALUES (VR_NOMETABELA, 'ORIGEM PLANTIO CANA-MUDA');

   ELSIF VR_NOMETABELA = 'GA_DIVI4_PART' THEN
     INSERT INTO GA_DIVI4_FILHOS VALUES (VR_NOMETABELA, 'PARTICIPAÇÕES');

   ELSIF VR_NOMETABELA = 'GA_ESTIM_DIVI4' THEN
     INSERT INTO GA_DIVI4_FILHOS VALUES (VR_NOMETABELA, 'ESTIMATIVAS DE PRODUÇÃO');

   ELSIF VR_NOMETABELA = 'GA_ETQ_PREANA' THEN
     INSERT INTO GA_DIVI4_FILHOS VALUES (VR_NOMETABELA, 'ETIQUETAS');

   ELSIF VR_NOMETABELA = 'GA_LANC_BROCA' THEN
     INSERT INTO GA_DIVI4_FILHOS VALUES (VR_NOMETABELA, 'BROCAS');

   ELSIF VR_NOMETABELA = 'GA_MOV_PRE_ANALI' THEN
     INSERT INTO GA_DIVI4_FILHOS VALUES (VR_NOMETABELA, 'PRÉ-ANALISES');

   ELSIF VR_NOMETABELA = 'GA_OBS_MIDIA_DIVI4' THEN
     INSERT INTO GA_DIVI4_FILHOS VALUES (VR_NOMETABELA, 'OBSERVAÇÕES AGRONÔMICAS');

   ELSIF VR_NOMETABELA = 'GA_RECUR_UTIL_LOC' THEN
     INSERT INTO GA_DIVI4_FILHOS VALUES (VR_NOMETABELA, 'INSUMOS');

   ELSIF VR_NOMETABELA = 'GA_RECUR_UTIL_LOC_HIST' THEN
     INSERT INTO GA_DIVI4_FILHOS VALUES (VR_NOMETABELA, 'INSUMOS - HISTÓRICO');

   ELSIF VR_NOMETABELA = 'GA_REFER_DIVI4' THEN
     INSERT INTO GA_DIVI4_FILHOS VALUES (VR_NOMETABELA, 'ÁREAS DIVERSAS');

   ELSIF VR_NOMETABELA = 'GA_ROTA_CANA' THEN
     INSERT INTO GA_DIVI4_FILHOS VALUES (VR_NOMETABELA, 'DISTÂNCIA SEDE - TALHÃO');

   ELSIF VR_NOMETABELA = 'GA_ROTA_DIVER' THEN
     INSERT INTO GA_DIVI4_FILHOS VALUES (VR_NOMETABELA, 'DISTÂNCIA DE ÁREAS DIVERSAS');

   ELSIF VR_NOMETABELA = 'GA_ROTA_DIVI4' THEN
     INSERT INTO GA_DIVI4_FILHOS VALUES (VR_NOMETABELA, 'DISTÂNCIA ENTRE TALHÕES');

   ELSIF VR_NOMETABELA = 'GA_ROTA_DIVI4_DIVI4' THEN
     INSERT INTO GA_DIVI4_FILHOS VALUES (VR_NOMETABELA, 'DISTÂNCIA ENTRE PONTOS DE CARREGAMENTO');

   ELSIF VR_NOMETABELA = 'GA_SIM_CORTE_MOV' THEN
     INSERT INTO GA_DIVI4_FILHOS VALUES (VR_NOMETABELA, 'SIMULAÇÃO DE CORTE');

   ELSIF VR_NOMETABELA = 'GA_SOLOS_DIVI4' THEN
     INSERT INTO GA_DIVI4_FILHOS VALUES (VR_NOMETABELA, 'SOLOS PARA TALHÃO');

   ELSIF VR_NOMETABELA = 'GA_VALID_ROTA_CANA' THEN
     INSERT INTO GA_DIVI4_FILHOS VALUES (VR_NOMETABELA, 'VALIDADE ROTA-CANA');

   ELSIF VR_NOMETABELA = 'GA_VALID_ROTA_DIVI4' THEN
     INSERT INTO GA_DIVI4_FILHOS VALUES (VR_NOMETABELA, 'VALIDADE ROTA-TALHÃO');

   ELSIF VR_NOMETABELA = 'GA_VALID_ROT_DIVER' THEN
     INSERT INTO GA_DIVI4_FILHOS VALUES (VR_NOMETABELA, 'VALIDADE ROTA-DIVERSA');

   ELSIF VR_NOMETABELA = 'GA_VARIE_DIVI4' THEN
     INSERT INTO GA_DIVI4_FILHOS VALUES (VR_NOMETABELA, 'VARIEDADES PARA TALHÃO');

   ELSIF VR_NOMETABELA = 'GA_VAR_CEC' THEN
     INSERT INTO GA_DIVI4_FILHOS VALUES (VR_NOMETABELA, 'CONTROLE DE ENTREGA DE CANA');

   END IF;

  End LOOP;

 Close SEL_TABELA;

 /*======================================================================*/
 /* Confirmacao das transacoes                                           */
 /*======================================================================*/
 Commit;

/*=======================================================================*/
/* Tratamento de erros                                                   */
/*=======================================================================*/
Exception
   When Others then
	Rollback;

/*=======================================================================*/
/* Fim da procedure: BuscaFilhos                                         */
/*=======================================================================*/
END BuscaFilhos;


 