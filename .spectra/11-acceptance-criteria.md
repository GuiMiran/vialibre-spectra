# Criterios de aceptación

### AC-001: Mapa y red

Traza · US-001, BR-001, OP-001, OP-002, WF-001, EVT-002

- **Dado** Base válida y secuencia r1, r1, r2 en estado.
- **Cuando** se abre la vista y llegan las tres instantáneas.
- **Entonces** se pinta la base, se consulta la red dos veces y la última geometría reemplaza la anterior.

### AC-002: Actualización

Traza · US-003, BR-005, OP-003, POL-003, EVT-001

- **Dado** arranque completado y reloj controlado.
- **Cuando** avanzan 20 s visible, 40 s oculto y se vuelve a mostrar la pestaña.
- **Entonces** se consulta en el turno visible y al volver, con cero consultas durante los turnos ocultos.

### AC-003: Filtros

Traza · US-002, US-004, BR-003, BR-004, BR-008, INV-001, INV-005, OP-004, POL-002, EVT-004, SK-002, WF-002

- **Dado** AVE a Girona +15, AVE a Madrid +8, Alvia a Girona +20 y un producto desconocido +30.
- **Cuando** se deja solo AVE y se elige Cataluña.
- **Entonces** aparece una fila +15, dos marcadores AVE y dos retrasos en el total. Se conservan ambas preferencias tras recargar.

### AC-004: Umbrales y orden

Traza · US-002, BR-002, BR-003, INV-001, POL-001

- **Dado** trenes visibles con retrasos −2, 0, 4, 5, 14 y 15.
- **Cuando** se dibujan marcadores y lista.
- **Entonces** los tres primeros son verdes, 5 y 14 amarillos y 15 naranja. La lista muestra 15, 14 y 5 en ese orden.

### AC-005: Ficha y medianoche

Traza · US-001, BR-006, BR-010, INV-004, EVT-005, SK-003

- **Dado** tren con llegada 23:55, retraso 15 y velocidad 3.
- **Cuando** se activa su fila con Enter.
- **Entonces** el mapa se centra y la ficha muestra 23:55, 00:10 y «Parado». Cerrar oculta la ficha.

### AC-006: Frescura

Traza · US-003, BR-005, INV-003, SK-001

- **Dado** fuente operativa y marca válida.
- **Cuando** la edad del dato cambia de 180 a 181 s y se vuelve a pintar.
- **Entonces** la primera vista muestra en vivo y la segunda identifica los últimos datos como antiguos.

### AC-007: Extrapolación

Traza · US-005, BR-007, INV-002, POL-004

- **Dado** x=400, y=250, vx=2, vy=0.
- **Cuando** se evalúa el objetivo a −1 s, +10 s, +61 s y con movimiento reducido.
- **Entonces** los objetivos x son 400, 420, 520 y 400 respectivamente, con y constante.

### AC-008: Aviso inicial

Traza · US-004, BR-008

- **Dado** una visita con almacenamiento vacío.
- **Cuando** se abre la página, se marca la opción de omitir el aviso y se recarga.
- **Entonces** el aviso aparece en la primera visita y queda oculto en la segunda.

### AC-009: Caída y recuperación

Traza · US-003, BR-005, EVT-003

- **Dado** una instantánea válida seguida de un HTTP 503 y luego una respuesta fresca válida.
- **Cuando** se procesan las tres consultas.
- **Entonces** el 503 conserva las posiciones previas y muestra el aviso. La recuperación actualiza el estado y oculta el aviso.

### AC-010: Tamaño y totales

Traza · US-002, BR-003, BR-009

- **Dado** 13 llegadas retrasadas en una zona.
- **Cuando** se abre en móvil y escritorio y después se expande.
- **Entonces** se ven primero 6 y 12 respectivamente, y 13 al expandir. Con una instantánea separada de retrasos 0 y 10 se muestra 10 como indicador central.

### AC-011: Ensayo independiente

Traza · AG-001, AG-002, SK-004, WF-003

- **Dado** especificación congelada y pruebas del evaluador separadas.
- **Cuando** se entrega un candidato.
- **Entonces** cada resultado registra criterio, datos de entrada, resultado esperado y observado, con estado pendiente si falta ejecución.
