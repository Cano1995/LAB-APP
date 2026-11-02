-- Configuración de marca de la instalación (Administración → Configuración). Idempotente.
--   LAB_APP_CONFIG: textos (nombre de la app, empresa, lema, descripción, país) como clave/valor.
--   LAB_APP_ASSET : imágenes (logo claro/oscuro, emblema, favicon) como BLOB.
-- Sin filas la app funciona con los valores por defecto (nombre «Lab App» y logos genéricos).
DECLARE
  n NUMBER;
BEGIN
  SELECT COUNT(*) INTO n FROM user_tables WHERE table_name = 'LAB_APP_CONFIG';
  IF n = 0 THEN
    EXECUTE IMMEDIATE q'[
      CREATE TABLE LAB_APP_CONFIG (
        CLAVE       VARCHAR2(60)   NOT NULL,
        VALOR       VARCHAR2(500),
        ACTUALIZ    DATE           DEFAULT SYSDATE NOT NULL,
        ID_USUARIO  NUMBER(5),
        CONSTRAINT PK_LAB_APP_CONFIG PRIMARY KEY (CLAVE)
      )
    ]';
  END IF;

  SELECT COUNT(*) INTO n FROM user_tables WHERE table_name = 'LAB_APP_ASSET';
  IF n = 0 THEN
    EXECUTE IMMEDIATE q'[
      CREATE TABLE LAB_APP_ASSET (
        CLAVE       VARCHAR2(40)   NOT NULL,
        MIME        VARCHAR2(60)   NOT NULL,
        NOMBRE      VARCHAR2(120),
        DATOS       BLOB           NOT NULL,
        TAMANO      NUMBER(10)     NOT NULL,
        ACTUALIZ    DATE           DEFAULT SYSDATE NOT NULL,
        ID_USUARIO  NUMBER(5),
        CONSTRAINT PK_LAB_APP_ASSET PRIMARY KEY (CLAVE)
      )
    ]';
  END IF;
END;
/
