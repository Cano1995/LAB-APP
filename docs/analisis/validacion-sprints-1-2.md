# Validación — Sprints 1 y 2 (tablas maestras, módulos 15, 91 y 1)

Fecha: 2026-10-22, contra DESA (servidor `oradesa`, 10.213.52.25). Scripts de solo lectura salvo donde se indica.

## Qué se pudo validar y cómo

La comparación pantalla a pantalla con el VB6 **no se puede hacer para estos módulos**: sus formularios no están
en ninguno de los 9 ejecutables disponibles, así que no hay pantalla vieja contra la cual comparar. Se validó
contra la evidencia que el sistema viejo sí deja en la base y en los ejecutables vigentes.

| # | Validación | Resultado |
|---|---|---|
| 1 | **Mapeo form → tabla** por FKs entrantes/salientes, columnas de tablas transaccionales y SQL de los exe vigentes | Confirmado (ver abajo) |
| 2 | **`idForm`** de cada recurso = formulario correcto en `GAM_MODULOS_FORMS` (de eso dependen los permisos) | 45/45 OK |
| 3 | **Triggers** en las tablas (efectos laterales o códigos generados que la app se saltearía) | Ninguno |
| 4 | **Fidelidad ida y vuelta**: cada fila real, leída como la API y reenviada sin cambios, debe quedar idéntica (padding CHAR, fechas con hora, horas, S/N, 0/1, espacios) | OK salvo los hallazgos 1 y 2 |
| 5 | **Unicidad de la clave lógica** en todas las filas reales | ⚠ falla en divisões 2/3/4 (hallazgo 1) |
| 6 | **Escritura real** (alta/edición/baja con datos de prueba, luego borrados) en tablas con hora, fecha en PK, S/N, FK y scope por empresa | OK tras corregir los bugs del Sprint 2 |
| 7 | Grilla completa (límite de 500 filas) en tablas sin scope | OK (la mayor tiene 79) |

### Evidencia del mapeo (módulo 1)

- **Bloque Liberação:** `GA_LIBERACAO` tiene exactamente las columnas de sus catálogos — `ID_CARAC`
  (`GA_CARAC_CANA_2`), `COD_TIP_CORTE` (`GA_TIPO_CORTE_2`), `ID_MOTIVO` (`GA_MOTIV_LIBER`), `COD_SERVI`
  (`GA_CODIG_SERVI`, además con FK), `COD_FRENTE` (`GA_FRENT_TRABA`, FK), `COD_EMPREIT` (`GA_EMPREIT`, FK),
  `COD_FINALID` (`GA_FINALID_COPER`, FK).
- **Equipamentos = `GI_MEQ_MIS`:** 11 tablas referencian su `COD_MIS` por FK (paradas, impureza, fechamento…);
  la usa GAtec_Lab. `GA_EQUIP` en cambio es tránsito.
- **Municípios = `GA_CEP_MUNIC`:** FK desde `GA_FUNDO_AGRIC`, `GA_PROPRIETARIO`, `GA_FRE_PREST_SERVICO`; la usa el cubo.
- **Turno = `GA_TURNO_TRABALHO`:** FK desde `GA_IMPUREZA_TOTAL` / `GA_IMPUREZA_EQUIPE_OPER` (turno de la carga
  analizada); GAtec_Lab la lee con `TO_CHAR(tur_hr_inicio, 'hh24:mi')`, lo que confirma que guarda solo hora.
- **Unidade, Cultura, Moeda, Cargos, Classe equipo, Centro de custo, Safra, Empresa:** referenciadas por FK desde
  varias tablas con la columna esperada.
- **Sin evidencia más allá del nombre:** `GA_TIPO_COMPOSICAO` y `GA_COMP_TRANSBORDO` (sin FKs, sin SQL en los exe,
  vacías). Quedan como confianza media.

## Hallazgos y correcciones

1. **Claves lógicas duplicadas (Sprint 1, divisões).** `GA_DIVI2_2` y `GA_DIVI3_2` tienen 44 claves repetidas
   (zafra 2006) y `GA_DIVI4_2` 139 `ID_DIVI4` repetidos (2006 y uno en 2008); son filas duplicadas idénticas.
   Editar o borrar una habría afectado a todas las copias. **Corregido:** la API rechaza editar/borrar cuando la
   clave coincide con más de una fila (probado: la fila queda intacta).
2. **Espacios al inicio.** Un `COD_DIVI4` empieza con espacio; el `trim()` lo habría alterado al editar.
   **Corregido:** solo se quitan espacios finales.
3. (Ya corregidos en el Sprint 2, impactaban también al Sprint 1) fechas guardadas un día antes, horas corridas
   ~1h16, PK con fecha que no funcionaba, errores ORA crudos.

## Pendiente (requiere una persona)

Para cerrar la validación funcional hace falta alguien que haya usado estas pantallas en el VB6:

- [ ] Confirmar que **Tipo de Composição** y **Transbordo** son las tablas correctas (o que no se usan).
- [ ] Confirmar si **Intervalo** y **Tipo Comp. X Equipamento** se usan (no se encontró tabla).
- [ ] Revisar que los campos visibles en cada grilla/formulario son los que se esperan (los rótulos de las
      columnas `FUN_FLG*`, `PAR_*`, etc. salen del nombre de la columna).
- [ ] Reglas de negocio del VB6 que no quedan en la base (ej. autonumeración de códigos, validaciones cruzadas):
      sin el código fuente no se pueden recuperar; hoy el código se ingresa a mano.

Dato de contexto: casi todas las tablas del módulo 1 están **vacías en DESA**, que replica producción;
es probable que buena parte del módulo no se use en AZPA.
