CREATE OR REPLACE FUNCTION FRETORNAAMOSTRA(NCOD_DIVI1    IN NUMBER,
                                           NCOD_DIVI2    IN NUMBER,
                                           NCOD_DIVI3    IN NUMBER,
                                           NCOD_DIVI4    IN NUMBER,
                                           SCODAMOSTRA   IN VARCHAR2,
                                           STIPOPESQUISA IN VARCHAR2,
                                           SCODPROFUND   IN NUMBER)
  RETURN NUMBER IS
  NVALOR NUMBER(12, 4);
BEGIN
  -- Se sTipo
  IF UPPER(STIPOPESQUISA) = 'U' THEN
    SELECT AVG(LANU.ANL_VALOR)
      INTO NVALOR
      FROM GA_SOL_ANALISES      LANA,
           GA_SOL_ANALISE_DIVI4 LAND4,
           GA_SOL_ANALISE_ITENS LANU,
           GA_DIVI4             D4,
           GA_SOL_ITENS_ANALISE IT  
     WHERE LANA.ANL_CODIGO = LAND4.ANL_CODIGO AND
           LAND4.ANL_CODIGO = LANU.ANL_CODIGO AND
           LAND4.ID_DIVI4 = D4.ID_DIVI4 AND 
           IT.ITE_CODIGO = LANU.ITE_CODIGO AND
           LANA.ANL_DATA =
           (SELECT MAX(ANL_DATA)
              FROM GA_SOL_ANALISES      LANA,
                   GA_SOL_ANALISE_DIVI4 LAND4,
                   GA_SOL_ANALISE_ITENS LANU,
                   GA_DIVI4             D4,
                   GA_SOL_ITENS_ANALISE IT  
             WHERE LANA.ANL_CODIGO = LAND4.ANL_CODIGO AND
                   LAND4.ANL_CODIGO = LANU.ANL_CODIGO AND
                   LAND4.ID_DIVI4 = D4.ID_DIVI4 AND 
                   IT.ITE_CODIGO = LANU.ITE_CODIGO AND
                   D4.COD_DIVI1 = NCOD_DIVI1 AND 
                   D4.COD_DIVI2 = NCOD_DIVI2 AND
                   D4.COD_DIVI3 = NCOD_DIVI3 AND 
                   D4.COD_DIVI4 = NCOD_DIVI4 AND
                   IT.ABV_ITEM = SCODAMOSTRA AND
                   LANA.PRF_CODIGO = SCODPROFUND) AND
           D4.COD_DIVI1 = NCOD_DIVI1 AND
           D4.COD_DIVI2 = NCOD_DIVI2 AND 
           D4.COD_DIVI3 = NCOD_DIVI3 AND
           D4.COD_DIVI4 = NCOD_DIVI4 AND 
           IT.ABV_ITEM = SCODAMOSTRA AND
           LANA.PRF_CODIGO = SCODPROFUND;
  ELSE
    SELECT AVG(LANU.ANL_VALOR)
      INTO NVALOR
      FROM GA_SOL_ANALISES      LANA,
           GA_SOL_ANALISE_DIVI4 LAND4,
           GA_SOL_ANALISE_ITENS LANU,
           GA_DIVI4             D4,
           GA_SOL_ITENS_ANALISE IT   
     WHERE LANA.ANL_CODIGO = LAND4.ANL_CODIGO AND
           LAND4.ANL_CODIGO = LANU.ANL_CODIGO AND
           LAND4.ID_DIVI4 = D4.ID_DIVI4 AND 
           IT.ITE_CODIGO = LANU.ITE_CODIGO AND
           D4.COD_DIVI1 = NCOD_DIVI1 AND
           D4.COD_DIVI2 = NCOD_DIVI2 AND 
           D4.COD_DIVI3 = NCOD_DIVI3 AND
           D4.COD_DIVI4 = NCOD_DIVI4 AND 
           IT.ABV_ITEM = SCODAMOSTRA AND
           LANA.PRF_CODIGO = SCODPROFUND;
  END IF;
  RETURN NVALOR;
END;

 