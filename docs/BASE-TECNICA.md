# Base técnica propuesta

Documento de diseño y evolución. Ya existe una primera implementación estática con escritorio, calculadora, grabadora y explorador; las capacidades descritas como futuras siguen pendientes. El README describe el alcance disponible.

## Aplicación estática y modular

Empezar con HTML, CSS y módulos JavaScript, sin servidor de datos ni cuentas. Esta base permite un despliegue estático en GitHub Pages. Las dependencias especializadas se incorporarán por necesidad, con versiones fijadas y licencias revisadas.

Separar tres responsabilidades:

- **Aplicación común:** catálogo, búsqueda, preferencias, temas, ventanas y navegación.
- **Servicios comunes:** almacenamiento, importación/exportación, comprobación de capacidades y gestión de errores.
- **Herramientas:** interfaz, estado y operaciones propias de cada utilidad.

Cada herramienta tiene una carpeta en `tools/` y se registra en `app.js` con identificador, nombre, descripción, icono, dimensiones y función de apertura. La apertura puede devolver una función de limpieza y una comprobación de trabajo sin guardar. El escritorio siempre arranca vacío, incluso con un fragmento en la URL; Inicio permite abrir las utilidades. La carga diferida de bibliotecas grandes se incorporará cuando hagan falta.

Usar rutas de recursos compatibles con `/Tools/`, sin asumir alojamiento en la raíz del dominio. El código de cada herramienta debe poder evolucionar sin modificar las demás.

## Ventanas y acceso

Las ventanas movibles y redimensionables serán paneles dentro de la página. Deben ofrecer foco visible, orden coherente al cambiar de ventana y botones accesibles para mover o maximizar sin depender exclusivamente del arrastre.

En pantallas pequeñas se priorizará una herramienta a la vez con un selector de las abiertas. Pantalla completa y ventana independiente serán opciones adicionales. El modo siempre visible depende de capacidades como Document Picture-in-Picture y no será un requisito de la base.

Fuente: [Document Picture-in-Picture](https://developer.mozilla.org/en-US/docs/Web/API/Document_Picture-in-Picture_API/Using).

## Almacenamiento y archivos

- Preferencias pequeñas en `localStorage`; documentos y binarios en IndexedDB u otro almacenamiento local adecuado.
- Claves, bases de datos y futuras cachés con prefijo `tools-`; esquema versionado y migraciones que conserven los datos existentes.
- Autoguardado con espera breve entre cambios y confirmación únicamente tras completar la escritura.
- Exportación individual en formatos comunes y copia de seguridad de los datos persistidos con versión de formato.
- Importaciones validadas, con límites de tamaño y resolución explícita de conflictos; mostrar el texto importado como texto, sin ejecutar HTML o scripts.
- Detectar falta de espacio, fallos de escritura y navegación privada; conservar el trabajo en memoria y ofrecer exportarlo cuando falle el guardado.
- Solicitar almacenamiento persistente cuando resulte útil, sin confundirlo con una copia de seguridad.

El almacenamiento del navegador pertenece al **origen**, no a la carpeta de la URL. Otros proyectos bajo `alejandropico.github.io` comparten ese origen. Los prefijos evitan colisiones accidentales; un dominio propio aportaría aislamiento entre proyectos. Una futura caché sin conexión tendrá alcance `/Tools/` y no deberá borrar cachés ajenas.

El acceso directo al disco se ofrecerá mediante selección y autorización de archivos o carpetas cuando exista soporte. La alternativa será importar con un selector y exportar mediante descarga. No se promete acceso a todo el equipo ni ejecución de programas instalados.

Fuentes: [almacenamiento y cuotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria), [File System API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API), [File System Access](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access).

## Cámara, micrófono y pantalla

Estas herramientas requerirán un contexto seguro como HTTPS y comprobación de las API disponibles. Pedir permisos después de una acción explícita; distinguir cancelación, denegación y error del dispositivo.

La captura de pantalla usará `getDisplayMedia()`: la persona elige qué comparte en el selector del navegador en cada sesión. Una imagen se obtendrá a partir de ese flujo y se recortará en el editor. No se ofrecerá un atajo global de Windows desde la página.

La grabación usará los formatos que admita `MediaRecorder`; el audio del sistema dependerá de la fuente y el navegador. Al detener o cerrar, parar todas las pistas de los flujos adquiridos, cancelar tareas y liberar las URL temporales. Durante grabaciones largas se definirán límites y una estrategia de almacenamiento; no asumir memoria ilimitada.

Fuentes: [captura de pantalla](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia), [grabación multimedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder), [cámara y micrófono](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).

## Transcripción y servicios externos

La grabadora podrá existir antes que la transcripción. El reconocimiento de voz del navegador puede utilizar servidores externos; no basta con usar una API del navegador para afirmar que es local.

Evaluar primero el reconocimiento en el dispositivo, comprobando soporte y paquetes de idioma. Si no está disponible, explicar la limitación. Un modelo descargable es otra vía a estudiar por tamaño, rendimiento, licencia y compatibilidad. Cualquier modo remoto será opcional y explicará proveedor, envío de datos y coste antes de activarse.

La redacción de artículos a partir de transcripciones tendrá su propio alcance en el proyecto del blog. Tools podrá exportar audio y texto para facilitar ese flujo.

Fuentes: [reconocimiento de voz](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API), [reconocimiento local en Edge](https://learn.microsoft.com/en-us/microsoft-edge/web-platform/speech-recognition-api).

## Verificación y publicación

Al implementar, añadir comprobaciones de los cálculos y conversiones, persistencia tras recarga, importación/exportación y recuperación ante errores. Probar permisos, cancelación y liberación de dispositivos en las herramientas multimedia. Revisar teclado, foco, contraste y distribución móvil.

GitHub Actions ejecuta las comprobaciones y prepara el sitio con cada cambio en `main`. La aplicación es estática y permite publicar la raíz directamente mediante GitHub Pages o el contenido de `dist/` con otro alojamiento estático. La existencia de una URL de Pages no sustituye la comprobación de la versión desplegada.
