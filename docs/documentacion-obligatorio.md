# Rumbo

## Memoria de diseño, desarrollo e integración de inteligencia artificial

**Obligatorio 2 · Diseño Interactivo**  
**Estudiante:** Iván Gonzales  
**Fecha:** 20 de julio de 2026  
**Estado:** MVP funcional y testeable

> **Promesa de producto**  
> Convertí tu viaje en una aventura interactiva.

---

## 1. Resumen ejecutivo

Rumbo es una aplicación web que transforma un viaje en una experiencia interactiva. En lugar de concentrarse en reservas, vuelos o itinerarios, acompaña al usuario durante y después del viaje: genera misiones personalizadas con inteligencia artificial, permite registrar evidencias y emociones, desbloquea sellos digitales y convierte lo vivido en una bitácora narrativa compartible.

El proyecto responde a una situación frecuente: durante un viaje se generan muchas fotos, videos, mensajes y anécdotas, pero esos recuerdos quedan dispersos y pierden contexto. Rumbo propone pequeñas acciones para mirar el destino con más intención y organiza los resultados como una colección de historias.

El MVP implementa el recorrido completo: registro o acceso de muestra, creación de un viaje, personalización, generación de seis misiones con IA, carga de foto o video, selección de emociones, generación de un sello, pasaporte digital y bitácora final. La IA es una funcionalidad visible, evaluable y central para la experiencia.

## 2. Modalidad elegida

La modalidad elegida es un **producto digital interactivo**, desarrollado como aplicación web fullstack y testeable en navegador. La propuesta combina:

- una experiencia de uso completa;
- generación de contenido con IA dentro del producto;
- persistencia de usuarios, viajes, misiones, sellos y bitácoras;
- una identidad visual propia;
- una estrategia de comunicación y piezas de campaña;
- documentación del proceso y de las decisiones tomadas.

Se eligió una aplicación web porque permite probar el flujo sin instalar software, facilita la evaluación docente y hace posible demostrar la integración entre interfaz, servidor, persistencia e inteligencia artificial.

## 3. Problema o necesidad abordada

Muchos viajes terminan reducidos a una galería de fotos sin contexto, mensajes de chat y recuerdos aislados. Durante el viaje, las personas también pueden repetir planes conocidos, depender demasiado de recomendaciones genéricas o no saber cómo registrar lo que hace especial a un momento.

El problema tiene dos dimensiones:

1. **Durante el viaje:** falta una guía liviana que proponga acciones concretas para observar, probar, conversar, improvisar y registrar.
2. **Después del viaje:** falta una forma de reunir las evidencias y convertirlas en una historia ordenada, emocional y compartible.

Rumbo no busca reemplazar un mapa ni organizar la logística. Su oportunidad es enriquecer la experiencia y conservar su dimensión emocional.

### Pregunta de diseño

**¿Cómo podemos ayudar a que una persona viva un viaje con más intención y luego pueda recordarlo como una historia, sin agregarle una carga de planificación?**

## 4. Público objetivo

El público principal está formado por jóvenes adultos de 18 a 35 años que viajan solos, en pareja, con amigos o en grupos pequeños. Son personas acostumbradas a utilizar productos digitales, sacar fotos, grabar videos y compartir historias, pero que no necesariamente llevan un diario o clasifican sus recuerdos.

### Comportamientos relevantes

- Registran muchos momentos con el celular.
- Buscan recomendaciones y experiencias diferentes.
- Valoran la espontaneidad y las propuestas fáciles de realizar.
- Comparten parte del viaje en redes sociales.
- Después del viaje conservan archivos, pero pierden el relato que los conecta.
- Prefieren una experiencia rápida antes que una herramienta compleja.

### Necesidades

- Saber qué hacer ahora sin revisar una lista extensa.
- Recibir propuestas relacionadas con el destino y el grupo.
- Guardar evidencias sin tener que construir manualmente un diario.
- Sentir progreso y recompensa.
- Recuperar la historia del viaje al finalizarlo.

## 5. User persona

### Sofía, 24 años

Sofía es estudiante y viaja con amigas cuando puede. Le gusta sacar fotos, subir historias y descubrir lugares que se sientan propios. Durante el viaje guarda todo en el celular y conversa por WhatsApp, pero al regresar le cuesta reconstruir qué pasó y por qué cada momento fue importante.

