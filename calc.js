// Lógica de cálculo del coste total de propiedad (TCO).
// No depende del navegador: se puede usar desde app.js o desde Node para pruebas.

(function (global) {
  "use strict";

  // Horizonte para buscar la amortización más allá de los años elegidos.
  const HORIZONTE_MAX = 30;
  // Máximo de km al año al buscar cuántos hacen falta para amortizar.
  const KM_MAX_BUSQUEDA = 200000;

  // Precio medio del kWh mezclando carga en casa y en electrolinera.
  function precioKwhMedio(comun) {
    const casa = comun.porcentajeCasa / 100;
    return casa * comun.precioKwhCasa + (1 - casa) * comun.precioKwhPublico;
  }

  function porcentajeElectrico(coche) {
    if (coche.tipo === "electrico") return 100;
    if (coche.tipo === "gasolina") return 0;
    return coche.porcentajeElectrico ?? 0;
  }

  // Coste de energía por km (€/km): eléctrico, gasolina o híbrido enchufable (mezcla).
  function costeKm(coche, comun) {
    const electrico = porcentajeElectrico(coche) / 100;
    const kmLuz = ((coche.consumoKwh100 ?? 0) / 100) * precioKwhMedio(comun);
    const kmGasolina = ((coche.consumoL100 ?? 0) / 100) * comun.precioLitro;
    return electrico * kmLuz + (1 - electrico) * kmGasolina;
  }

  // El mantenimiento sube con los km del coche: +3 % por cada 10.000 km, como mucho el doble.
  function factorMantenimiento(km) {
    return Math.min(2, 1 + (0.03 * km) / 10000);
  }

  // La depreciación anual baja con la edad: un 10 % menos de la tasa por año,
  // hasta quedarse en el 40 % de la tasa de un coche nuevo.
  function tasaDepreciacion(base, edad) {
    return (base / 100) * Math.max(0.4, 1 - 0.1 * edad);
  }

  // Valor de un coche tras `anios` años, partiendo de `precio` cuando tenía `edad` años.
  function valorTrasAnios(precio, base, edad, anios) {
    let valor = precio;
    for (let a = 0; a < anios; a++) valor *= 1 - tasaDepreciacion(base, edad + a);
    return valor;
  }

  // Edad y km del coche al comprarlo (0 si es nuevo).
  function estadoInicial(coche, comun) {
    if (coche.estado !== "usado") return { edad: 0, km: 0 };
    const anioActual = comun.anioActual ?? new Date().getFullYear();
    return {
      edad: Math.max(0, anioActual - coche.anioMatriculacion),
      km: Math.max(0, coche.kmActuales),
    };
  }

  // Desglose y gasto acumulado año a año de un coche.
  function calcularCoche(coche, comun) {
    const km = costeKm(coche, comun);
    const inicio = estadoInicial(coche, comun);
    const instalacion = coche.instalacion ?? 0;
    const inicial = coche.precio - coche.ayudas + instalacion;
    const acumulado = [inicial];
    let energiaTotal = 0;
    let mantenimientoTotal = 0;

    for (let anio = 1; anio <= comun.anios; anio++) {
      const factor = Math.pow(1 + comun.subidaEnergia / 100, anio - 1);
      const energia = km * comun.kmAnuales * factor;
      const kmMedios = inicio.km + (anio - 0.5) * comun.kmAnuales;
      const mantenimiento = coche.mantenimiento * factorMantenimiento(kmMedios);
      energiaTotal += energia;
      mantenimientoTotal += mantenimiento;
      acumulado.push(acumulado[anio - 1] + energia + mantenimiento + coche.seguro + coche.impuesto);
    }

    const valorResidual = valorTrasAnios(coche.precio, coche.depreciacion, inicio.edad, comun.anios);

    return {
      costeKm: km,
      acumulado,
      desglose: {
        compra: coche.precio,
        ayudas: -coche.ayudas,
        instalacion,
        energia: energiaTotal,
        mantenimiento: mantenimientoTotal,
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

  // ¿Cuándo compensa el coche `idA` frente al coche `idRef`?
  // Devuelve el sobrecoste inicial, el ahorro del primer año, los años para amortizar
  // y los km al año necesarios para amortizarlo en `objetivoAnios`.
  function compensa(datos, idA, idRef, objetivoAnios) {
    const { comun } = datos;
    const a = datos.coches.find((c) => c.id === idA);
    const b = datos.coches.find((c) => c.id === idRef);
    const inicial = (c) => c.precio - c.ayudas + (c.instalacion ?? 0);

    const largo = { ...comun, anios: Math.max(comun.anios, HORIZONTE_MAX) };
    const ra = calcularCoche(a, largo);
    const rb = calcularCoche(b, largo);

    const sobrecoste = inicial(a) - inicial(b);
    const ahorroAnual = (rb.acumulado[1] - rb.acumulado[0]) - (ra.acumulado[1] - ra.acumulado[0]);
    const ahorroEnergia = (costeKm(b, comun) - costeKm(a, comun)) * comun.kmAnuales;

    // Si cuesta menos de comprar pero más de mantener, ¿cuándo deja de compensar?
    let dejaDeCompensar = null;
    if (sobrecoste < 0 && ahorroAnual < 0) dejaDeCompensar = puntoAmortizacion(rb.acumulado, ra.acumulado);

    // km al año mínimos para amortizarlo en `objetivoAnios` (búsqueda binaria).
    const cumple = (km) => {
      const c = { ...comun, kmAnuales: km, anios: objetivoAnios };
      const t = puntoAmortizacion(calcularCoche(a, c).acumulado, calcularCoche(b, c).acumulado);
      return t !== null && t <= objetivoAnios;
    };
    let kmNecesarios;
    if (sobrecoste <= 0 || cumple(0)) kmNecesarios = 0;
    else if (!cumple(KM_MAX_BUSQUEDA)) kmNecesarios = null;
    else {
      let bajo = 0, alto = KM_MAX_BUSQUEDA;
      for (let i = 0; i < 40; i++) {
        const medio = (bajo + alto) / 2;
        if (cumple(medio)) alto = medio; else bajo = medio;
      }
      kmNecesarios = alto;
    }

    return {
      sobrecoste,
      ahorroAnual,
      ahorroEnergia,
      ahorroFijo: ahorroAnual - ahorroEnergia,
      anios: sobrecoste <= 0 ? 0 : puntoAmortizacion(ra.acumulado, rb.acumulado),
      dejaDeCompensar,
      kmNecesarios,
      compensa: sobrecoste <= 0
        ? dejaDeCompensar === null || dejaDeCompensar > comun.anios
        : kmNecesarios !== null && comun.kmAnuales >= kmNecesarios,
    };
  }

  // datos: { comun, coches: [{ id, tipo, estado, ... }], referencia }
  // Las amortizaciones y los ahorros se calculan frente al coche de referencia.
  function comparar(datos) {
    const { comun } = datos;
    const coches = {};
    for (const c of datos.coches) coches[c.id] = calcularCoche(c, comun);
    const referencia = coches[datos.referencia] ? datos.referencia : datos.coches[0].id;

    const amortizacion = {};
    const ahorro = {};
    for (const c of datos.coches) {
      if (c.id === referencia) continue;
      const anios = puntoAmortizacion(coches[c.id].acumulado, coches[referencia].acumulado);
      amortizacion[c.id] = anios === null ? null : { anios, km: anios * comun.kmAnuales };
      ahorro[c.id] = coches[referencia].total - coches[c.id].total;
    }

    const masBarato = Object.keys(coches).reduce((min, id) =>
      coches[id].total < coches[min].total ? id : min);

    return { coches, referencia, amortizacion, ahorro, masBarato };
  }

  const api = {
    comparar, compensa, costeKm, precioKwhMedio, puntoAmortizacion,
    factorMantenimiento, tasaDepreciacion, valorTrasAnios, HORIZONTE_MAX, KM_MAX_BUSQUEDA,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else global.Calculadora = api;
})(this);
