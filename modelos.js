// Modelos predefinidos para rellenar el formulario de un clic.
// Precios y consumos orientativos de España (octubre 2026). Las ayudas son estimaciones:
// compruébalas en el concesionario, cambian con cada plan y campaña.
// Los consumos son algo superiores a los WLTP oficiales para reflejar un uso real.
//
// `valores.precio` es el precio de nuevo. En los modelos pensados para segunda mano,
// precio de nuevo y depreciación están ajustados para que el precio estimado de usado
// se parezca a los anuncios. `usado` es el año y los km típicos al elegirlo de segunda mano.

window.MODELOS = {
  electrico: [
    {
      id: "byd-dolphin",
      nombre: "BYD Dolphin 60 kWh",
      valores: {
        precio: 36690, ayudas: 4500,
        consumoKwh100: 16.5,
        mantenimiento: 300, seguro: 600, impuesto: 25, depreciacion: 15,
      },
      usado: { anioMatriculacion: 2023, kmActuales: 45000 },
    },
    {
      // Usados de 2023 por 16.000–18.000 €.
      id: "mg4-51",
      nombre: "MG4 51 kWh",
      valores: {
        precio: 30000, ayudas: 0,
        consumoKwh100: 17,
        mantenimiento: 300, seguro: 500, impuesto: 25, depreciacion: 20,
      },
      usado: { anioMatriculacion: 2023, kmActuales: 45000 },
    },
    {
      // Usados de 2020 por 16.000–20.000 €; 64 kWh, más autonomía y maletero familiar.
      id: "kia-e-niro-64",
      nombre: "Kia e-Niro 64 kWh",
      valores: {
        precio: 38000, ayudas: 0,
        consumoKwh100: 16.5,
        mantenimiento: 300, seguro: 550, impuesto: 25, depreciacion: 17,
      },
      usado: { anioMatriculacion: 2020, kmActuales: 80000 },
    },
  ],
  hibrido: [
    {
      id: "byd-atto2-dmi",
      nombre: "BYD Atto 2 DM-i Boost",
      valores: {
        precio: 27740, ayudas: 3000,
        consumoKwh100: 18, consumoL100: 5.2, porcentajeElectrico: 65,
        mantenimiento: 450, seguro: 600, impuesto: 25, depreciacion: 15,
      },
      usado: { anioMatriculacion: 2025, kmActuales: 20000 },
    },
    {
      // Usados de 2021 por ~15.000 €; unos 45 km reales en eléctrico.
      id: "kia-niro-phev",
      nombre: "Kia Niro PHEV 1.6 GDi",
      valores: {
        precio: 33000, ayudas: 0,
        consumoKwh100: 17, consumoL100: 5.3, porcentajeElectrico: 65,
        mantenimiento: 450, seguro: 500, impuesto: 30, depreciacion: 17,
      },
      usado: { anioMatriculacion: 2021, kmActuales: 80000 },
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
      usado: { anioMatriculacion: 2021, kmActuales: 70000 },
    },
    {
      // Familiar; etiqueta C (gasolina desde 2006). Usados de 2020 por ~15.000–16.000 €.
      // Impuesto: circulación + impuesto catalán de CO₂ (~115–130 g/km, pocos euros).
      id: "skoda-octavia-combi",
      nombre: "Skoda Octavia Combi 1.5 TSI 150 CV",
      valores: {
        precio: 29000, ayudas: 0,
        consumoL100: 6.5,
        mantenimiento: 600, seguro: 500, impuesto: 110, depreciacion: 13,
      },
      usado: { anioMatriculacion: 2020, kmActuales: 90000 },
    },
  ],
};
