# Copilot instructions for Maestro IA

## Project overview

Maestro IA is a Spanish-language Electron desktop app for ADHD and burnout-aware study assistance. It combines an adaptive focus/break timer, RPG-style skill and task tracking, a weekly/monthly planner, and a local Ollama chat/evaluation panel. User data is intentionally local: there is no external application database.

## Build, run, and test commands

Install dependencies with `npm install`.

```bash
# Run the Electron desktop app
npm start

# Run the static development server at http://localhost:8081
node ./server.cjs

# Run all Jest unit tests (ESM + jsdom)
npm test

# Run one Jest file
npm test -- __tests__/timer.test.mjs

# Run one Jest test by name
npm test -- __tests__/timer.test.mjs -t "timer starts"

# Run Jest in watch mode or with coverage
npm run test:watch
npm run test:coverage

# Run Playwright E2E tests; the config starts/reuses server.cjs
npm run test:e2e

# Run one E2E spec or one E2E test by title
npx playwright test tests/e2e/basic-test.spec.cjs
npx playwright test tests/e2e/basic-test.spec.cjs -g "test title"

# Show the last Playwright HTML report
npm run test:e2e:report

# Package Windows installer and portable builds, respectively
npm run build
npm run build:portable
```

There is no lint script in `package.json`; use the existing Jest and Playwright suites as the validation paths for behavior and UI changes. Jest is configured with a 70% global threshold for branches, functions, lines, and statements. Playwright uses Chromium against the development server by default; Electron E2E coverage is opt-in with `RUN_ELECTRON_E2E=1`.

Chat and connection tests assume Ollama behavior can be mocked. For manual chat testing, start Ollama separately and pull a model such as `qwen2.5-coder:3b`:

```bash
ollama serve
ollama pull qwen2.5-coder:3b
```

## Architecture

- [electron.cjs](C:/Users/Fabian/Desktop/_Proyectos/Proyectos/maestro_ia/electron.cjs) is the CommonJS main process. It owns the single-instance lock, frameless `BrowserWindow`, secure web preferences, crash reporting, external-link handling, navigation blocking, and titlebar IPC handlers.
- [preload.cjs](C:/Users/Fabian/Desktop/_Proyectos/Proyectos/maestro_ia/preload.cjs) is the narrow context-isolated bridge. It exposes only `window.electronAPI` methods for minimize, maximize, close, and maximize-state notifications.
- [index.html](C:/Users/Fabian/Desktop/_Proyectos/Proyectos/maestro_ia/index.html) is the single renderer shell: Spanish markup, embedded CSS/design tokens, CSP, and the timer/skills/chat/schedule/settings layout. It loads `app.mjs` as an ES module.
- [app.mjs](C:/Users/Fabian/Desktop/_Proyectos/Proyectos/maestro_ia/app.mjs) contains nearly all renderer behavior and a central mutable `state`: timer modes and intervals, skill/task CRUD and XP, weekly schedule and calendar persistence, chat/evaluation requests, settings, modals/toasts, and initialization. It renders HTML into the shell and persists through `localStorage`.
- [server.cjs](C:/Users/Fabian/Desktop/_Proyectos/Proyectos/maestro_ia/server.cjs) is only the development HTTP server. It serves allowlisted static file types from the repository root on port 8081 and is not the production runtime.
- [__tests__](C:/Users/Fabian/Desktop/_Proyectos/Proyectos/maestro_ia/__tests__) imports `app.mjs` directly under Jest/jsdom. `__tests__/helpers/setupDom.mjs` creates the IDs expected by functions; tests generally reset or mutate the exported app state and mock `fetch`, timers, storage, and dialogs.
- [tests/e2e](C:/Users/Fabian/Desktop/_Proyectos/Proyectos/maestro_ia/tests/e2e) exercises the real HTML/module flow through Chromium and the dev server. `playwright.config.cjs` owns server startup, browser projects, retries, and failure artifacts.

The normal data flow is: DOM interaction -> delegated `data-action` handler in `app.mjs` -> central `state` mutation -> `render*` update -> `saveState()` or feature-specific localStorage write. The chat path validates the Ollama URL, calls `/api/tags` for availability and `/api/generate` for responses, and supports aborting an in-flight request.

## Repository-specific conventions and constraints

### Modules and UI events

- The package is `"type": "module"`, but Electron main/preload/server and Jest/Playwright config files intentionally remain CommonJS (`.cjs`). Do not convert them casually.
- Keep renderer behavior in `app.mjs` and the static shell/styles in `index.html`; there are no frontend frameworks or external CSS dependencies.
- The bottom of `app.mjs` exposes named functions to `window` for the HTML bridge and delegates `click`/`change` events through `data-action`, `data-args`, and `data-stop`. Prefer this CSP-safe mechanism for dynamic UI instead of adding inline event handlers or new ad-hoc listeners.
- Preserve the initialization split: browser startup goes through `initApp(window, document)`, while unit tests import functions and call initialization/helpers explicitly.
- User-facing strings are Spanish. Match the existing terminology for timer modes, skills, schedule, settings, status messages, and toast/modal feedback.

### Persistence and behavior

- `maestro_state` stores the canonical state subset (energy, selected mode, daily stats, streak, session history, settings, and skills).
- Weekly tasks use `maestro_schedule_{dayIndex}`; calendar tasks use `maestro_calendar_{dateStr}`. Keep these key formats stable when changing persistence.
- `recordSession()` caps history at the most recent 100 entries. Energy rewards are capped at 5; avoid changing completion/un-completion semantics without updating the related tests.
- Timer and break intervals are module-level handles. Clear them when stopping, resetting, or completing flows to avoid duplicate ticks.
- `clearAllData()` is the single full-reset path and must preserve the app's canonical default state after clearing storage.

### Ollama and security

- All new Ollama URLs must pass `isAllowedOllamaUrl()`. Only `http`/`https` loopback hosts (`localhost`, `127.0.0.1`, or `::1`) are allowed.
- Keep the CSP in [index.html](C:/Users/Fabian/Desktop/_Proyectos/Proyectos/maestro_ia/index.html) strict: `script-src 'self'`, loopback-only `connect-src`, and no new inline scripts or unsafe script sources.
- Preserve Electron `contextIsolation: true`, `sandbox: true`, and `nodeIntegration: false`. Do not expose Node/Electron primitives directly to the renderer.
- External `http(s)` links are opened through the system browser by Electron; in-app navigation away from `index.html` is blocked.
- The app must remain local-first. Do not add telemetry, remote persistence, or non-loopback network calls without an explicit product/security decision.

### Packaging and assets

- `package.json` `build.files` is an explicit allowlist: `index.html`, `app.mjs`, `electron.cjs`, `preload.cjs`, and `assets/**/*`. Add any new runtime asset to that list if the allowlist changes.
- Optional code signing uses `CSC_LINK` and `CSC_KEY_PASSWORD`; unsigned local builds are supported.
- `humanizer/` and `wiki-skills/` are separate subprojects with their own Git metadata; changes there are not part of the main app unless explicitly requested.
