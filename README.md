# Maestro IA - Asistente de Estudio Adaptativo

> 🎓 Una aplicación de escritorio construida con Electron que sirve como asistente de estudio adaptativo para personas con TDAH y recuperación de burnout.

## ¿Qué es Maestro IA?

Maestro IA es una aplicación de escritorio innovadora diseñada específicamente para ayudar a personas con **Trastorno por Déficit de Atención e Hiperactividad (TDAH)** y aquellos en recuperación de burnout a establecer rutinas de estudio efectivas. Utilizando un modelo de lenguaje local ejecutado mediante **Ollama**, Maestro IA crea planes de estudio personalizados, monitorea el progreso, enforces sesiones de productividad y valida la adquisición de habilidades.

### Principios de Diseño Fundamentales

1. ⏰ **Intervalos Dinámicos** - En lugar del tradicional Pomodoro de 25/5 minutos, Maestro IA adapta los períodos de trabajo y descanso según tu energía, tipo de tarea, hora del día y historial personal.
2. 🧠 **Diseñado para el TDAH** - Trabaja *con* tu neurobiología, abordando la ceguera temporal, fatiga ejecutiva, ciclos de evitación y trampas de hiperconcentración.
3. 🔋 **Restauración, no Agotamiento** - Prioriza descansos activos sobre el scroll pasivo para prevenir el agotamiento mental.
4. 🎯 **Mide Inicios, no Horas** - La métrica principal son las "iniciaciones exitosas" en lugar de las horas totales trabajadas.
5. 📋 **Programa, no Abruma** - Divide metas grandes en pasos diarios accionables para evitar la sobrecarga.

## Características Principales

### 🍅 Temporizador Inteligente
- **5 modos adaptativos**: Arranque difícil (5/2 min), Estudio regular (15/5 min), Trabajo profundo (35/8 min), Baja energía (10/5 min), Reverse Pomodoro (2/10 min)
- **Widget de energía**: Slider 1-5 para ajustar duración según tu nivel de energía antes de cada sesión
- **Sistema de recompensas**: Ganancia de puntos de energía (1 punto cada 5 minutos de enfoque)
- **Protección contra hiperconcentración**: Alertas 5 minutos antes del final con opción "Montar la Ola"

### 🎯 Sistema de Habilidades tipo RPG
- **4 habilidades predefinidas**: RPG Maker (Dev de Juegos), Godot 2D (Dev de Juegos), Apache NiFi (Ingeniería de Datos), Inglés (Validación de Idioma)
- **Seguimiento de progreso**: Cada habilidad tiene tareas específicas y porcentaje de completion
- **Recompensas por completado**: Asignación de tiempo de estudio otorga puntos de experiencia y energía

### 📅 Agenda y Planificador
- **Vista semanal**: Organiza tu semana con bloques de tiempo por día
- **Vista de calendario**: Planificación mensual con vista tradicional de calendario
- **Asociación de habilidades**: Vincula tareas a habilidades específicas para ganar XP relevante
- **Seguimiento de completado**: Marca tareas como completadas y registra tiempo invertido

