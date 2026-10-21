# Seguridad

## Cómo avisar de un problema

Si encuentras una vulnerabilidad, **no abras un issue público**. Usa la opción
**Report a vulnerability** de la pestaña [Security](https://github.com/jboronat3/electric_cars/security)
del repositorio para enviarla en privado.

## Qué datos maneja la web

- Es una web estática: no tiene servidor, base de datos, cuentas ni cookies.
- No envía datos a ningún sitio. Lo que escribes se guarda solo en tu navegador (`localStorage`)
  y puedes borrarlo con el botón *Restablecer valores*.
- No carga scripts, estilos ni fuentes de terceros, y una Content Security Policy lo impide.
