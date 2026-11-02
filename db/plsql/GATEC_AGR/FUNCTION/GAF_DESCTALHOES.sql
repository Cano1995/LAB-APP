CREATE OR REPLACE function gaf_DescTalhoes( nIdliber in number )
return varchar2 is

sTalhao     varchar2(200);

Cursor curLiber Is
  select cod_divi4 from ga_area_liber are, ga_divi4 di4 
where di4.id_divi4 = are.id_divi4 
and id_liber = nIdliber;
regLiber curLiber%ROWTYPE;



begin

Open curLiber;
			Fetch curLiber Into regLiber;
				Loop
      		Exit When curLiber%NOTFOUND;

          sTalhao := sTalhao || '(' || regliber.cod_divi4 || ')';

                    
          Fetch curLiber Into regLiber;
        end loop;
        
        close curliber;
        

   return sTalhao;

end;

 