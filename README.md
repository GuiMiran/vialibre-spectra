# Vía libre · Renfe y SPECTRA

[Aplicación publicada](https://vialibre-spectra-demo.glossyberyl2.chatgpt.site) · [Contexto y motivación](docs/project-context.md)


La vista principal consulta posiciones GPS y actualizaciones de retrasos de los
feeds oficiales de Renfe. El modo de demostración permanece en `/?mode=demo`.
La aplicación conserva la atribución al frontend de Álvaro Hernández y la
adaptación de Guido Miranda.

## Ejecución

Requiere Node.js compatible con el campo engines y las dependencias del proyecto.

```bash
npm install
npm run dev
npm run check
npm test
npm run build
```

El alojamiento usa un servidor Vinext/Cloudflare con tres operaciones.

- `/api/base` devuelve contornos geográficos y estaciones principales.
- `/api/red` devuelve conexiones rectas entre estaciones del horario GTFS.
- `/api/estado` consulta los feeds oficiales, relaciona el identificador del
  viaje con los horarios y devuelve posiciones y retrasos publicados.

Los feeds se consultan desde el servidor con timeout, caché de 15 segundos y
reutilización de peticiones concurrentes. El navegador consulta cada 20 segundos
cuando está visible. Un fallo en las posiciones conserva la última vista. Un
fallo en la fuente de retrasos produce valores desconocidos y un aviso.

## Interpretación de los datos

La hora del GPS y la de los retrasos se muestran por separado. Una fuente antigua
se identifica como tal. El azul identifica un retraso desconocido. Las posiciones
son las coordenadas publicadas, con velocidades de extrapolación a cero. La
velocidad se muestra únicamente cuando está publicada. La estimación de llegada
al destino aplica el retraso del viaje al horario previsto cuando ambos existen.

La red dibujada conecta estaciones y sirve de orientación. El trazado físico de
las vías requiere otra fuente. La cobertura es la de los feeds AV/LD/MD, con un
grupo explícito para posiciones cuyo producto no pueda clasificarse. El visor
conserva las posiciones disponibles aunque falte el horario de un viaje.

Los horarios y las provincias de estaciones son una instantánea descargada el
5 de noviembre de 2026. El mapa base procede de Natural Earth 1:110m. La revisión
de horarios necesita renovar la instantánea y publicar una versión nueva.
Una ausencia de datos por sí sola no permite confirmar una cancelación.

## Fuentes y atribución

Origen de los datos: Renfe Operadora. Los conjuntos consultados están publicados
bajo CC BY 4.0. Los feeds y tablas se transforman al contrato del visor.

[Posiciones oficiales](https://data.renfe.com/es/dataset/posicion-vehiculos-av-ld-md)

[Actualizaciones de horarios y retrasos](https://data.renfe.com/es/dataset/horarios-viaje-alta-velocidad-larga-media-distancia)

[Horarios GTFS](https://data.renfe.com/es/dataset/horarios-de-alta-velocidad-larga-distancia-y-media-distancia)

[Estaciones y provincias](https://data.renfe.com/es/dataset/estaciones-listado-completo/resource/783e0626-6fa8-4ac7-a880-fa53144654ff)

[Cartografía Natural Earth](https://github.com/nvkelso/natural-earth-vector)

[Frontend de referencia](https://vialibre.soft-flow.app/mapa/)

[Especificaciones SPECTRA](https://github.com/GuiMiran/vialibre-spectra)

## Verificación

Las pruebas cubren normalización real, unidades, adelantos, retraso ausente,
metadatos ausentes, posiciones inválidas, cancelaciones explícitas, caché,
concurrencia, fallos de upstream y las reglas verificadas de la demo. La revisión
visual y los resultados están registrados en `.spectra/12-trace.md`.

La coherencia entre la parada publicada y el itinerario GTFS también se comprueba. Si discrepan, la ficha marca el itinerario sin confirmar y conserva la posición GPS publicada.

## Recuperación de la primera versión

Código recuperado del commit de origen `e52c2c001e8c9ff8ae6c8b34249e94f921aa5147`. Las trece pruebas automatizadas y la comprobación de sintaxis pasaron de nuevo al recuperar esta versión. La vista por regiones y Rodalies de Catalunya está pendiente.
