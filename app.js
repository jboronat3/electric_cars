// Interfaz: genera el formulario, lee los datos, los guarda y pinta los resultados.

(function () {
  "use strict";

  const COCHES = ["electrico", "hibrido", "gasolina"];
  const NOMBRES = { electrico: "Eléctrico", hibrido: "Híbrido enchufable", gasolina: "Gasolina" };
  const CLAVE_GUARDADO = "comparador-coches-v2";

  // Campos del formulario: [clave, etiqueta, unidad, paso]
  const CAMPOS = {
    comun: [
      ["kmAnuales", "Kilómetros al año", "km", 500],
      ["anios", "Años que tendrás el coche", "años", 1],
      ["subidaEnergia", "Subida anual de luz/gasolina", "%", 0.5],
      ["porcentajeCasa", "Carga en casa (vs electrolinera)", "%", 5],
      ["precioKwhCasa", "Precio luz en casa", "€/kWh", 0.01],
      ["precioKwhPublico", "Precio electrolinera", "€/kWh", 0.01],
      ["precioLitro", "Precio gasolina", "€/L", 0.01],
    ],
    electrico: [
      ["precio", "Precio de compra", "€", 500],
      ["ayudas", "Ayudas y descuentos", "€", 100],
      ["instalacion", "Instalación del cargador", "€", 50],
      ["consumoKwh100", "Consumo", "kWh/100 km", 0.5],
      ["mantenimiento", "Mantenimiento anual", "€/año", 25],
      ["seguro", "Seguro anual", "€/año", 25],
      ["impuesto", "Impuesto de circulación", "€/año", 5],
      ["depreciacion", "Depreciación anual", "%", 0.5],
    ],
    hibrido: [
      ["precio", "Precio de compra", "€", 500],
      ["ayudas", "Ayudas y descuentos", "€", 100],
      ["instalacion", "Instalación del cargador", "€", 50],
      ["porcentajeElectrico", "Km hechos en modo eléctrico", "%", 5],
      ["consumoKwh100", "Consumo en eléctrico", "kWh/100 km", 0.5],
      ["consumoL100", "Consumo en híbrido", "L/100 km", 0.1],
      ["mantenimiento", "Mantenimiento anual", "€/año", 25],
      ["seguro", "Seguro anual", "€/año", 25],
      ["impuesto", "Impuesto de circulación", "€/año", 5],
      ["depreciacion", "Depreciación anual", "%", 0.5],
    ],
    gasolina: [
      ["precio", "Precio de compra", "€", 500],
      ["ayudas", "Ayudas y descuentos", "€", 100],
      ["consumoL100", "Consumo", "L/100 km", 0.1],
      ["mantenimiento", "Mantenimiento anual", "€/año", 25],
      ["seguro", "Seguro anual", "€/año", 25],
      ["impuesto", "Impuesto de circulación", "€/año", 5],
      ["depreciacion", "Depreciación anual", "%", 0.5],
    ],
  };

  const VALORES_COMUNES = {
    kmAnuales: 15000, anios: 8, subidaEnergia: 2,
    porcentajeCasa: 80, precioKwhCasa: 0.15, precioKwhPublico: 0.45, precioLitro: 1.55,
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
  const campo = (grupo, clave) => document.getElementById(grupo + "-" + clave);
  const selector = (grupo) => document.getElementById("modelo-" + grupo);
  const compensaCoche = document.getElementById("compensa-coche");
  const compensaObjetivo = document.getElementById("compensa-objetivo");

  // --- Formulario -----------------------------------------------------------

  function crearCampos() {
    for (const [grupo, campos] of Object.entries(CAMPOS)) {
      const panel = document.getElementById("panel-" + grupo);

      if (grupo !== "comun") {
        const fila = document.createElement("label");
        fila.className = "campo modelo";
        fila.innerHTML = `<span>Modelo</span><select id="modelo-${grupo}">` +
          MODELOS[grupo].map((m) => `<option value="${m.id}">${m.nombre}</option>`).join("") +
          `<option value="personalizado">Personalizado</option></select>`;
        panel.appendChild(fila);
      }

      for (const [clave, etiqueta, unidad, paso] of campos) {
        const id = grupo + "-" + clave;
        const fila = document.createElement("label");
        fila.className = "campo";
        fila.htmlFor = id;
        fila.innerHTML =
          `<span>${etiqueta}</span>` +
          `<span class="entrada"><input type="number" id="${id}" name="${id}" ` +
          `data-grupo="${grupo}" step="${paso}" min="0" inputmode="decimal">` +
          `<span class="unidad">${unidad}</span></span>`;
        panel.appendChild(fila);
      }
    }
  }

  function aplicarModelo(grupo, id) {
    const modelo = MODELOS[grupo].find((m) => m.id === id);
    if (!modelo) return;
    for (const [clave, valor] of Object.entries(modelo.valores)) campo(grupo, clave).value = valor;
    selector(grupo).value = id;
  }

  function valoresPorDefecto() {
    for (const [clave, valor] of Object.entries(VALORES_COMUNES)) campo("comun", clave).value = valor;
    for (const grupo of COCHES) aplicarModelo(grupo, MODELOS[grupo][0].id);
  }

  function leerDatos() {
    const datos = {};
    for (const [grupo, campos] of Object.entries(CAMPOS)) {
      datos[grupo] = {};
      for (const [clave] of campos) {
        const v = parseFloat(campo(grupo, clave).value);
        datos[grupo][clave] = Number.isFinite(v) ? v : 0;
      }
    }
    datos.comun.anios = Math.max(1, Math.round(datos.comun.anios));
    return datos;
  }

  // --- Guardado en el navegador ----------------------------------------------
  // localStorage puede fallar (modo privado, almacenamiento bloqueado): la app sigue funcionando.

  const GUARDABLES = "#formulario input, #compensa input, #compensa select";

  function guardar() {
    const valores = {};
    document.querySelectorAll(GUARDABLES).forEach((i) => { valores[i.id] = i.value; });
    const modelos = {};
    for (const grupo of COCHES) modelos[grupo] = selector(grupo).value;
    try { localStorage.setItem(CLAVE_GUARDADO, JSON.stringify({ valores, modelos })); } catch (e) { /* sin guardado */ }
  }

  function restaurar() {
    let guardado;
    try { guardado = JSON.parse(localStorage.getItem(CLAVE_GUARDADO)); } catch (e) { return false; }
    if (!guardado || !guardado.valores) return false;
    for (const [id, valor] of Object.entries(guardado.valores)) {
      const input = document.getElementById(id);
      if (input && input.matches(GUARDABLES)) input.value = valor;
    }
    if (!compensaCoche.value) compensaCoche.value = "electrico";
    for (const grupo of COCHES) {
      const id = guardado.modelos && guardado.modelos[grupo];
      if (id && [...selector(grupo).options].some((o) => o.value === id)) selector(grupo).value = id;
    }
    return true;
  }

  // --- Resultados -----------------------------------------------------------

  function textoAmortizacion(a) {
    if (a === null) return "no se amortiza en este periodo";
    if (a.anios === 0) return "más barato desde el primer día";
    return `se amortiza en ${decimal.format(a.anios)} años (${numero.format(a.km)} km)`;
  }

  // Sección "¿Cuándo compensa?": sobrecoste, ahorro anual, años y km necesarios.
  function pintarCompensa(datos) {
    const clave = compensaCoche.value;
    const objetivo = Math.min(Calculadora.HORIZONTE_MAX, Math.max(1, Math.round(parseFloat(compensaObjetivo.value) || 1)));
    const c = Calculadora.compensa(datos, clave, objetivo);
    const nombre = clave === "electrico" ? "el eléctrico" : "el híbrido enchufable";
    const signo = (v) => (v < 0 ? "−" : "") + euros.format(Math.abs(v));

    document.getElementById("c-sobrecoste").textContent = signo(c.sobrecoste);
    document.getElementById("c-ahorro").textContent = signo(c.ahorroAnual) + "/año";
    document.getElementById("c-ahorro-detalle").textContent =
      `${signo(c.ahorroEnergia)} en energía y ${signo(c.ahorroFijo)} en mantenimiento, seguro e impuesto`;

    const ritmo = `a tu ritmo de ${numero.format(datos.comun.kmAnuales)} km/año`;
    let anios, km, detalle = ritmo;
    if (c.sobrecoste <= 0) {
      anios = "Desde el día 1";
      km = "0 km";
      detalle = "";
    } else if (c.anios === null) {
      anios = `Más de ${Calculadora.HORIZONTE_MAX} años`;
      km = `Más de ${numero.format(Calculadora.HORIZONTE_MAX * datos.comun.kmAnuales)} km`;
    } else {
      anios = `${decimal.format(c.anios)} años`;
      km = `${numero.format(Math.round(c.anios * datos.comun.kmAnuales / 100) * 100)} km`;
    }
    document.getElementById("c-anios").textContent = anios;
    document.getElementById("c-anios-detalle").textContent = detalle;
    document.getElementById("c-km").textContent = km;
    document.getElementById("c-km-detalle").textContent = detalle;

    document.getElementById("c-formula").textContent = c.sobrecoste > 0 && c.ahorroAnual > 0
      ? `${euros.format(c.sobrecoste)} ÷ ${euros.format(c.ahorroAnual)}/año ≈ ${decimal.format(c.sobrecoste / c.ahorroAnual)} años. ` +
        "La cifra exacta de arriba tiene en cuenta que la luz y la gasolina suben cada año."
      : "";

    const veredicto = document.getElementById("c-veredicto");
    const kmTuyos = numero.format(datos.comun.kmAnuales);
    let texto;
    if (c.sobrecoste <= 0) {
      texto = `${mayuscula(nombre)} ya es más barato de comprar que el de gasolina: compensa desde el primer día.`;
    } else if (c.kmNecesarios === 0) {
      texto = `Se amortiza en ${objetivo} años o menos con cualquier kilometraje: el ahorro en mantenimiento, seguro e impuesto ya cubre el sobrecoste.`;
    } else if (c.kmNecesarios === null) {
      texto = `Con estos precios ${nombre} no gasta menos por km que el de gasolina, así que no se amortiza en ${objetivo} años por muchos km que hagas.`;
    } else {
      texto = `Para amortizarlo en ${objetivo} años necesitas hacer al menos ${numero.format(Math.ceil(c.kmNecesarios))} km al año. ` +
        (c.compensa ? `Con tus ${kmTuyos} km/año, sí compensa.` : `Con tus ${kmTuyos} km/año, no compensa en ese plazo.`);
    }
    veredicto.textContent = texto;
    veredicto.className = "veredicto " + (c.compensa || c.sobrecoste <= 0 ? "si" : "no");
  }

  const mayuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  function pintarTarjetas(r, datos) {
    const tarjetas = COCHES.map((c) => {
      const coche = r.coches[c];
      const extra = c === "gasolina"
        ? "Referencia de la comparación"
        : `Frente a gasolina: ${r.ahorro[c] >= 0 ? "ahorras" : "pagas de más"} ${euros.format(Math.abs(r.ahorro[c]))}; ${textoAmortizacion(r.amortizacion[c])}`;
      return `<div class="tarjeta ${c}${r.masBarato === c ? " ganador" : ""}">` +
        `<span class="etiqueta">${NOMBRES[c]}${r.masBarato === c ? " · el más barato" : ""}</span>` +
        `<span class="valor">${euros.format(coche.total)}</span>` +
        `<span class="detalle">${centimos.format(coche.costeKm)} por km en energía</span>` +
        `<span class="detalle">${extra}</span></div>`;
    });
    document.getElementById("tarjetas").innerHTML = tarjetas.join("");
    document.getElementById("titulo-resultados").textContent =
      `Coste total en ${datos.comun.anios} años (descontando la reventa)`;
  }

  function pintarDesglose(r) {
    document.querySelector("#desglose tbody").innerHTML = CONCEPTOS.map(([clave, nombre]) =>
      `<tr><td>${nombre}</td>` +
      COCHES.map((c) => `<td>${euros.format(r.coches[c].desglose[clave])}</td>`).join("") +
      "</tr>").join("");
    document.querySelector("#desglose tfoot").innerHTML =
      "<tr><td>Coste total</td>" +
      COCHES.map((c) => `<td>${euros.format(r.coches[c].total)}</td>`).join("") + "</tr>";
  }

  // Gráfica de líneas en SVG, sin librerías.
  function pintarGrafica(r) {
    const series = COCHES.map((c) => [c, r.coches[c].acumulado]);
    const ancho = 640, alto = 300;
    const m = { arriba: 16, derecha: 16, abajo: 36, izquierda: 84 };
    const anchoUtil = ancho - m.izquierda - m.derecha;
    const altoUtil = alto - m.arriba - m.abajo;
    const n = series[0][1].length - 1;
    const maximo = niceMax(Math.max(...series.flatMap(([, s]) => s)));

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

    // Una línea discontinua del color de cada coche en su punto de amortización.
    let leyendaAmortiza = false;
    for (const c of ["electrico", "hibrido"]) {
      const a = r.amortizacion[c];
      if (a && a.anios > 0) {
        leyendaAmortiza = true;
        svg += `<line class="amortiza ${c}" x1="${x(a.anios)}" x2="${x(a.anios)}" y1="${m.arriba}" y2="${m.arriba + altoUtil}"/>`;
      }
    }

    for (const [c, s] of [...series].reverse()) svg += `<path class="serie ${c}" d="${linea(s)}"/>`;
    for (const [c, s] of series) {
      s.forEach((v, i) => {
        svg += `<circle class="punto ${c}" cx="${x(i)}" cy="${y(v)}" r="3"><title>Año ${i} · ${NOMBRES[c]}: ${euros.format(v)}</title></circle>`;
      });
    }
    svg += "</svg>";

    svg += `<div class="leyenda">` + COCHES.map((c) => `<span class="${c}">${NOMBRES[c]}</span>`).join("") +
      (leyendaAmortiza ? `<span class="amortiza">Amortización frente a gasolina</span>` : "") + "</div>";

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
    pintarCompensa(datos);
    pintarGrafica(r);
    pintarDesglose(r);
    guardar();
  }

  // --- Arranque -------------------------------------------------------------

  crearCampos();
  valoresPorDefecto();
  restaurar();

  form.addEventListener("input", (ev) => {
    const grupo = ev.target.dataset.grupo;
    // Al tocar un dato de un coche, deja de ser el modelo predefinido.
    if (ev.target.tagName === "INPUT" && grupo && grupo !== "comun") selector(grupo).value = "personalizado";
    actualizar();
  });
  form.addEventListener("change", (ev) => {
    if (ev.target.tagName === "SELECT") {
      aplicarModelo(ev.target.id.replace("modelo-", ""), ev.target.value);
      actualizar();
    }
  });
  form.addEventListener("submit", (ev) => ev.preventDefault());
  document.getElementById("compensa").addEventListener("input", actualizar);
  document.getElementById("restablecer").addEventListener("click", () => {
    try { localStorage.removeItem(CLAVE_GUARDADO); } catch (e) { /* sin guardado */ }
    valoresPorDefecto();
    compensaCoche.value = "electrico";
    compensaObjetivo.value = 7;
    actualizar();
  });

  actualizar();
})();
