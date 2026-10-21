// Interfaz: genera el formulario, lee los datos y pinta los resultados.

(function () {
  "use strict";

  // Campos del formulario: [clave, etiqueta, unidad, valor por defecto, paso]
  const CAMPOS = {
    comun: [
      ["kmAnuales", "Kilómetros al año", "km", 15000, 500],
      ["anios", "Años que tendrás el coche", "años", 8, 1],
      ["subidaEnergia", "Subida anual de luz/gasolina", "%", 2, 0.5],
    ],
    electrico: [
      ["precio", "Precio de compra", "€", 35000, 500],
      ["ayudas", "Ayudas y subvenciones", "€", 4500, 100],
      ["instalacion", "Instalación del cargador", "€", 1200, 50],
      ["consumoKwh100", "Consumo", "kWh/100 km", 16, 0.5],
      ["porcentajeCasa", "Carga en casa", "%", 80, 5],
      ["precioKwhCasa", "Precio luz en casa", "€/kWh", 0.15, 0.01],
      ["precioKwhPublico", "Precio electrolinera", "€/kWh", 0.45, 0.01],
      ["mantenimiento", "Mantenimiento anual", "€/año", 300, 25],
      ["seguro", "Seguro anual", "€/año", 600, 25],
      ["impuesto", "Impuesto de circulación", "€/año", 25, 5],
      ["depreciacion", "Depreciación anual", "%", 15, 0.5],
    ],
    gasolina: [
      ["precio", "Precio de compra", "€", 28000, 500],
      ["ayudas", "Ayudas y descuentos", "€", 0, 100],
      ["consumoL100", "Consumo", "L/100 km", 6.5, 0.1],
      ["precioLitro", "Precio gasolina", "€/L", 1.55, 0.01],
      ["mantenimiento", "Mantenimiento anual", "€/año", 600, 25],
      ["seguro", "Seguro anual", "€/año", 550, 25],
      ["impuesto", "Impuesto de circulación", "€/año", 100, 5],
      ["depreciacion", "Depreciación anual", "%", 14, 0.5],
    ],
  };

  const CONCEPTOS = [
    ["compra", "Precio de compra"],
    ["ayudas", "Ayudas"],
    ["instalacion", "Instalación cargador"],
    ["energia", "Energía / combustible"],
    ["mantenimiento", "Mantenimiento"],
    ["seguro", "Seguro"],
    ["impuesto", "Impuesto circulación"],
    ["valorResidual", "Valor de reventa"],
  ];

  // useGrouping "always": en es-ES, por defecto 4 cifras salen sin punto de millar (8704 en vez de 8.704).
  const formatoEuros = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0, useGrouping: "always" });
  const euros = { format: (v) => formatoEuros.format(v + 0 || 0) }; // evita "-0 €"
  const centimos = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 3 });
  const numero = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0, useGrouping: "always" });
  const decimal = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });

  const form = document.getElementById("formulario");

  function crearCampos() {
    for (const [grupo, campos] of Object.entries(CAMPOS)) {
      const panel = document.getElementById("panel-" + grupo);
      for (const [clave, etiqueta, unidad, valor, paso] of campos) {
        const id = grupo + "-" + clave;
        const fila = document.createElement("label");
        fila.className = "campo";
        fila.htmlFor = id;
        fila.innerHTML =
          `<span>${etiqueta}</span>` +
          `<span class="entrada"><input type="number" id="${id}" name="${id}" ` +
          `value="${valor}" step="${paso}" min="0" inputmode="decimal">` +
          `<span class="unidad">${unidad}</span></span>`;
        panel.appendChild(fila);
      }
    }
  }

  function leerDatos() {
    const datos = {};
    for (const [grupo, campos] of Object.entries(CAMPOS)) {
      datos[grupo] = {};
      for (const [clave] of campos) {
        const v = parseFloat(document.getElementById(grupo + "-" + clave).value);
        datos[grupo][clave] = Number.isFinite(v) ? v : 0;
      }
    }
    datos.comun.anios = Math.max(1, Math.round(datos.comun.anios));
    return datos;
  }

  function pintarTarjetas(r, datos) {
    document.getElementById("total-electrico").textContent = euros.format(r.electrico.total);
    document.getElementById("total-gasolina").textContent = euros.format(r.gasolina.total);
    document.getElementById("km-electrico").textContent = centimos.format(r.electrico.costeKm) + " por km en energía";
    document.getElementById("km-gasolina").textContent = centimos.format(r.gasolina.costeKm) + " por km en combustible";

    const ganaElectrico = r.ahorro >= 0;
    document.getElementById("ahorro-etiqueta").textContent =
      `Ahorras con el ${ganaElectrico ? "eléctrico" : "de gasolina"} en ${datos.comun.anios} años`;
    document.getElementById("ahorro").textContent = euros.format(Math.abs(r.ahorro));

    const a = r.amortizacion;
    document.getElementById("amortizacion").textContent =
      a === null
        ? "El eléctrico no se amortiza en este periodo"
        : a.anios === 0
          ? "El eléctrico es más barato desde el primer día"
          : `El eléctrico se amortiza en ${decimal.format(a.anios)} años (${numero.format(a.km)} km)`;
  }

  function pintarDesglose(r) {
    const cuerpo = document.querySelector("#desglose tbody");
    cuerpo.innerHTML = CONCEPTOS.map(([clave, nombre]) =>
      `<tr><td>${nombre}</td><td>${euros.format(r.electrico.desglose[clave])}</td>` +
      `<td>${euros.format(r.gasolina.desglose[clave])}</td></tr>`).join("");
    document.querySelector("#desglose tfoot").innerHTML =
      `<tr><td>Coste total</td><td>${euros.format(r.electrico.total)}</td>` +
      `<td>${euros.format(r.gasolina.total)}</td></tr>`;
  }

  // Gráfica de líneas en SVG, sin librerías.
  function pintarGrafica(r) {
    const e = r.electrico.acumulado;
    const g = r.gasolina.acumulado;
    const ancho = 640, alto = 300;
    const m = { arriba: 16, derecha: 16, abajo: 36, izquierda: 64 };
    const anchoUtil = ancho - m.izquierda - m.derecha;
    const altoUtil = alto - m.arriba - m.abajo;
    const n = e.length - 1;
    const maximo = niceMax(Math.max(...e, ...g));

    const x = (i) => m.izquierda + (i / n) * anchoUtil;
    const y = (v) => m.arriba + altoUtil - (v / maximo) * altoUtil;
    const linea = (serie) => serie.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

    let svg = `<svg viewBox="0 0 ${ancho} ${alto}" role="img" aria-label="Gasto acumulado por año">`;

    for (let k = 0; k <= 4; k++) {
      const v = (maximo / 4) * k;
      svg += `<line class="rejilla" x1="${m.izquierda}" x2="${ancho - m.derecha}" y1="${y(v)}" y2="${y(v)}"/>`;
      svg += `<text class="eje" x="${m.izquierda - 8}" y="${y(v) + 4}" text-anchor="end">${numero.format(v / 1000)}k €</text>`;
    }
    const pasoX = Math.max(1, Math.ceil(n / 10));
    for (let i = 0; i <= n; i += pasoX) {
      svg += `<text class="eje" x="${x(i)}" y="${alto - m.abajo + 20}" text-anchor="middle">${i}</text>`;
    }
    svg += `<text class="eje" x="${ancho - m.derecha}" y="${alto - 2}" text-anchor="end">años</text>`;

    if (r.amortizacion && r.amortizacion.anios > 0) {
      const xa = x(r.amortizacion.anios);
      svg += `<line class="amortiza" x1="${xa}" x2="${xa}" y1="${m.arriba}" y2="${m.arriba + altoUtil}"/>`;
    }

    svg += `<path class="serie gasolina" d="${linea(g)}"/>`;
    svg += `<path class="serie electrico" d="${linea(e)}"/>`;
    e.forEach((v, i) => {
      svg += `<circle class="punto electrico" cx="${x(i)}" cy="${y(v)}" r="3"><title>Año ${i} · Eléctrico: ${euros.format(v)}</title></circle>`;
      svg += `<circle class="punto gasolina" cx="${x(i)}" cy="${y(g[i])}" r="3"><title>Año ${i} · Gasolina: ${euros.format(g[i])}</title></circle>`;
    });
    svg += "</svg>";

    svg += `<div class="leyenda"><span class="electrico">Eléctrico</span><span class="gasolina">Gasolina</span>` +
      (r.amortizacion && r.amortizacion.anios > 0 ? `<span class="amortiza">Amortización</span>` : "") + "</div>";

    document.getElementById("grafica").innerHTML = svg;
  }

  // Redondea hacia arriba a un número "bonito" para el eje Y.
  function niceMax(v) {
    if (v <= 0) return 1;
    const potencia = Math.pow(10, Math.floor(Math.log10(v)));
    for (const f of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
      if (f * potencia >= v) return f * potencia;
    }
    return 10 * potencia;
  }

  function actualizar() {
    const datos = leerDatos();
    const r = Calculadora.comparar(datos);
    pintarTarjetas(r, datos);
    pintarGrafica(r);
    pintarDesglose(r);
  }

  crearCampos();
  form.addEventListener("input", actualizar);
  form.addEventListener("submit", (ev) => ev.preventDefault());
  actualizar();
})();
