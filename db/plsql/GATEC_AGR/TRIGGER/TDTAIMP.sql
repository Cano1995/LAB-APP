CREATE OR REPLACE TRIGGER "GATEC_AGR".tdtaimp
BEFORE   INSERT  OR
           UPDATE  OF IMP_TOT_DT_HR, IMP_TOT_HR
                   ON GA_IMPUREZA_TOTAL
FOR EACH ROW






















BEGIN
   :new.imp_dia_balanca  := GAF_DIABALANCA( TO_DATE( TO_CHAR(:new.imp_tot_dt_hr, 'DD/MM/YY') ||
         ' ' || TO_CHAR(:new.imp_tot_hr, 'HH24:MI:SS'), 'DD/MM/YY HH24:MI:SS' ) )
    ;
END;



