CREATE OR REPLACE procedure gap_liga_job(nLiga number, nSafra number, nEmpr number) is
nJOB number;

Cursor cur_Res Is
select 	job
from 	user_jobs
where 	upper(what)
like 	'%GAP_ACUMULADOS_JOB%';
reg_Res cur_Res%ROWTYPE;

begin

        Open cur_Res;
	fetch cur_Res Into reg_Res;
	If  reg_res.job > 0 then

  	    IF nLiga = 0 then

	       	Loop
		     	exit When cur_Res%NOTFOUND;
		     	fetch cur_Res Into reg_Res;

			If  reg_res.job > 0 then
			    DBMS_JOB.REMOVE( reg_res.job );
			end if;
		end Loop;
	   	commit;
	   	close cur_Res;

	     else

		Loop
			exit When cur_Res%NOTFOUND;
		     	fetch cur_Res Into reg_Res;

		     If  reg_res.job > 0 then
			 DBMS_JOB.CHANGE( reg_res.job,null,SYSDATE+5/1440, 'SYSDATE+'||to_char(nLiga)||'/1440' );
		     end if;

		   end Loop;
		   commit;
		   close cur_Res;
	     end if;
	else
	     DBMS_JOB.SUBMIT(nJOB, 'gap_acumulados_job('||TO_CHAR(nSafra)||','||TO_CHAR(nEmpr)||');',sysdate, 'SYSDATE+'||to_char(nLiga)||'/1440');

	     commit;

	end if;
end;

 