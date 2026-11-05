# SPECTRA-TRACE

Iteración inicial. La revisión del ZIP es evidencia de origen. Los criterios están definidos y pendientes de ejecución contra una reconstrucción.

| Requisito | Evidencia de referencia | Criterios | Estado |
|---|---|---|---|
| BR-001 | app.js · cargarBase, cargarRed, actualizar | AC-001 | Pendiente |
| BR-002 a BR-004 | app.js · nivel, visibles, enZona, pintarLista | AC-003, AC-004, AC-010 | Pendiente |
| BR-005 | app.js · actualizar, pintarCabecera, arranque | AC-002, AC-006, AC-009 | Pendiente |
| BR-006 y BR-010 | app.js · pintarFicha, seleccionar, addMin, eventos SVG | AC-005 | Pendiente |
| BR-007 | app.js · objetivo | AC-007 | Pendiente |
| BR-008 | app.js · guardado y portada | AC-003, AC-008 | Pendiente |
| BR-009 | app.js · pintarLista | AC-010 | Pendiente |
| WF-003 | Protocolo del ensayo | AC-011 | Pendiente |

**Traza inversa de referencia:** cartografía → BR-001, temporización y frescura → BR-005, ficha → BR-006, interpolación visual → BR-007, preferencias → BR-008, lista → BR-003 y BR-009. La reconstrucción todavía carece de código etiquetado y de resultados de pruebas.

**Brechas:** fuente real y contrato completo del servidor; mensaje de reintento inconsistente con el intervalo; reintento de geometría tras fallo para la misma versión; comportamiento ante respuestas concurrentes o fuera de orden y marcas malformadas; verificación de detalles cartográficos, gestos y accesibilidad con un candidato. No se muestra un panel operativo de incidencias Adif en el código examinado.

## Evidencia de la adaptación funcional · 5 de noviembre de 2026

El frontend de referencia fue reutilizado. Esta iteración es una adaptación
funcional y carece de independencia para el ensayo ciego de WF-003.

Se ejecutaron seis pruebas automatizadas mediante `npm test` con resultado
satisfactorio. Cubren reglas de AC-004, AC-005, AC-007 y AC-010 parcialmente,
consistencia del generador y respuestas de los tres endpoints del servidor.
Los tests de reglas por sí solos no prueban los criterios completos de interfaz.

La revisión manual de escritorio comprobó 65 marcadores, filtro de Cataluña
sin alterar su número, selección y cierre de ficha, controles de zoom,
identificación de datos antiguos, conservación de posiciones tras una caída
simulada y recuperación del estado. Quedan pendientes el conjunto completo
de casos de conformidad, gestos táctiles y revisión visual en móvil.

## Integración real · 5 de noviembre de 2026

Se incorporaron los feeds oficiales de posiciones y actualizaciones de viajes,
con horarios GTFS y provincias del catálogo de estaciones de Renfe. Las fuentes
están atribuidas como CC BY 4.0. Las conexiones entre estaciones son orientativas.
La normalización fue comprobada con una muestra descargada de ambos feeds.

Doce pruebas automatizadas pasaron, incluyendo tratamiento de retraso desconocido,
marcas temporales originales, metadatos ausentes, unidades, caché y errores de
upstream. La compilación del servidor también pasó. La vista previa responde a
la cartografía, pero su acceso saliente al feed devuelve un error interno del
entorno. La comprobación del acceso de producción se registra tras desplegar.

La versión publicada se verificó con datos reales en el navegador. Una consulta
mostró 77 posiciones y la posterior 78. Funcionaron el filtro de Cataluña y
la ficha con velocidad desconocida. El GPS se identificó como antiguo por su
marca temporal. Se añadió una comprobación de coherencia entre parada e
itinerario GTFS y la prueba correspondiente. Trece pruebas pasan.
