CREATE OR REPLACE Procedure           Gap_AcertaEstagio( nIDDivi4 in    NUMBER,
                                                sErroSQL       in out VARCHAR2 ) Is
nFinalid  Number(1) ;
nAreaPrev Number ;
sEstag    varchar2(3);
cursor LeDivi4 Is
  select cod_empr,saf_ano_safra,cod_divi1,cod_divi2,cod_divi3,cod_divi4,di4_situa,cod_estag_usina
  from ga_divi4
  where id_divi4 = nIDDivi4;
regDiv4 LeDivi4%ROWTYPE;
cursor LeEstag Is
  Select cod_cc_estag_usina,cod_sc_estag_usina
    From ga_mudan_estag
     where cod_estag_usina = regDiv4.cod_estag_usina;
regEstag LeEstag%ROWTYPE;
cursor MaiorDat Is
 select max(ED4_DT_ESTIM) Data
  from GA_ESTIM_DIVI4
     where ID_DIVI4 = nIDDivi4
       and COD_FINALID = nFinalid;
regdat MaiorDat%ROWTYPE;
cursor EstimAtiv Is
  select id_estim_agrup
    from ga_estim_agrup
      where eag_ativa=1;
regest EstimAtiv%ROWTYPE;
Cursor curEstim Is
  Select (nvl(A.ed4_area_manual,0)+nvl(A.ed4_area_mecanica,0)) Soma
     From ga_estim_divi4 A
       where a.ED4_DT_ESTIM   = regdat.Data
         and a.cod_finalid    = nFinalid
         and a.ID_ESTIM_AGRUP = regest.id_estim_agrup
         and a.id_divi4       = nIDDivi4;
regEstim curEstim%ROWTYPE;
Cursor curAreaLib Is
  Select Sum( are.TAL_AREA_LIB ) soma
   From GA_AREA_LIBER are,
        GA_LIBERACAO  lib
    Where lib.ID_LIBER    = are.ID_LIBER  and
          lib.COD_FINALID between 1 and 5 and
          are.ID_DIVI4    = nIDDivi4 ;
regAreLib curAreaLib%ROWTYPE;
Begin
   --sErroSQL := '' ;
   open LeDivi4;
   fetch LeDivi4 into regDiv4;
   open LeEstag;
   fetch LeEstag into regEstag;
   if regDiv4.di4_situa < 4 then
      sEstag := regEstag.cod_sc_estag_usina;
   Elsif regDiv4.di4_situa = 6  then
      sEstag := regEstag.cod_cc_estag_usina;
   Elsif regDiv4.di4_situa = 4 or regDiv4.di4_situa = 5 then
      open EstimAtiv ;
      fetch EstimAtiv into regest ;
      open curArealib ;
      fetch curAreaLib into regAreLib   ;
      nAreaPrev := 0;
      nFinalid := 1;
      while nFinalid <= 5 loop
         open  maiordat ;
         fetch maiordat into regdat ;
         open  curEstim ;
         fetch curEstim into regEstim ;
         if curEstim%FOUND then
            nAreaPrev := nAreaPrev + regEstim.Soma ;
         end if;
         close curEstim;
	 close maiordat;
         nFinalid := nFinalid + 1;
      end loop ;
      if regAreLib.soma >= (nAreaPrev/2) then
         sEstag := regEstag.cod_cc_estag_usina;
      Else
         sEstag := regEstag.cod_sc_estag_usina;
      end if ;
      close curArealib;
      close EstimAtiv;
   end if ;
   update ga_divi4 set cod_estag_usina=sEstag
     where cod_empr = regDiv4.cod_empr  and saf_ano_safra = regDiv4.saf_ano_safra+1 and
           cod_divi1= regDiv4.cod_divi1 and cod_divi2=regDiv4.cod_divi2 and
           cod_divi3= regDiv4.cod_divi3 and cod_divi4=regDiv4.cod_divi4;
   close LeEstag;
   close LeDivi4;
end ;

 