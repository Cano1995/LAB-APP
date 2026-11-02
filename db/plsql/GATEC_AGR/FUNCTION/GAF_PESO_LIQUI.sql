CREATE OR REPLACE function gaf_peso_liqui(nPeso in number,
                                          nLib  in number,
                                          nD4   in number,
                                          nVar  in number,
                                          nSol  in number) return number is
  nPesoRet number;
  nReg     number;
  somaarea number;
  maxD4    number;
begin
  if nVar = 0 and nSol = 0 then
    select count(*) into nReg from ga_area_liber where id_liber = nLib;
    if nReg = 1 then
      nPesoRet := nPeso;
    else
      select sum(tal_area_lib * tal_estim_pos_queim)
        into somaarea
        from ga_area_liber
       where id_liber = nLib;
    
      select max(id_divi4)
        into maxD4
        from ga_area_liber
       where id_liber = nLib;
    
      if nd4 = maxd4 then
        select nPeso - nvl(sum(round((tal_area_lib * tal_estim_pos_queim) /
                                     somaarea * nPeso,
                                     -1)),
                           0)
          into nPesoRet
          from ga_area_liber
         where id_liber = nLib and id_divi4 <> nD4;
      else
        select round((tal_area_lib * tal_estim_pos_queim) / somaarea *
                     nPeso,
                     -1)
          into nPesoRet
          from ga_area_liber
         where id_liber = nLib and id_divi4 = nD4;
      end if;
    end if;
  end if;
  return nPesoRet;
end;

 