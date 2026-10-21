# Eléctrico vs Gasolina

Webapp que compara el coste total de propiedad de un coche eléctrico, un híbrido enchufable y uno de gasolina, todos nuevos.

**Pruébala:** https://jboronat3.github.io/electric_cars/ (cuando GitHub Pages esté activado)

## Qué calcula

- **Coste total a N años**: compra − ayudas + cargador + energía + mantenimiento + seguro + impuesto − valor de reventa.
- **Gráfica año a año** del gasto acumulado de cada coche.
- **Punto de amortización** del eléctrico y del híbrido frente al de gasolina: en qué año y con cuántos km pasan a ser más baratos.
- **¿Cuándo compensa?**: sobrecoste inicial ÷ ahorro anual, y el cálculo inverso: cuántos km al año necesitas para amortizar el eléctrico (o el híbrido) en los años que elijas.

Los resultados se recalculan al momento, y los datos se guardan en el navegador (botón *Restablecer valores* para volver a los de fábrica).

## Modelos incluidos

| Tipo               | Modelo                       |
|--------------------|------------------------------|
| Eléctrico          | BYD Dolphin 60 kWh           |
| Híbrido enchufable | BYD Atto 2 DM-i Boost        |
| Gasolina           | Skoda Octavia 1.5 TSI 150 CV |

Precios y consumos orientativos de España (octubre 2026); las ayudas son estimaciones. Para añadir modelos, edita `modelos.js`.

## Cómo usarla

Abre `index.html` en el navegador. No necesita instalar nada.

## Estructura

| Archivo      | Contenido                                              |
|--------------|--------------------------------------------------------|
| `index.html` | Estructura de la página                                |
| `styles.css` | Estilos (modo claro y oscuro)                          |
| `calc.js`    | Lógica de cálculo, sin dependencias del navegador      |
| `modelos.js` | Modelos predefinidos de cada tipo de coche             |
| `app.js`     | Formulario, guardado, tarjetas, gráfica SVG y desglose |

## Supuestos del modelo

- Los precios de la luz y la gasolina son comunes a los tres coches y suben un % fijo cada año.
- El híbrido enchufable hace un % de sus km en eléctrico y el resto en modo híbrido con gasolina.
- El valor de reventa se calcula con una depreciación anual constante sobre el precio de compra.
- El gasto acumulado de la gráfica no descuenta la reventa; el coste total sí.

## Publicación

Se publica en GitHub Pages con el workflow `.github/workflows/pages.yml` en cada push a `main` (Settings → Pages → Source: *GitHub Actions*).

## Seguridad

Ver [SECURITY.md](SECURITY.md). La web no tiene servidor ni envía datos a ningún sitio; una Content Security Policy bloquea cualquier script o conexión de terceros, y el workflow de publicación usa acciones fijadas por SHA con permisos mínimos.
