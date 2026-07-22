# Proceso de diseno y desarrollo

## Punto de partida

La consigna pide un producto digital testeable que integre inteligencia artificial como una feature real. A partir de eso se definio Rumbo como una app de viaje centrada en experiencia, memoria y juego.

## Problema

Muchos viajes terminan reducidos a fotos sueltas, chats y recuerdos dispersos. Rumbo propone pequenos desafios durante el viaje y luego los convierte en una memoria digital.

## Publico

Jovenes adultos de 18 a 35 anos que viajan solos, en pareja o en grupos chicos. Disfrutan sacar fotos, descubrir lugares y guardar recuerdos, pero no siempre tienen una forma clara de ordenar lo vivido.

## Decisiones de MVP

Se priorizo un flujo completo antes que muchas funcionalidades:

1. Crear cuenta.
2. Crear viaje.
3. Generar misiones.
4. Completar misiones.
5. Desbloquear sellos.
6. Generar bitacora.

Quedaron fuera del MVP:

- GPS.
- Mapas reales.
- Hoteles.
- Vuelos.
- Chat grupal.
- Subida de imagenes.

## Direccion visual

La interfaz combina:

- Pasaporte digital.
- Tarjetas de mision.
- Sellos circulares.
- Textura sutil de papel.
- Colores de viaje: azul noche, naranja atardecer, verde exploracion y crema papel.

## Decisiones tecnicas

- Se uso JavaScript puro en frontend para cumplir la consigna.
- Se uso Express para separar frontend, backend y llamadas a IA.
- Se mantuvo JSON como respaldo local y se agregó Supabase Postgres + Storage para la publicación y el acceso entre dispositivos.
- Se incorporaron sesiones con token, autorización por propiedad y recorrido de muestra de solo lectura.
- Se dejo el servicio de IA aislado en `aiService.js` para poder ajustar el proxy real sin tocar toda la app.
