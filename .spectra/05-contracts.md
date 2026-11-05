# Contratos de operaciones

### OP-001: Obtener cartografía — `GET /api/base`

PRE · Arranque. POST · JSON con `land` (cadenas de trayectoria SVG `esp,fra,and,mar,prt`), `corr` (polilíneas de pares x,y), `principales` (ciudades con `x,y` y etiqueta `n`). Todas las coordenadas del mapa usan el mismo plano. ERROR · La interfaz continúa con la consulta de estado. BR-001.

### OP-002: Obtener red — `GET /api/red`

PRE · Se detectó una nueva versión en el estado. POST · JSON con segmentos numéricos `[x1,y1,x2,y2]` que reemplazan la geometría anterior al recibir una respuesta válida. ERROR · Un error HTTP conserva la red anterior. El reintento para una misma versión está pendiente de decisión. BR-001.

### OP-003: Obtener estado — `GET /api/estado`

PRE · Arranque, vuelta a la pestaña o turno visible de actualización. POST · JSON con `trenes` (array), `est` (diccionario por código), `fuentes.renfe` (indicador `ok` y marca `hora`), `red` (versión), `flotaHora` (marca mostrada), `generado` (marca de referencia del reloj, si está presente) y `sinPosicion` (contador cuando se informa). Cada tren de prueba incluye `n,p,x,y,ret`. Según el caso incluye `ts` en epoch ms y `vx,vy` en unidades del plano por segundo, `ori,des,ant,sig` como códigos de estación, `lleg,hs` en HH:mm, `kmh` y `acc`. Estaciones con `n,prov` y coordenadas para las etiquetas. Fijar números de tren y códigos de estación como cadenas en los fixtures para conservar ceros. ERROR · Ante fallo HTTP o de transporte se muestra aviso sin sustituir los datos previos. Los campos opcionales solo alimentan la parte de la vista que los consume. BR-005, BR-006, BR-007.

### OP-004: Consultar llegadas

PRE · Instantánea, tipos activos y zona. POST · Lista filtrada, ordenada, paginada visualmente y totales globales por tipos. ERROR · Lista vacía con mensaje de espera si no hay trenes o de ausencia de retrasos coincidentes si existen trenes. BR-002, BR-003, BR-004, BR-009.
