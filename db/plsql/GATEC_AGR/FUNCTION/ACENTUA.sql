CREATE OR REPLACE function acentua(valor_col in varchar2) return varchar2
is
begin
  return replace(replace(replace(replace(replace(replace(replace(replace(replace
(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace
(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace
(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace
(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace
(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace
(replace(replace(replace(replace(replace(replace(replace(replace(valor_col ,'c?o','ção'),'C?O','ÇÃO'),'N?o','Não'),'Jo?o','João'
),'S?O','SÃO'),'s?o','são'),'r?o','rão'),'t?o','tão'),'S?o','São'),'C?ES','ÇÕES'
),'c?es','çôes'),'DR?O','DRÃO'),'lh?es','lhões'),'q?en','qüen'),'N?O','NÃO'),'x?
es','xões'),'s?es','sões'),'lh?o','lhão'),'god?o','godão'),'ab?o','abão'),'arv?o
','arvão'),'rg?o','rgão'),'T?CNICA','TÈCNICA'),'n?o','não'),'h?o','hão'),'d?o','
dão'),'m?o','mão'),'M?o','Mão'),'z?o','zão'),'r?es','rões'),'i?es','iões'),'i?o'
,'ião'),'p?e','põe'),'l?o','lão'),'x?o','xão'),'c?ees','çõees'),'JO?O','JOÃO'),'
S?O','SÃO'),'b?es','bões'),'M?RIO','MÁRIO'),'e?o','eão'),'p?e','põe'),'Z?O','ZÃO
'),'v?o','vão'),'q?i','qüi'),'T?NC','TÃNC'),'(?es)','(ões)'),'?ltimo','último'),
'p?o','pão'),'j?o','jão'),'Gr?-','Grã-'),'n?','nº'),'N?','Nº'),'1?','1º'),'2?','2º'),
'3?','3º'),'4?','4º'),'5?','5º'),'6?','6º'),'7?','7º'),'8?','8º'),'9?','9º'),'m?','mã'),
'L?','L^'),'h?','hõ'),'t?','tõ'),'l?','lõ');
end;

 