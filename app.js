(function () {
  "use strict";

  const CONFIG = window.PRESU_CONFIG;
  const PLANTILLAS = window.PRESU_PLANTILLAS;
  const CLAVES = { borrador: "presu.borrador", ajustes: "presu.ajustes", licencia: "presu.licencia" };
  const COLOR_DEFECTO = "#1f5eff";
  const DIAS_REVALIDAR = 30;

  // ---------- Almacenamiento (puede fallar en modo privado: la app sigue funcionando) ----------

  function leer(clave, defecto) {
    try {
      const valor = localStorage.getItem(clave);
      return valor ? JSON.parse(valor) : defecto;
    } catch (e) {
      return defecto;
    }
  }

  function guardar(clave, valor) {
    try {
      localStorage.setItem(clave, JSON.stringify(valor));
      return true;
    } catch (e) {
      return false;
    }
  }

  function borrar(clave) {
    try { localStorage.removeItem(clave); } catch (e) { /* sin almacenamiento */ }
  }

  // ---------- Utilidades ----------

  const $ = (sel) => document.querySelector(sel);

  function hoyISO() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  function nuevoId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function aNumero(valor) {
    const n = parseFloat(String(valor).replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }

  function redondear(n) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  // Formato español con separador de miles siempre (Intl no agrupa números de 4 cifras en es-ES).
  function euros(n) {
    const negativo = n < 0;
    const [entero, decimales] = Math.abs(n).toFixed(2).split(".");
    const conMiles = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return (negativo ? "-" : "") + conMiles + "," + decimales + " €";
  }

  function cantidadTexto(n) {
    return String(redondear(n)).replace(".", ",");
  }

  function fechaES(iso) {
    if (!iso) return "";
    const [a, m, d] = iso.split("-");
    return `${d}/${m}/${a}`;
  }

  function sumarDias(iso, dias) {
    if (!iso) return "";
    const d = new Date(iso + "T12:00:00");
    d.setDate(d.getDate() + dias);
    return d.toISOString().slice(0, 10);
  }

  function hexARgb(hex) {
    const limpio = /^#[0-9a-f]{6}$/i.test(hex) ? hex : COLOR_DEFECTO;
    return [1, 3, 5].map((i) => parseInt(limpio.slice(i, i + 2), 16));
  }

  function toast(texto) {
    const el = $("#toast");
    el.textContent = texto;
    el.classList.add("visible");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove("visible"), 2500);
  }

  // ---------- Estado ----------

  function partidaVacia() {
    return { concepto: "", cantidad: 1, unidad: "ud", precio: 0 };
  }

  function presupuestoNuevo(base) {
    return {
      id: nuevoId(),
      numero: "",
      fecha: hoyISO(),
      validezDias: 30,
      empresa: base ? { ...base.empresa } : { nombre: "", nif: "", direccion: "", telefono: "", email: "" },
      cliente: { nombre: "", nif: "", direccion: "", telefono: "" },
      partidas: [partidaVacia()],
      iva: base ? base.iva : 21,
      descuento: 0,
      formaPago: base ? base.formaPago : "",
      condiciones: base ? base.condiciones : "",
    };
  }

  let presupuesto = leer(CLAVES.borrador, null) || presupuestoNuevo();
  let ajustes = Object.assign(
    { logo: null, logoAncho: 0, logoAlto: 0, color: COLOR_DEFECTO, catalogo: [], siguienteNumero: 1, historial: [] },
    leer(CLAVES.ajustes, {})
  );
  let licencia = leer(CLAVES.licencia, null);

  function esPro() {
    return Boolean(licencia && licencia.valida);
  }

  function guardarBorrador() {
    guardar(CLAVES.borrador, presupuesto);
  }

  function guardarAjustes() {
    if (!guardar(CLAVES.ajustes, ajustes)) toast("No se pudo guardar en este dispositivo (¿logo demasiado grande?)");
  }

  function obtenerRuta(obj, ruta) {
    return ruta.split(".").reduce((o, k) => (o ? o[k] : undefined), obj);
  }

  function fijarRuta(obj, ruta, valor) {
    const partes = ruta.split(".");
    const ultima = partes.pop();
    partes.reduce((o, k) => o[k], obj)[ultima] = valor;
  }

  // ---------- Cálculos ----------

  function importeLinea(p) {
    return redondear(aNumero(p.cantidad) * aNumero(p.precio));
  }

  function calcularTotales(pr) {
    const subtotal = redondear(pr.partidas.reduce((s, p) => s + importeLinea(p), 0));
    const descuentoPct = Math.min(Math.max(aNumero(pr.descuento), 0), 100);
    const descuento = redondear(subtotal * descuentoPct / 100);
    const base = redondear(subtotal - descuento);
    const ivaPct = aNumero(pr.iva);
    const iva = redondear(base * ivaPct / 100);
    return { subtotal, descuentoPct, descuento, base, ivaPct, iva, total: redondear(base + iva) };
  }

  // ---------- Numeración (Pro) ----------

  function asignarNumeroAutomatico() {
    const anio = new Date().getFullYear();
    presupuesto.numero = `${anio}-${String(ajustes.siguienteNumero).padStart(3, "0")}`;
    ajustes.siguienteNumero += 1;
    guardarAjustes();
  }

  // ---------- Pintado ----------

  function pintarCampos() {
    document.querySelectorAll("[data-campo]").forEach((el) => {
      const valor = obtenerRuta(presupuesto, el.dataset.campo);
      el.value = valor === undefined || valor === null ? "" : valor;
    });
    $("#ayuda-numero").textContent = esPro()
      ? "Numeración automática activada."
      : "Con Pro, la numeración es automática.";
  }

  function crearCampo(etiqueta, clase, atributos) {
    const label = document.createElement("label");
    label.className = clase;
    label.textContent = etiqueta;
    const input = document.createElement("input");
    Object.assign(input, atributos);
    label.appendChild(input);
    return { label, input };
  }

  function pintarPartidas() {
    const cont = $("#partidas");
    cont.innerHTML = "";
    presupuesto.partidas.forEach((p, i) => {
      const fila = document.createElement("div");
      fila.className = "partida";

      const concepto = crearCampo("Concepto", "f-concepto", { value: p.concepto, placeholder: "Ej.: Cambio de grifo" });
      const cantidad = crearCampo("Cantidad", "f-cantidad", { type: "number", step: "any", min: "0", inputMode: "decimal", value: p.cantidad });
      const unidad = crearCampo("Unidad", "f-unidad", { value: p.unidad, placeholder: "ud, h, m²" });
      const precio = crearCampo("Precio €", "f-precio", { type: "number", step: "any", min: "0", inputMode: "decimal", value: p.precio });

      const importe = document.createElement("div");
      importe.className = "importe";
      importe.textContent = euros(importeLinea(p));

      const actualizar = (campo) => (e) => {
        p[campo] = e.target.value;
        importe.textContent = euros(importeLinea(p));
        guardarBorrador();
        pintarTotales();
      };
      concepto.input.addEventListener("input", actualizar("concepto"));
      cantidad.input.addEventListener("input", actualizar("cantidad"));
      unidad.input.addEventListener("input", actualizar("unidad"));
      precio.input.addEventListener("input", actualizar("precio"));

      const acciones = document.createElement("div");
      acciones.className = "acciones";
      const estrella = document.createElement("button");
      estrella.type = "button";
      estrella.className = "btn-link";
      estrella.title = "Guardar en mi catálogo (Pro)";
      estrella.setAttribute("aria-label", "Guardar en mi catálogo");
      estrella.textContent = "★";
      estrella.addEventListener("click", () => guardarEnCatalogo(p));
      const quitar = document.createElement("button");
      quitar.type = "button";
      quitar.className = "btn-link btn-danger-link";
      quitar.textContent = "Quitar";
      quitar.addEventListener("click", () => {
        presupuesto.partidas.splice(i, 1);
        if (!presupuesto.partidas.length) presupuesto.partidas.push(partidaVacia());
        guardarBorrador();
        pintarPartidas();
        pintarTotales();
      });
      acciones.append(estrella, quitar);

      fila.append(concepto.label, cantidad.label, unidad.label, precio.label, importe, acciones);
      cont.appendChild(fila);
    });
  }

  function pintarTotales() {
    const t = calcularTotales(presupuesto);
    const filas = [["Subtotal", euros(t.subtotal)]];
    if (t.descuento > 0) filas.push([`Descuento (${cantidadTexto(t.descuentoPct)} %)`, "-" + euros(t.descuento)]);
    filas.push(["Base imponible", euros(t.base)], [`IVA (${cantidadTexto(t.ivaPct)} %)`, euros(t.iva)]);

    const cont = $("#totales");
    cont.innerHTML = "";
    filas.forEach(([etiqueta, valor]) => {
      const fila = document.createElement("div");
      fila.className = "fila";
      fila.append(Object.assign(document.createElement("span"), { textContent: etiqueta }),
        Object.assign(document.createElement("span"), { textContent: valor }));
      cont.appendChild(fila);
    });
    const total = document.createElement("div");
    total.className = "fila total";
    total.id = "total-final";
    total.append(Object.assign(document.createElement("span"), { textContent: "TOTAL" }),
      Object.assign(document.createElement("span"), { textContent: euros(t.total) }));
    cont.appendChild(total);
    $("#total-barra").textContent = euros(t.total);
  }

  function pintarPro() {
    const pro = esPro();
    $("#btn-pro").textContent = pro ? "Pro ✓" : "Hazte Pro";
    $("#card-marca").classList.toggle("bloqueado", !pro);
    $("#card-historial").classList.toggle("bloqueado", !pro);
    $("#in-color").value = ajustes.color || COLOR_DEFECTO;
    const preview = $("#logo-preview");
    preview.hidden = !ajustes.logo;
    $("#btn-quitar-logo").hidden = !ajustes.logo;
    if (ajustes.logo) preview.src = ajustes.logo;
    pintarHistorial();
  }

  function pintarHistorial() {
    const lista = $("#historial");
    lista.innerHTML = "";
    if (!esPro() || !ajustes.historial.length) {
      lista.appendChild(Object.assign(document.createElement("li"), {
        className: "vacio",
        textContent: esPro() ? "Aún no has descargado ningún presupuesto." : "Disponible con Pro.",
      }));
      return;
    }
    ajustes.historial.forEach((h) => {
      const li = document.createElement("li");
      const info = document.createElement("div");
      info.append(
        Object.assign(document.createElement("strong"), { textContent: `${h.numero || "Sin número"} · ${h.cliente || "Sin cliente"}` }),
        Object.assign(document.createElement("div"), { className: "meta", textContent: `${fechaES(h.fecha)} · ${euros(h.total)}` })
      );
      const botones = document.createElement("div");
      const abrir = Object.assign(document.createElement("button"), { type: "button", className: "btn-link", textContent: "Abrir" });
      abrir.addEventListener("click", () => {
        presupuesto = JSON.parse(JSON.stringify(h.presupuesto));
        guardarBorrador();
        pintarTodo();
        window.scrollTo({ top: 0, behavior: "smooth" });
        toast("Presupuesto abierto");
      });
      const eliminar = Object.assign(document.createElement("button"), { type: "button", className: "btn-link btn-danger-link", textContent: "Borrar" });
      eliminar.style.marginLeft = "12px";
      eliminar.addEventListener("click", () => {
        if (!confirm("¿Borrar este presupuesto del historial?")) return;
        ajustes.historial = ajustes.historial.filter((x) => x.id !== h.id);
        guardarAjustes();
        pintarHistorial();
      });
      botones.append(abrir, eliminar);
      li.append(info, botones);
      lista.appendChild(li);
    });
  }

  function pintarCatalogo() {
    const lista = $("#catalogo");
    lista.innerHTML = "";
    if (!ajustes.catalogo.length) {
      lista.appendChild(Object.assign(document.createElement("li"), {
        className: "vacio",
        textContent: "Tu catálogo está vacío. Pulsa ★ en una partida para guardarla.",
      }));
      return;
    }
    ajustes.catalogo.forEach((c, i) => {
      const li = document.createElement("li");
      const anadir = Object.assign(document.createElement("button"), { type: "button", className: "btn-link", textContent: `${c.concepto} · ${euros(aNumero(c.precio))}/${c.unidad}` });
      anadir.style.textAlign = "left";
      anadir.addEventListener("click", () => {
        anadirPartida({ concepto: c.concepto, cantidad: 1, unidad: c.unidad, precio: c.precio });
        cerrarModal("#modal-catalogo");
        toast("Partida añadida");
      });
      const quitar = Object.assign(document.createElement("button"), { type: "button", className: "btn-link btn-danger-link", textContent: "Quitar" });
      quitar.addEventListener("click", () => {
        ajustes.catalogo.splice(i, 1);
        guardarAjustes();
        pintarCatalogo();
      });
      li.append(anadir, quitar);
      lista.appendChild(li);
    });
  }

  function pintarTodo() {
    pintarCampos();
    pintarPartidas();
    pintarTotales();
    pintarPro();
  }

  // ---------- Acciones ----------

  function anadirPartida(p) {
    const ultima = presupuesto.partidas[presupuesto.partidas.length - 1];
    // Sustituye la línea vacía inicial en lugar de dejarla colgando.
    if (presupuesto.partidas.length === 1 && !ultima.concepto && !aNumero(ultima.precio)) {
      presupuesto.partidas = [];
    }
    presupuesto.partidas.push(p);
    guardarBorrador();
    pintarPartidas();
    pintarTotales();
  }

  function cargarPlantilla(clave) {
    const plantilla = PLANTILLAS[clave];
    if (!plantilla) return;
    const hayPartidas = presupuesto.partidas.some((p) => p.concepto || aNumero(p.precio));
    if (hayPartidas && !confirm("¿Sustituir las partidas actuales por el ejemplo de " + plantilla.nombre + "?")) return;
    presupuesto.partidas = plantilla.partidas.map((p) => ({ ...p }));
    if (!presupuesto.condiciones) presupuesto.condiciones = plantilla.condiciones;
    guardarBorrador();
    pintarTodo();
    toast("Ejemplo cargado: ajusta los precios a los tuyos");
  }

  function guardarEnCatalogo(p) {
    if (!esPro()) return abrirModal("#modal-pro");
    if (!p.concepto) return toast("Escribe un concepto antes de guardarlo");
    const existente = ajustes.catalogo.find((c) => c.concepto.toLowerCase() === p.concepto.toLowerCase());
    if (existente) Object.assign(existente, { unidad: p.unidad, precio: p.precio });
    else ajustes.catalogo.push({ concepto: p.concepto, unidad: p.unidad, precio: p.precio });
    guardarAjustes();
    toast("Guardada en tu catálogo");
  }

  function empezarNuevo(conPartidas) {
    const base = presupuesto;
    presupuesto = presupuestoNuevo(base);
    if (conPartidas) presupuesto.partidas = base.partidas.map((p) => ({ ...p }));
    if (esPro()) asignarNumeroAutomatico();
    guardarBorrador();
    pintarTodo();
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast(conPartidas ? "Nuevo presupuesto con las mismas partidas" : "Nuevo presupuesto");
  }

  function guardarEnHistorial(totales) {
    const entrada = {
      id: presupuesto.id,
      numero: presupuesto.numero,
      cliente: presupuesto.cliente.nombre,
      fecha: presupuesto.fecha,
      total: totales.total,
      presupuesto: JSON.parse(JSON.stringify(presupuesto)),
    };
    ajustes.historial = [entrada, ...ajustes.historial.filter((h) => h.id !== presupuesto.id)].slice(0, 200);
    guardarAjustes();
    pintarHistorial();
  }

  function cargarLogo(archivo) {
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Reducimos el logo para que quepa en el almacenamiento del navegador.
        const escala = Math.min(1, 600 / img.width, 300 / img.height);
        const lienzo = document.createElement("canvas");
        lienzo.width = Math.round(img.width * escala);
        lienzo.height = Math.round(img.height * escala);
        const ctx = lienzo.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, lienzo.width, lienzo.height);
        ctx.drawImage(img, 0, 0, lienzo.width, lienzo.height);
        ajustes.logo = lienzo.toDataURL("image/jpeg", 0.9);
        ajustes.logoAncho = lienzo.width;
        ajustes.logoAlto = lienzo.height;
        guardarAjustes();
        pintarPro();
      };
      img.onerror = () => toast("No se pudo leer la imagen");
      img.src = lector.result;
    };
    lector.readAsDataURL(archivo);
  }

  // ---------- Licencia (Lemon Squeezy) ----------

  async function llamarLemon(accion, datos) {
    const respuesta = await fetch(`https://api.lemonsqueezy.com/v1/licenses/${accion}`, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new URLSearchParams(datos),
    });
    return respuesta.json();
  }

  function productoCorrecto(datos) {
    return !CONFIG.lemonProductId || (datos.meta && Number(datos.meta.product_id) === Number(CONFIG.lemonProductId));
  }

  async function activarLicencia(clave) {
    const estado = $("#pro-estado");
    estado.className = "aviso";
    estado.textContent = "Comprobando licencia…";
    try {
      const datos = await llamarLemon("activate", { license_key: clave, instance_name: "PresuRápido " + hoyISO() });
      if (!datos.activated || !productoCorrecto(datos)) {
        throw new Error(datos.error || "Esta licencia no es válida para PresuRápido.");
      }
      licencia = { clave, instancia: datos.instance.id, valida: true, comprobada: Date.now() };
      guardar(CLAVES.licencia, licencia);
      estado.className = "aviso aviso-ok";
      estado.textContent = "¡Pro activado! Gracias por tu compra.";
      if (!presupuesto.numero) asignarNumeroAutomatico();
      pintarTodo();
    } catch (e) {
      estado.className = "aviso aviso-error";
      estado.textContent = e instanceof TypeError
        ? "No hay conexión. Inténtalo de nuevo en un momento."
        : e.message;
    }
  }

  // Revalida de vez en cuando por si la licencia se reembolsó. Sin conexión, se mantiene.
  async function revalidarLicencia() {
    if (!licencia || Date.now() - licencia.comprobada < DIAS_REVALIDAR * 86400000) return;
    try {
      const datos = await llamarLemon("validate", { license_key: licencia.clave, instance_id: licencia.instancia });
      if (datos.valid === false) {
        licencia = null;
        borrar(CLAVES.licencia);
        pintarTodo();
        return;
      }
      licencia.comprobada = Date.now();
      guardar(CLAVES.licencia, licencia);
    } catch (e) { /* sin conexión: se reintenta en la próxima visita */ }
  }

  // ---------- PDF ----------

  function generarPDF() {
    if (!window.jspdf) return toast("No se pudo cargar el generador de PDF. Recarga la página.");
    const pro = esPro();
    if (pro && !presupuesto.numero) asignarNumeroAutomatico();

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const color = hexARgb(pro ? ajustes.color : COLOR_DEFECTO);
    const ancho = doc.internal.pageSize.getWidth();
    const alto = doc.internal.pageSize.getHeight();
    const margen = 15;
    const derecha = ancho - margen;
    const pr = presupuesto;
    const t = calcularTotales(pr);
    const gris = [95, 104, 121];

    // Cabecera: logo y datos de la empresa a la izquierda, datos del presupuesto a la derecha.
    let y = margen;
    if (pro && ajustes.logo && ajustes.logoAncho) {
      const escala = Math.min(45 / ajustes.logoAncho, 20 / ajustes.logoAlto);
      const w = ajustes.logoAncho * escala;
      const h = ajustes.logoAlto * escala;
      doc.addImage(ajustes.logo, "JPEG", margen, y, w, h);
      y += h + 4;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(26, 34, 48);
    doc.text(pr.empresa.nombre || "Tu empresa", margen, y + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...gris);
    let yEmpresa = y + 9;
    [pr.empresa.nif && "NIF: " + pr.empresa.nif, pr.empresa.direccion, pr.empresa.telefono, pr.empresa.email]
      .filter(Boolean)
      .forEach((linea) => { doc.text(linea, margen, yEmpresa); yEmpresa += 4.5; });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...color);
    doc.text("PRESUPUESTO", derecha, margen + 6, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(26, 34, 48);
    let yDatos = margen + 13;
    [
      pr.numero && "Nº " + pr.numero,
      "Fecha: " + fechaES(pr.fecha),
      "Válido hasta: " + fechaES(sumarDias(pr.fecha, aNumero(pr.validezDias) || 30)),
    ].filter(Boolean).forEach((linea) => { doc.text(linea, derecha, yDatos, { align: "right" }); yDatos += 5; });

    y = Math.max(yEmpresa, yDatos) + 2;
    doc.setDrawColor(...color);
    doc.setLineWidth(0.8);
    doc.line(margen, y, derecha, y);
    y += 7;

    // Cliente
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...gris);
    doc.text("CLIENTE", margen, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(26, 34, 48);
    const lineasCliente = [
      pr.cliente.nombre || "—",
      pr.cliente.nif && "NIF/DNI: " + pr.cliente.nif,
      pr.cliente.direccion,
      pr.cliente.telefono,
    ].filter(Boolean);
    lineasCliente.forEach((linea) => { doc.text(linea, margen, y); y += 5; });
    y += 3;

    // Partidas
    const filas = pr.partidas
      .filter((p) => p.concepto || aNumero(p.precio))
      .map((p) => [p.concepto, cantidadTexto(aNumero(p.cantidad)), p.unidad, euros(aNumero(p.precio)), euros(importeLinea(p))]);
    doc.autoTable({
      startY: y,
      head: [["Concepto", "Cant.", "Ud.", "Precio", "Importe"]],
      body: filas.length ? filas : [["—", "", "", "", ""]],
      margin: { left: margen, right: margen },
      styles: { font: "helvetica", fontSize: 9.5, cellPadding: 2.5, textColor: [26, 34, 48], lineColor: [221, 226, 234], lineWidth: 0.1 },
      headStyles: { fillColor: color, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [246, 247, 249] },
      columnStyles: {
        1: { halign: "right", cellWidth: 16 },
        2: { halign: "center", cellWidth: 14 },
        3: { halign: "right", cellWidth: 26 },
        4: { halign: "right", cellWidth: 28 },
      },
      theme: "grid",
      // Alinea las cabeceras numéricas igual que su columna.
      didParseCell: (celda) => {
        if (celda.section === "head") celda.cell.styles.halign = ["left", "right", "center", "right", "right"][celda.column.index];
      },
    });
    y = doc.lastAutoTable.finalY + 6;

    const asegurarEspacio = (necesario) => {
      if (y + necesario > alto - 25) { doc.addPage(); y = margen; }
    };

    // Totales
    const lineasTotales = [["Subtotal", euros(t.subtotal)]];
    if (t.descuento > 0) lineasTotales.push([`Descuento (${cantidadTexto(t.descuentoPct)} %)`, "-" + euros(t.descuento)]);
    lineasTotales.push(["Base imponible", euros(t.base)], [`IVA (${cantidadTexto(t.ivaPct)} %)`, euros(t.iva)]);
    asegurarEspacio(lineasTotales.length * 5.5 + 14);
    const xEtiqueta = derecha - 70;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    lineasTotales.forEach(([etiqueta, valor]) => {
      doc.text(etiqueta, xEtiqueta, y);
      doc.text(valor, derecha, y, { align: "right" });
      y += 5.5;
    });
    doc.setFillColor(...color);
    doc.rect(xEtiqueta - 3, y - 3, derecha - xEtiqueta + 3, 10, "F");
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("TOTAL", xEtiqueta, y + 3.5);
    doc.text(euros(t.total), derecha - 2, y + 3.5, { align: "right" });
    doc.setTextColor(26, 34, 48);
    y += 16;

    // Forma de pago y condiciones
    const bloqueTexto = (titulo, texto) => {
      if (!texto) return;
      const lineas = doc.splitTextToSize(texto, derecha - margen);
      asegurarEspacio(lineas.length * 4.5 + 10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...gris);
      doc.text(titulo, margen, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(26, 34, 48);
      doc.text(lineas, margen, y);
      y += lineas.length * 4.5 + 4;
    };
    bloqueTexto("FORMA DE PAGO", pr.formaPago);
    bloqueTexto("CONDICIONES", pr.condiciones);

    // Firma de aceptación
    asegurarEspacio(28);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...gris);
    doc.text("Conforme del cliente (fecha y firma):", margen, y);
    doc.setDrawColor(180);
    doc.setLineWidth(0.3);
    doc.line(margen, y + 18, margen + 75, y + 18);

    // Pie en todas las páginas
    const paginas = doc.getNumberOfPages();
    for (let i = 1; i <= paginas; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...gris);
      if (paginas > 1) doc.text(`Página ${i} de ${paginas}`, derecha, alto - 10, { align: "right" });
      if (!pro) doc.text(`Hecho con PresuRápido · Crea tus presupuestos gratis en ${CONFIG.urlPublica}`, margen, alto - 10);
    }

    const nombreArchivo = ["Presupuesto", pr.numero, pr.cliente.nombre]
      .filter(Boolean).join(" ")
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-") + ".pdf";
    doc.save(nombreArchivo);

    guardarBorrador();
    if (pro) guardarEnHistorial(t);
    pintarCampos();
    toast("PDF descargado");
  }

  // ---------- Modales ----------

  function abrirModal(sel) {
    $(sel).classList.add("abierto");
  }

  function cerrarModal(sel) {
    $(sel).classList.remove("abierto");
  }

  // ---------- Eventos ----------

  function enlazar() {
    document.querySelectorAll("[data-campo]").forEach((el) => {
      el.addEventListener("input", () => {
        fijarRuta(presupuesto, el.dataset.campo, el.value);
        guardarBorrador();
        pintarTotales();
      });
    });

    const selector = $("#sel-plantilla");
    Object.entries(PLANTILLAS).forEach(([clave, p]) => {
      selector.appendChild(Object.assign(document.createElement("option"), { value: clave, textContent: p.nombre }));
    });
    selector.addEventListener("change", () => {
      cargarPlantilla(selector.value);
      selector.value = "";
    });

    $("#btn-anadir").addEventListener("click", () => anadirPartida(partidaVacia()));
    $("#btn-catalogo").addEventListener("click", () => {
      if (!esPro()) return abrirModal("#modal-pro");
      pintarCatalogo();
      abrirModal("#modal-catalogo");
    });
    $("#btn-nuevo").addEventListener("click", () => {
      if (confirm("¿Empezar un presupuesto nuevo? Tus datos de empresa se mantienen.")) empezarNuevo(false);
    });
    $("#btn-duplicar").addEventListener("click", () => empezarNuevo(true));
    $("#btn-pdf").addEventListener("click", generarPDF);

    $("#btn-pro").addEventListener("click", () => abrirModal("#modal-pro"));
    $("#btn-cerrar-pro").addEventListener("click", () => cerrarModal("#modal-pro"));
    $("#btn-cerrar-catalogo").addEventListener("click", () => cerrarModal("#modal-catalogo"));
    document.querySelectorAll(".modal-fondo").forEach((fondo) => {
      fondo.addEventListener("click", (e) => { if (e.target === fondo) fondo.classList.remove("abierto"); });
    });
    ["#card-marca", "#card-historial"].forEach((sel) => {
      $(sel).addEventListener("click", (e) => {
        if (!esPro()) { e.preventDefault(); abrirModal("#modal-pro"); }
      }, true);
    });

    const comprar = $("#btn-comprar");
    if (CONFIG.checkoutUrl) comprar.href = CONFIG.checkoutUrl;
    else comprar.addEventListener("click", (e) => { e.preventDefault(); toast("La compra aún no está disponible"); });
    $("#btn-activar").addEventListener("click", () => {
      const clave = $("#in-licencia").value.trim();
      if (clave) activarLicencia(clave);
    });
    if (esPro()) {
      const estado = $("#pro-estado");
      estado.className = "aviso aviso-ok";
      estado.textContent = "Tienes Pro activado en este dispositivo.";
    }

    $("#in-logo").addEventListener("change", (e) => cargarLogo(e.target.files[0]));
    $("#btn-quitar-logo").addEventListener("click", () => {
      ajustes.logo = null;
      guardarAjustes();
      pintarPro();
    });
    $("#in-color").addEventListener("input", (e) => {
      ajustes.color = e.target.value;
      guardarAjustes();
    });
  }

  // ---------- Inicio ----------

  enlazar();
  const oficio = new URLSearchParams(location.search).get("oficio");
  const vacio = !presupuesto.partidas.some((p) => p.concepto || aNumero(p.precio));
  if (oficio && PLANTILLAS[oficio] && vacio) {
    presupuesto.partidas = PLANTILLAS[oficio].partidas.map((p) => ({ ...p }));
    presupuesto.condiciones = presupuesto.condiciones || PLANTILLAS[oficio].condiciones;
    guardarBorrador();
  }
  pintarTodo();
  revalidarLicencia();
})();