**Objetivo:** vivir experiencias espontáneas y terminar el viaje con un recuerdo ordenado y visual.

**Frustraciones:** fotos descontextualizadas, recomendaciones repetidas, demasiada planificación y aplicaciones con muchas opciones.

**Motivaciones:** descubrir, compartir, coleccionar recuerdos y sentir que cada viaje tiene una identidad.

**Frase guía:** “Quiero recordar el viaje como una historia, no como una carpeta de fotos.”

### Escenario de uso

Sofía crea “Escapada a Valparaíso”, selecciona que viaja con amigos, elige los estilos cultural, gastronómico y fotográfico, y define una energía media. Rumbo genera seis misiones. Durante el viaje completa “Bocado valiente”, sube una foto, selecciona cómo se sintió y escribe una frase. La app genera un sello y actualiza el pasaporte. Al finalizar, Sofía genera una bitácora con el relato y un caption para compartir.

## 6. Investigación y análisis de competencia

Se realizó un análisis heurístico de tres referentes actuales. No se buscaron copias directas, sino patrones de interacción y oportunidades de diferenciación.

| Referente | Enfoque principal | Aprendizaje para Rumbo | Oportunidad detectada |
|---|---|---|---|
| Polarsteps | Planificar, registrar el recorrido y revivir viajes; genera recapitulaciones y libros de viaje. | El valor del viaje aumenta cuando el registro termina en un objeto narrativo. | Incorporar una capa activa de misiones y emociones, no solo seguimiento y recapitulación. |
| Goosechase | Experiencias interactivas basadas en misiones, desafíos y recompensas. Incluye creación asistida por IA. | Las consignas breves y la progresión hacen que participar sea más claro y lúdico. | Llevar la lógica de misiones a un viaje personal y conectarla con recuerdos, sellos y bitácora. |
| Wanderlog | Planificación detallada, mapas, itinerarios y reservas en un mismo lugar. | Una herramienta de viaje necesita jerarquía para evitar sobrecarga de información. | Diferenciarse de la logística: Rumbo trabaja sobre cómo vivir y recordar, no sobre qué reservar. |

### Hallazgo principal

El mercado aparece dividido entre aplicaciones que **planifican**, aplicaciones que **registran** y plataformas que **gamifican actividades**. Rumbo ocupa una intersección específica: propone misiones personalizadas durante un viaje y transforma sus resultados en una memoria narrativa.

### Diferencial

- La personalización parte del contexto real del viaje.
- La misión no termina en “completada”: produce evidencia, emoción, sello y relato.
- La recompensa tiene valor emocional, no competitivo.
- El producto acompaña el momento presente y construye un resultado final.

## 7. Ideación inicial y definición del alcance

La idea nació con una promesa clara: “No te dice solamente a dónde ir. Te propone cómo vivir y recordar el viaje”. En la etapa de definición se trabajó sobre tres conceptos: aventura, colección y memoria.

### Hipótesis iniciales

1. Las misiones breves pueden ayudar a observar el destino de otra manera.
2. Una recompensa visual puede motivar continuidad sin convertir el viaje en una competencia.
3. La IA permite adaptar las propuestas sin diseñar manualmente contenido para cada destino.
4. La bitácora aumenta el valor de los datos cargados durante el viaje.

### Priorización del MVP

Se priorizó un flujo completo antes que una gran cantidad de funciones:

1. Crear cuenta o entrar al recorrido de muestra.
2. Crear y personalizar un viaje.
3. Generar misiones con IA.
4. Completar una misión con evidencia y emociones.
5. Desbloquear un sello.
6. Consultar el pasaporte.
7. Generar la bitácora final.

### Funciones descartadas o postergadas

- GPS y seguimiento de ubicación.
- Mapas de navegación.
- Clima, vuelos, hoteles y reservas.
- Chat grupal y colaboración en tiempo real.
- Ranking o competencia entre usuarios.
- Publicación social directa.

Estas decisiones reducen complejidad y mantienen el foco en la propuesta de valor.

## 8. Bocetos, wireframes y prototipo

El proceso se desarrolló como un **prototipo evolutivo de alta fidelidad** implementado directamente en navegador. Cada captura y prueba dio lugar a una revisión concreta de jerarquía, claridad o comportamiento.

### Evolución del login

