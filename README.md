# Tools

Un pequeño escritorio de herramientas gratuitas en el navegador. Abre varias aplicaciones a la vez, mueve sus ventanas, cambia su tamaño y guarda los archivos en tu equipo.

**[Abrir Tools](https://alejandropico.github.io/Tools/)**

## Aplicaciones disponibles

### Calculadora

Operaciones básicas, porcentajes, cambio de signo, inverso, raíz, cuadrado y memoria. Admite teclado, operaciones consecutivas y repetición de igual. El historial conserva los últimos 50 resultados en el navegador, permite recuperarlos y exportarlos a TXT. Sigue el cálculo secuencial de una calculadora estándar: `2 + 3 × 4 = 20`.

### Grabadora de audio

Graba desde el micrófono, muestra la onda de audio, permite pausar, reanudar, escuchar el resultado y ponerle nombre. Ofrece **Guardar como…** en navegadores compatibles y **Descargar** como alternativa. El archivo usa el formato que admita el navegador, como WebM/Opus, Ogg o M4A; no se promete MP3.

La grabación permanece en memoria hasta cerrar la herramienta o iniciar otra. Se avisa antes de descartar audio sin exportar. El límite por toma es una hora o aproximadamente 100 MB. No hay transcripción en esta versión.

### Explorador de archivos

Abre una carpeta autorizada o varios archivos, navega por subcarpetas, filtra por nombre y previsualiza texto, imágenes, audio y vídeo compatibles. Permite descargar o guardar una copia. Es de **solo lectura**: no borra ni modifica los originales.

El acceso directo a carpetas depende del navegador; se ofrece selección de carpeta mediante archivos como alternativa. En carpetas abiertas con la API de directorios se muestran hasta 2000 elementos por nivel. La vista de texto se limita a los primeros 200 KB, mientras que la descarga conserva el archivo completo. Los documentos HTML se muestran como texto.

## Ventanas y teclado

- Arrastra la barra superior para mover una ventana; arrastra su esquina inferior derecha para redimensionarla.
- Usa los botones de minimizar, maximizar/restaurar y cerrar. Recupera una ventana desde la barra inferior.
- Haz doble clic en la barra superior para maximizar o restaurar.
- Con la barra superior enfocada: flechas para mover y Mayús + flechas para ajustar el tamaño.
- En la calculadora: números y operaciones habituales, coma o punto decimal, Intro para igual, Retroceso para borrar una cifra y Esc para reiniciar.

Las ventanas se ajustan al espacio disponible; su contenido puede desplazarse cuando se reduce el tamaño.

## Tus datos y tus archivos

El procesamiento de archivos, audio y cálculos ocurre en el dispositivo. Tools no tiene cuentas, servidor de documentos, analítica ni envío de grabaciones. Solo el historial de cálculos se conserva entre sesiones, mediante almacenamiento local del navegador; puede perderse si borras los datos del sitio.

**Guardar como…** abre un selector para elegir el archivo de destino cuando existe soporte. **Descargar** utiliza la configuración del navegador: podrá preguntar la ubicación o usar tu carpeta de descargas. Tools no puede imponer ese ajuste.

El micrófono requiere HTTPS o localhost y permiso del navegador, solicitado al pulsar grabar. El explorador solo accede a lo que selecciones.

## Ejecutar en local

Requiere Node.js 22 o posterior, sin dependencias de terceros:

```sh
npm start
```

Abre `http://127.0.0.1:4187`. También puedes usar cualquier servidor estático; abrir `index.html` directamente como archivo no es suficiente para los módulos JavaScript.

```sh
npm test
npm run build
```

La compilación prepara `dist/`. GitHub Actions ejecuta las pruebas y publica ese directorio en GitHub Pages con cada cambio en `main`; el origen de Pages debe ser GitHub Actions. Las rutas son relativas y funcionan bajo `/Tools/`. La raíz también permite alojamiento estático directo.

## Estructura

```text
favicon.svg                 Identidad vectorial de Tools
index.html / app.js         Escritorio y catálogo
styles.css                  Estilo común
core/                       Ventanas, archivos y utilidades comunes
tools/
  calculator/               Calculadora, motor y estilos
  audio-recorder/           Grabadora, formatos y estilos
  file-explorer/            Explorador, modelo y estilos
tests/                      Pruebas y archivos de ejemplo
scripts/                    Servidor local y preparación del sitio
```

Cada herramienta vive en su propia carpeta dentro de `tools/`. El trabajo se realiza directamente en `main`, según la preferencia del propietario.

## Desarrollo y próximos pasos

La [hoja de ruta](ROADMAP.md) recoge nuevas utilidades y futuras mejoras. La [base técnica](docs/BASE-TECNICA.md) conserva las decisiones y referencias de diseño. Para comprobar la grabadora sin activar un micrófono real, abre `tests/browser.html` desde el servidor local: utiliza una señal sintética con `MediaRecorder` real. Esta página no se incluye en `dist/`.

## Licencia

Pendiente de elección e incorporación. La intención es distribuir Tools como software libre. Las funciones actuales son gratuitas y el código está publicado; los permisos de reutilización se concretarán con la licencia.
