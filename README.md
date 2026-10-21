# Eléctrico vs Gasolina

Webapp que compara el coste total de propiedad de un coche eléctrico nuevo frente a uno de gasolina nuevo.

## Qué calcula

- **Coste total a N años**: compra − ayudas + cargador + energía + mantenimiento + seguro + impuesto − valor de reventa.
- **Gráfica año a año** del gasto acumulado de cada coche.
- **Punto de amortización**: en qué año y con cuántos km el eléctrico pasa a ser más barato.

Los resultados se recalculan al momento al cambiar cualquier dato.

## Cómo usarla

Abre `index.html` en el navegador. No necesita instalar nada.

## Estructura

| Archivo      | Contenido                                            |
|--------------|------------------------------------------------------|
| `index.html` | Estructura de la página                              |
| `styles.css` | Estilos (modo claro y oscuro)                        |
| `calc.js`    | Lógica de cálculo, sin dependencias del navegador    |
| `app.js`     | Formulario, tarjetas, gráfica SVG y tabla de desglose |

## Supuestos del modelo

- El precio de la energía sube un % fijo cada año (configurable).
- El valor de reventa se calcula con una depreciación anual constante sobre el precio de compra.
- El gasto acumulado de la gráfica no descuenta la reventa; el coste total sí.

Los valores por defecto son orientativos para España; ajústalos a tu caso.
