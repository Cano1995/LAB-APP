CREATE OR REPLACE VIEW GATEC_AGR.VW_PROM_LAB_GENERAL AS
SELECT a.cod_empr cod_empresa,
       to_char(A.AC_DT_ACUM,'yyyymm') mes_anio,
       '1' quincena,
       round(SUM(NVL(A.AC_POND_POL_CANA, 0)*(A.AC_PROD / 1000))/SUM(A.AC_PROD / 1000),2) POL,
       round(SUM(NVL(A.AC_POND_PUREZA, 0)*(A.AC_PROD / 1000))/SUM(A.AC_PROD / 1000),2) Pureza,
       round(SUM(NVL(A.AC_POND_FIBRA, 0)*(A.AC_PROD / 1000))/SUM(A.AC_PROD / 1000),2) fibra
 FROM GA_ACUM_D4     A,
       GA_DIVI1       D1,
       GA_DIVI2       D2,
       GA_DIVI3       D3,
       GA_DIVI4       D4
 WHERE A.cod_empr = '01'
   AND NVL(A.AC_PROD, 0) > 0
   --establecido por el Ing. Pedrozo en reunion con Antonio Carlos Fernandes
   --Jose Grau y JMBosch el dia Jueves 21 de Febrero en Casa Central
   --AND A.cod_tip_corte = '3'
   --
   and to_char(A.AC_DT_ACUM,'dd')  between '01' and  '15'
   --todas las fechas de esta campo gatec si pasan de las 04:00 am le resta una
   --asi que debemos tomar asi
   AND NVL(A.AC_POND_POL_CANA, 0)  > 0
   AND NVL(A.AC_POND_PUREZA, 0)  > 0
   AND NVL(A.AC_POND_FIBRA, 0) > 0
   AND D1.SAF_ANO_SAFRA = A.SAF_ANO_SAFRA
   AND D1.COD_EMPR = A.COD_EMPR
   AND D1.COD_DIVI1 = A.COD_DIVI1
   AND D2.SAF_ANO_SAFRA = A.SAF_ANO_SAFRA
   AND D2.COD_EMPR = A.COD_EMPR
   AND D2.COD_DIVI1 = A.COD_DIVI1
   AND D2.COD_DIVI2 = A.COD_DIVI2
   AND D3.SAF_ANO_SAFRA = A.SAF_ANO_SAFRA
   AND D3.COD_EMPR = A.COD_EMPR
   AND D3.COD_DIVI1 = A.COD_DIVI1
   AND D3.COD_DIVI2 = A.COD_DIVI2
   AND D3.COD_DIVI3 = A.COD_DIVI3
   AND D4.SAF_ANO_SAFRA = A.SAF_ANO_SAFRA
   AND D4.COD_EMPR = A.COD_EMPR
   AND D4.COD_DIVI1 = A.COD_DIVI1
   AND D4.COD_DIVI2 = A.COD_DIVI2
   AND D4.COD_DIVI3 = A.COD_DIVI3
   AND D4.COD_DIVI4 = A.COD_DIVI4

GROUP BY a.cod_empr,
                   to_char(A.AC_DT_ACUM,'yyyymm'),
                   '1'

UNION ALL

SELECT
       a.cod_empr,
       to_char(A.AC_DT_ACUM,'yyyymm') mes_anio,
       '2' quincena,
       round(SUM(NVL(A.AC_POND_POL_CANA, 0)*(A.AC_PROD / 1000))/SUM(A.AC_PROD / 1000),2) POL,
       round(SUM(NVL(A.AC_POND_PUREZA, 0)*(A.AC_PROD / 1000))/SUM(A.AC_PROD / 1000),2) Pureza,
       round(SUM(NVL(A.AC_POND_FIBRA, 0)*(A.AC_PROD / 1000))/SUM(A.AC_PROD / 1000),2) fibra

 FROM GA_ACUM_D4     A,
       GA_DIVI1       D1,
       GA_DIVI2       D2,
       GA_DIVI3       D3,
       GA_DIVI4       D4
 WHERE A.cod_empr = '01'
   AND NVL(A.AC_PROD, 0) > 0
   --establecido por el Ing. Pedrozo en reunion con Antonio Carlos Fernandes
   --Jose Grau y JMBosch el dia Jueves 21 de Febrero en Casa Central
   --AND A.cod_tip_corte = '3'
   --
   and to_char(A.AC_DT_ACUM,'dd')  between '16' and  '31'
   --todas las fechas de esta campo gatec si pasan de las 04:00 am le resta una
   --asi que debemos tomar asi
   AND NVL(A.AC_POND_POL_CANA, 0)  > 0
   AND NVL(A.AC_POND_PUREZA, 0)  > 0
   AND NVL(A.AC_POND_FIBRA, 0) > 0
   AND D1.SAF_ANO_SAFRA = A.SAF_ANO_SAFRA
   AND D1.COD_EMPR = A.COD_EMPR
   AND D1.COD_DIVI1 = A.COD_DIVI1
   AND D2.SAF_ANO_SAFRA = A.SAF_ANO_SAFRA
   AND D2.COD_EMPR = A.COD_EMPR
   AND D2.COD_DIVI1 = A.COD_DIVI1
   AND D2.COD_DIVI2 = A.COD_DIVI2
   AND D3.SAF_ANO_SAFRA = A.SAF_ANO_SAFRA
   AND D3.COD_EMPR = A.COD_EMPR
   AND D3.COD_DIVI1 = A.COD_DIVI1
   AND D3.COD_DIVI2 = A.COD_DIVI2
   AND D3.COD_DIVI3 = A.COD_DIVI3
   AND D4.SAF_ANO_SAFRA = A.SAF_ANO_SAFRA
   AND D4.COD_EMPR = A.COD_EMPR
   AND D4.COD_DIVI1 = A.COD_DIVI1
   AND D4.COD_DIVI2 = A.COD_DIVI2
   AND D4.COD_DIVI3 = A.COD_DIVI3
   AND D4.COD_DIVI4 = A.COD_DIVI4

GROUP BY a.cod_empr,
                   to_char(A.AC_DT_ACUM,'yyyymm'),
                   '2'

 
/
