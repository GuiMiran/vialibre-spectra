# Invariantes

- INV-001: Toda fila de llegadas tiene un tipo activo, retraso ≥5 y destino compatible con la zona. BR-002, BR-003, BR-004.
- INV-002: Ninguna posición estimada usa un intervalo negativo o superior a 60 s. BR-007.
- INV-003: Para datos temporales válidos, si la fuente falla o su edad supera 180 s, la cabecera no declara estado en vivo. BR-005.
- INV-004: Si existe llegada estimada, la diferencia horaria circular respecto de la programada equivale al retraso no negativo módulo 1440. BR-006.
- INV-005: Cambiar solo la zona conserva el conjunto de marcadores y los totales. BR-003, BR-009.
