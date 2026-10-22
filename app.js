// Interfaz: lista de coches, formulario, guardado y resultados.

(function () {
  "use strict";

  const CLAVE_GUARDADO = "comparador-coches-v3";
  const MAX_COCHES = 6;
  const MIN_COCHES = 2;
  const COLORES = 6;
  const ANIO_ACTUAL = new Date().getFullYear();

  const TIPOS = {
    electrico: { nombre: "Eléctrico", icono: "⚡" },
    hibrido: { nombre: "Híbrido enchufable", icono: "🔌" },
    gasolina: { nombre: "Gasolina", icono: "⛽" },
  };
  const ESTADOS = { nuevo: "Nuevo", usado: "Segunda mano" };

  // Campos del formulario: [clave, etiqueta, unidad, paso]
  const CAMPOS_COMUN = [
    ["kmAnuales", "Kilómetros al año", "km", 500],
    ["anios", "Años que tendrás el coche", "años", 1],
    ["subidaEnergia", "Subida anual de luz/gasolina", "%", 0.5],
    ["porcentajeCasa", "Carga en casa (vs electrolinera)", "%", 5],
    ["precioKwhCasa", "Precio luz en casa", "€/kWh", 0.01],
    ["precioKwhPublico", "Precio electrolinera", "€/kWh", 0.01],
    ["precioLitro", "Precio gasolina", "€/L", 0.01],
  ];

  const CAMPOS_USADO = [
    ["anioMatriculacion", "Año de matriculación", "año", 1],
    ["kmActuales", "Km actuales", "km", 1000],
  ];

  const PRECIO = ["precio", "Precio de compra", "€", 500];
  const AYUDAS = ["ayudas", "Ayudas y descuentos", "€", 100];
  const INSTALACION = ["instalacion", "Instalación del cargador", "€", 50];
  const GASTOS = [
    ["mantenimiento", "Mantenimiento anual (a 0 km)", "€/año", 25],
    ["seguro", "Seguro anual", "€/año", 25],
    ["impuesto", "Impuesto de circulación", "€/año", 5],
    ["depreciacion", "Depreciación anual (de nuevo)", "%", 0.5],
  ];
  const CAMPOS = {
    electrico: [PRECIO, AYUDAS, INSTALACION,
      ["consumoKwh100", "Consumo", "kWh/100 km", 0.5], ...GASTOS],
    hibrido: [PRECIO, AYUDAS, INSTALACION,
      ["porcentajeElectrico", "Km hechos en modo eléctrico", "%", 5],
      ["consumoKwh100", "Consumo en eléctrico", "kWh/100 km", 0.5],
      ["consumoL100", "Consumo en híbrido", "L/100 km", 0.1], ...GASTOS],
    gasolina: [PRECIO, AYUDAS,
      ["consumoL100", "Consumo", "L/100 km", 0.1], ...GASTOS],
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

  // Los nombres los escribe el usuario: se escapan antes de meterlos en HTML.
  const escapar = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const aNumero = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
  const mayuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  const form = document.getElementById("formulario");
  const contenedorCoches = document.getElementById("paneles-coches");
  const selectorReferencia = document.getElementById("referencia");
  const compensaCoche = document.getElementById("compensa-coche");
  const compensaObjetivo = document.getElementById("compensa-objetivo");

  // Estado de la app: { comun, coches, referencia, compensa: { coche, objetivo }, siguienteId }
  let estado;

  // --- Coches ---------------------------------------------------------------

  const buscarCoche = (id) => estado.coches.find((c) => c.id === id);
  const buscarModelo = (tipo, id) => MODELOS[tipo].find((m) => m.id === id);

  function colorLibre() {
    const usados = new Set(estado.coches.map((c) => c.color));
    for (let i = 0; i < COLORES; i++) if (!usados.has(i)) return i;
    return 0;
  }

  // Precio estimado de un usado: el de nuevo menos lo que se ha depreciado con los años.
  function precioUsadoEstimado(valores, anioMatriculacion) {
    const edad = Math.max(0, ANIO_ACTUAL - anioMatriculacion);
    return Math.round(Calculadora.valorTrasAnios(valores.precio, valores.depreciacion, 0, edad) / 100) * 100;
  }

  // Nombre automático: el del modelo, con el año si es de segunda mano.
  function nombreAuto(coche) {
    const modelo = buscarModelo(coche.tipo, coche.modelo);
    if (!modelo) return coche.nombre;
    return coche.estado === "usado" ? `${modelo.nombre} (${coche.anioMatriculacion})` : modelo.nombre;
  }

  function aplicarModelo(coche, idModelo) {
    const modelo = buscarModelo(coche.tipo, idModelo);
    if (!modelo) { coche.modelo = "personalizado"; return; }
    Object.assign(coche, modelo.valores);
    coche.modelo = modelo.id;
    if (coche.estado === "usado") {
      coche.precio = precioUsadoEstimado(modelo.valores, coche.anioMatriculacion);
      coche.ayudas = 0;
    }
    if (!coche.nombrePropio) coche.nombre = nombreAuto(coche);
  }

  // Crea un coche de `tipo` con los datos del primer modelo. `base` conserva
  // id, color, nombre propio, año y km al cambiar de tipo.
  function nuevoCoche(tipo, estadoCoche, base = {}) {
    const coche = {
      id: base.id || "c" + estado.siguienteId++,
      color: base.color ?? colorLibre(),
      tipo,
      estado: estadoCoche,
      nombre: base.nombrePropio ? base.nombre : "",
      nombrePropio: !!base.nombrePropio,
      modelo: "personalizado",
      anioMatriculacion: base.anioMatriculacion ?? ANIO_ACTUAL - 4,
      kmActuales: base.kmActuales ?? 60000,
    };
    for (const [clave] of CAMPOS[tipo]) coche[clave] = 0;
    aplicarModelo(coche, MODELOS[tipo][0].id);
    return coche;
  }

  function descripcion(coche) {
    if (coche.estado !== "usado") return `${TIPOS[coche.tipo].nombre} · nuevo`;
    return `${TIPOS[coche.tipo].nombre} · usado de ${coche.anioMatriculacion}, ${numero.format(coche.kmActuales)} km`;
  }

  function primerGasolina() {
    const gasolina = estado.coches.find((c) => c.tipo === "gasolina");
    return (gasolina || estado.coches[0]).id;
  }

  function estadoPorDefecto() {
    estado = { comun: { ...VALORES_COMUNES }, coches: [], referencia: null, compensa: { coche: null, objetivo: 7 }, siguienteId: 1 };
    for (const [tipo, est, base] of [
      ["electrico", "nuevo"],
      ["hibrido", "nuevo"],
      ["gasolina", "nuevo"],
      ["electrico", "usado", { anioMatriculacion: ANIO_ACTUAL - 3, kmActuales: 45000 }],
    ]) estado.coches.push(nuevoCoche(tipo, est, base));
    estado.referencia = primerGasolina();
    estado.compensa.coche = estado.coches[0].id;
  }

  // --- Guardado en el navegador ----------------------------------------------
  // localStorage puede fallar (modo privado, almacenamiento bloqueado): la app sigue funcionando.

  function guardar() {
    try { localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(estado)); } catch (e) { /* sin guardado */ }
  }

  // Reconstruye el estado guardado validando cada dato; si algo no cuadra, se descarta.
  function restaurar() {
    let g;
    try { g = JSON.parse(localStorage.getItem(CLAVE_GUARDADO)); } catch (e) { return false; }
    if (!g || !Array.isArray(g.coches) || g.coches.length < MIN_COCHES || g.coches.length > MAX_COCHES) return false;
    if (!g.coches.every((c) => c && TIPOS[c.tipo])) return false;

    const num = (v, defecto) => (Number.isFinite(Number(v)) && v !== null && v !== "" ? Number(v) : defecto);
    estado = { comun: {}, coches: [], referencia: null, compensa: { coche: null, objetivo: 7 }, siguienteId: 1 };
    for (const clave of Object.keys(VALORES_COMUNES)) {
      estado.comun[clave] = num(g.comun && g.comun[clave], VALORES_COMUNES[clave]);
    }

    const ids = {};
    for (const gc of g.coches) {
      const coche = nuevoCoche(gc.tipo, gc.estado === "usado" ? "usado" : "nuevo");
      for (const [clave] of [...CAMPOS[gc.tipo], ...CAMPOS_USADO]) coche[clave] = num(gc[clave], coche[clave]);
      coche.modelo = buscarModelo(gc.tipo, gc.modelo) ? gc.modelo : "personalizado";
      coche.nombrePropio = !!gc.nombrePropio;
      if (typeof gc.nombre === "string") coche.nombre = gc.nombre.slice(0, 60);
      const color = Number(gc.color);
      if (Number.isInteger(color) && color >= 0 && color < COLORES && !estado.coches.some((c) => c.color === color)) {
        coche.color = color;
      } else {
        coche.color = colorLibre();
      }
      ids[gc.id] = coche.id;
      estado.coches.push(coche);
    }
    estado.referencia = ids[g.referencia] || primerGasolina();
    estado.compensa.coche = (g.compensa && ids[g.compensa.coche]) || estado.coches[0].id;
    estado.compensa.objetivo = num(g.compensa && g.compensa.objetivo, 7);
    return true;
  }

  // --- Formulario -----------------------------------------------------------

  function filaCampo(id, etiqueta, control, unidad) {
    const fila = document.createElement("label");
    fila.className = "campo";
    fila.htmlFor = id;
    const texto = document.createElement("span");
    texto.textContent = etiqueta;
    const entrada = document.createElement("span");
    entrada.className = "entrada";
    entrada.append(control);
    if (unidad !== undefined) {
      const u = document.createElement("span");
      u.className = "unidad";
      u.textContent = unidad;
      entrada.append(u);
    }
    fila.append(texto, entrada);
    return fila;
  }

  function entradaNumero(id, valor, paso) {
    const input = document.createElement("input");
    Object.assign(input, { type: "number", id, value: valor, step: paso, min: 0, inputMode: "decimal" });
    return input;
  }

  function desplegable(id, opciones, valor) {
    const select = document.createElement("select");
    select.id = id;
    for (const [v, texto] of opciones) select.add(new Option(texto, v, false, v === valor));
    return select;
  }

  function crearPanelComun() {
    const panel = document.getElementById("panel-comun");
    for (const [clave, etiqueta, unidad, paso] of CAMPOS_COMUN) {
      const input = entradaNumero("comun-" + clave, estado.comun[clave], paso);
      input.dataset.comun = clave;
      panel.append(filaCampo(input.id, etiqueta, input, unidad));
    }
  }

  function pintarPanelComun() {
    for (const [clave] of CAMPOS_COMUN) document.getElementById("comun-" + clave).value = estado.comun[clave];
  }

  function panelCoche(coche) {
    const panel = document.createElement("fieldset");
    panel.className = `panel coche c${coche.color}`;
    panel.dataset.coche = coche.id;

    const leyenda = document.createElement("legend");
    leyenda.textContent = `${TIPOS[coche.tipo].icono} ${coche.nombre || "Coche"}`;
    panel.append(leyenda);

    const id = (campo) => `${coche.id}-${campo}`;
    const nombre = document.createElement("input");
    Object.assign(nombre, { type: "text", id: id("nombre"), value: coche.nombrePropio ? coche.nombre : "", maxLength: 60, placeholder: coche.nombre || "Nombre del coche" });
    nombre.dataset.campo = "nombre";
    panel.append(filaCampo(nombre.id, "Nombre", nombre));

    const selects = [
      ["tipo", "Tipo", Object.entries(TIPOS).map(([v, t]) => [v, t.nombre]), coche.tipo],
      ["estado", "Estado", Object.entries(ESTADOS), coche.estado],
      ["modelo", "Modelo", [...MODELOS[coche.tipo].map((m) => [m.id, m.nombre]), ["personalizado", "Personalizado"]], coche.modelo],
    ];
    for (const [campo, etiqueta, opciones, valor] of selects) {
      const select = desplegable(id(campo), opciones, valor);
      select.dataset.campo = campo;
      const fila = filaCampo(select.id, etiqueta, select);
      fila.classList.add("selector");
      panel.append(fila);
    }

    const campos = [...(coche.estado === "usado" ? CAMPOS_USADO : []), ...CAMPOS[coche.tipo]];
    for (const [clave, etiqueta, unidad, paso] of campos) {
      const input = entradaNumero(id(clave), coche[clave], paso);
      input.dataset.campo = clave;
      panel.append(filaCampo(input.id, etiqueta, input, unidad));
    }

    if (estado.coches.length > MIN_COCHES) {
      const quitar = document.createElement("button");
      Object.assign(quitar, { type: "button", className: "quitar", textContent: "Quitar coche" });
      quitar.dataset.accion = "quitar";
      panel.append(quitar);
    }
    return panel;
  }

  function pintarPaneles() {
    contenedorCoches.replaceChildren(...estado.coches.map(panelCoche));
    document.getElementById("anadir").disabled = estado.coches.length >= MAX_COCHES;
  }

  // --- Resultados -----------------------------------------------------------

  function pintarSelectores() {
    if (!buscarCoche(estado.referencia)) estado.referencia = primerGasolina();
    const otros = estado.coches.filter((c) => c.id !== estado.referencia);
    if (!otros.some((c) => c.id === estado.compensa.coche)) estado.compensa.coche = otros[0].id;

    selectorReferencia.replaceChildren(...estado.coches.map((c) =>
      new Option(c.nombre || "Coche", c.id, false, c.id === estado.referencia)));
    compensaCoche.replaceChildren(...otros.map((c) =>
      new Option(c.nombre || "Coche", c.id, false, c.id === estado.compensa.coche)));
    document.getElementById("compensa-ref").textContent = buscarCoche(estado.referencia).nombre || "Coche";
    // No pisar el campo mientras el usuario escribe en él.
    if (document.activeElement !== compensaObjetivo) compensaObjetivo.value = estado.compensa.objetivo;
  }

  function textoAmortizacion(a, ahorro) {
    if (a === null) return "no se amortiza en este periodo";
    if (a.anios === 0) return ahorro >= 0 ? "más barato desde el primer día" : "más barato de comprar, pero no al final";
    return `se amortiza en ${decimal.format(a.anios)} años (${numero.format(a.km)} km)`;
  }

  function pintarTarjetas(r, datos) {
    const ref = buscarCoche(r.referencia);
    document.getElementById("tarjetas").innerHTML = estado.coches.map((c) => {
      const coche = r.coches[c.id];
      const extra = c.id === r.referencia
        ? "Referencia de la comparación"
        : `Frente a ${escapar(ref.nombre)}: ${r.ahorro[c.id] >= 0 ? "ahorras" : "pagas de más"} ${euros.format(Math.abs(r.ahorro[c.id]))}; ${textoAmortizacion(r.amortizacion[c.id], r.ahorro[c.id])}`;
      const ganador = r.masBarato === c.id;
      return `<div class="tarjeta c${c.color}${ganador ? " ganador" : ""}">` +
        `<span class="etiqueta">${TIPOS[c.tipo].icono} ${escapar(c.nombre || "Coche")}${ganador ? " · el más barato" : ""}</span>` +
        `<span class="detalle">${escapar(descripcion(c))}</span>` +
        `<span class="valor">${euros.format(coche.total)}</span>` +
        `<span class="detalle">${centimos.format(coche.costeKm)} por km en energía</span>` +
        `<span class="detalle">${extra}</span></div>`;
    }).join("");
    document.getElementById("titulo-resultados").textContent =
      `Coste total en ${datos.comun.anios} años (descontando la reventa)`;
  }

  // Sección "¿Cuándo compensa?": sobrecoste, ahorro anual, años y km necesarios.
  function pintarCompensa(datos) {
    const objetivo = Math.min(Calculadora.HORIZONTE_MAX, Math.max(1, Math.round(estado.compensa.objetivo) || 1));
    const a = buscarCoche(estado.compensa.coche);
    const ref = buscarCoche(estado.referencia);
    const c = Calculadora.compensa(datos, a.id, ref.id, objetivo);
    const nombre = a.nombre || "este coche";
    const signo = (v) => (v < 0 ? "−" : "") + euros.format(Math.abs(v));
    const kmAnuales = datos.comun.kmAnuales;

    document.getElementById("c-sobrecoste").textContent = signo(c.sobrecoste);
    document.getElementById("c-ahorro").textContent = signo(c.ahorroAnual) + "/año";
    document.getElementById("c-ahorro-detalle").textContent =
      `${signo(c.ahorroEnergia)} en energía y ${signo(c.ahorroFijo)} en mantenimiento, seguro e impuesto`;

    const ritmo = `a tu ritmo de ${numero.format(kmAnuales)} km/año`;
    let anios, km, detalle = ritmo;
    if (c.sobrecoste <= 0) {
      anios = "Desde el día 1";
      km = "0 km";
      detalle = "";
    } else if (c.anios === null) {
      anios = `Más de ${Calculadora.HORIZONTE_MAX} años`;
      km = `Más de ${numero.format(Calculadora.HORIZONTE_MAX * kmAnuales)} km`;
    } else {
      anios = `${decimal.format(c.anios)} años`;
      km = `${numero.format(Math.round(c.anios * kmAnuales / 100) * 100)} km`;
    }
    document.getElementById("c-anios").textContent = anios;
    document.getElementById("c-anios-detalle").textContent = detalle;
    document.getElementById("c-km").textContent = km;
    document.getElementById("c-km-detalle").textContent = detalle;

    document.getElementById("c-formula").textContent = c.sobrecoste > 0 && c.ahorroAnual > 0
      ? `${euros.format(c.sobrecoste)} ÷ ${euros.format(c.ahorroAnual)}/año ≈ ${decimal.format(c.sobrecoste / c.ahorroAnual)} años. ` +
        "La cifra exacta de arriba tiene en cuenta que la energía sube y el mantenimiento crece con los km."
      : "";

    let texto;
    if (c.sobrecoste <= 0 && c.dejaDeCompensar !== null) {
      texto = `${mayuscula(nombre)} cuesta ${euros.format(-c.sobrecoste)} menos de comprar, pero gasta ${euros.format(-c.ahorroAnual)} más al año: ` +
        `a los ${decimal.format(c.dejaDeCompensar)} años (${numero.format(Math.round(c.dejaDeCompensar * kmAnuales / 100) * 100)} km) ${ref.nombre || "el otro"} pasa a ser más barato. ` +
        (c.compensa ? `En tus ${datos.comun.anios} años, sí compensa.` : `En tus ${datos.comun.anios} años, no compensa.`);
    } else if (c.sobrecoste <= 0) {
      texto = `${mayuscula(nombre)} cuesta menos de comprar y de mantener que ${ref.nombre || "el otro"}: compensa desde el primer día.`;
    } else if (c.kmNecesarios === 0) {
      texto = `Se amortiza en ${objetivo} años o menos con cualquier kilometraje: el ahorro en mantenimiento, seguro e impuesto ya cubre el sobrecoste.`;
    } else if (c.kmNecesarios === null) {
      texto = `${mayuscula(nombre)} no se amortiza en ${objetivo} años frente a ${ref.nombre || "el otro"} ni haciendo ${numero.format(Calculadora.KM_MAX_BUSQUEDA)} km al año.`;
    } else {
      texto = `Para amortizarlo en ${objetivo} años necesitas hacer al menos ${numero.format(Math.ceil(c.kmNecesarios))} km al año. ` +
        (c.compensa ? `Con tus ${numero.format(kmAnuales)} km/año, sí compensa.` : `Con tus ${numero.format(kmAnuales)} km/año, no compensa en ese plazo.`);
    }
    const veredicto = document.getElementById("c-veredicto");
    veredicto.textContent = texto;
    veredicto.className = "veredicto " + (c.compensa ? "si" : "no");
  }

  function pintarDesglose(r) {
    document.querySelector("#desglose thead").innerHTML = "<tr><th>Concepto</th>" +
      estado.coches.map((c) => `<th class="c${c.color}">${escapar(c.nombre || "Coche")}</th>`).join("") + "</tr>";
    document.querySelector("#desglose tbody").innerHTML = CONCEPTOS.map(([clave, nombre]) =>
      `<tr><td>${nombre}</td>` +
      estado.coches.map((c) => `<td>${euros.format(r.coches[c.id].desglose[clave])}</td>`).join("") +
      "</tr>").join("");
    document.querySelector("#desglose tfoot").innerHTML = "<tr><td>Coste total</td>" +
      estado.coches.map((c) => `<td>${euros.format(r.coches[c.id].total)}</td>`).join("") + "</tr>";
  }

  // Gráfica de líneas en SVG, sin librerías.
  function pintarGrafica(r) {
    const series = estado.coches.map((c) => [c, r.coches[c.id].acumulado]);
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
    for (const [c] of series) {
      const a = r.amortizacion[c.id];
      if (a && a.anios > 0) {
        leyendaAmortiza = true;
        svg += `<line class="amortiza c${c.color}" x1="${x(a.anios)}" x2="${x(a.anios)}" y1="${m.arriba}" y2="${m.arriba + altoUtil}"/>`;
      }
    }

    for (const [c, s] of [...series].reverse()) svg += `<path class="serie c${c.color}" d="${linea(s)}"/>`;
    for (const [c, s] of series) {
      const nombre = escapar(c.nombre || "Coche");
      s.forEach((v, i) => {
        svg += `<circle class="punto c${c.color}" cx="${x(i)}" cy="${y(v)}" r="3"><title>Año ${i} · ${nombre}: ${euros.format(v)}</title></circle>`;
      });
    }
    svg += "</svg>";

    const ref = escapar(buscarCoche(r.referencia).nombre || "Coche");
    svg += `<div class="leyenda">` +
      estado.coches.map((c) => `<span class="c${c.color}">${escapar(c.nombre || "Coche")}</span>`).join("") +
      (leyendaAmortiza ? `<span class="amortiza">Amortización frente a ${ref}</span>` : "") + "</div>";

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
    pintarSelectores();
    const datos = {
      comun: { ...estado.comun, anios: Math.max(1, Math.round(estado.comun.anios)), anioActual: ANIO_ACTUAL },
      coches: estado.coches,
      referencia: estado.referencia,
    };
    const r = Calculadora.comparar(datos);
    pintarTarjetas(r, datos);
    pintarCompensa(datos);
    pintarGrafica(r);
    pintarDesglose(r);
    guardar();
  }

  // --- Eventos --------------------------------------------------------------

  function actualizarNombre(panel, coche) {
    panel.querySelector("legend").textContent = `${TIPOS[coche.tipo].icono} ${coche.nombre || "Coche"}`;
    panel.querySelector(`#${coche.id}-nombre`).placeholder = coche.nombre || "Nombre del coche";
  }

  form.addEventListener("input", (ev) => {
    const t = ev.target;
    if (t.dataset.comun) {
      estado.comun[t.dataset.comun] = aNumero(t.value);
      return actualizar();
    }
    const panel = t.closest("[data-coche]");
    if (!panel || t.tagName !== "INPUT") return;
    const coche = buscarCoche(panel.dataset.coche);
    const campo = t.dataset.campo;

    if (campo === "nombre") {
      coche.nombrePropio = t.value.trim() !== "";
      coche.nombre = coche.nombrePropio ? t.value.trim().slice(0, 60) : nombreAuto(coche);
      actualizarNombre(panel, coche);
      return actualizar();
    }

    coche[campo] = aNumero(t.value);
    if (campo === "anioMatriculacion") {
      // Con un modelo elegido, el precio estimado se ajusta al año.
      const modelo = buscarModelo(coche.tipo, coche.modelo);
      if (modelo) {
        coche.precio = precioUsadoEstimado(modelo.valores, coche.anioMatriculacion);
        panel.querySelector(`#${coche.id}-precio`).value = coche.precio;
        if (!coche.nombrePropio) {
          coche.nombre = nombreAuto(coche);
          actualizarNombre(panel, coche);
        }
      }
    } else if (campo !== "kmActuales") {
      // Al tocar un dato del coche, deja de ser el modelo predefinido.
      coche.modelo = "personalizado";
      panel.querySelector(`#${coche.id}-modelo`).value = "personalizado";
    }
    actualizar();
  });

  form.addEventListener("change", (ev) => {
    const t = ev.target;
    const panel = t.closest("[data-coche]");
    if (!panel || t.tagName !== "SELECT") return;
    const coche = buscarCoche(panel.dataset.coche);
    const i = estado.coches.indexOf(coche);

    if (t.dataset.campo === "tipo") {
      estado.coches[i] = nuevoCoche(t.value, coche.estado, coche);
    } else if (t.dataset.campo === "estado") {
      coche.estado = t.value;
      if (coche.modelo !== "personalizado") aplicarModelo(coche, coche.modelo);
    } else if (t.dataset.campo === "modelo") {
      aplicarModelo(coche, t.value);
    }
    pintarPaneles();
    actualizar();
    document.getElementById(t.id).focus();
  });

  form.addEventListener("click", (ev) => {
    if (ev.target.dataset.accion !== "quitar") return;
    const id = ev.target.closest("[data-coche]").dataset.coche;
    estado.coches = estado.coches.filter((c) => c.id !== id);
    pintarPaneles();
    actualizar();
  });

  form.addEventListener("submit", (ev) => ev.preventDefault());

  document.getElementById("anadir").addEventListener("click", () => {
    if (estado.coches.length >= MAX_COCHES) return;
    const coche = nuevoCoche("gasolina", "usado");
    estado.coches.push(coche);
    pintarPaneles();
    actualizar();
    const panel = contenedorCoches.querySelector(`[data-coche="${coche.id}"]`);
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
    panel.querySelector(`#${coche.id}-tipo`).focus({ preventScroll: true });
  });

  selectorReferencia.addEventListener("change", () => {
    estado.referencia = selectorReferencia.value;
    actualizar();
  });
  compensaCoche.addEventListener("change", () => {
    estado.compensa.coche = compensaCoche.value;
    actualizar();
  });
  compensaObjetivo.addEventListener("input", () => {
    estado.compensa.objetivo = aNumero(compensaObjetivo.value);
    actualizar();
  });

  document.getElementById("restablecer").addEventListener("click", () => {
    try { localStorage.removeItem(CLAVE_GUARDADO); } catch (e) { /* sin guardado */ }
    estadoPorDefecto();
    pintarPanelComun();
    pintarPaneles();
    actualizar();
  });

  // --- Arranque -------------------------------------------------------------

  let restaurado = false;
  try { restaurado = restaurar(); } catch (e) { restaurado = false; }
  if (!restaurado) estadoPorDefecto();
  crearPanelComun();
  pintarPaneles();
  actualizar();
})();