La primera versión combinaba una presentación muy grande con un formulario pequeño. Después se exploraron referencias de formularios inmersivos y se llegó a una composición dividida: a la izquierda, un mundo visual con postales; a la derecha, un formulario claro. El planeta se convirtió en una escena 3D interactiva que puede girarse horizontalmente con el mouse. También se corrigieron el recorte de las postales, el orden de capas y el parpadeo al cambiar entre “Entrar” y “Crear”.

### Evolución del dashboard

El estado vacío llegó a tener tres botones diferentes para crear el mismo viaje. Se redujo a una única acción principal. Las tarjetas de viajes dejaron de ser cajas genéricas y pasaron a incluir destino, fechas, estilos, progreso, cantidad de misiones, sellos y una portada construida con la evidencia más reciente.

### Evolución de la pantalla interna

La primera versión mostraba demasiada información simultánea. Para responder “¿qué hago ahora?” se incorporaron:

- una tarjeta de próxima acción según el estado;
- un recorrido de cinco pasos;
- tabs para Misiones, Pasaporte y Bitácora;
- filtros por estado;
- acciones secundarias agrupadas en un menú.

### Evolución de la misión

El formulario pasó de una nota y un selector simple a un flujo de tres pasos:

1. Evidencia con foto o video.
2. Selección múltiple de emociones.
3. Historia breve y detalle opcional.

Se agregaron previsualización, cambio y eliminación de evidencia, límite de video, posicionamiento de imagen y opción de rehacer la misión. La selección emocional se redujo a ocho opciones para evitar sobrecarga.

### Evolución del pasaporte y la bitácora

El pasaporte pasó de una grilla genérica a una colección con sellos circulares, estados bloqueados y una animación de desbloqueo. La bitácora se reorganizó como resultado editorial del viaje, con portada, relato, mejores momentos, sellos, premios, frases y caption.

## 9. Arquitectura de información y flujo

### Recorrido principal

```text
Acceso
  → Mis viajes
  → Crear viaje
  → Generar misiones
  → Completar misión
  → Desbloquear sello
  → Consultar pasaporte
  → Generar bitácora
```

### Principio de orientación

Cada pantalla intenta responder una pregunta concreta:

- **Mis viajes:** ¿qué aventura quiero continuar?
- **Crear viaje:** ¿cómo quiero vivir este viaje?
- **Misiones:** ¿qué hago ahora?
- **Completar misión:** ¿qué evidencia y emoción quiero guardar?
- **Pasaporte:** ¿qué logré y qué falta descubrir?
- **Bitácora:** ¿qué historia dejó el viaje?

## 10. Definición de tecnologías

### Frontend

- **HTML semántico:** estructura de vistas, formularios, modales y navegación.
- **CSS propio:** sistema visual completo sin framework CSS.
- **JavaScript puro:** estado de interfaz, validación, consumo de API y renderizado dinámico.
- **Three.js:** planeta 3D interactivo del login.
- **TopoJSON y World Atlas:** geometría de continentes para el globo.
- **Flatpickr:** selector de fechas personalizado y consistente entre navegadores.

### Backend

- **Node.js:** entorno de ejecución.
- **Express:** servidor, archivos estáticos y rutas API.
- **dotenv:** variables de entorno y credenciales.
- **crypto:** hash de contraseñas mediante PBKDF2 con salt.

### Persistencia

- **Supabase Postgres:** usuarios, sesiones, viajes, misiones, sellos y bitácoras en la versión publicada.
- **Supabase Storage:** fotos, videos y previews en un bucket privado con acceso temporal firmado.
- **JSON local:** respaldo de desarrollo para ejecutar y demostrar la app sin credenciales externas.
- **localStorage:** conserva el usuario público y el token de sesión; no contiene viajes ni contraseñas.

### Inteligencia artificial

- Proxy Gemini Vertex provisto por la cátedra.
- `gemini-2.5-flash` para misiones y sellos.
- `gemini-2.5-pro` para bitácoras más extensas.

### Motivo de la elección

El stack cumple la consigna sin incorporar un framework frontend que oculte la manipulación del DOM. Express permite mantener la API key fuera del navegador y separar claramente interfaz, persistencia y servicio de IA.

## 11. Decisiones de diseño

### Identidad

El nombre **Rumbo** se eligió porque es corto, recordable y representa dirección, descubrimiento y movimiento. El claim de la marca es: “Convertí tu viaje en una aventura interactiva”.

