CREATE OR REPLACE TRIGGER "GATEC_AGR".Gat_Usuario
	AFTER INSERT
		ON GA_USUARIO
		FOR EACH ROW














declare n varchar2(10);
Begin

   select NOME INTO N from USUARIOS where NOME = :new.ID_USUARIO;

exception
   when NO_DATA_FOUND then

      insert into USUARIOS (NOME,SENHA,PRIORIDADE,MODULO)
      	values
      	(:new.ID_USUARIO,:new.USU_SENHA,'1-SUPER','GA');

end Gat_Usuario;




