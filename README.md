# Tools

Una caja de herramientas gratuitas para resolver tareas cotidianas desde el navegador, con tus archivos y datos bajo tu control.

Tools reunir� peque�as aplicaciones: bloc de notas, calculadora, capturas de pantalla, grabadoras, dibujo, conversores y otras utilidades que vayan haciendo falta. Cada herramienta deber� aportar algo �til: m�s comodidad, mejores opciones de exportaci�n, funciones adicionales o la posibilidad de combinarla con otras.

## Estado del proyecto

Fase de definici�n. Este repositorio contiene el concepto, una propuesta de base com�n y la hoja de ruta. Todav�a no hay una aplicaci�n ejecutable ni herramientas implementadas. Las funciones descritas a continuaci�n son objetivos de desarrollo.

## La experiencia

- Un cat�logo con buscador, categor�as y favoritos.
- Herramientas utilizables a p�gina completa o en ventanas dentro de la aplicaci�n.
- Varias herramientas abiertas a la vez: tomar notas mientras se calcula, o anotar una captura y guardarla.
- Ventanas que se puedan mover, redimensionar, minimizar y maximizar; en m�vil, una vista adaptada a la pantalla.
- Guardado autom�tico de borradores en el navegador y exportaci�n a archivos del dispositivo.
- Acceso r�pido con teclado, interfaz en espa�ol, temas claro y oscuro y controles accesibles.

Las ventanas internas ser�n la experiencia com�n. Una ventana independiente o siempre visible sobre otras aplicaciones ser� una mejora opcional, sujeta a lo que permita cada navegador.

## Principios

1. **Gratis para usar.** Sin suscripciones ni funciones esenciales de pago.
2. **Vocaci�n de software libre.** C�digo p�blico y reutilizable bajo una licencia libre que se elegir� antes de publicar la primera versi�n.
3. **Datos locales por defecto.** Procesar textos, im�genes y grabaciones en el dispositivo siempre que sea posible. Cualquier servicio externo deber� identificarse y activarse expresamente.
4. **Guardar y llevarse el trabajo.** Usar formatos comunes y ofrecer importaci�n, exportaci�n y copias de seguridad cuando corresponda.
5. **Permisos cuando hacen falta.** Pedir c�mara, micr�fono, pantalla o archivos al iniciar la acci�n que los necesita.
6. **Crecer por necesidades reales.** A�adir herramientas independientes y terminadas, con mejoras concretas frente a la alternativa habitual.

## Por d�nde empezar

| Entrega propuesta | Contenido | Valor a�adido |
| --- | --- | --- |
| Base com�n | Cat�logo, ventanas, preferencias y guardado local | Un solo lugar para trabajar con varias utilidades |
| Bloc de notas | Varias notas, b�squeda, autoguardado, importar y exportar TXT/Markdown | Recuperar borradores y organizar notas sin cuenta |
| Calculadora | Operaciones habituales, historial reutilizable y conversiones de unidades | Recuperar c�lculos, copiar resultados y enviarlos a una nota |
| Im�genes y capturas | Abrir una imagen o capturar una fuente compartida, recortar y anotar | Capturar, editar y exportar desde el mismo sitio |
| Grabadoras | Audio de micr�fono, v�deo de pantalla y, despu�s, webcam | Previsualizar y descargar las grabaciones localmente |

La calculadora cient�fica, gr�fica, de programador y de fechas se incorporar� progresivamente. La conversi�n de divisas requerir� decidir de d�nde obtener las cotizaciones y mostrar su fecha.

## Qu� significa �local�

El **borrador del navegador** permite continuar m�s tarde en el mismo navegador y sitio. Puede perderse al borrar los datos del sitio o por las pol�ticas de almacenamiento del navegador. No sustituye a una copia de seguridad.

El **archivo exportado** queda en el dispositivo y se puede mover, compartir o abrir en otras aplicaciones. Cuando el navegador lo permita, se ofrecer� abrir y guardar directamente en un archivo elegido por la persona. En los dem�s casos se usar� selecci�n de archivos y descarga.

Los documentos y grabaciones se almacenar�n con mecanismos adecuados a su tama�o, como IndexedDB; las cookies no ser�n el almac�n de trabajo.

## Alcance del navegador

- El explorador de archivos trabajar� con los archivos o carpetas que la persona seleccione y autorice.
- Las capturas y grabaciones de pantalla partir�n del selector del navegador. El recorte se aplicar� despu�s a la imagen obtenida.
- La transcripci�n de voz tendr� una fase propia. Grabar audio localmente y convertirlo a texto son capacidades distintas; algunos motores de reconocimiento env�an audio a un servicio externo.
- Una lupa, un teclado o un lector dentro de Tools actuar�n sobre su propio contenido; el control de otras aplicaciones requerir�a otro tipo de integraci�n.

La [base t�cnica propuesta](docs/BASE-TECNICA.md) detalla estas restricciones y sus fuentes.

## Pr�ximas herramientas

La [hoja de ruta](ROADMAP.md) recoge las ideas iniciales y los criterios para incorporar otras. Es una lista abierta: no hace falta decidir ahora todas las herramientas que acabar�n existiendo.

## Licencia

Pendiente de elecci�n e incorporaci�n. La intenci�n es distribuir Tools como software libre; la publicaci�n del c�digo por s� sola no define sus permisos de reutilizaci�n. V�ase la [gu�a de GitHub sobre licencias](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository).
