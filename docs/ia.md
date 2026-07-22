# Integracion de IA

## Objetivo

Rumbo usa IA como una feature real del producto. La IA no se usa solo para disenar o programar, sino para producir contenido dentro de la experiencia del usuario.

## Momentos de IA

### 1. Generacion de misiones

Ruta:

```text
POST /api/ai/missions
```

Input:

- Destino.
- Fechas.
- Tipo de grupo.
- Estilo de viaje.
- Energia.
- Intereses.

Output:

- Lista de misiones.
- Categoria.
- Dificultad.
- Sello sugerido.

Una misión pendiente también puede reemplazarse de forma individual sin alterar
las demás ni consumir una generación completa de seis propuestas:

```text
POST /api/ai/missions/:missionId/regenerate
```

Las misiones completadas quedan protegidas para conservar su evidencia, sello y
recuerdo. Primero deben marcarse para rehacer antes de poder cambiarlas.

### 2. Generacion de sellos

Ruta:

```text
PATCH /api/missions/:missionId/complete
```

La ruta completa la mision y, como parte del flujo, llama a IA para crear el sello.

Input:

- Mision.
- Nota del usuario.
- Mood.

Output:

- Nombre del sello.
- Frase breve.
- Descripcion del recuerdo.

### 3. Bitacora final

Ruta:

```text
POST /api/ai/travel-log
```

Input:

- Datos del viaje.
- Misiones completadas.
- Notas.
- Moods.
- Sellos.

Output:

- Titulo.
- Relato final.
- Mejores momentos.
- Premios.
- Frases memorables.
- Caption para redes.

## Servicio

Servicio indicado por la catedra:

```text
https://gemini-vertex-student-proxy.vercel.app
```

Modelos previstos:

- `gemini-2.5-flash` para misiones, sellos y textos breves.
- `gemini-2.5-pro` para bitacora final.

Variables:

```bash
AI_PROXY_URL=https://gemini-vertex-student-proxy.vercel.app
AI_PROXY_ENDPOINT=
AI_PROXY_API_KEY=
AI_TEXT_MODEL=gemini-2.5-flash
AI_LONG_TEXT_MODEL=gemini-2.5-pro
AI_USE_FALLBACK=true
```

`AI_PROXY_ENDPOINT` queda vacio por defecto porque debe completarse con el endpoint exacto de la documentacion del proxy.

## Seguridad

- La API key no esta en el frontend.
- La API key vive en `.env`.
- El archivo `.env` no se sube al repositorio.
- Las rutas del frontend llaman a `/api/ai/...`.
- El backend llama al proxy.
- No se envian contrasenas ni datos innecesarios a IA.

## Prompts

Los prompts reales estan centralizados en:

```text
server/aiService.js
```

Todos piden JSON valido para facilitar el parseo y la persistencia.
