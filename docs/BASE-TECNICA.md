# Base t�cnica propuesta

Documento de dise�o, todav�a sin implementaci�n. Las decisiones se revisar�n al construir la primera versi�n.

## Aplicaci�n est�tica y modular

Empezar con HTML, CSS y m�dulos JavaScript, sin servidor de datos ni cuentas. Esta base permite un despliegue est�tico en GitHub Pages. Las dependencias especializadas se incorporar�n por necesidad, con versiones fijadas y licencias revisadas.

Separar tres responsabilidades:

- **Aplicaci�n com�n:** cat�logo, b�squeda, preferencias, temas, ventanas y navegaci�n.
- **Servicios comunes:** almacenamiento, importaci�n/exportaci�n, comprobaci�n de capacidades y gesti�n de errores.
- **Herramientas:** interfaz, estado y operaciones propias de cada utilidad.

Cada herramienta tendr� un identificador estable, nombre, descripci�n, categor�a, requisitos del navegador y una funci�n de apertura con limpieza al cerrar. Las bibliotecas grandes se cargar�n bajo demanda. Una ruta o enlace directo permitir� abrir cada herramienta sin obligar a pasar por el cat�logo.

Usar rutas de recursos compatibles con `/Tools/`, sin asumir alojamiento en la ra�z del dominio. El c�digo de cada herramienta debe poder evolucionar sin modificar las dem�s.

## Ventanas y acceso

Las ventanas movibles y redimensionables ser�n paneles dentro de la p�gina. Deben ofrecer foco visible, orden coherente al cambiar de ventana y botones accesibles para mover o maximizar sin depender exclusivamente del arrastre.

En pantallas peque�as se priorizar� una herramienta a la vez con un selector de las abiertas. Pantalla completa y ventana independiente ser�n opciones adicionales. El modo siempre visible depende de capacidades como Document Picture-in-Picture y no ser� un requisito de la base.

Fuente: [Document Picture-in-Picture](https://developer.mozilla.org/en-US/docs/Web/API/Document_Picture-in-Picture_API/Using).

## Almacenamiento y archivos

- Preferencias peque�as en `localStorage`; documentos y binarios en IndexedDB u otro almacenamiento local adecuado.
- Claves, bases de datos y futuras cach�s con prefijo `tools-`; esquema versionado y migraciones que conserven los datos existentes.
- Autoguardado con espera breve entre cambios y confirmaci�n �nicamente tras completar la escritura.
- Exportaci�n individual en formatos comunes y copia de seguridad de los datos persistidos con versi�n de formato.
- Importaciones validadas, con l�mites de tama�o y resoluci�n expl�cita de conflictos; mostrar el texto importado como texto, sin ejecutar HTML o scripts.
- Detectar falta de espacio, fallos de escritura y navegaci�n privada; conservar el trabajo en memoria y ofrecer exportarlo cuando falle el guardado.
- Solicitar almacenamiento persistente cuando resulte �til, sin confundirlo con una copia de seguridad.

El almacenamiento del navegador pertenece al **origen**, no a la carpeta de la URL. Otros proyectos bajo `alejandropico.github.io` comparten ese origen. Los prefijos evitan colisiones accidentales; un dominio propio aportar�a aislamiento entre proyectos. Una futura cach� sin conexi�n tendr� alcance `/Tools/` y no deber� borrar cach�s ajenas.

El acceso directo al disco se ofrecer� mediante selecci�n y autorizaci�n de archivos o carpetas cuando exista soporte. La alternativa ser� importar con un selector y exportar mediante descarga. No se promete acceso a todo el equipo ni ejecuci�n de programas instalados.

Fuentes: [almacenamiento y cuotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria), [File System API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API), [File System Access](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access).

## C�mara, micr�fono y pantalla

Estas herramientas requerir�n un contexto seguro como HTTPS y comprobaci�n de las API disponibles. Pedir permisos despu�s de una acci�n expl�cita; distinguir cancelaci�n, denegaci�n y error del dispositivo.

La captura de pantalla usar� `getDisplayMedia()`: la persona elige qu� comparte en el selector del navegador en cada sesi�n. Una imagen se obtendr� a partir de ese flujo y se recortar� en el editor. No se ofrecer� un atajo global de Windows desde la p�gina.

La grabaci�n usar� los formatos que admita `MediaRecorder`; el audio del sistema depender� de la fuente y el navegador. Al detener o cerrar, parar todas las pistas de los flujos adquiridos, cancelar tareas y liberar las URL temporales. Durante grabaciones largas se definir�n l�mites y una estrategia de almacenamiento; no asumir memoria ilimitada.

Fuentes: [captura de pantalla](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia), [grabaci�n multimedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder), [c�mara y micr�fono](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).

## Transcripci�n y servicios externos

La grabadora podr� existir antes que la transcripci�n. El reconocimiento de voz del navegador puede utilizar servidores externos; no basta con usar una API del navegador para afirmar que es local.

Evaluar primero el reconocimiento en el dispositivo, comprobando soporte y paquetes de idioma. Si no est� disponible, explicar la limitaci�n. Un modelo descargable es otra v�a a estudiar por tama�o, rendimiento, licencia y compatibilidad. Cualquier modo remoto ser� opcional y explicar� proveedor, env�o de datos y coste antes de activarse.

La redacci�n de art�culos a partir de transcripciones tendr� su propio alcance en el proyecto del blog. Tools podr� exportar audio y texto para facilitar ese flujo.

Fuentes: [reconocimiento de voz](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API), [reconocimiento local en Edge](https://learn.microsoft.com/en-us/microsoft-edge/web-platform/speech-recognition-api).

## Verificaci�n y publicaci�n

Al implementar, a�adir comprobaciones de los c�lculos y conversiones, persistencia tras recarga, importaci�n/exportaci�n y recuperaci�n ante errores. Probar permisos, cancelaci�n y liberaci�n de dispositivos en las herramientas multimedia. Revisar teclado, foco, contraste y distribuci�n m�vil.

GitHub Actions podr� ejecutar las comprobaciones y preparar el sitio. La publicaci�n se configurar� como una tarea separada cuando haya una primera aplicaci�n funcional. La existencia de Actions o de una URL de Pages no significa que ya haya una versi�n desplegada.