### Sistema visual

- Azul noche `#17223B`: identidad, profundidad y texto principal.
- Naranja atardecer `#E86F35`: acciones y momentos clave.
- Verde exploración `#2F8F68`: progreso y estados logrados.
- Azul cielo `#4A83B8`: categorías y controles secundarios.
- Crema papel `#F7EFD8`: memoria, bitácora y pasaporte.
- Inter: tipografía legible y consistente con una aplicación contemporánea.

La textura de papel, los sellos y las líneas de ruta relacionan la interfaz con un pasaporte sin volverla literal. Los bordes se mantienen en 8 px para conservar una estética de producto y evitar el exceso de tarjetas redondeadas.

### Jerarquía y reducción de carga

- Una acción principal por contexto.
- Menús para operaciones destructivas o menos frecuentes.
- Tabs para separar contenido sin cambiar de pantalla.
- Estados visibles: pendiente, nueva, completada y sello desbloqueado.
- Próxima acción calculada a partir del progreso.
- Microcopy rioplatense, cercano y accionable.

### Accesibilidad y feedback

- Labels asociados a campos.
- Navegación con teclado en controles principales.
- Mensajes de error junto al campo y alerta visual general.
- Estados de foco visibles.
- Textos alternativos y nombres accesibles en botones.
- Contraste alto entre azul, crema y naranja.

## 12. Desarrollo e implementación

### Organización

```text
public/                 interfaz y assets
  css/styles.css        sistema visual y responsive
  js/app.js             estado, vistas y eventos
  js/globe.js           escena 3D
server/
  index.js              servidor Express
  db.js                 adaptador Supabase/JSON
  session.js            sesiones seguras
  authMiddleware.js     autenticación y permisos
  storage.js            evidencias en Storage
  supabase.js           cliente privado del servidor
  security.js           hash y verificación de contraseñas
  aiService.js          prompts, proxy y fallback
  routes/               autenticación, viajes, misiones e IA
supabase/migrations/    esquema SQL de producción
data/rumbo.json         respaldo local de desarrollo
docs/                   memoria y documentación técnica
```

### Modelo de datos

- **User:** nombre, email, hash, salt y fecha de creación.
- **Trip:** usuario, nombre, destino, fechas, grupo, estilos, energía e intereses.
- **Mission:** viaje, categoría, título, descripción, dificultad, estado, evidencia, emociones y notas.
- **Stamp:** misión, viaje, nombre, frase, categoría y descripción del recuerdo.
- **TravelLog:** viaje, relato, momentos, premios, frases y caption.

### Endpoints principales

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/showcase`
- `GET /api/trips`
- `POST /api/trips`
- `DELETE /api/trips/:tripId`
- `POST /api/ai/missions`
- `POST /api/ai/missions/:missionId/regenerate`
- `PATCH /api/missions/:missionId/complete`
- `PATCH /api/missions/:missionId/reset`
- `POST /api/ai/travel-log`

### Persistencia y publicación

Cerrar sesión no elimina la información. En producción, Supabase Postgres conserva los datos estructurados y Storage guarda las evidencias fuera de la base. Por eso una persona puede iniciar sesión desde otro dispositivo y recuperar sus viajes. El archivo `data/rumbo.json` continúa disponible únicamente como respaldo de desarrollo. Un importador convierte las evidencias base64 existentes en archivos persistentes y migra las entidades locales antes del despliegue.

## 13. Integración de inteligencia artificial

La IA interviene en tres momentos centrales. El frontend nunca llama directamente al servicio externo: realiza una petición al backend, el backend arma el prompt, incorpora la API key desde `.env`, llama al proxy de la cátedra, valida el JSON y guarda el resultado.

### 13.1 Generación de misiones

**Entrada:** destino, fechas, grupo, estilos, energía e intereses.  
**Salida:** seis misiones con título, descripción, categoría, dificultad y sello sugerido.  
**Modelo:** `gemini-2.5-flash`.

El prompt limita longitud, mezcla categorías, evita actividades peligrosas o invasivas y solicita JSON estricto.

### 13.2 Generación de sellos

**Entrada:** misión, nota y emociones.  
**Salida:** nombre, frase y descripción del recuerdo.  
**Modelo:** `gemini-2.5-flash`.

La regla más importante es no inventar hechos que el usuario no haya registrado.

### 13.3 Generación de bitácora

**Entrada:** viaje, misiones completadas, evidencias declaradas y sellos.  
**Salida:** título, relato, mejores momentos, premios, frases memorables y caption.  
**Modelo:** `gemini-2.5-pro`.

Las imágenes y videos no se envían dentro del prompt. Solo se informa si existe evidencia y de qué tipo, lo que reduce peso y exposición de datos.

### Flujo técnico

```text
Usuario
  → Frontend de Rumbo
  → API propia en Express
  → Prompt normalizado
  → Proxy Gemini de la cátedra
  → Respuesta JSON
  → Validación y normalización
  → Persistencia
  → Actualización de la interfaz
