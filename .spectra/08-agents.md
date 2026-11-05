# Agentes

El producto observado es determinista. Los siguientes roles pertenecen al ensayo de reconstrucción.

- AG-001: Agente reconstructor. Recibe estas specs y los contratos sintéticos. Reconstruye la experiencia mediante SK-001, SK-002 y SK-003. Debe respetar INV-001, INV-002, INV-003, INV-004 e INV-005. Registra dudas en la matriz y entrega un candidato.
- AG-002: Agente evaluador independiente. Recibe el candidato y ejecuta SK-004 con datos y reloj controlados. Mantiene los casos reservados fuera del contexto del reconstructor y registra qué criterios pasan, fallan o carecen de evidencia.
