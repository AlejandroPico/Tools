# Comprobación de las primeras versiones 10–14

Entrega de noviembre de 2026, integrada directamente en main. Las familias son Capturas, Audio, Voz, Productividad y Accesibilidad; Grabadora incorpora marcas.

## Resultados comprobados

- 69 pruebas automáticas: se conservan las anteriores y se añaden PCM/WAV, recortes y fundidos, unión, tonos, SRT/VTT, validación de gráficos, SVG seguro, pizarra, teclado Unicode y apariencias.
- Compilación completa del sitio, bibliotecas y motores WebAssembly en `dist/`; las páginas de prueba no se publican.
- Captura de una fuente sintética real mediante MediaStream: PNG recortado descargado de 320 × 180, vídeo WebM con pausa/reanudación, pistas liberadas al terminar y al cerrar la cámara.
- Tonos WAV de 2 segundos; recorte descargado de 1 segundo; unión descargada de 3 segundos. Verificación independiente de cabeceras, frecuencia de 48 kHz y mono. Conversión nativa a WebM/Opus y reproducción preparada.
- Preparación real de Whisper Tiny q8 en WebAssembly, transcripción en inglés del [audio público de JFK del ejemplo de Transformers.js](https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/jfk.wav), envío a Subtítulos y descarga SRT. Resultado reconocido: la frase «ask not what your country can do for you». No se sustituye el reconocimiento por un texto simulado.
- El navegador de prueba ofrece español como paquete de dictado local descargable. No se instala un paquete del sistema durante las pruebas. La disponibilidad del dictado en directo depende del navegador; el reconocimiento de archivos con Whisper sí se ha comprobado.
- Voces locales enumeradas; inicio y parada de lectura; edición, autoguardado y controles del teleprónter.
- Creación de tareas, tarjetas y mapas mentales; nodos y conexiones etiquetadas en diagramas; documentos JSON exportados y validados. Pizarra exportada a PNG de 1600 × 900; SVG de diagrama con flechas y texto. Recuperación del diagrama tras recargar.
- Ajustes de tamaño al 150 %, alto contraste y filtro gris, seguidos de restablecimiento. Lupa de imagen. Teclado virtual escribiendo «Prueba: hola» en una nota nueva y activando su autoguardado.
- Marca durante una grabación sintética; descarga JSON con tiempo, etiqueta y nombre del archivo. Las pruebas de micrófono y cámara usan fuentes sintéticas y el codificador real, sin acceder a dispositivos personales.
- Cambio entre Tools, Windows, macOS y Ubuntu. Inicio y ventanas adaptados, barra inferior o Dock lateral/flotante, controles a izquierda o derecha y maximizado reservando las barras. En una vista de 1280 × 900: Windows maximiza a 1280 × 848; Ubuntu a 1208 × 868 desde (72,32). Se revisa también la vista estrecha de 600 píxeles.
- Recarga con escritorio vacío, manteniendo preferencias y borradores. Los permisos se solicitan mediante acciones explícitas y cada resultado generado ofrece guardado o descarga.

## Límites de esta entrega

Son primeras versiones ampliables. Los dispositivos, formatos comprimidos, voces instaladas, dictado y captura de pantalla dependen de las API del navegador. No hay acceso libre al sistema operativo. La transcripción es aproximada; su modelo se descarga opcionalmente y no se envía el audio. Los formatos y límites se detallan en el README.
