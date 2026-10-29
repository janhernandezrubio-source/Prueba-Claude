// Pruebas de extremo a extremo. Uso: node tests/e2e.cjs
// Requiere Playwright con Chromium y pdftotext (poppler-utils).
const { chromium } = require("playwright");
const { spawn, execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const RAIZ = path.resolve(__dirname, "..");
const PUERTO = 8765;
const BASE = `http://127.0.0.1:${PUERTO}`;
let fallos = 0;

function comprobar(condicion, mensaje) {
  console.log(`${condicion ? "✓" : "✗"} ${mensaje}`);
  if (!condicion) fallos++;
}

function textoPdf(ruta) {
  return execFileSync("pdftotext", ["-layout", ruta, "-"]).toString();
}

async function descargarPdf(page) {
  const [descarga] = await Promise.all([page.waitForEvent("download"), page.click("#btn-pdf")]);
  const ruta = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "presu-")), descarga.suggestedFilename());
  await descarga.saveAs(ruta);
  return { ruta, nombre: descarga.suggestedFilename() };
}

async function sinScrollHorizontal(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
}

(async () => {
  const servidor = spawn("python3", ["-m", "http.server", String(PUERTO), "--bind", "127.0.0.1"], { cwd: RAIZ, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 800));
  const navegador = await chromium.launch();

  try {
    for (const [nombre, viewport] of [["móvil", { width: 375, height: 740 }], ["escritorio", { width: 1280, height: 900 }]]) {
      const ctx = await navegador.newContext({ viewport, acceptDownloads: true });
      const page = await ctx.newPage();
      const errores = [];
      page.on("pageerror", (e) => errores.push(e.message));
      page.on("console", (m) => { if (m.type() === "error") errores.push(m.text()); });

      await page.goto(`${BASE}/index.html`);
      comprobar(await sinScrollHorizontal(page), `[${nombre}] landing sin scroll horizontal`);
      await page.screenshot({ path: path.join(os.tmpdir(), `landing-${nombre}.png`), fullPage: true });

      await page.goto(`${BASE}/legal.html`);
      comprobar(await sinScrollHorizontal(page), `[${nombre}] legal sin scroll horizontal`);

      await page.goto(`${BASE}/app.html`);
      comprobar(await sinScrollHorizontal(page), `[${nombre}] app sin scroll horizontal`);

      // Versión gratis: rellenar y comprobar totales.
      await page.fill('[data-campo="empresa.nombre"]', "Fontanería López");
      await page.fill('[data-campo="empresa.nif"]', "12345678Z");
      await page.fill('[data-campo="cliente.nombre"]', "María García");
      await page.fill('[data-campo="numero"]', "2026-007");
      await page.fill(".partida .f-concepto input", "Cambio de grifo");
      await page.fill(".partida .f-cantidad input", "2");
      await page.fill(".partida .f-precio input", "1234.5");
      await page.click("#btn-anadir");
      await page.fill(".partida:nth-child(2) .f-concepto input", "Desplazamiento");
      await page.fill(".partida:nth-child(2) .f-precio input", "30");
      await page.fill('[data-campo="descuento"]', "10");
      await page.selectOption('[data-campo="iva"]', "10");
      // 2×1234,50 + 30 = 2499; -10 % = 2249,10; +10 % IVA = 224,91 → 2474,01
      comprobar((await page.textContent("#total-final")).includes("2.474,01 €"), `[${nombre}] total con descuento e IVA = 2.474,01 €`);
      comprobar((await page.textContent("#total-barra")) === "2.474,01 €", `[${nombre}] barra inferior muestra el total`);

      const gratis = await descargarPdf(page);
      const textoGratis = textoPdf(gratis.ruta);
      comprobar(gratis.nombre === "Presupuesto-2026-007-Maria-Garcia.pdf", `[${nombre}] nombre del PDF: ${gratis.nombre}`);
      comprobar(textoGratis.includes("PRESUPUESTO") && textoGratis.includes("Fontanería López"), `[${nombre}] PDF con cabecera y empresa (acentos)`);
      comprobar(textoGratis.includes("2.474,01 €") && textoGratis.includes("2.469,00 €"), `[${nombre}] PDF con importes y símbolo €`);
      comprobar(textoGratis.includes("Hecho con PresuRápido"), `[${nombre}] PDF gratis lleva marca de agua`);

      // Persistencia del borrador.
      await page.reload();
      comprobar((await page.inputValue('[data-campo="cliente.nombre"]')) === "María García", `[${nombre}] el borrador se conserva al recargar`);

      // Plantilla de oficio por URL en un contexto limpio.
      const ctx2 = await navegador.newContext({ viewport });
      const p2 = await ctx2.newPage();
      await p2.goto(`${BASE}/app.html?oficio=pintura`);
      comprobar((await p2.locator(".partida").count()) === 4, `[${nombre}] ?oficio=pintura carga 4 partidas`);
      await ctx2.close();

      // Funciones Pro bloqueadas.
      await page.click("#btn-catalogo");
      comprobar(await page.isVisible("#modal-pro"), `[${nombre}] catálogo abre el modal Pro en versión gratis`);
      await page.click("#btn-cerrar-pro");

      // Simular licencia Pro activa.
      await page.evaluate(() => localStorage.setItem("presu.licencia", JSON.stringify({ clave: "x", instancia: "y", valida: true, comprobada: Date.now() })));
      await page.reload();
      comprobar((await page.textContent("#btn-pro")) === "Pro ✓", `[${nombre}] botón muestra Pro activo`);
      await page.fill('[data-campo="numero"]', "");
      await page.dispatchEvent('[data-campo="numero"]', "input");
      await page.setInputFiles("#in-logo", {
        name: "logo.png",
        mimeType: "image/png",
        buffer: Buffer.from(await page.evaluate(() => {
          const c = Object.assign(document.createElement("canvas"), { width: 80, height: 40 });
          c.getContext("2d").fillRect(0, 0, 40, 40);
          return c.toDataURL("image/png").split(",")[1];
        }), "base64"),
      });
      await page.waitForSelector("#logo-preview:not([hidden])");
      const pro = await descargarPdf(page);
      const textoPro = textoPdf(pro.ruta);
      comprobar(!textoPro.includes("Hecho con PresuRápido"), `[${nombre}] PDF Pro sin marca de agua`);
      const anio = new Date().getFullYear();
      comprobar(textoPro.includes(`Nº ${anio}-001`), `[${nombre}] numeración automática ${anio}-001`);
      comprobar((await page.locator("#historial li").count()) === 1 && !(await page.textContent("#historial")).includes("Disponible"), `[${nombre}] el PDF se guarda en el historial`);

      // Catálogo Pro.
      await page.click(".partida .acciones .btn-link");
      await page.click("#btn-catalogo");
      comprobar((await page.textContent("#catalogo")).includes("Cambio de grifo"), `[${nombre}] partida guardada en el catálogo`);
      await page.click("#btn-cerrar-catalogo");

      // Nuevo presupuesto conserva empresa, limpia cliente y numera.
      page.once("dialog", (d) => d.accept());
      await page.click("#btn-nuevo");
      comprobar((await page.inputValue('[data-campo="empresa.nombre"]')) === "Fontanería López", `[${nombre}] nuevo conserva datos de empresa`);
      comprobar((await page.inputValue('[data-campo="cliente.nombre"]')) === "", `[${nombre}] nuevo limpia el cliente`);
      comprobar((await page.inputValue('[data-campo="numero"]')) === `${anio}-002`, `[${nombre}] nuevo asigna ${anio}-002`);
      await page.screenshot({ path: path.join(os.tmpdir(), `app-${nombre}.png`), fullPage: true });

      comprobar(errores.length === 0, `[${nombre}] sin errores de JavaScript${errores.length ? ": " + errores.join(" | ") : ""}`);
      await ctx.close();
    }
  } finally {
    await navegador.close();
    servidor.kill();
  }

  console.log(fallos ? `\n${fallos} comprobaciones fallidas` : "\nTodo correcto");
  process.exit(fallos ? 1 : 0);
})();
