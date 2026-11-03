# Hoja de ruta

Todas las entregas est�n pendientes. El orden es una propuesta inicial y podr� cambiar seg�n las necesidades que aparezcan.

## 1. Primera versi�n �til

- [ ] Elegir e incorporar una licencia libre.
- [ ] Crear una aplicaci�n est�tica que pueda alojarse en GitHub Pages bajo `/Tools/`.
- [ ] Cat�logo con buscador, categor�as y favoritos.
- [ ] Gestor de ventanas internas con vista completa y alternativa accesible por teclado.
- [ ] Guardado local con estados claros: guardando, guardado y error.
- [ ] Exportar e importar los datos de trabajo; explicar d�nde se guardan.
- [ ] Bloc de notas con varias notas, b�squeda, recuentos, TXT y Markdown.
- [ ] Calculadora b�sica con teclado, historial persistente y conversiones de unidades.
- [ ] Comprobar la experiencia en escritorio y m�vil y las alternativas en distintos navegadores.

**Criterio de entrega:** abrir una nota y la calculadora a la vez, escribir, calcular, recargar, recuperar el trabajo y exportarlo. Un fallo de almacenamiento debe avisarse sin presentar los datos como guardados.

## 2. Im�genes y capturas

- [ ] Abrir im�genes locales, recortar, girar y cambiar tama�o.
- [ ] Capturar una pesta�a, ventana o pantalla mediante el selector del navegador.
- [ ] Anotar con texto, flechas y formas; deshacer y rehacer.
- [ ] Exportar PNG y JPEG con dimensiones y calidad configurables.
- [ ] A�adir dibujo tipo Paint con pincel, goma, colores y lienzo configurable.

**Criterio de entrega:** importar o capturar una imagen, recortarla, anotarla y descargarla. Al cancelar el selector, la herramienta sigue siendo utilizable; al terminar se libera la captura.

## 3. Audio, pantalla y webcam

- [ ] Grabadora de micr�fono con selector de entrada cuando est� disponible.
- [ ] Grabaci�n de pantalla con opciones de audio compatibles con el navegador.
- [ ] Captura de foto y grabaci�n de webcam.
- [ ] Indicador de grabaci�n, duraci�n, parada, previsualizaci�n y descarga.
- [ ] Detectar formatos disponibles y mostrar el formato real del archivo.
- [ ] Definir l�mites de tama�o y recuperaci�n ante falta de espacio.

**Criterio de entrega:** grabar, detener, reproducir y descargar; liberar c�mara, micr�fono y pantalla al finalizar o cerrar la herramienta. Gestionar permisos denegados y el fin de la compartici�n desde el navegador.

## 4. Voz y texto

- [ ] Investigar transcripci�n local: motores del navegador y modelos descargables con licencia compatible.
- [ ] Medir precisi�n en espa�ol, consumo de memoria y funcionamiento en equipos modestos.
- [ ] Separar dictado en directo de transcripci�n de archivos ya grabados.
- [ ] Editor de transcripci�n con correcciones y exportaci�n TXT/Markdown.
- [ ] Lector en voz alta con las voces disponibles y explicaci�n de su procesamiento.
- [ ] Definir un intercambio de audio y texto con el futuro proyecto del blog.

**Criterio de entrega:** indicar d�nde se procesa el audio; el modo local debe funcionar sin enviar su contenido a servicios externos. La elaboraci�n de art�culos pertenecer� al proyecto del blog o a una integraci�n expl�cita posterior.

## 5. Ampliaciones

Ideas sin compromiso de implementaci�n ni prioridad asignada:

| Familia | Ideas |
| --- | --- |
| C�lculo | Cient�fica, gr�fica, programador, fechas, porcentajes, zonas horarias |
| Conversi�n | Unidades, bases num�ricas, colores y divisas con fuente y fecha |
| Tiempo | Cron�metro, temporizadores, Pomodoro y reloj mundial |
| Texto | Comparar textos, limpiar formato, contar palabras, buscar y reemplazar |
| Archivos | Explorador de carpetas autorizadas, visor hexadecimal y sumas de verificaci�n |
| Imagen | Cuentagotas, paletas de color, compresi�n y conversi�n de formatos compatibles |
| Documentos | Unir, dividir, ordenar y rotar PDF mediante una biblioteca adecuada |
| Desarrollo | Formatear JSON, probar expresiones regulares, codificar URL y Base64 |
| Utilidades | Crear y leer QR, generar contrase�as localmente con aleatoriedad criptogr�fica |
| Accesibilidad | Ampliaci�n del contenido de Tools, lectura y ayudas de entrada |

La instalaci�n como aplicaci�n y el uso sin conexi�n se a�adir�n cuando el cat�logo y el almacenamiento tengan una base estable. Se indicar� qu� herramientas siguen necesitando red.

## C�mo elegir la siguiente herramienta

Cada propuesta debe responder a estas preguntas:

1. �Qu� situaci�n concreta resuelve y qu� mejora aporta?
2. �Qu� incluye la primera versi�n y qu� queda para despu�s?
3. �Qu� datos necesita, d�nde se procesan y c�mo se exportan?
4. �Funciona localmente? �Qu� permisos, dependencias o servicios requiere?
5. �Qu� alternativa se ofrece si el navegador no admite la funci�n?
6. �C�mo se comprueba que el resultado es correcto y el trabajo se conserva?

Una nueva herramienta debe aprovechar el cat�logo, las ventanas y el guardado comunes, cargando sus dependencias solo cuando se abre.
