# Vía libre · SPECTRA

Especificaciones funcionales para reconstruir un visualizador ferroviario y evaluar su comportamiento mediante SPECTRA. El objetivo es comprobar cuánto puede reconstruir un agente a partir de reglas, contratos y criterios explícitos.

Referencia funcional, Vía libre de Álvaro Hernández (@alvarohdezdp). Autor de estas especificaciones, Guido Miranda.

[Aplicación de referencia](https://vialibre.soft-flow.app/mapa/) · [Framework SPECTRA](https://github.com/GuiMiran/spectra)

## Origen y motivación de Vía libre

El 30 de octubre de 2026, El Español y La Razón recogieron el relato del autor sobre una primera versión creada en 3–4 horas con datos públicos de posiciones de Renfe. Las noticias le atribuyen una crítica a la falta de innovación y una propuesta para combinar datos con sistemas de seguridad y alertas, incluyendo agentes de IA. También recogen su aclaración de que la aplicación particular no estaba destinada a controlar la circulación ferroviaria.

Fuentes periodísticas consultadas el 5 de noviembre de 2026. [El Español](https://www.elespanol.com/omicrono/20261030/alvaro-creador-app-monitoriza-trenes-renfe-tiempo-real-van-retraso-locos/1003744440979_0.html) · [La Razón](https://www.larazon.es/sociedad/joven-denuncia-falta-voluntad-politica-mejorar-seguridad-montar-sola-manana-app-monitorizar-trenes-renfe-119-trenes-93-retraso-b50m_202610306ae49107004b78127aba189a.html?outputType=amp)

La web expresa directamente la intención de mostrar lo que puede hacerse en una tarde con datos públicos. El material revisado deja sin confirmar la edad del autor, la herramienta de programación usada y el uso de vibe coding en el desarrollo. La propuesta de añadir agentes de IA es distinta de la evidencia sobre cómo se programó el prototipo. El acceso directo al hilo de X no pudo verificarse en esta revisión.

[Fuente primaria, pie de la aplicación](https://vialibre.soft-flow.app/mapa/)

## Para qué sirve esta reconstrucción

Especifica mapa, posiciones disponibles, rutas, llegadas y retrasos, con filtros por producto y zona de destino. Incluye ficha del servicio, frescura de los datos, preferencias y tratamiento de fallos. El frontend examinado utiliza HTML, CSS, JavaScript vanilla y SVG. Consume `/api/base`, `/api/red` y `/api/estado`, y consulta el estado cada 20 segundos mientras la pestaña está visible. Una posición animada puede estar extrapolada desde una observación anterior.

La cobertura de incidencias descrita por la prensa puede corresponder a otra versión. En el frontend aportado, la función de pintado de incidencias está vacía. Los contratos de las specs reflejan el subconjunto consumido por esa versión.

## Capas, skills y agentes

| Capa | Papel en el proyecto |
|---|---|
| 00–07 | Definen propósito, vocabulario, historias, reglas, invariantes, contratos, políticas y eventos |
| 08 · Agentes | Define las responsabilidades del reconstructor y el evaluador del ensayo |
| 09 · Skills | Define interpretar instantáneas, evaluar llegadas, representar trenes y evaluar la reconstrucción |
| 10 · Flujos | Relaciona tareas, agentes, capacidades y tratamiento de errores |
| 11 · Aceptación | Define once criterios observables |
| 12 · Trazabilidad | Registra vínculos, evidencia y brechas |

Las specs permiten derivar qué capacidades hacen falta y qué responsabilidad puede asumir cada agente. Convertir esas definiciones en herramientas ejecutables y seleccionar modelos concretos requiere una implementación y un entorno de ejecución. Los agentes actuales pertenecen al ensayo.

Como evolución propuesta, la ayuda a operadores podría comenzar por detectar datos antiguos o contradictorios y presentar avisos trazables para revisión humana. Cada caso requiere definir entradas, umbrales, destinatario, acción esperada y pruebas. La ayuda frente a errores humanos requiere un análisis específico de tareas y riesgos. La atribución de causas en accidentes requiere fuentes oficiales.

## Qué habría podido aportar ante accidentes del último año

Periodo considerado del 5 de noviembre de 2025 al 5 de noviembre de 2026 en España. Se seleccionan dos casos ilustrativos documentados.

| Caso | Utilidad potencial | Condiciones y límites |
|---|---|---|
| Adamuz, 18 de enero de 2026 | Ayudar a consultar servicios Renfe representados, retrasos y antigüedad de su última posición | El BOE documenta un Alvia y un Iryo implicados. Iryo aparece como sin datos en la versión analizada. Faltan instantáneas históricas para demostrar qué habría mostrado el visualizador |
| Gelida, 20 de enero de 2026 | Una ampliación con datos de Rodalies y avisos oficiales podría ayudar a comunicar interrupciones | El BOE describe un tren R4 que chocó contra un muro caído durante un temporal. La cobertura de Rodalies está sin verificar. Las posiciones del tren no observan el estado del muro |

Fuente oficial sobre fechas, servicios y descripción de los sucesos, consultada el 5 de noviembre de 2026. [BOE, Real Decreto-ley 1/2026, exposición de motivos I](https://www.boe.es/buscar/doc.php?id=BOE-A-2026-2023)

La utilidad informativa depende de cobertura, continuidad y calidad del feed. Un tren parado o un dato antiguo por sí solos no identifican un accidente. La reconstrucción retrospectiva requiere un archivo histórico. La prevención o detección automática de accidentes necesita requisitos y evidencias adicionales. El material disponible no permite afirmar que esta aplicación habría evitado esos siniestros.

## Cómo utilizar las specs

1. Leer [SPEC-INDEX.md](SPEC-INDEX.md) y las capas 00 a 11 de [.spectra](.spectra).
2. Preparar respuestas sintéticas de los tres endpoints y un reloj controlado.
3. Dar las specs a un agente reconstructor en un contexto nuevo.
4. Evaluar el candidato con pruebas independientes y casos reservados fuera del contexto del reconstructor.
5. Registrar resultados y brechas en la [matriz de trazabilidad](.spectra/12-trace.md).

Con SPECTRA instalado, ejecutar desde la raíz del repositorio.

```bash
spectra validate
```

Las 13 capas pasaron la comprobación estructural de presencia, unicidad de identificadores y referencias cruzadas. Los once criterios siguen pendientes de ejecución contra una implementación candidata. La conformidad funcional requiere evidencia de ejecución.

## Procedencia y brechas

Las specs proceden de la inspección estática del frontend entregado. La fuente exacta del servidor, licencia de datos, proyección de coordenadas, cálculo del retraso de origen y contrato completo siguen como brechas. Las mejoras propuestas para el reintento están identificadas en las capas.

Vía libre se presenta como proyecto particular independiente de Renfe y Adif. Este repositorio publica las especificaciones del caso de estudio. La publicación no atribuye derechos sobre el código o los datos del proyecto de referencia.