```

### Fallback

El servicio incluye respuestas locales para que el MVP pueda demostrarse si el proxy está temporalmente caído o no está configurado. La respuesta se identifica internamente como `ai` o `fallback`. Para una evaluación estricta puede desactivarse con `AI_USE_FALLBACK=false`.

## 14. Prompts principales utilizados

Los prompts completos están centralizados en `server/aiService.js`. A continuación se documenta su estructura real.

### Prompt de misiones

```text
Sos Rumbo, una app que convierte viajes en aventuras interactivas.
Generá 6 misiones breves, seguras, realizables y variadas.

Datos: destino, fechas, tipo de grupo, estilos, energía e intereses.

Reglas:
- no proponer actividades peligrosas, ilegales o invasivas;
- no pedir datos personales a desconocidos;
- evitar compras costosas;
- mezclar categorías;
- usar tono cercano, explorador y lúdico;
- limitar título, descripción y sello;
- responder únicamente JSON válido.

Formato: { "missions": [{ "title", "description", "category",
"difficulty", "suggestedStamp" }] }
```

La regeneración individual usa una variante de este prompt que solicita una sola
misión y recibe los títulos actuales como lista de exclusión. La nueva propuesta
reemplaza únicamente una misión pendiente, conserva su identificador y no afecta
las otras cinco. Las misiones completadas no pueden sustituirse para evitar la
pérdida de evidencias, sellos o recuerdos.

### Prompt de sello

```text
Sos Rumbo. Creá un sello digital para una misión completada.

Entrada: título, descripción y categoría de la misión;
nota y emociones del usuario.

Reglas:
- nombre breve y memorable;
- frase de hasta 18 palabras;
- convertir el momento en recuerdo;
- no inventar datos concretos;
- responder únicamente JSON válido.

Formato: { "name", "phrase", "memoryDescription" }
```

### Prompt de bitácora

```text
Sos Rumbo, una app que convierte viajes en recuerdos narrativos.
Escribí una bitácora final cálida, concreta y compartible.

Entrada: datos del viaje, misiones completadas y sellos.

Reglas:
- no inventar lugares, nombres ni hechos;
- usar tono emocional, cercano y lúdico;
- escribir como memoria, no como reporte;
- incluir mejores momentos, premios, frases y caption;
- responder únicamente JSON válido.

