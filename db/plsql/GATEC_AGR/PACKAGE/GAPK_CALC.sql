CREATE OR REPLACE package gapk_calc as
   function GAF_CalculaSondaLiber( nIdLib in number, cTipo in varchar2) return number ;
   pragma restrict_references( GAF_CalculaSondaLiber, 'WNDS' ) ;
   --------------------------------------------------------------------------------------
   --- Dados PRE-ANALISE
   --- Função para cálculo dos valores (pre-analise) utilizando prefixo do tipo e id_divi4
   function GAF_CalculaPre(nIDD4 in number,cTipo in varchar2) return number;
   pragma restrict_references( GAF_CalculaPre, 'WNDS' ) ;
   --------------------------------------------------------------------------------------
   --- Função para retorno dos valores (pre-analise) utilizando apenas o prefixo do tipo
   function GAF_RetPre(cTipo in varchar2) return number;
   pragma restrict_references( GAF_RetPre, 'WNDS' ) ;
   --------------------------------------------------------------------------------------
   --- Dados SONDA
   --- Função para cálculo dos valores (sonda) utilizando prefixo do tipo e id_divi4
   function GAF_CalculaSonda(nIDD4 in number,cTipo in varchar2) return number;
   pragma restrict_references( GAF_CalculaSonda, 'WNDS' ) ;
   --------------------------------------------------------------------------------------
   --- Dados
   --- Função para cálculo dos valores (gerais) utilizando prefixo do tipo e id_divi4
   function GAF_CalculaForm(nEmp in number, nSaf in number, nBrix in number, nLs in number, nPbu in number, cTipo in varchar2) return number ;
   pragma restrict_references( GAF_CalculaForm, 'WNDS' ) ;
   --------------------------------------------------------------------------------------
   --- Função para retorno dos valores (sonda) utilizando apenas o prefixo do tipo
   function GAF_RetSonda(cTipo in varchar2) return number;
   pragma restrict_references( GAF_RetSonda, 'WNDS' ) ;
   --------------------------------------------------------------------------------------
   --- Função para retorno dos valores utilizando apenas o prefixo do tipo
   function GAF_RetForm(cTipo in varchar2) return number;
   pragma restrict_references( GAF_RetForm, 'WNDS' ) ;
   --------------------------------------------------------------------------------------
   --- Dados FINALIDADE
   --- Função para pesquisar areas por finalidade utilizando id_divi4 e codigo finalidade
   function GAF_CalculaFin(nIDD4 in number,nFinalid in number) return number;
   pragma restrict_references( GAF_CalculaFin, 'WNDS' ) ;
   --------------------------------------------------------------------------------------
   --- Dados SONDA
   --- Função para cálculo dos valores (sonda) utilizando prefixo do tipo e id_divi4
   function GAF_CalculaSondaTVB(nIDD4 in number,cTipo in varchar2,cCorte in number) return number;
   pragma restrict_references( GAF_CalculaSondaTVB, 'WNDS' ) ;
   --------------------------------------------------------------------------------------
   --- Dados Liberacao PARA O GATEC_TVB
   --- Função para cálculo dos valores (Liberacao) utilizando prefixo do tipo e id_divi4
   function GAF_CalculaLiberTVB(nIdLib in number, cTipo in varchar2, nIdD4 in number) return number;
   pragma restrict_references( GAF_CalculaLiberTVB, 'WNDS' ) ;
   --------------------------------------------------------------------------------------
   --------------------------------------------------------------------------------------
   --------------------------------------------------------------------------------------
   --------------------------------------------------------------------------------------
   --------------------------------------------------------------------------------------
   --- Variáveis Globais
   --- Variaveis Pré-analise
   nGP_Pbu number :=0;
   nGP_Brix number :=0;
   nGP_Ls number :=0;
   nGP_LsCor number :=0;
   nGP_Clarif number :=0;
   nGP_Fibra number :=0;
   nGP_AgioAtr number :=0;
   nGP_Pureza number :=0;
   nGP_PolCana number :=0;
   nGP_PolCaldo number :=0;
   nGP_Ar number :=0;
   nGP_Atr number :=0;
   nGP_Agio number :=0;
   --- Variáveis Sonda
   nGS_Pbu number :=0;
   nGS_Brix number :=0;
   nGS_Ls number :=0;
   nGS_LsCor number :=0;
   nGS_Clarif number :=0;
   nGS_Fibra number :=0;
   nGS_AgioAtr number :=0;
   nGS_Pureza number :=0;
   nGS_PolCana number :=0;
   nGS_PolCaldo number :=0;
   nGS_Ar number :=0;
   nGS_Atr number :=0;
   nGS_Agio number :=0;
   nGS_TmpCorte number :=0;
   nGS_TmpQuei number :=0;
   nGR_Prd number := 0;
   nGR_PrA number := 0;
   --- Variáveis diversas
   nPanNumer 	number :=0;
   nClarif	number :=0;
   sErroSql varchar2(2000);
   nId_divi4 number;
   -------
   ----Cursor curSafras Is
   ---	    Select COD_EMPR,
   ---	  	   SAF_ANO_SAFRA
   --- 	    From   GA_DIVI4
   ---	    Where  id_divi4 = nId_divi4;
   ---regSafras curSafras%ROWTYPE;
end gapk_calc;

 