# Todo

## Micro-SaaS: generador de presupuestos para oficios

**Objetivo:** que fontaneros, electricistas, pintores y reformistas hagan un presupuesto profesional en PDF desde el móvil en 2 minutos.
**Restricciones:** 0 €, poco mantenimiento. Sin servidor ni base de datos ni cuentas de usuario.

### Decisiones
- HTML/CSS/JS estático sin build. Hosting gratis en GitHub Pages.
- PDF generado en el navegador con jsPDF y jspdf-autotable desde cdnjs, en versiones fijadas.
- Los datos se guardan solo en el navegador del usuario (localStorage). Así no hay servidor y la privacidad es fácil de explicar.
- Modelo freemium con pago único de unos 19 € por Lemon Squeezy:
  - **Gratis:** presupuestos ilimitados, con el pie "Hecho con …" en el PDF.
  - **Pro:** logo propio, sin marca de agua, color de marca, catálogo de partidas guardadas, numeración automática e historial.
- La licencia se valida en el navegador contra la API pública de licencias de Lemon Squeezy. Se puede saltar, pero es aceptable a este precio: quien paga es quien no quiere complicaciones.
- Un presupuesto no es una factura, así que no le afecta VeriFactu.

### Pasos
- [x] 1. Landing (`index.html`): propuesta de valor, demo, precio, FAQ y SEO en español ("presupuesto fontanero", "plantilla presupuesto reforma"…)
- [x] 2. App (`app.html`):
  - datos de empresa y cliente
  - partidas (concepto, cantidad, unidad, precio)
  - IVA (21/10/4/0 %) y descuento
  - validez, condiciones y forma de pago
  - totales en vivo
- [x] 3. Exportar PDF limpio y profesional, con marca de agua en la versión gratis
- [x] 4. Autoguardado del borrador. Duplicar presupuesto.
- [x] 5. Funciones Pro tras la licencia: logo, color, catálogo de partidas, numeración, historial
- [x] 6. Plantillas de partidas de ejemplo por oficio (fontanería, electricidad, pintura, reformas)
- [x] 7. Páginas legales: aviso legal y privacidad
- [x] 8. Verificación con Playwright:
  - en vista móvil y escritorio
  - el PDF se genera y los totales cuadran
  - el bloqueo Pro funciona
- [x] 9. `LANZAMIENTO.md`: activar GitHub Pages, crear el producto en Lemon Squeezy y conseguir los primeros 10 clientes

### Review
- Todo construido: landing (`index.html`), app (`app.html`, `app.js`), `config.js`, `plantillas.js`, `legal.html` y `LANZAMIENTO.md`.
- jsPDF 2.5.1 y jspdf-autotable 3.8.2 van copiados en `vendor/`. Así no se depende de un CDN y la app sigue funcionando aunque cdnjs caiga.
- `tests/e2e.cjs` pasa 42 de 42 comprobaciones, en móvil (375 px) y escritorio:
  - sin scroll horizontal
  - totales con descuento e IVA correctos
  - el texto del PDF lleva acentos y €
  - marca de agua en la versión gratis y no en la Pro
  - persistencia del borrador
  - plantilla cargada por URL
  - numeración, historial y catálogo Pro
  - sin errores de JavaScript
- Revisión visual del PDF hecha: arreglada la alineación de las cabeceras numéricas y la negrita que se colaba en el pie.
- **Sin verificar:** la activación real contra la API de Lemon Squeezy (que la llamada desde el navegador no falle por CORS). Se comprueba con una compra en modo test, que es el paso 7 de la sección 2 de `LANZAMIENTO.md`.
