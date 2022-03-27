# test-pokeapi-js
Resolucion de challenge Pokemon Finder utilizando framework propio (WebApp), desarrollado integramente en JS.

## Ejecucion ##
No es necesario compilar, simplemente descargar el repositorio y se abrir el archivo **index.html** en un navegador web.

Se utiliza Bootstrap v5.1.3 para el maquetado CSS.

## WebApp ##
Es un framework JS de mi autoria, incluyendo algunos rewrites de librerias open-source y codigo encontrando en internet. Destaca su diseño orientado a eventos y la modularidad de sus componentes.

### WebApp.Parser ###
Libreria basada en Ashe (https://github.com/dfsq/Ashe) como soporte al manejo de templates HTML.

## Pokeapi Client ##
Wrapper JS de http://pokeapi.co que implementa una carga inicial en cache de todos los pokemones disponibles permitiendo busqueda por **prefijo de nombre**
- ToDo: carga progresiva de cache
- ToDo: mejorar manejo de errores
