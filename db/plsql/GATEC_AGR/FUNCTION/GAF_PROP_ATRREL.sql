CREATE OR REPLACE Function GAF_PROP_ATRREL(pCod_prop In Number, pCod_fundo In Number,
						    pData In Date, pCod_empr In Number, pSafra In Number, pTipoRet in varchar2) Return varchar2
Is

/*
sTipoRet:
[A] - Retorna a configuração do ATR Relativo - "S" ou "N"
[P] - Retorna Código Proprietário - alterado ou sem alteração
*/

sRetorno   VARCHAR2(7);
nTotReg    NUMBER;
sAtr       VARCHAR2(1);

BEGIN

   nTotReg := 0;
   sAtr := 'N';

   If pTipoRet = 'P' then

      select count(distinct atr.ATR_REL)
        into nTotReg
        from (SELECT distinct nvl(CONF.CFG_ATR_REL, 'N') ATR_REL
                from GA_CONFIG_PCTS_FA CONF
                WHERE CONF.COD_FUNDO_AGRIC in
                     (SELECT FA.COD_FUNDO_AGRIC
                       FROM GA_FUNDO_AGRIC FA
                       WHERE FA.SAF_ANO_SAFRA = pSafra
                        AND FA.COD_PROP = pCod_prop)
                 AND CONF.COD_EMPR = pCod_empr
                 AND CONF.CFG_PCTS_DATA =
                     (select max(b.cfg_pcts_data)
                       from ga_config_pcts_fa b
                       where b.cod_fundo_agric = conf.cod_fundo_agric
                       and b.cfg_pcts_data <= pData)) atr;

      If nTotReg > 1 then

         SELECT nvl(CONF.CFG_ATR_REL, 'N')
           into sAtr
           from GA_CONFIG_PCTS_FA CONF
           WHERE CONF.COD_FUNDO_AGRIC = pCod_fundo
           AND CONF.COD_EMPR = pCod_empr
           AND CONF.CFG_PCTS_DATA =
                (select max(b.cfg_pcts_data)
                from ga_config_pcts_fa b
                where b.cod_fundo_agric = conf.cod_fundo_agric
                and b.cfg_pcts_data <= pData);

          If sAtr = 'N' then
             sRetorno := TRIM(TO_CHAR(1000000 + TRIM(pCod_prop),'999999999'));
          else
             sRetorno := TO_CHAR(pCod_prop);
          end if;
      else
         sRetorno := TO_CHAR(pCod_prop);
      end if;

   elsif pTipoRet = 'A' then

         SELECT nvl(CONF.CFG_ATR_REL, 'N')
           into sAtr
           from GA_CONFIG_PCTS_FA CONF
           WHERE CONF.COD_FUNDO_AGRIC = pCod_fundo
           AND CONF.COD_EMPR = pCod_empr
           AND CONF.CFG_PCTS_DATA =
                (select max(b.cfg_pcts_data)
                from ga_config_pcts_fa b
                where b.cod_fundo_agric = conf.cod_fundo_agric
                and b.cfg_pcts_data <= pData);

      sRetorno := sAtr;

   end if;

   RETURN sRetorno;

END GAF_PROP_ATRREL;

 