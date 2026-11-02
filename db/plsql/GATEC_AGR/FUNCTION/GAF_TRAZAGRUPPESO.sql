CREATE OR REPLACE Function Gaf_TrazAgrupPeso( cCOD_AGRUP In GA_AGRUP_MIS.COD_AGRUP%TYPE )
           Return NUMBER Is
cursor curTrazAgrup Is
        Select agr_peso_medio_inte, agr_peso_medio_pica, agr_tipo_cana
          From GA_AGRUP_MIS
            Where COD_AGRUP = cCOD_AGRUP;
regTrazAgrup curTrazAgrup%ROWTYPE;
   Begin
        open curTrazAgrup;
        fetch curTrazAgrup into regTrazAgrup;
        If regTrazAgrup.agr_tipo_cana = 'I' Then
           return regTrazAgrup.agr_peso_medio_inte;
        Else
           return regTrazAgrup.agr_peso_medio_pica;
        end If;
        close curTrazAgrup;
   End;

 