CREATE OR REPLACE function gaf_LSClarif( nLsDig in number, nTipo in number )  
 return number is  
  
 nLs  number; 
 begin 
   if nLsDig = 0 then 
      nLs := 0 ; 
   elsif nTipo = 1 then  
      nLs := nLsDig;   elsif nTipo = 0 then  
      nLs := 1.00621*nLsDig +0.05117 ; 
   elsif nTipo = 2 then  
      nLs := 0.99879 * nLsDig+ 0.47374 ; 
   else 
      nLs := 1.00621*nLsDig +0.05117 ; 
   end if; 
   Return nLs; 
 end; 
  

 