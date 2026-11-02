CREATE OR REPLACE Function GAF_DIST_MEDIA_POND( nId_Divi4   IN Number	,
				      		nEmpresa    IN Number	,
						nProd_D4    IN Number	 )
Return Number
Is
nDist_Med_Pond Number(9,1) := 0 ;
Cursor C1 Is
Select	Nvl(ROT_ASFAL,0)+Nvl(ROT_TERR1,0)+Nvl(ROT_TERR2,0) Soma
From 	GA_ROTA a,
     	GA_ROTA_CANA b
Where 	a.COD_EMPR_DEST 	= nEmpresa
	AND a.COD_ROTA 		= b.COD_ROTA
       	AND b.ID_DIVI4 		= nId_Divi4
       	AND b.ROC_PRINCIPAL 	= 1;
R1 C1%RowType;
Begin
      Open C1;
      Fetch C1 Into R1;
      If C1%FOUND Then
           nDist_Med_Pond := ( nProd_D4 * R1.Soma );
      Else
	   nDist_Med_Pond := -1;
      End If;
      Close C1;
      Return nDist_Med_Pond;
End GAF_DIST_MEDIA_POND;

 