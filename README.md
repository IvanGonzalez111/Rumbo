# Rumbo

Rumbo es una app web que convierte un viaje en una aventura interactiva. El usuario crea un viaje, genera misiones personalizadas con IA, completa recuerdos, desbloquea sellos digitales y crea una bitacora final.

## Stack

- Frontend: HTML, CSS y JavaScript puro.
- Backend: Node.js + Express.
- Persistencia: Supabase Postgres + Storage en producción, con JSON local como respaldo de desarrollo.
- IA: rutas backend propias que llaman al proxy de la catedra si esta configurado.

## Funcionalidades del MVP

- Crear cuenta e iniciar sesion.
- Explorar un recorrido de muestra en modo solo lectura.
- Crear viajes por usuario.
- Generar misiones personalizadas.
- Ver y filtrar misiones.
- Completar y editar misiones con foto o video, varias emociones, nota y recuerdo opcional.
- Rehacer una misión completada sin afectar el resto del viaje.
- Desbloquear sellos.
- Ver pasaporte digital.
- Generar bitacora final.
- Guardar viajes, misiones, sellos y bitacoras.

## Instalacion

```bash
npm install
```

Crear un archivo `.env` tomando como base `.env.example`.

```bash
cp .env.example .env
```

## Ejecutar

```bash
npm run dev
```

Abrir:

```text
http://localhost:3012
```

La cuenta que abre `Ver recorrido de muestra` se configura con
`SHOWCASE_USER_EMAIL`. El visitante puede recorrer viajes, misiones, sellos y
bitacoras, pero no crear, editar ni eliminar contenido desde esa vista.

## Persistencia al publicar

Sin variables de Supabase, la app usa `data/rumbo.json` para desarrollo local.
Cuando `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` están configuradas, las
cuentas, sesiones, viajes, misiones, sellos y bitácoras se guardan en Postgres;
las fotos y videos se guardan en un bucket privado de Storage. Así, una persona
puede cerrar sesión y volver a entrar desde otro dispositivo sin perder su viaje.

### Configurar Supabase

1. Crear un proyecto en Supabase.
2. Abrir el SQL Editor y ejecutar `supabase/migrations/001_rumbo.sql`.
3. Copiar la URL del proyecto y la `service_role` key al `.env` del servidor.
4. Importar los datos locales existentes una sola vez:

```bash
npm run migrate:supabase
```

La `SUPABASE_SERVICE_ROLE_KEY` nunca debe copiarse al frontend, subirse a Git ni
exponerse con un prefijo público. En el hosting se configura como variable
secreta del servidor.

Los videos del MVP pueden pesar hasta 40 MB y durar hasta 30 segundos. El margen
permite registrar consignas de 15 segundos sin exigir una compresión agresiva.

## IA y fallback

El frontend nunca llama directo al servicio de IA. Siempre usa rutas del backend:

- `POST /api/ai/missions`
- `POST /api/ai/missions/:missionId/regenerate`
- `POST /api/ai/stamp`
- `POST /api/ai/travel-log`

Si el proxy no esta configurado o falla, el proyecto usa respuestas fallback para que el MVP siga siendo testeable durante una demo.

Para obligar a que falle si la IA real no responde:

```bash
AI_USE_FALLBACK=false
```

## Seguridad

- `.env` esta en `.gitignore`.
- Las credenciales no aparecen en el frontend.
- Las sesiones usan tokens aleatorios; en la base solo se guarda su hash.
- Cada ruta verifica que el viaje pertenezca a la cuenta autenticada.
- El recorrido de muestra usa una sesión temporal de solo lectura.
- El backend recibe datos minimos y arma los prompts.
- Las respuestas de IA se normalizan antes de guardarse.
- Las contrasenas se guardan hasheadas con `crypto.pbkdf2Sync`.

## Estructura

```text
rumbo/
  server/
    index.js
    db.js
    security.js
    aiService.js
    routes/
  public/
    index.html
    css/styles.css
    js/app.js
  data/
  docs/
```
