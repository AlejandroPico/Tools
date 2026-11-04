# Bibliotecas incluidas

Tools procesa estos datos en el dispositivo. Las bibliotecas se instalan mediante `npm ci` y se empaquetan con el sitio; no se consultan servicios de conversión ni CDN durante el uso.

| Biblioteca | Versión | Licencia | Uso |
| --- | --- | --- | --- |
| [PDF.js](https://github.com/mozilla/pdf.js) | 6.5.438 | Apache-2.0 | Dibujar páginas del visor PDF |
| [pdf-lib](https://github.com/Hopding/pdf-lib) | 1.17.1 | MIT | Unir, extraer, girar y crear PDF |
| [fflate](https://github.com/101arrowz/fflate) | 0.8.3 | MIT | Compresión y descompresión ZIP |
| [qrcode](https://github.com/soldair/node-qrcode) | 1.5.4 | MIT | Matrices QR |
| [JsBarcode](https://github.com/lindell/JsBarcode) | 3.12.3 | MIT | Códigos de barras |
| [esbuild](https://github.com/evanw/esbuild) | 0.28.2 | MIT | Empaquetado durante el desarrollo |
| [jsQR](https://github.com/cozmo/jsQR) | 1.4.0 | Apache-2.0 | Comprobación independiente de QR durante pruebas |

`package-lock.json` fija también las dependencias transitivas. La compilación conserva los avisos de licencia de los paquetes instalados en `vendor/LICENSES.txt`, y los avisos propios de fuentes y decodificadores de PDF.js dentro de sus carpetas. Estos archivos se incluyen en `dist/vendor/`.

La licencia del código propio de Tools sigue pendiente de elección. Las licencias de estas bibliotecas continúan aplicándose a sus componentes.
