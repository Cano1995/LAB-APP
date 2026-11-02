# Prompt: calendario de sprints en HTML

Para pegar en Claude Code, abierto en la carpeta del otro proyecto. Si el proyecto no tiene
roadmap, backlog ni inventario, pasa antes los documentos o la lista de módulos a planificar.

Tiene dos usos: generar un informe nuevo, o reutilizar el que ya existe en este repo
(`docs/planificacion/calendario-sprints.html`) como modelo de diseño.

---

## Prompt

```
Quiero un informe en un solo archivo HTML con el calendario de sprints de este proyecto,
para mostrarlo en una reunión (pantalla grande y también legible en el celular).

Fuentes: lee el ROADMAP, el backlog y la documentación del repo (README, CLAUDE.md, docs/).
No inventes alcance: todo trabajo y tamaño sale de esos documentos. Si algo no está
documentado, ponlo igual pero avísame al final qué redacté yo.

Contenido:
1. Encabezado con el nombre del proyecto y una etiqueta "Proyección del MVP · sin fechas".
2. Línea de tiempo por semanas (Semana 1, 2, 3...), una barra por sprint. Sin fechas
   ni meses: todavía no empezamos. Duración por sprint: <2 semanas>.
3. Una tarjeta por sprint con:
   - número, semanas que ocupa, nombre y módulos/formularios que cubre
   - objetivo en una frase
   - lista de trabajos concretos a realizar
   - recuadro destacado "Entregable esperado": qué se podrá ver o usar al cierre
4. Sección "Cómo se da por terminado cada sprint" con los pasos de la convención del repo.
5. Una nota al pie con los supuestos de la proyección.

Diseño: un solo .html autocontenido, texto en español, tema claro y oscuro, sin librerías
salvo fuentes de Google Fonts. Los datos de los sprints van en un arreglo JS al inicio del
script, para poder editarlos sin tocar el resto. Que no desborde horizontalmente en celular
(la línea de tiempo puede tener scroll propio).

Entrega: guarda el archivo en docs/planificacion/calendario-sprints.html. Antes de cerrar,
revisa que el script no tenga errores de sintaxis y dime qué partes del contenido son
supuestos tuyos.

Modelo de referencia (opcional): <ruta a calendario-sprints.html de lab-app>.
Mantén su estructura y estilo, y cambia solo el contenido.
```

---

## Ajustes frecuentes

- **Con fechas:** "Usa fechas reales: el Sprint 1 empieza el <fecha>, sprints de 2 semanas de lunes a viernes."
- **Recorte de MVP:** "Marca en la línea de tiempo hasta qué sprint llega el MVP y atenúa los siguientes."
- **Estado de avance:** "Marca cada trabajo como hecho o pendiente según el ROADMAP y agrega una barra de avance por sprint."
- **Otro idioma o más corto:** "Máximo 4 trabajos por sprint" o "en inglés".
