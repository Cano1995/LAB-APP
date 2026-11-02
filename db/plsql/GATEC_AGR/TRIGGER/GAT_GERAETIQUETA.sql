CREATE OR REPLACE TRIGGER "GATEC_AGR".Gat_GeraEtiqueta
		   Before Insert
		       On GA_ETQ_PREANA
		      For Each Row















Declare
nRetorno  number(1) := 0;
sProcesso varchar2(100);

begin

	:new.PAN_NUMER := '';

	sProcesso := 'Chamando Gap_GeraEtiqueta';
-- 	Monta o Nro da ETIQUETA conforme a configuracao
	Gap_GeraEtiqueta( :new.ID_DIVI4,
			  :new.COD_VARIE_USINA,
			  :new.PAN_NUMER,
			  nRetorno );

	:new.PAN_NUMER := ltrim( rtrim( :new.PAN_NUMER ) );

	sProcesso := 'Chamando Gaf_CodBarra';
      :new.ETQ_NUMER := Gaf_CodBarra( :new.PAN_NUMER );

	If nRetorno = 0 Then
--              sProcesso := 'Chamando Gap_GeraPreAnalise';
                Gap_GeraPreAnalise( :new.ID_DIVI4, :new.COD_EMPR, :new.SAF_ANO_SAFRA, :new.PAN_NUMER, :new.COD_VARIE_USINA, nRetorno );
                sProcesso := 'Chamando Gap_GeraPreAnalise --Varied->'||to_char(:new.COD_VARIE_USINA);
	End if;

        If nRetorno <> 0 Then

		:new.PAN_NUMER := 'ERRO'||:new.ID_DIVI4;

	end if;
	if nRetorno <> 0 then
		insert into log_erro values
                ( 'Falha na trigger Gat_GeraEtiqueta ' || USER || ' ' ||
                  TO_CHAR( SYSDATE , 'DD-MM-YY-HH24:MI:SS' ) || ' - ' ||
			sProcesso );
	end if;
end;



