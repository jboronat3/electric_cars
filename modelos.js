// Modelos predefinidos para rellenar el formulario de un clic.
// Precios y consumos orientativos de España (octubre 2026). Las ayudas son estimaciones:
// compruébalas en el concesionario, cambian con cada plan y campaña.
// Los consumos son algo superiores a los WLTP oficiales para reflejar un uso real.

window.MODELOS = {
  electrico: [
    {
      id: "byd-dolphin",
      nombre: "BYD Dolphin 60 kWh",
      valores: {
        precio: 36690, ayudas: 4500, instalacion: 1200,
        consumoKwh100: 16.5,
        mantenimiento: 300, seguro: 600, impuesto: 25, depreciacion: 15,
      },
    },
  ],
  hibrido: [
    {
      id: "byd-atto2-dmi",
      nombre: "BYD Atto 2 DM-i Boost",
      valores: {
        precio: 27740, ayudas: 3000, instalacion: 800,
        consumoKwh100: 18, consumoL100: 5.2, porcentajeElectrico: 65,
        mantenimiento: 450, seguro: 600, impuesto: 25, depreciacion: 15,
      },
    },
  ],
  gasolina: [
    {
      id: "skoda-octavia",
      nombre: "Skoda Octavia 1.5 TSI 150 CV",
      valores: {
        precio: 32600, ayudas: 0,
        consumoL100: 6.0,
        mantenimiento: 600, seguro: 550, impuesto: 100, depreciacion: 13,
      },
    },
  ],
};
