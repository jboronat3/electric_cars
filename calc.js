// Lógica de cálculo del coste total de propiedad (TCO).
// No depende del navegador: se puede usar desde app.js o desde Node para pruebas.

(function (global) {
  "use strict";

  // Coste de energía por km del eléctrico (€/km), mezclando carga en casa y en electrolinera.
  function costeKmElectrico(e) {
    const precioMedioKwh =
      (e.porcentajeCasa / 100) * e.precioKwhCasa +
      (1 - e.porcentajeCasa / 100) * e.precioKwhPublico;
    return (e.consumoKwh100 / 100) * precioMedioKwh;
  }

  // Coste de combustible por km del coche de gasolina (€/km).
  function costeKmGasolina(g) {
    return (g.consumoL100 / 100) * g.precioLitro;
  }

  // Calcula el desglose y el coste acumulado año a año de un coche.
  //   coche: { precio, ayudas, instalacion, mantenimiento, seguro, impuesto, depreciacion }
  //   costeKm: €/km de energía en el año 1
  //   comun: { kmAnuales, anios, subidaEnergia }
  function calcularCoche(coche, costeKm, comun) {
    const inicial = coche.precio - coche.ayudas + coche.instalacion;
    const fijosAnuales = coche.mantenimiento + coche.seguro + coche.impuesto;
    const acumulado = [inicial];
    let energiaTotal = 0;

    for (let anio = 1; anio <= comun.anios; anio++) {
      const factor = Math.pow(1 + comun.subidaEnergia / 100, anio - 1);
      const energia = costeKm * comun.kmAnuales * factor;
      energiaTotal += energia;
      acumulado.push(acumulado[anio - 1] + energia + fijosAnuales);
    }

    const valorResidual =
      coche.precio * Math.pow(1 - coche.depreciacion / 100, comun.anios);

    return {
      acumulado,
      desglose: {
        compra: coche.precio,
        ayudas: -coche.ayudas,
        instalacion: coche.instalacion,
        energia: energiaTotal,
        mantenimiento: coche.mantenimiento * comun.anios,
        seguro: coche.seguro * comun.anios,
        impuesto: coche.impuesto * comun.anios,
        valorResidual: -valorResidual,
      },
      total: acumulado[comun.anios] - valorResidual,
    };
  }

  // Primer momento (en años, con decimales) en que el gasto acumulado del eléctrico
  // queda por debajo o igual que el de gasolina. null si no ocurre en el periodo.
  function puntoAmortizacion(acumElectrico, acumGasolina) {
    if (acumElectrico[0] <= acumGasolina[0]) return 0;
    for (let i = 1; i < acumElectrico.length; i++) {
      const difAntes = acumElectrico[i - 1] - acumGasolina[i - 1];
      const difAhora = acumElectrico[i] - acumGasolina[i];
      if (difAhora <= 0) {
        // Interpolación lineal dentro del año.
        return i - 1 + difAntes / (difAntes - difAhora);
      }
    }
    return null;
  }

  function comparar(datos) {
    const { electrico, gasolina, comun } = datos;
    const kmE = costeKmElectrico(electrico);
    const kmG = costeKmGasolina(gasolina);
    const resE = calcularCoche(electrico, kmE, comun);
    const resG = calcularCoche({ ...gasolina, instalacion: 0 }, kmG, comun);
    const anios = puntoAmortizacion(resE.acumulado, resG.acumulado);

    return {
      electrico: { ...resE, costeKm: kmE },
      gasolina: { ...resG, costeKm: kmG },
      amortizacion:
        anios === null ? null : { anios, km: anios * comun.kmAnuales },
      ahorro: resG.total - resE.total,
    };
  }

  const api = { comparar, costeKmElectrico, costeKmGasolina, puntoAmortizacion };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else global.Calculadora = api;
})(this);
