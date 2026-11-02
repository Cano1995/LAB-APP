CREATE OR REPLACE function gaf_DataCompleta( dData in date,
							   dHora in date )
return date is
dRetorno date;
begin
	dRetorno := to_date(
				 to_char( dData, 'DD-MM-YYYY' ) || ' ' ||
				 to_char( dhora, 'HH24:MI:SS' ),
					'DD-MM-YYYY HH24:MI:SS' );
	return dRetorno;
end gaf_datacompleta;

 