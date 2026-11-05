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
