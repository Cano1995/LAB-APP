# Decisiones y notas — lab-app

Registro de decisiones de diseño y trampas de datos encontradas al reescribir GATEC.

## Pantallas no recreadas (registro)

Las pantallas del **módulo 91 (Expedición/Certificados)** —Clientes, Tipos de Produtos,
Locais de Armazenamento, Certificados, Certificados do Cliente, Validade, Parâmetros,
y las relaciones "ECQ Guarani"— **no se recrean**, porque:

1. Sus **formularios no están en ninguno de los 9 ejecutables** disponibles en `C:\Gatec\Gatec`.
2. Sus **tablas candidatas están vacías** en DESA (que replica producción a diario).
3. La integración "ECQ Guarani" no tiene tablas en ningún esquema GATEC de esta base.

Queda solo como registro. Si aparece el ejecutable que las maneja, o se confirma que el
módulo se usa, se retoman. La única pantalla del módulo 91 implementada es **Tipos de Embalagem**
(`GA_POP_EMBALAGEM`), por tener mapeo de alta confianza.

**Parametros** (`frmParam`) se resolvió en el Sprint 2: es `GA_PARAM_EMPR_SAFRA` (la usan GAtec_Lab y
GAtec_Lat), implementado como recurso `parametros` del módulo 1.

Del **módulo 1** no se recrean como pantalla propia: Intervalo (sin tabla), Tipo Comp. X Equipamento (sin tabla
clara), y los subformularios Associa Operação / Pesquisa Funcionário (cubiertos por otras pantallas).
Detalle en `mapeo-modulo-1.md`.

## Decisiones de diseño

- **Autenticación (2026-10-23):** usuario = el de `GATEC_AGR.GAM_USUARIOS`; contraseña = la de su usuario de
  **Oracle**, validada abriendo una conexión a la base (no se guardan contraseñas). Reemplaza al esquema anterior
  (bcrypt + "definir contraseña en el primer ingreso"), que permitía que cualquiera tomara una cuenta que todavía no
  había definido su clave. Como los perfiles de Oracle bloquean la cuenta tras 3 fallos (por 30 días), la app corta
  tras 2 fallos seguidos durante 15 min. Limitación: fallos hechos fuera de la app (VB6, SQL*Plus) también cuentan en
  Oracle. 11 de los 40 usuarios activos del GATEC no tienen cuenta Oracle y no pueden ingresar.
- **Permisos (corregido 2026-10-23):** se reusan las tablas del GATEC (`GAM_USUARIOS_FORM_ACESSOS`, `GAM_GRUPO_FORM_ACESSOS`)
  con **su** regla: códigos **1 = ACESSO TOTAL, 2 = SEM ACESSO, 3 = ACESSO PARCIAL** (rótulos y SQL de `GAtec_Senha.exe`);
  el permiso directo del usuario manda sobre los de grupo y entre grupos se usa **MIN**. Evidencia: el GPI viejo muestra
  deshabilitados para `bot` los menús con código 2 (Fechamento, Configuração, Tabelas, Utilitários), 10/10 coincidencias;
  y los grupos administradores tienen 1 en Cierre mientras los demás tienen 2.
  *Error anterior:* se había supuesto 1=consulta, 2=edición, 3=total con MAX, de modo que un usuario con **sin acceso (2)**
  recibía permiso de **edición** en el CRUD genérico. Corregido; "parcial" se trata como solo lectura (mínimo privilegio)
  hasta confirmar qué habilita por formulario. El menú superior del GPI se deshabilita por código 2.
- **Contexto empresa/zafra:** equivalente al "Alterar Empresa/Safra" viejo. Se guarda por usuario
  en `LAB_APP_AUTH` (SEL_COD_EMPR, SEL_SAF_ANO_SAFRA) y filtra las tablas scopeadas.
- **CRUD genérico:** las tablas maestras se declaran en `api/src/modules/maestras/recursos.js`;
  la metadata de columnas se lee en vivo de `all_tab_columns` al arrancar. Sumar una tabla ≈ 5 líneas.
  Soporta scope por empresa/zafra (`safraScoped`) o solo empresa (`scope: ["COD_EMPR"]`), booleanos 0/1
  (`bool`) o `'S'`/`'N'` (`sn`), y columnas de solo hora (`hora`). Valida dígitos de `NUMBER(p,s)` y
  traduce errores de integridad (ORA-00001/02291/01400/01438) a mensajes legibles.
