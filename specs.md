# Especificación del Proyecto: Opus Dei Quiz

## 1. Resumen
Aplicación web tipo quiz (SPA) sobre la vida y el legado de San Josemaría Escrivá y otros referentes del Opus Dei. Incluye autenticación, selección de tema, modos de juego, puntuaciones y clasificación global persistida en Firestore. La UI es React + Tailwind con animaciones, y se distribuye como PWA.

## 2. Objetivos
- Permitir a usuarios registrados jugar cuestionarios temáticos.
- Registrar y mostrar un ranking global por modo y tema.
- Ofrecer una experiencia rápida y móvil con soporte PWA.

## 3. Alcance Funcional
- Autenticación:
  - Registro con email/contraseña.
  - Inicio de sesión con email/contraseña.
  - Inicio de sesión con Google.
  - Perfil de usuario con `displayName`, `email`, `photoURL`.
- Juego:
  - Selección de tema.
  - Selección de modo de juego.
  - Preguntas de opción múltiple con retroalimentación inmediata.
  - Resultado final con puntuación y métricas.
- Clasificación:
  - Tabla global de puntuaciones (top 50) con filtros por modo y tema.
- Persistencia:
  - Guardado de perfiles y puntuaciones en Firestore.
- Infra:
  - Servidor Express en modo dev y estático en producción.
  - PWA con manifest y registro de Service Worker.

## 4. Modos de Juego y Reglas
- **Estándar**:
  - 10 preguntas aleatorias.
  - 10 puntos por acierto.
- **Contrarreloj**:
  - 10 preguntas aleatorias.
  - Se mide el tiempo total.
  - Si completa las 10 y mejora el récord del tema, obtiene 50 puntos; si no, 0.
- **Supervivencia**:
  - Preguntas aleatorias hasta fallar.
  - 2 puntos por acierto.

## 5. Temas y Preguntas
- Temas disponibles (`Topic`):
  - `josemaria` (San Josemaría)
  - `alvaro` (Álvaro del Portillo)
  - `javier` (Javier Echevarría)
  - `guadalupe` (Guadalupe Ortiz)
- Tamaño de los bancos de preguntas:
  - `QUESTIONS_POOL`: 100 preguntas (`src/questions.ts`).
  - `ALVARO_QUESTIONS_POOL`: 50 preguntas (`src/questions_alvaro.ts`).
  - `JAVIER_QUESTIONS_POOL`: 50 preguntas (`src/questions_javier.ts`).
  - `GUADALUPE_QUESTIONS_POOL`: 50 preguntas (`src/questions_guadalupe.ts`).

## 6. Flujo de Usuario
1. El usuario abre la app.
2. Si no hay sesión, ve pantalla de login/registro.
3. Tras iniciar sesión, elige tema y modo.
4. Juega el quiz y recibe feedback por pregunta.
5. Al finalizar, se guarda la puntuación y puede ver el ranking.

## 7. Requisitos de Datos (Firestore)
### 7.1 Colección `users`
- Documento: `/users/{uid}`
- Campos:
  - `uid`: string (requerido)
  - `displayName`: string (requerido)
  - `photoURL`: string (opcional)
  - `email`: string (requerido)

### 7.2 Colección `scores`
- Documento: `/scores/{scoreId}`
- Campos:
  - `uid`: string (requerido)
  - `displayName`: string (requerido)
  - `score`: number (requerido)
  - `mode`: `standard | time-trial | survival` (requerido)
  - `topic`: `josemaria | alvaro | javier | guadalupe` (requerido)
  - `time`: number en ms (opcional; solo para contrarreloj)
  - `timestamp`: string ISO 8601 (requerido)

### 7.3 Reglas de seguridad (resumen)
- Lectura de `scores`: pública.
- Escritura de `scores`: solo usuarios autenticados y con datos válidos.
- `users`: lectura solo autenticados; escritura solo el propio usuario.

## 8. Requisitos Técnicos
- Node.js requerido (ver `package.json`).
- React 19 + Vite 6.
- Tailwind CSS 4 con plugin oficial.
- Firebase:
  - Auth (Google + email/password).
  - Firestore para perfiles y ranking.
- PWA:
  - Manifest definido en `vite.config.ts`.
  - Registro de SW en `src/main.tsx`.

## 9. Configuración y Variables de Entorno
Archivo de ejemplo: `.env.example`
- `GEMINI_API_KEY`: definido para AI Studio, actualmente no se usa en el código de la app.
- `APP_URL`: URL del despliegue; tampoco se consume directamente en el código actual.

## 10. Endpoints
Servidor Express (`server.ts`):
- `GET /api/health` → `{ status: "ok" }`

## 11. Assets y UI
- Icono PWA: `public/pwa-icon.svg`.
- En la selección de tema se referencian imágenes `input_file_0.png` a `input_file_3.png`.
  - **Nota**: esos archivos no existen en el repositorio actual y deberían añadirse en `public/` o ajustarse las rutas.

## 12. Scripts de Desarrollo
Definidos en `package.json`:
- `npm run dev`: arranca Express + Vite en modo dev.
- `npm run build`: build de Vite.
- `npm run preview`: preview de Vite.
- `npm run lint`: TypeScript `--noEmit`.

## 13. Dependencias Clave
- `react`, `react-dom`
- `express`
- `firebase`
- `tailwindcss` + `@tailwindcss/vite`
- `vite-plugin-pwa`
- `motion` (animaciones) y `lucide-react` (iconos)
- `@google/genai` está instalado pero no se usa en el código actual.

## 14. Requisitos No Funcionales
- Responsivo (mobile-first).
- Animaciones suaves en transiciones de vistas y preguntas.
- Persistencia inmediata en Firestore y actualización en tiempo real de la clasificación.

## 15. Riesgos y Gaps Identificados
- Falta de imágenes `input_file_*.png` para temas.
- Variables de entorno de Gemini/APP_URL no se usan (posible deuda técnica).

