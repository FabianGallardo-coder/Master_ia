# AGENTS.md

## Project

Electron desktop app for ADHD/burnout study assistance. Local LLM (Ollama) for chat, adaptive timer, skill tracking, schedule planner. UI in Spanish.

## Architecture

- `electron.cjs` — Main process (CommonJS): BrowserWindow, single-instance lock, CrashReporter, security policies, external-link handling, custom-titlebar IPC handlers
- `preload.cjs` — Exposes `window.electronAPI` (`minimize`/`maximize`/`close`/`onMaximizeChange`) via contextBridge for the frameless titlebar
- `app.mjs` — Renderer logic (ES Module): all state management, timer, skills, schedule, chat, settings, persistence. Loaded via `<script type="module">` in index.html
- `index.html` — UI shell: HTML + embedded CSS (no external deps, no frameworks)
- `server.cjs` — Dev HTTP server on `localhost:8081` (serves static files, path-traversal protected)
- `__tests__/` — Jest unit tests (19 `.test.mjs` files)
- `tests/e2e/` — Playwright E2E specs (`.spec.cjs`, Chromium against dev server)
- `humanizer/`, `wiki-skills/` — Separate subprojects (each has own `.git`)

## Commands

```bash
npm start              # Launch Electron
node ./server.cjs      # Dev server only (http://localhost:8081)
npm test               # Jest: 19 files — requires --experimental-vm-modules (already in script)
npm run test:watch     # Jest watch mode
npm run test:coverage  # Jest with coverage (70% threshold global)
npm run test:debug     # Jest with --inspect-brk
npm run test:e2e       # Playwright (starts server.cjs automatically)
npm run test:e2e:headed
npm run test:e2e:report
npm run build          # electron-builder (NSIS + portable)
npm run build:portable # Portable only
```

## Key Gotchas

- **Module mismatch**: Project is `"type": "module"` but `electron.cjs`, `server.cjs`, `preload.cjs`, `jest.config.cjs` are CommonJS. Don't convert them to ESM.
- **Frameless window**: `frame: false`; titlebar buttons in index.html call `window.electronAPI` (preload). No `electronAPI` in the browser/dev-server context — titlebar buttons dead under `server.cjs`, that's expected.
- **Jest + ESM**: Tests use `--experimental-vm-modules`. Test files import `app.mjs` directly. `__tests__/helpers/setupDom.mjs` populates jsdom with required `#id` elements.
- **Bridge pattern**: `app.mjs` copies all functions to `window` via IIFE at bottom so `index.html` inline `onclick="..."` attributes work. Tests bypass this and import functions directly.
- **CSP is strict**: `script-src 'self'` (no `'unsafe-inline'`), `connect-src` only allows `localhost:11434` and `127.0.0.1:11434`. Don't add inline scripts or widen connect-src.
- **URL allowlist**: `isAllowedOllamaUrl()` in app.mjs restricts Ollama URLs to loopback only. Any new network calls must go through this validator.
- **Security settings**: `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`. Never change these.
- **localStorage is the DB**: All data persists in localStorage keys `maestro_state`, `maestro_schedule_{dayIndex}`, `maestro_calendar_{dateStr}`. No external database.
- **Build only packages 5 entries**: `build.files` in package.json = `["index.html", "app.mjs", "electron.cjs", "preload.cjs", "assets/**/*"]`. New assets need to be added there.
- **UI is Spanish**: All user-facing strings are in Spanish.

## Testing

- Jest tests: `__tests__/*.test.mjs` — each file imports specific functions from `app.mjs`
- Helper: `__tests__/helpers/setupDom.mjs` creates jsdom elements needed by functions
- Coverage threshold: 70% branches/functions/lines/statements
- E2E: Playwright with `tests/e2e/*.spec.cjs`, uses Chromium against `localhost:8081`
- E2E Electron opt-in: `RUN_ELECTRON_E2E=1` to test Electron shell directly

## External Dependencies

- **Ollama** (runtime): Required. Must be running with a model pulled (e.g., `ollama pull qwen2.5-coder:3b`)
- **Electron** (runtime): v33.x
- **Playwright** (dev): E2E testing
- **Jest + jsdom** (dev): Unit testing
- **@testing-library/dom + jest-dom** (dev): DOM assertions in tests

## Code Signing

Optional: set `CSC_LINK` and `CSC_KEY_PASSWORD` env vars. Build works without them.
