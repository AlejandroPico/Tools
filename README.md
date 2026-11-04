# Tools

Un pequeño escritorio de herramientas gratuitas en el navegador. Abre varias aplicaciones a la vez, mueve sus ventanas, cambia su tamaño y guarda los archivos en tu equipo.

**[Abrir Tools](https://alejandropico.github.io/Tools/)**

## Aplicaciones disponibles

Las funciones se agrupan en aplicaciones completas; las 70 ideas iniciales no implican 70 iconos. Los nueve primeros bloques se reúnen en aplicaciones con funciones agrupadas. También está disponible la Grabadora básica.

### Bloc de notas

Varias notas con pestañas, título y autoguardado en IndexedDB. Incluye editor de texto, vista Markdown básica (títulos, listas, citas, código, énfasis y enlaces), comparación por líneas, búsqueda y reemplazo literal, limpieza de espacios y cambios de mayúsculas. Muestra palabras, caracteres Unicode, líneas y tiempo orientativo de lectura.

Abre TXT/Markdown, exporta la nota a TXT o MD y guarda/restaura copias JSON de todas las notas. Los borradores del navegador y el archivo exportado son distintos. Los fallos de guardado se muestran y no se presentan como escrituras completadas. La comparación admite 500 000 caracteres y 4000 líneas por operación, y la vista Markdown se limita a 200 000 caracteres; la nota completa se conserva para exportación.

### Reloj

Se abre desde Inicio **o pulsando la fecha y hora de la barra**. Reúne reloj local y ciudades, cronómetro con vueltas y CSV, temporizadores simultáneos, Pomodoro configurable, alarmas de una vez/diarias/laborables y calendario con notas por día y exportación JSON.

Los temporizadores, alarmas y Pomodoro continúan al minimizar o cerrar su ventana. Sus ajustes y las notas se guardan localmente. Los plazos se calculan con marcas de tiempo, no contando llamadas de un intervalo.

**Tools debe permanecer abierto y el equipo despierto para avisar a tiempo.** El navegador puede suspender o retrasar pestañas; no es un despertador del sistema y no despierta equipos apagados o suspendidos. Al volver a abrir se comprueban los avisos vencidos. El sonido se habilita mediante una acción de la persona y las notificaciones del sistema son opcionales. Referencias: [pestañas en segundo plano](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API), [notificaciones](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API).

### Calculadora

Operaciones básicas, porcentajes, cambio de signo, inverso, raíz, cuadrado y memoria. Admite teclado, operaciones consecutivas y repetición de igual. El historial conserva los últimos 50 resultados en el navegador, permite recuperarlos y exportarlos a TXT. Sigue el cálculo secuencial de una calculadora estándar: `2 + 3 × 4 = 20`.

El botón de menú lateral cambia entre seis modos de la **misma calculadora**:

- Estándar.
- Científica: expresiones con prioridad, paréntesis, trigonometría DEG/RAD, logaritmos, potencias, factorial y resultado anterior. `%` representa resto en expresiones científicas. Usa un analizador propio, sin ejecutar código introducido por la persona.
- Gráfica: hasta tres funciones de x, rangos editables, desplazamiento, zoom y exportación PNG/CSV. Las curvas son muestras aproximadas; los puntos fuera del dominio se omiten.
- Programador: enteros exactos con BigInt, bases 2/8/10/16, palabras de 8/16/32/64 bits, signo, operaciones lógicas y bits editables. Los desbordamientos se ajustan al tamaño de palabra.
- Fechas y edades: diferencia en días y años/meses/días, suma y resta de días, meses y años.
- Unidades: longitud, superficie, volumen, masa, temperatura, velocidad, tiempo, energía, presión y datos digitales.

### Datos

Cinco espacios en una ventana: JSON con validación, sangría, compactado y orden de claves; CSV con tabla editable y paginada; expresiones regulares con grupos y sustitución; URL/Base64 con UTF-8 y descarga de bytes; conversión exacta de enteros entre bases 2/8/10/16. JSON conserva los lexemas originales de números y claves repetidas, evitando redondear enteros grandes.

JSON y CSV admiten hasta 5 millones de caracteres (archivos de entrada de hasta 5 MB). CSV admite 3.000 filas, 100 columnas y 50.000 celdas. Puedes guardar el texto CSV o la tabla por separado y activar protección de fórmulas al exportar la tabla. Las expresiones regulares se ejecutan en un Worker que se interrumpe al superar un segundo; el texto admite 200.000 caracteres y la vista hasta 1.000 coincidencias. Las capturas y sustituciones tienen límites de memoria. Las bases numéricas admiten hasta 256 cifras de entrada sin recorte a 64 bits.

### Imagen

Lienzo transparente con pincel, borrador, líneas, rectángulos, elipses, texto y relleno con tolerancia. Incluye deshacer/rehacer (hasta 20 estados y un presupuesto de 64 MB), recorte por selección o coordenadas, tamaño con proporción y suavizado, giro de 90° y volteos. Abre imágenes locales o arrástralas al lienzo.

Exporta **PNG, JPEG y WebP**, si el navegador ofrece ese codificador. JPEG y WebP permiten elegir calidad y comparar el tamaño del archivo preparado. PNG conserva transparencia; JPEG la compone sobre blanco. Primero pulsa **Preparar archivo** y después **Guardar como…** o **Descargar**. Cambiar el lienzo o la calidad invalida el archivo preparado. El original no se modifica.

Límite: 30 MB de entrada, 4.096 píxeles por lado y 8 millones de píxeles en el lienzo. GIF se importa como imagen fija; no se editan animaciones, metadatos ni capas. Los SVG de entrada pasan por la misma limpieza que en Diseño. El borrador se guarda como PNG local en IndexedDB; no conserva el historial de deshacer entre sesiones.

### Diseño

Cuentagotas sobre una imagen local (clic o coordenadas), valores HEX/RGB/HSL, extracción de colores y paletas editables de hasta 16 colores. Importa/exporta paletas JSON, variables CSS y muestras SVG. El comprobador de contraste calcula la relación WCAG y los umbrales AA/AAA para colores opacos.

Genera degradados lineales de 2 a 8 paradas con ángulo y posiciones, con exportación CSS, SVG y PNG. El editor de SVG estático admite formas, texto, grupos, degradados, máscaras y recortes. La vista utiliza una imagen aislada; el código se valida y limpia antes de previsualizar o exportar. Se retiran scripts, eventos, HTML, animación, recursos externos, estilos globales y elementos use. La vista puede cambiar si el original utilizaba esas funciones: revisa el resultado. El SVG exportado siempre es el documento limpio. Límite: 1 MB y 5.000 elementos; PNG respeta el límite de tamaño de Imagen.

Datos y Diseño tienen un selector **Al guardar** para elegir destino o descargar directamente. Sus entradas y ajustes se guardan como borradores locales. Las imágenes utilizadas como referencia en el cuentagotas permanecen en memoria durante la sesión; la paleta extraída sí se conserva.

### Utilidades

Generador criptográfico de contraseñas con longitud, grupos de caracteres, opción para evitar caracteres parecidos, mostrar/ocultar, copiar y guardar TXT. No guarda contraseñas como borradores. Números enteros aleatorios con límites incluidos, repetición opcional y hasta 10.000 resultados; selección sin sesgo mediante rechazo. Sorteos desde una lista de nombres, con unificación opcional de duplicados y exportación del resultado.

Genera QR de texto UTF-8 y enlaces, con niveles L/M/Q/H, margen de lectura y salida SVG/PNG. Incluye códigos de barras Code 128, Code 39, EAN-13, EAN-8, UPC-A e ITF-14; calcula o valida la cifra de control en los formatos numéricos. Los códigos utilizan fondo blanco para mantener su lectura. El contenido y los resultados de Utilidades permanecen en memoria hasta cerrar la ventana.

### PDF

Visor local con zoom, navegación y vista de la copia preparada. Añade varios PDF a una lista común, selecciona páginas con casillas o rangos, reordena mediante arrastre o botones, gira la selección y deshaz la organización. **Un PDF** une o extrae las páginas seleccionadas en el orden mostrado; **Un PDF por página** las separa en documentos individuales dentro de un ZIP. También convierte imágenes a PDF con A4 de orientación automática o tamaño original a 96 ppp, proporción conservada y márgenes configurables.

Primero prepara el resultado, revísalo y después guárdalo o descárgalo. La entrada se limita a 50 MiB en total y 500 páginas; la salida PDF a 100 MiB. Las imágenes respetan los límites del editor Imagen. Los archivos permanecen en la ventana hasta cerrarla; no se guardan copias automáticas de los PDF en el navegador. Se avisa antes de descartar una organización o resultado sin exportar.

Los formularios AcroForm y las firmas requieren activar explícitamente **Convertir formularios y firmas a copia estática** antes de exportar: los campos dejan de ser interactivos y las firmas no conservan su validez. Los originales permanecen intactos. No se admiten PDF cifrados, XFA ni formularios con widgets no vinculados correctamente. Las copias contienen páginas; no se mantiene la estructura de marcadores del documento original. No incluye OCR, edición de texto PDF ni firma digital.

### Grabadora de audio

Graba desde el micrófono, muestra la onda de audio, permite pausar, reanudar, escuchar el resultado y ponerle nombre. Ofrece **Guardar como…** en navegadores compatibles y **Descargar** como alternativa. El archivo usa el formato que admita el navegador, como WebM/Opus, Ogg o M4A; no se promete MP3.

La grabación permanece en memoria hasta cerrar la herramienta o iniciar otra. Se avisa antes de descartar audio sin exportar. El límite por toma es una hora o aproximadamente 100 MB. No hay transcripción en esta versión.

### Explorador de archivos

Abre una carpeta autorizada o varios archivos, navega por subcarpetas con atrás/adelante, ruta y acceso a la carpeta principal, filtra por nombre y previsualiza texto, imágenes, audio y vídeo compatibles. Muestra tamaños y permite descargar o guardar una copia.

Con acceso directo a carpetas permite **copiar y pegar archivos**, crear carpetas y crear archivos TXT con contenido. La escritura se solicita al realizar esas acciones. Las copias buscan un nombre libre y no reemplazan deliberadamente elementos existentes; no se ofrecen borrado, corte ni renombrado.

Recuerda la carpeta y subcarpeta mediante identificadores guardados en IndexedDB. Al abrir Archivos restaura esa ubicación si el permiso sigue vigente; si no, muestra **Volver a conectar**. La primera selección es obligatoria: una web no puede descubrir libremente el disco ni la ruta completa `C:\…`. La ruta visible comienza en la carpeta autorizada. Referencia: [File System Access](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access).

El acceso directo a carpetas depende del navegador; se ofrece selección de carpeta mediante archivos como alternativa. En carpetas abiertas con la API de directorios se muestran hasta 2000 elementos por nivel. La vista de texto se limita a los primeros 200 KB, mientras que la descarga conserva el archivo completo. Los documentos HTML se muestran como texto.

Archivos también incluye estas pestañas:

- **ZIP:** añadir archivos o una carpeta, editar rutas internas, comprimir, inspeccionar y extraer. Guarda archivos individuales o extrae todo dentro de una carpeta nueva autorizada. Límite de 2.000 entradas y 100 MiB comprimidos/descomprimidos; ZIP estándar sin cifrar, métodos Almacenar/Deflate. No admite ZIP64, varios discos, enlaces simbólicos ni nombres no ASCII sin UTF-8. Valida rutas, colisiones, tamaños y CRC antes de entregar archivos extraídos. La extracción se ejecuta en un Worker cancelable.
- **Comparar:** comparación por bytes de dos archivos de hasta 200 MiB, primera posición diferente, recuento y hasta 100 diferencias, vistas de texto parciales e informe TXT.
- **Hexadecimal:** edición de una copia en memoria de hasta 16 MiB, posición decimal/hexadecimal, cambio de bytes, pegado de bloques de hasta 64 KiB, deshacer/rehacer y exportación. No altera el original.
- **SHA-256:** cálculo local hasta 100 MiB, comparación con una huella esperada, copia y archivo `.sha256`.
- **Crear archivo:** ceros, byte repetido o contenido aleatorio criptográfico hasta 32 MiB, o texto UTF-8 de hasta 5 millones de caracteres. Preparación y guardado de una copia local.

Los archivos abiertos, los ZIP y las copias binarias permanecen en memoria hasta cerrar Archivos. No sustituyen a los archivos de tu disco; guarda los resultados que quieras conservar.

## Ventanas y teclado

- El escritorio arranca siempre vacío. Abre aplicaciones desde Inicio; la barra inferior solo muestra las ventanas abiertas, Inicio y el reloj, sin accesos fijados ni recuentos.
- Arrastra la barra superior para mover una ventana hasta cualquier borde del escritorio; arrastra cualquiera de sus bordes o esquinas para redimensionarla. La esquina inferior derecha muestra un tirador visible.
- Usa los botones de minimizar, maximizar/restaurar y cerrar. Recupera una ventana desde la barra inferior.
- Haz doble clic en la barra superior para maximizar o restaurar.
- Con la barra superior enfocada: flechas para mover y Mayús + flechas para ajustar el tamaño.
- En la calculadora: números y operaciones habituales, coma o punto decimal, Intro para igual, Retroceso para borrar una cifra y Esc para reiniciar.

Las ventanas se ajustan al espacio disponible; su contenido puede desplazarse cuando se reduce el tamaño.

Ventanas, paneles, campos y botones tienen esquinas rectas. Solo los marcos de iconos mantienen redondeado. Inicio se titula **Aplicaciones**, con listado alfabético, búsqueda por nombre o función y categorías; no muestra contadores ni frases promocionales.

## Personalizar el escritorio

Pulsa el botón derecho sobre el fondo para abrir el menú propio del escritorio. Incluye acceso a las aplicaciones, organización de ventanas en cascada o mosaico, **Propiedades del escritorio** y, como última opción, **Acerca de Tools**. En pantallas táctiles, mantén pulsado un espacio vacío. También puedes abrirlo con la tecla de menú contextual o Mayús + F10.

Las propiedades ofrecen **32 temas seleccionables**, ocho por categoría: mañana, tarde, noche y **Mate**, que cambian el fondo y los colores de las ventanas. Los ocho Mate son fondos sólidos sin degradados, sombras ni efectos de brillo: Negro, Grafito, Carbón, Azul, Verde, Ciruela, Arena y Blanco. **Negro utiliza #000000 tanto en el fondo como en los paneles**, manteniendo controles y texto legibles.

El tema elegido y la última posición y tamaño de cada herramienta se guardan en este navegador. Al volver a entrar no se reabren ventanas automáticamente; recuperan su geometría cuando las abres desde Inicio.

El área de escritorio ocupa toda la pantalla. La barra está pegada abajo; una ventana movida hasta el borde inferior puede quedar parcialmente detrás de ella. Al maximizar se utiliza el espacio por encima de la barra.

## Tus datos y tus archivos

El procesamiento de archivos, audio y cálculos ocurre en el dispositivo. Tools no tiene cuentas, servidor de documentos, analítica ni envío de grabaciones. Preferencias, historial y estado del Reloj se guardan en localStorage; notas, borradores de Datos/Imagen/Diseño e identificadores de carpetas en IndexedDB. Pueden perderse si borras los datos del sitio. Los archivos del explorador permanecen en sus carpetas y las grabaciones no se guardan automáticamente entre sesiones. Las copias exportadas son independientes de esos borradores.

**Guardar como…** abre un selector para elegir el archivo de destino cuando existe soporte. **Descargar** utiliza la configuración del navegador: podrá preguntar la ubicación o usar tu carpeta de descargas. Tools no puede imponer ese ajuste.

El micrófono requiere HTTPS o localhost y permiso del navegador, solicitado al pulsar grabar. El explorador solo accede a lo que selecciones.

## Ejecutar en local

Requiere Node.js 22.16 o posterior. Instala las versiones fijadas y arranca la vista local:

```sh
npm ci
npm start
```

Abre `http://127.0.0.1:4187`. También puedes usar cualquier servidor estático; abrir `index.html` directamente como archivo no es suficiente para los módulos JavaScript.

```sh
npm test
npm run build
```

La compilación prepara las bibliotecas en `vendor/` y el sitio completo en `dist/`. `vendor/` se genera, no se versiona, y contiene también el motor del visor, sus fuentes y decodificadores. La web publicada utiliza estos archivos locales y no carga bibliotecas desde CDN. Consulta [dependencias y licencias](THIRD-PARTY.md). GitHub Actions ejecuta las pruebas y publica ese directorio en GitHub Pages con cada cambio en `main`; el origen de Pages debe ser GitHub Actions. Las rutas son relativas y funcionan bajo `/Tools/`. La raíz también permite alojamiento estático directo.

## Estructura

```text
favicon.svg                 Identidad vectorial de Tools
index.html / app.js         Escritorio y catálogo
styles.css                  Estilo común
core/                       Ventanas, archivos y utilidades comunes
tools/
  notepad/                  Bloc de notas y herramientas de texto
  clock/                    Reloj y servicio de avisos
  calculator/               Calculadora, motor y estilos
  data/                     JSON, CSV, expresiones y conversiones
  image/                    Dibujo y edición de imágenes
  design/                   Colores, degradados y SVG
  audio-recorder/           Grabadora, formatos y estilos
  file-explorer/            Explorador, ZIP y herramientas binarias
  utilities/                Contraseñas, códigos, números y sorteos
  pdf/                      Visor y organización local de PDF
tests/                      Pruebas y archivos de ejemplo
scripts/                    Servidor local y preparación del sitio
```

Cada herramienta vive en su propia carpeta dentro de `tools/`. El trabajo se realiza directamente en `main`, según la preferencia del propietario.

## Desarrollo y próximos pasos

La [hoja de ruta](ROADMAP.md) recoge las 14 familias y el estado de las entregas. La [base técnica](docs/BASE-TECNICA.md) conserva decisiones y referencias. `tests/browser.html` prueba la grabadora con audio sintético; `tests/explorer.html` prueba copias y creación con identificadores reales de una carpeta aislada del navegador, sin acceder al disco del usuario. `tests/creative.html` comprueba limpieza de SVG, imágenes y Worker de datos con una imagen de ejemplo. `node scripts/qa-fixtures.mjs` prepara archivos propios de prueba en `.local/qa789/` para verificar ZIP, bytes, PDF y formularios sin usar documentos personales. Las páginas de prueba no se incluyen en `dist/`.

## Licencia

Pendiente de elección e incorporación. La intención es distribuir Tools como software libre. Las funciones actuales son gratuitas y el código está publicado; los permisos de reutilización se concretarán con la licencia.
