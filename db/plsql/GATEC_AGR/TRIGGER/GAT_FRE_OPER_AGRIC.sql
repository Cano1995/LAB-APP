CREATE OR REPLACE TRIGGER "GATEC_AGR"."GAT_FRE_OPER_AGRIC" AFTER
INSERT
OR UPDATE
OR DELETE ON "GA_TABGR_OPER_AGRIC" FOR EACH ROW 
Declare
  sFracodigo varchar2(6);
  sErroSql varchar2(240);
  nUnidade number; 
Begin

if inserting or updating then 
  
 -- if nvl(:new.id_unidade,0) 0 then 
     nUnidade := 76 ;
 
 -- else
 --    id_unidade := :new.id_unidade;  
 -- end if;

  begin

     select fra_codigo
        into sFracodigo
        from ga_fre_atividade
       where fra_codigo = to_char(:new.id_oper);

  exception

       when NO_DATA_FOUND then
        sFracodigo := null ;

  end;
   
  
  if sFracodigo is null then

       insert into ga_fre_atividade
        (fra_codigo,
         fra_desc,
         fra_abv,
         fra_mobra,
         id_unidade,
         cod_empr)
       values
        (to_char(:new.id_oper),
         :new.dsc_oper,
         :new.abv_oper,
         0,
         nUnidade,
         1        );

 else 

      update ga_fre_atividade
        set  fra_codigo=to_char(:new.id_oper),
             fra_desc=:new.dsc_oper,
             fra_abv=:new.abv_oper
        where fra_codigo = sFraCodigo;

     end if;
end if;
exception
  when Others Then
    sErroSql := Substr(SqlErrm, 1, 240);
    Insert Into Log_Erro
    Values
      (:new.id_oper || to_char(SYSDATE, 'DD-MM-YYYY HH24:MI:SS ') ||
      ' Erro Trigger GAT_FRE_OPER_AGRIC ' ||
       sErroSql);

End;



