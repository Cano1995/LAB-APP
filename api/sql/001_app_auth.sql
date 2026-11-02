-- LAB_APP_AUTH: credenciales propias de lab-app (NO se toca GAM_USUARIOS: la comparte el sistema GATEC original).
-- Enlaza por ID_USUARIO contra GAM_USUARIOS. Idempotente. Ejecutar conectado como el dueño del esquema de la app (APP_SCHEMA).
DECLARE
  n NUMBER;
BEGIN
  SELECT COUNT(*) INTO n FROM user_tables WHERE table_name = 'LAB_APP_AUTH';
  IF n = 0 THEN
    EXECUTE IMMEDIATE q'[
      CREATE TABLE LAB_APP_AUTH (
        ID_USUARIO         NUMBER(5)    NOT NULL,
        SENHA_HASH         VARCHAR2(100),              -- bcrypt; NULL = aún no definió clave nueva
        REQUIERE_RESET     NUMBER(1)    DEFAULT 1 NOT NULL,
        INTENTOS_FALLIDOS  NUMBER(3)    DEFAULT 0 NOT NULL,
        BLOQUEADO          NUMBER(1)    DEFAULT 0 NOT NULL,
        ULTIMO_LOGIN       DATE,
        SEL_COD_EMPR       NUMBER(2),                  -- última empresa elegida
        SEL_SAF_ANO_SAFRA  NUMBER(4),                  -- última zafra elegida
        BLOQ_HASTA         DATE,                       -- espera tras intentos fallidos
        FECHA_ACTUALIZ     DATE         DEFAULT SYSDATE NOT NULL,
        CONSTRAINT PK_LAB_APP_AUTH PRIMARY KEY (ID_USUARIO)
      )
    ]';
  END IF;
END;
/
