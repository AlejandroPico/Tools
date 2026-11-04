# Bibliotecas incluidas

Tools procesa estos datos en el dispositivo. Las bibliotecas se instalan mediante `npm ci` y se empaquetan con el sitio; no se consultan servicios de conversión ni CDN durante el uso.

| Biblioteca | Versión | Licencia | Uso |
| --- | --- | --- | --- |
| [Transformers.js](https://github.com/huggingface/transformers.js) | 4.3.2 | Apache-2.0 | Transcripción local con Whisper |
| [ONNX Runtime Web](https://github.com/microsoft/onnxruntime) | 1.31.0-dev.20260914-8d85527a0 | MIT | Inferencia WebAssembly en el navegador |
| [PDF.js](https://github.com/mozilla/pdf.js) | 6.5.438 | Apache-2.0 | Dibujar páginas del visor PDF |
| [pdf-lib](https://github.com/Hopding/pdf-lib) | 1.17.1 | MIT | Unir, extraer, girar y crear PDF |
| [fflate](https://github.com/101arrowz/fflate) | 0.8.3 | MIT | Compresión y descompresión ZIP |
| [qrcode](https://github.com/soldair/node-qrcode) | 1.5.4 | MIT | Matrices QR |
| [JsBarcode](https://github.com/lindell/JsBarcode) | 3.12.3 | MIT | Códigos de barras |
| [esbuild](https://github.com/evanw/esbuild) | 0.28.2 | MIT | Empaquetado durante el desarrollo |
| [jsQR](https://github.com/cozmo/jsQR) | 1.4.0 | Apache-2.0 | Comprobación independiente de QR durante pruebas |

`package-lock.json` fija también las dependencias transitivas. La compilación conserva los avisos de licencia de los paquetes instalados en `vendor/LICENSES.txt`, y los avisos propios de fuentes y decodificadores de PDF.js dentro de sus carpetas. Estos archivos se incluyen en `dist/vendor/`.

La licencia del código propio de Tools sigue pendiente de elección. Las licencias de estas bibliotecas continúan aplicándose a sus componentes.

## Modelo de transcripción opcional

[Whisper Tiny de OpenAI](https://huggingface.co/openai/whisper-tiny), licencia Apache-2.0, convertido a ONNX en [onnx-community/whisper-tiny](https://huggingface.co/onnx-community/whisper-tiny). Tools fija la revisión `ff4177021cc41f7db950912b73ea4fdf7d01d8e7` y usa pesos cuantizados q8. Los pesos no se incluyen en Git ni en el despliegue; se descargan directamente del repositorio del modelo al pulsar Preparar modelo local y se conservan en la caché del navegador cuando está disponible. Los archivos de audio no salen del equipo. ONNX Runtime y sus módulos WebAssembly se distribuyen con el sitio.

## Apariencias

Los iconos de herramientas y gráficos de interfaz son SVG del proyecto. Los símbolos de Windows, Apple y Ubuntu identifican las apariencias inspiradas en esos sistemas; sus nombres y marcas pertenecen a Microsoft, Apple y Canonical respectivamente. Tools es un proyecto independiente.
