CREATE OR REPLACE Procedure GAP_ATU_OS_STATUS(
					pEmpresa   In Number,
          pSafra 	   In Number,
          pCom_Seq   In Number,
					pCod_OS    In Number,
					dDataRepro In Date  ) Is

nExiste  	  Number(3) := 0;
nOperacoes 	Number(3) := 0;
nAbertas 	  Number(3) := 0;
SqlErro   	VarChar2(240);
dDataOS		  Date;

Begin
  SELECT 	count(*)
  into		nOperacoes
  from   	ga_recur_util_ativ_os a
  where		a.cod_empr = pEmpresa  		and
  		a.saf_ano_safra = pSafra  	and
  		a.cod_os = pCod_OS ;

  SELECT 	count(*)
  into		nAbertas
  from   	ga_recur_util_ativ_os a
  where a.cod_empr = pEmpresa  and
  		  a.saf_ano_safra = pSafra  and
 	     	a.cod_os = pCod_OS and
  	  	not exists ( select 	b.id_oper
  				from 	ga_encerramento_op b
  				where 	a.id_oper = b.id_oper  and
          				a.cod_empr = b.cod_empr  and
          				a.saf_ano_safra = b.saf_ano_safra and
          				a.cod_os= b.cod_os            );

If nAbertas = 0  and  nOperacoes >0 then
	SELECT  MAX(DT_ENCERRAMENTO)
	INTO	dDataOS
	FROM 	GA_ENCERRAMENTO_OP
	WHERE 	COD_EMPR	= pEmpresa
	AND	SAF_ANO_SAFRA	= pSafra
	AND	COD_OS		= pCod_OS;

	UPDATE 	GA_PL_MAN_AREA_D4
	SET	STATUS 		= 'E',
		SIN_DT_TECN_INI = dDataOS,
		SIN_COND_INI    = 0,
		SIN_INI_NDIAS   = 0,
		SIN_COND_NEC    = 0
	WHERE	SAF_ANO_SAFRA 	= pSafra
	AND	COD_EMPR 	= pEmpresa
	AND	COM_SEQ 	= pCom_Seq
	AND	COD_OS		= pCod_OS;
Else
	UPDATE 	GA_PL_MAN_AREA_D4
	SET	STATUS 		= 'P',
		SIN_DT_TECN_INI = dDataRepro,
		SIN_COND_INI    = 0,
		SIN_INI_NDIAS   = 0,
		SIN_COND_NEC    = 0
	WHERE	SAF_ANO_SAFRA 	= pSafra
	AND	COD_EMPR 	= pEmpresa
	AND	COM_SEQ 	= pCom_Seq
	AND	COD_OS		= pCod_OS;
END IF;
---Eliminado em 04/12/01
---Se a OS existir sera sempre P, A ou null siginifica que nao existe OS
---Elsif nAbertas < nOperacoes then
---	UPDATE 	GA_PL_MAN_AREA_D4
---	SET	STATUS 		= 'P',
---		SIN_DT_TECN_INI = dDataRepro,
---		SIN_COND_INI    = 0,
---		SIN_INI_NDIAS   = 0,
---		SIN_COND_NEC    = 0
---	WHERE	SAF_ANO_SAFRA 	= pSafra
---	AND	COD_EMPR 	= pEmpresa
---	AND	COM_SEQ 	= pCom_Seq
---	AND	COD_OS		= pCod_OS;
---Elsif nAbertas = nOperacoes then
---	UPDATE 	GA_PL_MAN_AREA_D4
---	SET	STATUS 		= null,
---		SIN_DT_TECN_INI = null,
---		SIN_COND_INI    = 0,
---		SIN_INI_NDIAS   = 0,
---		SIN_COND_NEC    = 0
---	WHERE	SAF_ANO_SAFRA 	= pSafra
---	AND	COD_EMPR 	= pEmpresa
---	AND	COM_SEQ 	= pCom_Seq
---	AND	COD_OS		= pCod_OS;
---End If;

COMMIT;

  Exception
     When Others Then
        rollBack;
        sqlErro := SubStr( SqlErrm, 1, 240) ;
	insert into Log_Erro values ( 'GAP_ATU_OS_STATUS-> '|| sysdate|| ' - '|| SqlErro);

End GAP_ATU_OS_STATUS;



 