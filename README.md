# Eléctrico vs Gasolina

Webapp que compara el coste total de propiedad de coches eléctricos, híbridos enchufables y de gasolina, nuevos o de segunda mano.

**Pruébala:** https://jboronat3.github.io/electric_cars/ (cuando GitHub Pages esté activado)

## Qué calcula

- **Coste total a N años**: compra − ayudas + cargador + energía + mantenimiento + seguro + impuesto − valor de reventa.
- **Gráfica año a año** del gasto acumulado de cada coche.
- **Punto de amortización** de cada coche frente al de referencia: en qué año y con cuántos km pasan a ser más baratos.
- **¿Cuándo compensa?**: sobrecoste inicial ÷ ahorro anual, y el cálculo inverso: cuántos km al año necesitas para amortizar un coche frente a otro en los años que elijas.

Puedes comparar de 2 a 6 coches: con *+ Añadir coche* eliges tipo, estado (nuevo o segunda mano) y modelo. En los usados indicas el año de matriculación y los km, y la app propone un precio estimado que puedes cambiar por el del anuncio. Todo se compara frente al coche de referencia que elijas.

Los resultados se recalculan al momento, y los datos se guardan en el navegador (botón *Restablecer valores* para volver a los de fábrica).

## Modelos incluidos

| Tipo               | Modelo                       |
|--------------------|------------------------------|
| Eléctrico          | BYD Dolphin 60 kWh           |
| Híbrido enchufable | BYD Atto 2 DM-i Boost        |
| Gasolina           | Skoda Octavia 1.5 TSI 150 CV |

Precios y consumos orientativos de España (octubre 2026); las ayudas son estimaciones. Los modelos sirven de plantilla para coches nuevos y usados; para añadir más, edita `modelos.js`.

## Cómo usarla

Abre `index.html` en el navegador. No necesita instalar nada.

## Estructura

| Archivo      | Contenido                                              |
|--------------|--------------------------------------------------------|
| `index.html` | Estructura de la página                                |
| `styles.css` | Estilos (modo claro y oscuro)                          |
| `calc.js`    | Lógica de cálculo, sin dependencias del navegador      |
| `modelos.js` | Modelos predefinidos de cada tipo de coche             |
| `app.js`     | Lista de coches, formulario, guardado, tarjetas, gráfica SVG y desglose |

## Supuestos del modelo

- Los precios de la luz y la gasolina son comunes a todos los coches y suben un % fijo cada año.
- El híbrido enchufable hace un % de sus km en eléctrico y el resto en modo híbrido con gasolina.
- El mantenimiento sube con los km del coche: +3 % por cada 10.000 km, como mucho el doble.
- La depreciación anual baja con la edad del coche (un 10 % menos de la tasa por año, hasta el 40 % de la de un coche nuevo). El valor de reventa sale del precio de compra.
- El precio estimado de un usado es el de nuevo menos lo que se ha depreciado desde su año de matriculación.
- El gasto acumulado de la gráfica no descuenta la reventa; el coste total sí.

## Publicación

Se publica en GitHub Pages con el workflow `.github/workflows/pages.yml` en cada push a `main` (Settings → Pages → Source: *GitHub Actions*).

## Seguridad

Ver [SECURITY.md](SECURITY.md). La web no tiene servidor ni envía datos a ningún sitio; una Content Security Policy bloquea cualquier script o conexión de terceros, y el workflow de publicación usa acciones fijadas por SHA con permisos mínimos.
