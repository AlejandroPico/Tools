# Instrucciones del proyecto

- Trabajar directamente en `main`. El propietario ha autorizado expresamente los cambios y la publicación en esta rama. No crear ramas secundarias ni pull requests salvo una nueva instrucción suya.
- Cada aplicación debe vivir en `tools/<nombre>/`. La infraestructura compartida pertenece a `core/`; el escritorio se mantiene en la raíz.
- Mantener `favicon.svg` vectorial en la raíz y utilizarlo como identidad de Tools.
- Todos los componentes tienen esquinas rectas: ventanas, menús, botones, campos y paneles. Solo los iconos de aplicaciones conservan sus marcos redondeados en Tools. Excepción autorizada posterior: las apariencias Windows, macOS y Ubuntu adaptan bordes, controles y barras a sus sistemas. Inicio se titula «Aplicaciones», con búsqueda, categorías y listado compacto; sin contadores ni textos promocionales.
- Agrupar funciones relacionadas en una misma aplicación: Bloc de notas para texto, Reloj para tiempo y calendario, Calculadora con modos. Los bloques de la hoja de ruta representan familias de funciones, no necesariamente aplicaciones separadas.
- Arrancar siempre con el escritorio vacío, sin abrir aplicaciones automáticamente, tampoco desde enlaces con fragmentos. Mantenerlo libre de bienvenida, marca superior, botones permanentes y accesos en el fondo.
- Abrir aplicaciones desde Inicio. En la barra inferior solo aparecen las ventanas abiertas, además de Inicio y reloj; no mostrar recuentos de herramientas ni aplicaciones fijadas. La barra queda pegada al borde inferior.
- El botón derecho sobre el escritorio abre su menú contextual. Sus propiedades incluyen 32 temas seleccionables: ocho de mañana, tarde, noche y Mate. El color Negro de Mate debe usar #000000 sin degradados, brillos ni sombras. Los nombres de Mate son Negro, Grafito, Carbón, Azul, Verde, Ciruela, Arena y Blanco, sin sufijos. Acerca de Tools es la última opción; dentro van Tools, favicon, portfolio y repositorio. No poner un botón de Acerca de en la parte superior.
- Ofrecer las apariencias Tools, Windows, macOS y Ubuntu en una pestaña Apariencia de las propiedades, independientes de los 32 colores. Guardar tema, apariencia, accesibilidad y geometría de ventanas localmente, conservando el arranque vacío. Permitir mover ventanas hasta los cuatro límites de la pantalla y redimensionar por todos los bordes y esquinas.
- Ofrecer ventanas movibles, redimensionables y minimizables. No convertir las herramientas en páginas completas por defecto.
- Procesar los datos localmente. Los archivos generados deben poder descargarse; ofrecer un selector de destino cuando el navegador lo admita y explicar el comportamiento de la descarga alternativa.
- No pedir permisos de micrófono, cámara o archivos hasta una acción explícita de la persona. Liberar los dispositivos al terminar o cerrar.
- Mantener la interfaz en español, accesible por teclado y utilizable en pantallas pequeñas.
- Ejecutar `npm test` y `npm run build` antes de publicar. Verificar visualmente los cambios de interfaz y comprobar el comportamiento afectado.
- No añadir servicios de pago ni envío de archivos. La transcripción solicitada utiliza Whisper Tiny local: descargar sus pesos solo mediante el botón explícito Preparar modelo local, con revisión fijada y aviso de tamaño/origen. No enviar audio. Dictado solo con processLocally; lectura solo con voces locales.
