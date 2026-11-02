CREATE OR REPLACE Package GAPK_DADOSTECNO As
	nAgio     number;
	nFibra    number;
	nPureza   number;
	nPolCana  number;
	nPolCaldo number;
	nAr1      number;
	ddatpre   date;
	nbrix     number;
	nls       number;
	npbu      number;
	nFator    number;
	nVolume   number;
	nNumAnali number;

	Procedure GAP_CALCENT( nAgi in number, nFib in number, nPur in number,
		nPol in number, nAr in number, npoc in number, ddat in date, nb in number,
		nl in number, np in number, nNum in number, nFat in number, nVol in number) ;

		Pragma restrict_references( GAP_CALCENT, 'WNDS' ) ;

	Function GAF_CALCRET( cTipo in char ) return number ;

		Pragma restrict_references( GAF_CALCRET, 'WNDS', 'WNPS' ) ;

	Function  GAF_CALCDAT( cTipo in char ) return date ;

		Pragma restrict_references( GAF_CALCDAT, 'WNDS') ;

End GAPK_DADOSTECNO ;

 