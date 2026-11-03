# Instrucciones del proyecto

- Trabajar directamente en `main`. El propietario ha autorizado expresamente los cambios y la publicación en esta rama. No crear ramas secundarias ni pull requests salvo una nueva instrucción suya.
- Cada aplicación debe vivir en `tools/<nombre>/`. La infraestructura compartida pertenece a `core/`; el escritorio se mantiene en la raíz.
- Mantener `favicon.svg` vectorial en la raíz y utilizarlo como identidad de Tools.
- Ofrecer ventanas movibles, redimensionables y minimizables. No convertir las herramientas en páginas completas por defecto.
- Procesar los datos localmente. Los archivos generados deben poder descargarse; ofrecer un selector de destino cuando el navegador lo admita y explicar el comportamiento de la descarga alternativa.
- No pedir permisos de micrófono, cámara o archivos hasta una acción explícita de la persona. Liberar los dispositivos al terminar o cerrar.
- Mantener la interfaz en español, accesible por teclado y utilizable en pantallas pequeñas.
- Ejecutar `npm test` y `npm run build` antes de publicar. Verificar visualmente los cambios de interfaz y comprobar el comportamiento afectado.
- No añadir servicios de pago, envío de archivos o dependencias remotas sin un motivo concreto y una decisión explícita.
