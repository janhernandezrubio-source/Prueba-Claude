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
- [ ] 1. Landing (`index.html`): propuesta de valor, demo, precio, FAQ y SEO en español ("presupuesto fontanero", "plantilla presupuesto reforma"…)
- [ ] 2. App (`app.html`):
  - datos de empresa y cliente
  - partidas (concepto, cantidad, unidad, precio)
  - IVA (21/10/4/0 %) y descuento
  - validez, condiciones y forma de pago
  - totales en vivo
- [ ] 3. Exportar PDF limpio y profesional, con marca de agua en la versión gratis
- [ ] 4. Autoguardado del borrador. Duplicar presupuesto.
- [ ] 5. Funciones Pro tras la licencia: logo, color, catálogo de partidas, numeración, historial
- [ ] 6. Plantillas de partidas de ejemplo por oficio (fontanería, electricidad, pintura, reformas)
- [ ] 7. Páginas legales: aviso legal y privacidad
- [ ] 8. Verificación con Playwright:
  - en vista móvil y escritorio
  - el PDF se genera y los totales cuadran
  - el bloqueo Pro funciona
- [ ] 9. `LANZAMIENTO.md`: activar GitHub Pages, crear el producto en Lemon Squeezy y conseguir los primeros 10 clientes

### Review
_(pendiente)_
