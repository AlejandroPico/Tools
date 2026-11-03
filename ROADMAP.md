# Hoja de ruta

Todas las entregas están pendientes. El orden es una propuesta inicial y podrá cambiar según las necesidades que aparezcan.

## 1. Primera versión útil

- [ ] Elegir e incorporar una licencia libre.
- [ ] Crear una aplicación estática que pueda alojarse en GitHub Pages bajo `/Tools/`.
- [ ] Catálogo con buscador, categorías y favoritos.
- [ ] Gestor de ventanas internas con vista completa y alternativa accesible por teclado.
- [ ] Guardado local con estados claros: guardando, guardado y error.
- [ ] Exportar e importar los datos de trabajo; explicar dónde se guardan.
- [ ] Bloc de notas con varias notas, búsqueda, recuentos, TXT y Markdown.
- [ ] Calculadora básica con teclado, historial persistente y conversiones de unidades.
- [ ] Comprobar la experiencia en escritorio y móvil y las alternativas en distintos navegadores.

**Criterio de entrega:** abrir una nota y la calculadora a la vez, escribir, calcular, recargar, recuperar el trabajo y exportarlo. Un fallo de almacenamiento debe avisarse sin presentar los datos como guardados.

## 2. Imágenes y capturas

- [ ] Abrir imágenes locales, recortar, girar y cambiar tamaño.
- [ ] Capturar una pestaña, ventana o pantalla mediante el selector del navegador.
- [ ] Anotar con texto, flechas y formas; deshacer y rehacer.
- [ ] Exportar PNG y JPEG con dimensiones y calidad configurables.
- [ ] Añadir dibujo tipo Paint con pincel, goma, colores y lienzo configurable.

**Criterio de entrega:** importar o capturar una imagen, recortarla, anotarla y descargarla. Al cancelar el selector, la herramienta sigue siendo utilizable; al terminar se libera la captura.

## 3. Audio, pantalla y webcam

- [ ] Grabadora de micrófono con selector de entrada cuando esté disponible.
- [ ] Grabación de pantalla con opciones de audio compatibles con el navegador.
- [ ] Captura de foto y grabación de webcam.
- [ ] Indicador de grabación, duración, parada, previsualización y descarga.
- [ ] Detectar formatos disponibles y mostrar el formato real del archivo.
- [ ] Definir límites de tamaño y recuperación ante falta de espacio.

**Criterio de entrega:** grabar, detener, reproducir y descargar; liberar cámara, micrófono y pantalla al finalizar o cerrar la herramienta. Gestionar permisos denegados y el fin de la compartición desde el navegador.

## 4. Voz y texto

- [ ] Investigar transcripción local: motores del navegador y modelos descargables con licencia compatible.
- [ ] Medir precisión en español, consumo de memoria y funcionamiento en equipos modestos.
- [ ] Separar dictado en directo de transcripción de archivos ya grabados.
- [ ] Editor de transcripción con correcciones y exportación TXT/Markdown.
- [ ] Lector en voz alta con las voces disponibles y explicación de su procesamiento.
- [ ] Definir un intercambio de audio y texto con el futuro proyecto del blog.

**Criterio de entrega:** indicar dónde se procesa el audio; el modo local debe funcionar sin enviar su contenido a servicios externos. La elaboración de artículos pertenecerá al proyecto del blog o a una integración explícita posterior.

## 5. Ampliaciones

Ideas sin compromiso de implementación ni prioridad asignada:

| Familia | Ideas |
| --- | --- |
| Cálculo | Científica, gráfica, programador, fechas, porcentajes, zonas horarias |
| Conversión | Unidades, bases numéricas, colores y divisas con fuente y fecha |
| Tiempo | Cronómetro, temporizadores, Pomodoro y reloj mundial |
| Texto | Comparar textos, limpiar formato, contar palabras, buscar y reemplazar |
| Archivos | Explorador de carpetas autorizadas, visor hexadecimal y sumas de verificación |
| Imagen | Cuentagotas, paletas de color, compresión y conversión de formatos compatibles |
| Documentos | Unir, dividir, ordenar y rotar PDF mediante una biblioteca adecuada |
| Desarrollo | Formatear JSON, probar expresiones regulares, codificar URL y Base64 |
| Utilidades | Crear y leer QR, generar contraseñas localmente con aleatoriedad criptográfica |
| Accesibilidad | Ampliación del contenido de Tools, lectura y ayudas de entrada |

La instalación como aplicación y el uso sin conexión se añadirán cuando el catálogo y el almacenamiento tengan una base estable. Se indicará qué herramientas siguen necesitando red.

## Cómo elegir la siguiente herramienta

Cada propuesta debe responder a estas preguntas:

1. ¿Qué situación concreta resuelve y qué mejora aporta?
2. ¿Qué incluye la primera versión y qué queda para después?
3. ¿Qué datos necesita, dónde se procesan y cómo se exportan?
4. ¿Funciona localmente? ¿Qué permisos, dependencias o servicios requiere?
5. ¿Qué alternativa se ofrece si el navegador no admite la función?
6. ¿Cómo se comprueba que el resultado es correcto y el trabajo se conserva?

Una nueva herramienta debe aprovechar el catálogo, las ventanas y el guardado comunes, cargando sus dependencias solo cuando se abre.
