CREATE OR REPLACE function left(sCodigo in varchar2, n in integer ) return varchar2
is
begin
    return substr(sCodigo,1,n);
end;
 