- **Números sin `double` de JS** (Sprint 3): `oracledb` leía `NUMBER` 0,8533 como `0.8533000000000001` y, al guardar el
  registro sin cambios, lo habría escrito así. Ahora se leen con `TO_CHAR(col,'TM9')` y se escriben con `TO_NUMBER(:x)`
  desde texto; el pool fija `NLS_NUMERIC_CHARACTERS = '.,'` (la base usa coma decimal). Además, al editar solo se escriben
  las columnas que cambiaron. Verificado ida y vuelta en 21.000+ filas y con escritura real + `DUMP` idéntico.
  *Incidente durante el desarrollo:* un regex mal escapado (`/^(-?)./`) convirtió enteros en 0 en una prueba; afectó
  2 filas de DESA (`GA_DIVI4_2` id 20090100111 y `GA_TIPO_CORTE_2` código 1), restauradas con los valores exactos del
  `DUMP` previo. La API en ejecución no llegó a cargar ese código.
- **GPI en solo consulta** hasta validar el motor de fórmulas: cargar valores sin recalcular dejaría fórmulas, día y
  acumulados inconsistentes para el VB6, que sigue en uso. Ver `gpi-motor-formulas.md`.
- **Seguridad:** la API conecta con el usuario `INV`, que tiene rol **DBA**. Conviene una cuenta con privilegios mínimos
  (SELECT/INSERT/UPDATE/DELETE solo sobre las tablas que usa la app).
- **Fechas y horas sin `Date` de JS:** se leen con `TO_CHAR` y se escriben con `TO_DATE` desde texto.
  Con `Date`, una fecha `AAAA-MM-DD` se guardaba un día antes (medianoche UTC = 21:00 del día anterior
  en hora local), y las horas sobre `1899-12-30` se corrían ~1h16 por el desfase histórico (LMT) de 1899.

## Trampas de datos encontradas

- **Tablas `_2`:** las divisiones y variedade-usina reales son `GA_DIVI1..4_2`, `GA_VARIE_USINA_2`
  (las canónicas sin sufijo no existen o están vacías). Sin PK declarada → se usa clave lógica.
- **Padding CHAR vs VARCHAR2:** en las `_2`, `COD_EMPR` es `CHAR(2)` con ceros a la izquierda (`'01'`),
  pero `SAF_ANO_SAFRA` es `VARCHAR2`. Solo se rellenan con ceros las columnas CHAR (metadata `fixedLen`).
- **Filas duplicadas en tablas sin PK:** `GA_DIVI2_2`/`GA_DIVI3_2`/`GA_DIVI4_2` tienen claves lógicas repetidas
  (filas idénticas, zafra 2006). El CRUD se niega a editar/borrar si la clave matchea más de una fila.
- **Espacios al inicio en códigos** (ej. un `COD_DIVI4`): el CRUD solo quita espacios finales.
- **Charset:** la base es `WE8MSWIN1252`; los acentos salen bien sobre UTF-8 en la API (verificado).
- **Estadísticas desactualizadas:** `num_rows` del catálogo no es confiable; usar `COUNT(*)` en vivo.
- **Datos agrícolas en DESA:** solo hay datos para la **zafra 2009**.
- **DESA se recrea a diario:** lo creado a mano (incluida `LAB_APP_AUTH`) se pierde; por eso el
  bootstrap la recrea/evoluciona al arrancar la API.

## Recuperación del código original (fase 0)

- No hay fuente; los 9 ejecutables son VB6 **código nativo** (no P-Code): se recuperan formularios,
  nombres y SQL incrustado, pero no la lógica de cada rutina (habría que reescribirla).
- Los 5 ejecutables ASPack se inventariaron volcando su memoria en ejecución
  (`docs/inventario/dumps/`, script en el historial). Los 2 UPX con `upx -d`.
- Inventario completo en `docs/inventario/INVENTARIO.md`.
