CREATE OR REPLACE function trim(sCodigo in varchar2) return varchar2
is
begin
    return ltrim(rtrim(sCodigo));
end;
 