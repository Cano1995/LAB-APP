CREATE OR REPLACE TRIGGER "GATEC_AGR".Gat_CON_PERFIL
 BEFORE UPDATE of con_perfil
 ON GA_CONFIG_CTR
 FOR EACH ROW














begin
 :new.con_perfil := 'US_SAOJOAO';
      --update ga_config_ctr set con_perfil = 'US_SAOJOAO';


end Gat_CON_PERFIL;





