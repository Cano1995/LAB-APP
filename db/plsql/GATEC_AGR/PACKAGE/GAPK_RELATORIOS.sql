CREATE OR REPLACE Package Gapk_Relatorios As

	type typPesoFunc is Table of Varchar2(2000)
   		index by BINARY_INTEGER;

	aPeso typPesoFunc;

	nInd Number;

	Function Gaf_FuncTransporte( nCod_Func in Number, sDesc_Func In GA_FUNCIONARIO.DSC_FUNC%TYPE, nCod_Empr in Number, nSaf_Ano_Safra in Number,
		 dDataIni In Date, dDataFim In Date ) Return Varchar2;

	Pragma Restrict_References( Gaf_FuncTransporte, 'WNDS' ) ;

	Function Gaf_DistViagem(nViag In Number, nCod_Empr In Number, nSaf_Ano_Safra In Number) Return Number;

	Pragma Restrict_References( Gaf_DistViagem, 'WNDS', 'WNPS' ) ;

	Procedure Imp;

End Gapk_Relatorios;

 