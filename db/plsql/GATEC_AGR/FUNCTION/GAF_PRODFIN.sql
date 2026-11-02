CREATE OR REPLACE Function Gaf_ProdFin( nIDD4 In Number,nTip In Number  ) Return Number
Is
nAreaCorte Number(9,5) := 0;
nRet Number(15,4) := 0;
Cursor curProdMoa Is
 select sum(ac_prod) soma
     from ga_acum_d4  d4,
          ga_liberacao lib
   where d4.id_divi4 = nIDD4
         and  lib.id_liber = d4.id_liber
         and  lib.cod_finalid in (1,3,4,5 );
regProdMoa curProdMoa%ROWTYPE;
Cursor curProdMud Is
 select sum(ac_prod) soma
     from ga_acum_d4  d4,
          ga_liberacao lib
   where d4.id_divi4 = nIDD4
         and  lib.id_liber = d4.id_liber
         and  lib.cod_finalid  = 2;
regProdMud curProdMud%ROWTYPE;
Begin
   nRet := 0;
   if nTip = 1 then
     Open curProdMoa;
     Fetch curProdMoa Into regProdMoa;
     If curProdMoa%FOUND and regProdMoa.soma > 0 Then
        nRet := regProdMoa.soma;
     end if;
     Close curProdMoa;
  else
     Open curProdMud;
     Fetch curProdMud Into regProdMud;
     If curProdMud%FOUND and regProdMud.soma > 0 Then
        nRet := regProdMud.soma;
     end if;
     Close curProdMud;
  end if;
  Return nRet ;
End Gaf_ProdFin;

 