CREATE OR REPLACE VIEW GATEC_AGR.VIEW_BLOCO_PRE_ANALI AS
Select
        cfg.COD_EMPR,
        cfg.SAF_ANO_SAFRA,
        esp.COD_ESPEC,
        esp.ABV_ESPEC,
--      agr.ID_ESPEC,
        pre.PAN_NUMER,
        pre.PAN_DT,
        pre.PAN_BRIX,
        pre.PAN_LS,
        pre.PAN_PBU,
        pre.PAN_POL_CALDO,
        pre.PAN_AR
    From
           GA_ESPEC            esp,
           GA_AGRUP            agr,
           GA_PRE_ANALI        pre,
           GA_MOV_PRE_ANALI    mov,
           GA_CONFI_EMPR_SAFRA cfg
        Where esp.COD_SUBGR       = cfg.COD_SUBGR
          And esp.COD_GRUPO       = cfg.COD_GRUPO
          And esp.ID_ESPEC        = agr.ID_ESPEC
          And agr.COD_EMPR        = cfg.COD_EMPR
          And agr.SAF_ANO_SAFRA   = cfg.SAF_ANO_SAFRA
          And agr.ID_DIVI4        = mov.ID_DIVI4
          And mov.ID_PRE_ANALI    = pre.ID_PRE_ANALI
	  And nvl(pre.PAN_Brix,0) = 0

 
/
