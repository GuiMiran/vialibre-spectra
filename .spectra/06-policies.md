# Políticas de decisión

- POL-001: Si el retraso es ≥15, usar nivel grave. Si es ≥5 y <15, usar leve. En otro caso, usar normal. BR-002.
- POL-002: Si el tipo está activo y el retraso es ≥5, incluir en la lista si la zona es toda España o la provincia del destino coincide tras normalizar mayúsculas y diacríticos. Las zonas contempladas son Madrid, Cataluña, C. Valenciana, Andalucía, Galicia y Norte. BR-003.
- POL-003: Si falla el transporte o HTTP, mostrar aviso de conexión. Si la consulta responde pero la fuente está caída o antigua, mostrar los últimos datos como antiguos. Si la fuente responde con marca válida y edad ≤180 s, mostrar en vivo. BR-005.
- POL-004: Si la preferencia de movimiento reducido está activa, usar la posición observada. En otro caso, aplicar el límite temporal de extrapolación. BR-007.
- POL-005: Si llega una versión de red distinta de la última detectada, solicitar su geometría. Si es igual, reutilizar la existente en el recorrido nominal. BR-001.
