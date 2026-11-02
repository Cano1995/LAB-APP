CREATE OR REPLACE Package Body GAPK_DADOSTECNO AS

	Procedure GAP_CALCENT(nAgi in number, nFib in number, nPur in number, nPol in number,
		nAr in number, npoc in number, ddat in date, nb in number, nl in number ,
		np in number, nNum in number, nFat in number , nVol in number) IS

	Begin
   		nAgio    := nAgi ;
		nFibra   := nFib ;
   		nPureza  := nPur ;
   		nPolCaldo:= nPol ;
   		nPolCana := nPoc ;
   		nAr1     := nAr  ;
   		ddatpre  := ddat ;
   		nbrix    := nb   ;
   		nls      := nl   ;
   		npbu     := np   ;
   		nFator   := nFat ;
   		nVolume  := nVol ;
   		nNumAnali:= nNum ;

	End GAP_CALCENT;

	Function GAF_CALCRET( cTipo in char ) return number IS
		nret number ;
	Begin
   		If ctipo = 'AGI' then
      		nret := nAgio ;
   		Elsif ctipo = 'FIB' then
      		nret := nFibra ;
   		Elsif ctipo = 'PUR' then
      		nret := nPureza ;
   		Elsif ctipo = 'POL' then
      		nret := nPolCaldo ;
   		Elsif ctipo = 'POC' then
      		nret := nPolCana ;
   		Elsif cTipo = 'AR ' then
      		nret := nAr1;
   		Elsif cTipo = 'BRI' then
      		nret := nbrix;
   		Elsif cTipo = 'LS ' then
      		nret := nLs;
   		Elsif cTipo = 'PBU' then
      		nret := nPbu;
   		Elsif cTipo = 'NUM' then
      		nRet := nNumAnali ;
   		Elsif cTipo = 'FAT' then
      		nRet := nFator;
   		Elsif cTipo = 'VOL' then
      		nRet := nVolume ;
   		End if;

   		Return nret ;

		Exception
      		When Others Then
         		return 0;
	End GAF_CALCRET ;

	Function GAF_CALCDAT( cTipo in char ) return date  IS
		ddat date ;
	Begin
   		If cTipo = 'DAT' then
      		Return ddatpre ;
   		End if ;
	End GAF_CALCDAT ;


End GAPK_DADOSTECNO;
