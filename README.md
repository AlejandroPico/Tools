# Tools

Una caja de herramientas gratuitas para resolver tareas cotidianas desde el navegador, con tus archivos y datos bajo tu control.

Tools reunirá pequeñas aplicaciones: bloc de notas, calculadora, capturas de pantalla, grabadoras, dibujo, conversores y otras utilidades que vayan haciendo falta. Cada herramienta deberá aportar algo útil: más comodidad, mejores opciones de exportación, funciones adicionales o la posibilidad de combinarla con otras.

## Estado del proyecto

Fase de definición. Este repositorio contiene el concepto, una propuesta de base común y la hoja de ruta. Todavía no hay una aplicación ejecutable ni herramientas implementadas. Las funciones descritas a continuación son objetivos de desarrollo.

## La experiencia

- Un catálogo con buscador, categorías y favoritos.
- Herramientas utilizables a página completa o en ventanas dentro de la aplicación.
- Varias herramientas abiertas a la vez: tomar notas mientras se calcula, o anotar una captura y guardarla.
- Ventanas que se puedan mover, redimensionar, minimizar y maximizar; en móvil, una vista adaptada a la pantalla.
- Guardado automático de borradores en el navegador y exportación a archivos del dispositivo.
- Acceso rápido con teclado, interfaz en español, temas claro y oscuro y controles accesibles.

Las ventanas internas serán la experiencia común. Una ventana independiente o siempre visible sobre otras aplicaciones será una mejora opcional, sujeta a lo que permita cada navegador.

## Principios

1. **Gratis para usar.** Sin suscripciones ni funciones esenciales de pago.
2. **Vocación de software libre.** Código público y reutilizable bajo una licencia libre que se elegirá antes de publicar la primera versión.
3. **Datos locales por defecto.** Procesar textos, imágenes y grabaciones en el dispositivo siempre que sea posible. Cualquier servicio externo deberá identificarse y activarse expresamente.
4. **Guardar y llevarse el trabajo.** Usar formatos comunes y ofrecer importación, exportación y copias de seguridad cuando corresponda.
5. **Permisos cuando hacen falta.** Pedir cámara, micrófono, pantalla o archivos al iniciar la acción que los necesita.
6. **Crecer por necesidades reales.** Añadir herramientas independientes y terminadas, con mejoras concretas frente a la alternativa habitual.

## Por dónde empezar

| Entrega propuesta | Contenido | Valor añadido |
| --- | --- | --- |
| Base común | Catálogo, ventanas, preferencias y guardado local | Un solo lugar para trabajar con varias utilidades |
| Bloc de notas | Varias notas, búsqueda, autoguardado, importar y exportar TXT/Markdown | Recuperar borradores y organizar notas sin cuenta |
| Calculadora | Operaciones habituales, historial reutilizable y conversiones de unidades | Recuperar cálculos, copiar resultados y enviarlos a una nota |
| Imágenes y capturas | Abrir una imagen o capturar una fuente compartida, recortar y anotar | Capturar, editar y exportar desde el mismo sitio |
| Grabadoras | Audio de micrófono, vídeo de pantalla y, después, webcam | Previsualizar y descargar las grabaciones localmente |

La calculadora científica, gráfica, de programador y de fechas se incorporará progresivamente. La conversión de divisas requerirá decidir de dónde obtener las cotizaciones y mostrar su fecha.

## Qué significa «local»

El **borrador del navegador** permite continuar más tarde en el mismo navegador y sitio. Puede perderse al borrar los datos del sitio o por las políticas de almacenamiento del navegador. No sustituye a una copia de seguridad.

El **archivo exportado** queda en el dispositivo y se puede mover, compartir o abrir en otras aplicaciones. Cuando el navegador lo permita, se ofrecerá abrir y guardar directamente en un archivo elegido por la persona. En los demás casos se usará selección de archivos y descarga.

Los documentos y grabaciones se almacenarán con mecanismos adecuados a su tamaño, como IndexedDB; las cookies no serán el almacén de trabajo.

## Alcance del navegador

- El explorador de archivos trabajará con los archivos o carpetas que la persona seleccione y autorice.
- Las capturas y grabaciones de pantalla partirán del selector del navegador. El recorte se aplicará después a la imagen obtenida.
- La transcripción de voz tendrá una fase propia. Grabar audio localmente y convertirlo a texto son capacidades distintas; algunos motores de reconocimiento envían audio a un servicio externo.
- Una lupa, un teclado o un lector dentro de Tools actuarán sobre su propio contenido; el control de otras aplicaciones requeriría otro tipo de integración.

La [base técnica propuesta](docs/BASE-TECNICA.md) detalla estas restricciones y sus fuentes.

## Próximas herramientas

La [hoja de ruta](ROADMAP.md) recoge las ideas iniciales y los criterios para incorporar otras. Es una lista abierta: no hace falta decidir ahora todas las herramientas que acabarán existiendo.

## Licencia

Pendiente de elección e incorporación. La intención es distribuir Tools como software libre; la publicación del código por sí sola no define sus permisos de reutilización. Véase la [guía de GitHub sobre licencias](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository).