Formato: { "title", "story", "bestMoments", "awards",
"memorablePhrases", "socialCaption" }
```

## 15. Seguridad y uso responsable

- La API key se almacena en `.env` y está excluida mediante `.gitignore`.
- El navegador no recibe ni conoce la credencial.
- El backend envía al modelo únicamente los datos necesarios.
- Las contraseñas se guardan como hash PBKDF2 con salt, no en texto plano.
- El backend entrega tokens aleatorios y almacena solamente su hash con vencimiento.
- Todas las rutas privadas verifican la sesión y la propiedad del viaje.
- La credencial `service_role` de Supabase permanece exclusivamente en el servidor.
- Las evidencias se sirven mediante URLs temporales firmadas desde un bucket privado.
- Los prompts restringen actividades peligrosas, ilegales, invasivas o costosas.
- Las respuestas se solicitan como JSON y se normalizan antes de persistirse.
- Existe fallback para mantener la demo disponible sin ocultar que no provino de IA.
- El recorrido de muestra es de solo lectura para evitar modificaciones accidentales.

### Límites actuales

Antes de una apertura pública masiva todavía conviene incorporar rate limiting, recuperación y verificación de email, rotación de secretos, copias de seguridad automáticas y monitoreo. La implementación actual sí contempla sesión del lado servidor, autorización por propiedad, base externa y almacenamiento privado de medios.

## 16. Automatizaciones implementadas

En este proyecto, “automatización” refiere a acciones del producto que convierten datos en nuevos estados sin intervención manual adicional:

- generación de seis misiones a partir del perfil del viaje;
- creación del sello al completar una misión;
- actualización automática de progreso y próxima acción;
- selección de la evidencia más reciente como portada del viaje;
- generación o actualización de la bitácora;
- transformación de emociones guardadas en etiquetas del recuerdo;
- fallback automático cuando el servicio de IA no responde;
- validación de tamaño y duración de archivos;
- bloqueo de acciones de edición en el recorrido de muestra.

## 17. Estrategia de comunicación

### Desafío comunicacional

Una aplicación de reservas o mapas se comprende por asociación con servicios conocidos. Rumbo, en cambio, debe explicar una experiencia que conecta misiones, evidencias, emociones, sellos y bitácoras. La comunicación necesita responder rápidamente qué es, qué debe hacer la persona y qué obtiene al final.

El recorrido se resume en una secuencia visible y fácil de recordar:

```text
CONTEXTO DEL VIAJE → MISIÓN → EVIDENCIA Y EMOCIÓN → SELLO → BITÁCORA
```

### Posicionamiento

Rumbo es una compañera digital que convierte el contexto de un viaje en pequeñas aventuras y transforma sus resultados en una memoria narrativa. No se presenta como agencia, mapa ni planificador. Mientras otras aplicaciones ayudan a decidir dónde ir, Rumbo acompaña al usuario para decidir **cómo vivirlo y cómo recordarlo**.

### Objetivo general

Posicionar Rumbo como una forma nueva, lúdica y emocional de vivir y recordar un destino.

### Objetivos específicos

- Lograr que la propuesta de valor se comprenda en menos de diez segundos.
- Mostrar que las misiones se adaptan al destino, grupo, estilos y energía.
- Hacer visible la recompensa: misión, sello, pasaporte y bitácora.
- Llevar al público al recorrido de muestra o a la creación de una cuenta.
- Construir reconocimiento mediante el mundo, las postales y los sellos.

### Público y barreras

La comunicación se dirige a jóvenes adultos de 18 a 35 años que viajan solos, en pareja o con amistades, registran experiencias con el celular y comparten parte de sus viajes. La barrera principal es pensar que las misiones agregan trabajo o confundir Rumbo con una herramienta de planificación. Por eso se muestran consignas breves, el resultado visual y una prueba sin contraseña.

### Concepto de campaña

**Cada viaje deja una historia.** Las fotografías muestran lugares; las historias explican por qué fueron importantes. Rumbo activa esa historia mediante acciones pequeñas: observar, probar, conversar, improvisar y registrar.

### Mensaje principal

**No hagas solo fotos. Desbloqueá recuerdos.**

### Mensajes secundarios

- Tu viaje, una misión a la vez.
- Misiones para viajar distinto.
- Explorá. Guardá. Recordá.
- Cada misión deja una marca.
- Tu próxima historia empieza acá.

### Tono y dirección visual

Cercano, explorador, emocional y lúdico, sin resultar infantil. Utiliza verbos de acción, voseo rioplatense y frases breves. Evita el lenguaje corporativo y las promesas turísticas genéricas.

El sistema visual utiliza azul noche como soporte, naranja para acciones, crema como referencia al papel y verde para exploración y progreso. El mundo simboliza descubrimiento; las postales representan recuerdos; las líneas orbitales sugieren recorrido; y los sellos comunican recompensa y colección.

### Pilares de contenido

1. **Descubrimiento:** instala el problema de las fotos dispersas y despierta identificación.
2. **Experiencia:** muestra cómo la IA transforma el contexto del viaje en misiones.
3. **Recompensa:** presenta los sellos y el pasaporte como colección.
4. **Memoria:** muestra la bitácora como resultado emocional y compartible.

### Recorrido de campaña

| Etapa | Pregunta | Mensaje | Acción |
|---|---|---|---|
| Descubrir | ¿Por qué lo necesito? | Tus fotos guardan lugares; Rumbo guarda la historia. | Conocer la propuesta. |
| Comprender | ¿Cómo funciona? | Creá un viaje, recibí misiones y registrá lo vivido. | Ver el carrusel o reel. |
| Desear | ¿Qué obtengo? | Sellos, pasaporte y una bitácora propia. | Imaginar el próximo viaje. |
| Probar | ¿Puedo verlo antes? | Recorré una aventura sin contraseña. | Abrir el modo muestra. |
| Convertir | ¿Cómo empiezo? | Elegí destino, compañía, estilos y energía. | Crear una cuenta. |

### Canales y formatos

- **Instagram:** concepto, carruseles, sellos y demostraciones.
- **TikTok/Reels:** recorrido de quince segundos desde la misión hasta la bitácora.
- **Landing/producto:** explicación, conversión y recorrido de muestra.
- **Email:** bienvenida y guía para crear el primer viaje.

### Piezas generadas

1. **Post de lanzamiento:** “No hagas solo fotos. Desbloqueá recuerdos”.
2. **Story de producto:** “Tu viaje, una misión a la vez”.
3. **Carrusel explicativo:** cuatro pasos desde la personalización hasta la bitácora.
4. **Pieza de colección:** “Cada misión deja una marca”.
5. **Póster de experiencia:** “Convertí tu viaje en una aventura interactiva”.
6. **Mockups de campaña:** aplicación de las piezas en teléfono, feed y vía pública.

Las piezas comparten la paleta azul noche, naranja, verde y crema, e incorporan el mundo, las postales y los sellos como señales visuales de marca.

### Plan de lanzamiento

| Fase | Contenido | Mensaje | Objetivo |
|---|---|---|---|
| Expectativa | Detalles del mundo, postales y sellos. | Tu próxima historia empieza acá. | Generar curiosidad. |
| Presentación | Post principal, story, carrusel y reel. | No hagas solo fotos. Desbloqueá recuerdos. | Explicar el diferencial. |
| Prueba | Demo, sellos, bitácora y CTA al modo muestra. | Probá una aventura sin contraseña. | Reducir fricción. |
| Continuidad | Misiones, colecciones e historias. | Cada viaje deja una historia distinta. | Mantener interés. |

### Guion de reel

El reel de quince segundos comienza con fotos dispersas, presenta el formulario del viaje, muestra una misión generada con IA, registra una evidencia, reproduce el desbloqueo de un sello y termina en la bitácora. El cierre utiliza el mensaje principal y el llamado **Empezá tu aventura**.

### Indicadores propuestos

- Alcance e impresiones de las piezas.
- Reproducciones completas del reel.
- Guardados del carrusel.
- Clics en el recorrido de muestra.
- Cuentas y viajes creados.
- Primeras misiones completadas.
- Sellos y bitácoras generados.

### Automatización vinculada

Como extensión se propone el flujo **publicación → landing → recorrido de muestra o registro → email de bienvenida**. La automatización no se implementó en el MVP para priorizar la experiencia central, pero queda definida como continuidad coherente con la captación y activación de usuarios.

### Curaduría y uso de IA

La IA se utilizó para explorar conceptos, ordenar alternativas de mensajes y asistir la producción visual. La selección, la adaptación al voseo, la jerarquía, la composición y la coherencia con el producto fueron curadas manualmente. Las piezas representan funciones reales del MVP y no atribuyen a la IA capacidades que el producto no tiene.

La especificación completa de campaña, copies, calendario, accesibilidad, métricas y checklist se encuentra en `docs/comunicacion.md`.

## 18. Pruebas y validación

### Pruebas funcionales realizadas

- Registro, login y credenciales incorrectas.
- Recorrido de muestra de solo lectura.
- Creación, apertura y eliminación de viajes.
- Validación de campos obligatorios.
- Selección de múltiples estilos.
- Calendario, rango de fechas y energía deslizante.
- Ingreso libre de ciudad, región o país con validación de campo obligatorio.
- Generación global y regeneración individual de misiones pendientes.
- Conservación de las otras misiones al reemplazar una propuesta.
- Protección de misiones completadas frente a reemplazos accidentales.
- Filtros por estado.
- Carga, cambio y eliminación de foto o video.
- Límite de 12 MB para foto, 40 MB y 30 segundos para video.
- Posicionamiento manual de imágenes.
- Selección múltiple de emociones.
- Completar, editar y rehacer una misión.
- Desbloqueo de sello y animación.
- Generación y actualización de bitácora.
- Copia del caption.

### Pruebas visuales

Se revisaron los flujos en escritorio y móvil. Se corrigieron textos que desbordaban, superposiciones, recortes de postales, estados vacíos, jerarquía de botones y el comportamiento del modal en distintas alturas de pantalla.

### Validación pendiente

Todavía no se realizó un test formal con participantes externos. Como próximo paso se propone una prueba moderada con tres a cinco personas del público objetivo y estas tareas:

1. Crear un viaje sin ayuda.
2. Explicar qué sucederá al generar misiones.
3. Completar una misión con evidencia.
4. Encontrar el sello recién desbloqueado.
5. Generar la bitácora y explicar su valor.

Métricas sugeridas: finalización de tareas, tiempo, errores, comprensión de la próxima acción y percepción de diversión.

## 19. Dificultades, decisiones y aprendizajes

### Reducir información sin perder orientación

La pantalla interna llegó a mostrar progreso, pasos, tabs, filtros y tarjetas al mismo tiempo. La solución fue hacer contextual el contenido: próxima acción, recorrido compacto y acciones secundarias agrupadas.

### Mantener una escena 3D estable

El globo del login se reconstruía al cambiar entre acceso y registro, lo que producía un destello blanco. Se separó el ciclo de vida de la escena del render del formulario y se preservó el canvas.

### Diseñar medios dentro de un prototipo local

Se agregó foto y video sin servicio de archivos externo. Esto permitió probar la experiencia, pero evidenció que base64 y JSON no son adecuados para producción. El aprendizaje fue distinguir una decisión válida de MVP de una arquitectura escalable.

### Controlar respuestas de IA

Una respuesta creativa no siempre es fácil de persistir. Solicitar JSON estricto, limitar extensión, extraer la estructura y disponer de fallback hizo que la integración fuera demostrable y más resistente.

### Iterar desde problemas visibles

Varias mejoras surgieron de capturas concretas: botones duplicados, controles nativos poco claros, recortes, espacios, exceso de emociones y textos sin tilde. El prototipo evolucionó mediante ciclos cortos de observar, corregir y volver a probar.

### Aprendizaje general

La IA aporta valor cuando está integrada a una secuencia de decisiones del usuario. En Rumbo no reemplaza la experiencia: interpreta el contexto, propone, nombra y narra. La evidencia y la emoción siguen perteneciendo a la persona.

## 20. Estado actual y próximos pasos

El MVP cumple el recorrido central y puede ser evaluado localmente. Los próximos pasos recomendados son:

- realizar test con usuarios externos;
- desplegar backend y frontend;
- ejecutar la migración del contenido local a Supabase;
- configurar backups y monitoreo del entorno publicado;
- incorporar recuperación y verificación de email;
- agregar controles de consumo de IA;
- revisar accesibilidad con herramientas automáticas y lectores de pantalla;
- producir un reel corto con el recorrido completo.

## 21. Referencias

- Polarsteps. Sitio oficial y descripción de funciones de planificación, seguimiento y recapitulación. https://www.polarsteps.com/
- Goosechase. Sitio oficial, tipos de misiones, creación con IA y casos de turismo. https://www.goosechase.com/
- Wanderlog. Sitio oficial y propuesta de planificación, itinerario y mapa. https://wanderlog.com/
- Proxy Gemini Vertex para estudiantes. Documentación provista por la cátedra. https://gemini-vertex-student-proxy.vercel.app/docs
- Código fuente y documentación técnica de Rumbo: `README.md`, `docs/ia.md`, `docs/proceso.md` y `server/aiService.js`.

---

## Anexo A. Evidencias visuales

Las capturas incluidas en la versión DOCX/PDF documentan:

1. Dashboard y estado de los viajes.
2. Formulario personalizado de creación.
3. Próxima acción, progreso y tarjetas de misiones.
4. Registro de evidencia, emociones e historia.
5. Pasaporte y colección de sellos.
6. Bitácora final.

## Anexo B. Instrucciones de ejecución

```bash
npm install
cp .env.example .env
npm run dev
```

Abrir `http://localhost:3012/`.

La API key debe colocarse únicamente en `.env`, dentro de `AI_PROXY_API_KEY`. Nunca debe copiarse en `public/js/app.js`, HTML, CSS o repositorios públicos.
