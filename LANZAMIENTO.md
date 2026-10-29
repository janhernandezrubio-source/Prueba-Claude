# Lanzamiento de PresuRápido

Guía paso a paso para poner la web en marcha con 0 € y conseguir los primeros clientes.

## 1. Publicar la web gratis (GitHub Pages) · 10 min

1. Fusiona el PR en `main`.
2. Hazlo público: en GitHub, ve a **Settings → General → Danger Zone → Change visibility → Public**. GitHub Pages gratis solo funciona con repos públicos.
3. Ve a **Settings → Pages**. En "Source" elige **Deploy from a branch**, rama `main` y carpeta `/ (root)`, y guarda.
4. En 1–2 minutos la web estará en `https://janhernandezrubio-source.github.io/Prueba-Claude/`.
5. Opcional (unos 10 €/año, cuando ya vendas): compra un dominio tipo `presurapido.es` y configúralo en **Settings → Pages → Custom domain**.

Cambia `urlPublica` en `config.js` por la dirección real: aparece en el pie de los PDF gratuitos y es tu publicidad gratis.

## 2. Configurar el cobro (Lemon Squeezy) · 20 min

Lemon Squeezy actúa como vendedor: cobra, emite la factura al cliente y gestiona el IVA europeo. No pagas nada fijo; se queda una comisión por venta (consulta la tarifa actual en su web).

1. Crea una cuenta en https://www.lemonsqueezy.com y una tienda.
2. Crea un producto: nombre **PresuRápido Pro**, precio **19 €**, pago único.
3. En el producto, activa **License keys**, con límite de activaciones 3 (móvil, tablet y ordenador) y sin caducidad.
4. Copia el enlace de compra (**Share**) y pégalo en `checkoutUrl`, en `config.js`.
5. Copia el ID numérico del producto y ponlo en `lemonProductId`, también en `config.js`.
6. Rellena `emailSoporte`.
7. **Prueba una compra en modo test** y activa la clave en la app para comprobar que todo funciona.
8. Para cobrar de verdad, completa la verificación de identidad y los datos bancarios en Lemon Squeezy.

## 3. Aspectos legales (España)

- Rellena tus datos en `legal.html`: nombre, NIF, dirección y email. La LSSI exige un aviso legal.
- Lemon Squeezy factura al cliente. Tú recibes los pagos de Lemon Squeezy como ingresos de tu actividad.
- Si vendes de forma habitual, tendrás que darte de alta como autónomo o declarar los ingresos según tu situación. Consúltalo con un gestor cuando lleguen las primeras ventas.

## 4. Conseguir los primeros 10 clientes · 30 min al día

El producto gratis es el anuncio: cada PDF gratuito que llega a un cliente final lleva tu web en el pie.

1. **Grupos de Facebook y foros de oficios.** Busca "fontaneros autónomos", "electricistas España", "reformas profesionales"… No hagas spam: responde a quien pregunta cómo hacer presupuestos y comparte la herramienta gratis.
2. **Conocidos del gremio.** Pregunta a 5 profesionales que conozcas si les sirve y pídeles su opinión con sinceridad. Lo que te pidan es lo próximo que hay que construir.
3. **Vídeos cortos (TikTok, Reels, YouTube Shorts).** "Cómo hacer un presupuesto de fontanería desde el móvil en 1 minuto". Graba la pantalla del móvil usando la app; no necesitas salir en cámara.
4. **SEO.** La landing ya está optimizada. Cuando funcione, crea una página por oficio y ciudad (por ejemplo "presupuesto fontanería Madrid") con enlace directo a `app.html?oficio=fontaneria`.
5. **Proveedores.** Almacenes de fontanería y electricidad tienen mostrador lleno de autónomos. Ofréceles un código descuento para sus clientes.

## 5. Medir

- Mira las ventas en el panel de Lemon Squeezy.
- Si quieres saber cuántas visitas tienes sin poner cookies, añade más adelante una analítica sin cookies como GoatCounter (gratis para uso personal). Si lo haces, actualiza la sección de privacidad en `legal.html`.

## Comprobar que todo funciona

```bash
node tests/e2e.cjs   # necesita Playwright con Chromium y pdftotext
```