### 💬 Chat Integrado Chat Integrado con IA Local
- **Potenciado por Ollama**: Usa modelos locales como `o con IA Local
- **Potenciado por Ollama**: Usa modelos locales como `qwen2.5-coder:3b` para total privacidad
- **Configuración avanzada**: Ajusta Temperature, Top-P y Max Tokens según tus necesidades
- **Prompt personalizable**: Define el comportamiento del asistente mediante System Prompt
- **Configuraciones predefinidas**: 
  - Preciso (temp=0.1, top_p=0.1, tokens=256) - Para definiciones y hechos
  - Equilibrado (temp=0.3, top_p=0.5, tokens=512) - Para explicaciones generales
  - Detallado (temp=0.2, top_p=0.3, tokens=1024) - Para tutoriales paso a paso
  - Creativo (temp=0.7, top_p=0.9, tokens=768) - Para brainstorming y pensamiento creativo
- **Modo de evaluación**: Compara múltiples configuraciones simultáneamente para encontrar tu setup óptimo

### 🔐 Seguridad y Privacidad Primero
- **Totalmente local**: Ningún dato sale de tu máquina (excepto lo que tú elijas compartir)
- **Validación estricta de URLs**: Solo permite conexiones a localhost/127.0.0.1 para Ollama
- **Arquitectura Electron segura**: 
  - `contextIsolation: true`
  - `sandbox: true` 
  - `nodeIntegration: false`
  - CSP: `script-src 'self'` (sin 'unsafe-inline')
- **Bloqueo de instancia única**: Previene corrupción de datos locales
- **Enlaces externos seguros**: Se abren en el navegador del sistema, nunca dentro de la app

## Requisitos

- Node.js (v14 o superior)
- [Ollama](https://ollama.ai/) (para el modelo de lenguaje) - **Debe estar instalado y ejecutándose**

## Instalación y Uso

1. Clonar el repositorio:
   ```bash
   git clone <repository-url>
   cd maestro_ia
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. **Instalar y ejecutar Ollama** (requisito esencial):
   ```bash
   # Instalar Ollama desde https://ollama.ai/
   # Descargar e instalar según su sistema operativo
   
   # Después de instalar, descargar el modelo recomendado:
   ollama pull qwen2.5-coder:3b
   
   # Iniciar el servicio de Ollama (debe estar ejecutándose para que la aplicación funcione):
   ollama serve
   ```
   > **Nota**: Ollama debe estar ejecutándose en segundo plano para que la aplicación pueda conectarse a él.
   > Puede dejarlo ejecutándose en una terminal separada o configurarlo para que se inicie automáticamente con su sistema.

4. Iniciar la aplicación:
   ```bash
   npm start
   ```
   **O alternativamente**, haga doble clic en `start.bat` para lanzar la aplicación directamente.

## Configuración

La aplicación se configura a través de la interfaz de usuario en la pestaña "Ajustes":

- **URL de Ollama**: Por defecto `http://localhost:11434` (no cambie esto si Ollama está ejecutándose localmente)
- **Modelo**: Seleccione entre varios modelos disponibles en Ollama (debe haber descargado el modelo previamente con `ollama pull`)
- **System Prompt**: Personaliza el comportamiento del asistente
- **Temperatura**: Controla la aleatoriedad de las respuestas (0-2)
- **Top-P**: Controla la diversidad del muestreo mediante probabilidad acumulativa (0-1)
- **Max Tokens**: Limita la longitud de las respuestas

### Configuraciones Predefinidas
Para facilitar el uso, la aplicación incluye cuatro configuraciones optimizadas accesibles mediante botones en la sección de Ajustes:

| Configuración | Temperature | Top-P | Max Tokens | Caso de Uso Ideal |
|--------------|-------------|-------|------------|-------------------|
| **Preciso** | 0.1 | 0.1 | 256 | Definiciones, hechos, conceptos básicos |
| **Equilibrado** | 0.3 | 0.5 | 512 | Explicaciones generales, respuestas equilibradas |
| **Detallado** | 0.2 | 0.3 | 1024 | Tutoriales paso a paso, explicaciones profundas |
| **Creativo** | 0.7 | 0.9 | 768 | Brainstorming, analogías, pensamiento creativo |

### Parámetros Específicos Solicitados
Puede configurar manualmente los parámetros que especificó en su solicitud:
- Temperature: 0.22
- Top-P: 0.9  
- Max Tokens: 4086
Esta configuración es ideal para explicaciones técnicas detalladas y precisas.

## Estructura del Proyecto

- `app.mjs` — Lógica de la aplicación (ES Module). Cargado por `index.html` vía `<script type="module">`. Expone estado, funciones y auto-arranque.
- `index.html` — UI (HTML + CSS inline). Carga `app.mjs` como módulo.
- `electron.cjs` — Proceso principal de Electron (CommonJS): ventana, single-instance lock, CrashReporter, navegación segura.
- `server.cjs` — Servidor HTTP de desarrollo (`http://localhost:8081`). Sirve `index.html`, `app.mjs`, `.css`.
- `jest.config.cjs` — Configuración de Jest 30 con `--experimental-vm-modules` para tests ESM.
- `__tests__/` — Suites Jest, 11 archivos `.test.mjs` que importan `app.mjs` directamente.
- `__tests__/helpers/setupDom.mjs` — Helper que pobla el DOM de jsdom con los `#id` necesarios.
- `package.json` — `"type": "module"`; `build.files` incluye `index.html`, `app.mjs`, `electron.cjs`.

