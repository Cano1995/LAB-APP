CREATE OR REPLACE TRIGGER "GATEC_AGR".ATUALIZA_SAIDA
BEFORE INSERT ON GA_EQUIP_TRANSITO
FOR EACH ROW





DECLARE
  V_NR_CARGA NUMBER;
  V_AUX      NUMBER;
BEGIN
--  IF (:NEW.COD_MIS_CONTA = :NEW.COD_MIS_MOTRIZ OR
 --    :NEW.COD_MIS_CONTA IS NULL) THEN
    --:NEW.EQT_DATA_PREV_CAMPO:= SYSDATE;
    --:NEW.EQT_HORA_PREV_CAMPO:= SYSDATE;
    --SELECT CONJ_NUM_CARGA
     -- INTO V_NR_CARGA
     -- FROM GA_VAR_CONJUNTO
    -- WHERE ID_CONJU = :NEW.ID_CONJU;
    --V_AUX := gapk_CtrTrafego.GAF_TEMPOCICLOIDA(:NEW.COD_EMPR,
     --                                          :NEW.SAF_ANO_SAFRA,
      --                                         :NEW.COD_DIVI1,
       --                                        :NEW.COD_DIVI2,
        --                                       :NEW.COD_FRENTE,
         --                                      :NEW.COD_AGRUP,
          --                                     V_NR_CARGA,
           --                                    :NEW.ID_CONJU);
  --END IF;

  IF INSERTING THEN
  
    UPDATE GA_MOTIV_PARADA_EQUIP
       SET MPE_DATA_FIM = SYSDATE, MPE_HORA_FIM = SYSDATE
     WHERE COD_MIS = :NEW.COD_MIS_MOTRIZ AND MPE_DATA_FIM IS NULL;
  
  END IF;

  IF DELETING THEN
    UPDATE GA_FRENTE_D2_CALC F2
       SET F2.FDC_RECALCULO = 'S'
     WHERE F2.COD_EMPR = :OLD.COD_EMPR AND
           F2.SAF_ANO_SAFRA = :OLD.SAF_ANO_SAFRA AND
           F2.COD_DIVI1 = :OLD.COD_DIVI1 AND F2.COD_DIVI2 = :OLD.COD_DIVI2 AND
           F2.COD_FRENTE = :OLD.COD_FRENTE;
  ELSE
    UPDATE GA_FRENTE_D2_CALC F2
       SET F2.FDC_RECALCULO = 'S'
     WHERE F2.COD_EMPR = :NEW.COD_EMPR AND
           F2.SAF_ANO_SAFRA = :NEW.SAF_ANO_SAFRA AND
           F2.COD_DIVI1 = :NEW.COD_DIVI1 AND F2.COD_DIVI2 = :NEW.COD_DIVI2 AND
           F2.COD_FRENTE = :NEW.COD_FRENTE;
  END IF;
END;



