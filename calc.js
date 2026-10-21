// Lógica de cálculo del coste total de propiedad (TCO).
// No depende del navegador: se puede usar desde app.js o desde Node para pruebas.

(function (global) {
  "use strict";

  // Precio medio del kWh mezclando carga en casa y en electrolinera.
  function precioKwhMedio(comun) {
    const casa = comun.porcentajeCasa / 100;
    return casa * comun.precioKwhCasa + (1 - casa) * comun.precioKwhPublico;
  }

  // Coste de energía por km (€/km) de cualquier coche:
  // eléctrico (100 % eléctrico), gasolina (0 %) o híbrido enchufable (mezcla).
  function costeKm(coche, comun) {
    const electrico = (coche.porcentajeElectrico ?? 0) / 100;
    const kmLuz = ((coche.consumoKwh100 ?? 0) / 100) * precioKwhMedio(comun);
    const kmGasolina = ((coche.consumoL100 ?? 0) / 100) * comun.precioLitro;
    return electrico * kmLuz + (1 - electrico) * kmGasolina;
  }

  // Desglose y gasto acumulado año a año de un coche.
  function calcularCoche(coche, comun) {
    const km = costeKm(coche, comun);
    const instalacion = coche.instalacion ?? 0;
    const inicial = coche.precio - coche.ayudas + instalacion;
    const fijosAnuales = coche.mantenimiento + coche.seguro + coche.impuesto;
    const acumulado = [inicial];
    let energiaTotal = 0;

    for (let anio = 1; anio <= comun.anios; anio++) {
      const factor = Math.pow(1 + comun.subidaEnergia / 100, anio - 1);
      const energia = km * comun.kmAnuales * factor;
      energiaTotal += energia;
      acumulado.push(acumulado[anio - 1] + energia + fijosAnuales);
    }

    const valorResidual =
      coche.precio * Math.pow(1 - coche.depreciacion / 100, comun.anios);

    return {
      costeKm: km,
      acumulado,
      desglose: {
        compra: coche.precio,
        ayudas: -coche.ayudas,
        instalacion,
        energia: energiaTotal,
        mantenimiento: coche.mantenimiento * comun.anios,
        seguro: coche.seguro * comun.anios,
        impuesto: coche.impuesto * comun.anios,
        valorResidual: -valorResidual,
      },
      total: acumulado[comun.anios] - valorResidual,
    };
  }

  // Primer momento (en años, con decimales) en que el gasto acumulado de `a`
  // queda por debajo o igual que el de `b`. null si no ocurre en el periodo.
  function puntoAmortizacion(a, b) {
    if (a[0] <= b[0]) return 0;
    for (let i = 1; i < a.length; i++) {
      const difAntes = a[i - 1] - b[i - 1];
      const difAhora = a[i] - b[i];
      if (difAhora <= 0) {
        // Interpolación lineal dentro del año.
        return i - 1 + difAntes / (difAntes - difAhora);
      }
    }
    return null;
  }

  // datos: { comun, electrico, hibrido, gasolina }
  // Las amortizaciones se calculan frente al coche de gasolina.
  function comparar(datos) {
    const { comun } = datos;
    const coches = {
      electrico: calcularCoche({ ...datos.electrico, porcentajeElectrico: 100 }, comun),
      hibrido: calcularCoche(datos.hibrido, comun),
      gasolina: calcularCoche({ ...datos.gasolina, porcentajeElectrico: 0 }, comun),
    };

    const amortizacion = {};
    const ahorro = {};
    for (const clave of ["electrico", "hibrido"]) {
      const anios = puntoAmortizacion(coches[clave].acumulado, coches.gasolina.acumulado);
      amortizacion[clave] = anios === null ? null : { anios, km: anios * comun.kmAnuales };
      ahorro[clave] = coches.gasolina.total - coches[clave].total;
    }

    const masBarato = Object.keys(coches).reduce((min, c) =>
      coches[c].total < coches[min].total ? c : min);

    return { coches, amortizacion, ahorro, masBarato };
  }

  const api = { comparar, costeKm, precioKwhMedio, puntoAmortizacion };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else global.Calculadora = api;
})(this);