## Seguridad y CSP

- `Content-Security-Policy` en `index.html` (línea 6): `script-src 'self'` (sin `'unsafe-inline'`), `style-src 'self' 'unsafe-inline'`, `connect-src 'self' http://localhost:11434 http://127.0.0.1:11434`, `object-src 'none'`, `frame-ancestors 'none'`.
- `electron.cjs`: `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`.
- `ollamaUrl` se valida con `isAllowedOllamaUrl()` antes de cualquier `fetch` — solo se acepta loopback (`localhost`, `127.0.0.1`, `::1`) sobre `http`/`https`.
- Electron `setWindowOpenHandler` y `will-navigate` envían URLs externas al navegador del sistema y bloquean navegación interna.
- `requestSingleInstanceLock()` previene múltiples instancias del proceso (protege `localStorage`).

## Desarrollo

```bash
npm start             # Lanza Electron (app.mjs + electron.cjs)
node ./server.cjs     # Solo dev server: http://localhost:8081
npm test              # 11 suites, 28 tests
npm run build         # Empaqueta con electron-builder (NSIS + portable)
```

Build con firma de código: `CSC_LINK` y `CSC_KEY_PASSWORD` como variables de entorno (opcionales; build local funciona sin firma).

## Hallazgos cerrados

- M-1 ollamaUrl allowlist ✓
- M-2 localStorage clear-data (botón en Ajustes) ✓
- M-3 code signing config (`build.win.certificateFile`) ✓
- M-4 macOS dock single-instance ✓
- M-5 CrashReporter (kolekte local; upload opt-in) ✓
- M-6 ASAR packaging ✓
- M-7 ARIA skip-link ✓
- M-8 CSP sin `'unsafe-inline'` en `script-src` ✓
- M-9 `.gitignore` para `localStorage/`, `userData/`, `crashDumps/` ✓

## Notas Importantes

1. **Ollama es un requisito previo**: La aplicación **no funcionará** si Ollama no está instalado, ejecutándose y con al menos un modelo descargado.

2. La aplicación se conecta a Ollama mediante la URL configurada en la pestaña de Ajustes (por defecto `http://localhost:11434`).

3. **No requiere base de datos externa**: Toda la configuración, estado del temporizador, progreso de habilidades y agenda se almacenan localmente usando `localStorage` del navegador integrado en Electron.

4. Antes de usar la función de chat en la aplicación, asegúrese de:
   - Tener Ollama ejecutándose (`ollama serve`)
   - Tener al menos un modelo descargado (ej: `ollama pull qwen2.5-coder:3b`)
   - Verificar que la URL en Ajustes apunte a la instancia correcta de Ollama

5. Si experimenta problemas de conexión:
   - Verifique que Ollama esté ejecutándose en su máquina
   - Confirme que pueda acceder a `http://localhost:11434/api/tags` en su navegador o con curl (debería mostrar una lista de modelos o un mensaje de la API)
   - Asegúrese de que no haya firewalls bloqueando la conexión

6. Para obtener mejor rendimiento con modelos de lenguaje, asegúrese de tener suficiente RAM disponible (se recomiendan al menos 8GB de RAM totales para usar modelos de 3B-7B cómodamente).

## Solución de Problemas

- **Ollama no está disponible**: 
  - Verifique que Ollama esté instalado y ejecutándose
  - Intente acceder manualmente a `http://localhost:11434/api/tags` en su navegador o con curl
  - Si ve una lista de modelos (incluso vacía), entonces Ollama está funcionando

- **Modelo no encontrado**:
  - Ejecute `ollama list` para ver qué modelos tiene instalados
  - Descargue el modelo deseado con `ollama pull <nombre-del-modelo>`

- **Lento o sin respuesta**:
  - Los modelos de lenguaje requieren recursos significativos; cierre otras aplicaciones intensivas en memoria
  - Considere usar modelos más pequeños si tiene limitaciones de hardware

## Licencia

[Especificar licencia aquí]