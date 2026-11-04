# Hoja de ruta

Las 70 ideas iniciales se organizan en 14 familias de funciones, que se agrupan en aplicaciones cuando encajan juntas. No hay un compromiso de crear 70 ventanas o iconos independientes.

## Estado de las familias

| Bloque | Familia | Funciones previstas | Estado |
| --- | --- | --- | --- |
| 1 | Texto | Notas con pestañas, Markdown, comparación, limpieza, recuentos | Primera versión disponible en Bloc de notas |
| 2 | Tiempo | Cronómetro con vueltas, temporizadores, Pomodoro, ciudades, calendario con notas | Primera versión disponible en Reloj, con alarmas adicionales |
| 3 | Cálculo | Científica, gráfica, programador, fechas/edades, unidades | Primera versión disponible como modos de Calculadora |
| 4 | Datos y programación | JSON, CSV, expresiones regulares, bases numéricas, URL/Base64 | Primera versión disponible en Datos |
| 5 | Imágenes | Paint, recortes, tamaño, formatos, compresión | Primera versión disponible en Imagen |
| 6 | Diseño y colores | Cuentagotas, paletas, contraste, degradados, SVG | Primera versión disponible en Diseño |
| 7 | Utilidades | Contraseñas, QR, códigos de barras, números aleatorios, sorteos | Primera versión disponible en Utilidades |
| 8 | Archivos | ZIP, comparación, hexadecimal, SHA-256, generación de archivos | Primera versión disponible en Archivos, junto al explorador |
| 9 | PDF | Visor, unir, separar, reordenar/rotar, imágenes a PDF | Primera versión disponible en PDF |
| 10 | Capturas y cámara | Imagen de pantalla, vídeo de pantalla, foto/vídeo de webcam, grabadora con marcas | Pendiente; grabación básica de audio ya disponible |
| 11 | Audio | Recortar, unir, convertir, reproducir con velocidad, tonos | Pendiente |
| 12 | Voz y lectura | Transcripción, dictado, voz, subtítulos, teleprónter | Pendiente |
| 13 | Productividad | Tarjetas, pizarra, mapas mentales, tareas, diagramas | Pendiente |
| 14 | Accesibilidad | Lupa, lectura, teclado, filtros, contraste/tamaño | Pendiente |

## Base común ya disponible

- Escritorio vacío al iniciar, ventanas movibles hasta los cuatro límites y tamaño ajustable por todos los bordes y esquinas.
- Inicio con búsqueda, categorías y listado alfabético; barra con solo ventanas abiertas, Inicio y reloj.
- Esquinas rectas en la interfaz, salvo los marcos de iconos.
- Menú contextual, organización en cascada/mosaico y Acerca de como última opción.
- 32 temas de mañana, tarde, noche y Mate, incluido Negro #000000; preferencias y geometría locales.
- Exportación de archivos, borradores de notas, historial, estado del Reloj y borradores de Datos, Imagen y Diseño locales.
- Pruebas automáticas y publicación mediante GitHub Actions desde main.

## Criterio para cerrar cada entrega

1. Una primera versión utilizable de todas las funciones del bloque, agrupadas con sentido.
2. Ventanas, temas y acceso por teclado integrados con el escritorio.
3. Guardado local y exportación cuando corresponda, con errores visibles.
4. Pruebas de los resultados, permisos y conservación de datos.
5. Comprobación visual y publicación en main.

Las siguientes entregas pueden ampliar las versiones existentes. Las funciones multimedia, PDF y voz se desarrollarán por partes dentro de su bloque, documentando soporte, formatos y límites de cada navegador.

## Decisiones pendientes

- Elegir e incorporar una licencia libre.
- Definir la instalación y el funcionamiento sin conexión.
- Valorar modelos locales de transcripción por precisión, licencia, tamaño y rendimiento.
- Mantener separadas las funciones que exigen una aplicación nativa o extensión: acceso libre a todo el disco, alarmas con el navegador cerrado y control de otras aplicaciones no forman parte de una web estática.
