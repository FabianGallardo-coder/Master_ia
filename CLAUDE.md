# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Application Execution:**
- `npm start` - Launch the Electron application (main development command)
- `node ./server.cjs` - Run only the development HTTP server on http://localhost:8081
- Double-click `start.bat` - Alternative way to launch the application directly

**Testing:**
- `npm test` - Run all Jest tests (11 test suites, 28 tests)
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run test:debug` - Run tests with debugger
- `npm run test:e2e` - Run Playwright end-to-end tests
- `npm run test:e2e:headed` - Run E2E tests in headed mode
- `npm run test:e2e:report` - Show Playwright test report

**Building:**
- `npm run build` - Package application with electron-builder (creates NSIS installer + portable version)
- `npm run build:portable` - Create only portable version
- Code signing: Set `CSC_LINK` and `CSC_KEY_PASSWORD` environment variables for signed builds

**Development Workflow:**
1. Ensure Ollama is installed and running (`ollama serve`)
2. Ensure required model is downloaded (e.g., `ollama pull qwen2.5-coder:3b`)
3. Run `npm start` to develop/test the application
4. Use `node ./server.cjs` for rapid web-based iteration (connects to same index.html/app.mjs)
5. Run tests frequently with `npm test`

## Code Architecture & Structure

**Core Architecture:**
- **Electron Main Process** (`electron.cjs`): Creates BrowserWindow, handles single-instance lock, sets up security (contextIsolation, sandbox, no nodeIntegration), manages CrashReporter, and handles external link opening
- **Development Server** (`server.cjs`): Simple HTTP server serving static files for rapid iteration without Electron
- **Renderer Process** (`index.html` + `app.mjs`): 
  - `index.html`: Single HTML file containing all UI (HTML/CSS/JS) with embedded CSS
  - `app.mjs`: ES Module containing all application logic (state management, timer, skills, schedule, chat, settings, persistence)

**Key Components:**
1. **State Management** (`app.mjs`): Central `state` object containing:
   - Timer state (energy, selected mode, timing, sessions)
   - UI state (calendar view, cursor)
   - User settings (Ollama URL, model, prompts, parameters)
   - Skills array (RPG Maker, Godot 2D, Apache NiFi, English validation)
   - Session history

2. **Timer System:** 
   - Five modes: Hard Start (5/2), Regular Study (15/5), Deep Work (35/8), Low Energy (10/5), Reverse (2/10)
   - Energy-based break awards (1 energy point per 5 minutes)
   - Modal system for linking completed sessions to skills/tasks

3. **Persistence:** 
   - `localStorage` for all user data (state, skills, schedule, calendar)
   - Keyed storage: `maestro_state`, `maestro_schedule_{dayIndex}`, `maestro_calendar_{date}`
   - Single `clearAllData()` function for complete reset

4. **Modules/Panels:**
   - **Timer:** Pomodoro-based adaptive timer with energy widget
   - **Skills:** RPG-style skill tracking with XP/progress system
   - **Schedule:** Weekly planner + calendar view with drag-and-drop task assignment
   - **Chat:** Local LLM interface via Ollama API with presets and evaluation mode
   - **Settings:** Configuration panel for Ollama connection, model selection, and parameters

5. **Security Features:**
   - CSP: `script-src 'self'` (no 'unsafe-inline'), restricted connect-src to localhost
   - Electron security: `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`
   - URL validation: `isAllowedOllamaUrl()` restricts to localhost/127.0.0.1 only
   - Single-instance lock prevents localStorage corruption
   - External links open in system browser, internal navigation blocked

**Data Flow:**
1. User interacts with UI (index.html)
2. Events handled by functions in app.mjs (attached to window via bridge)
3. State updated in app.mjs state object
4. Changes persisted to localStorage via saveState()/save*() functions
5. UI updated via render*() functions
6. Ollama communication via fetch() in sendMessage()/checkOllama()
7. Timer logic uses setInterval() with second-granularity ticks

**Development Notes:**
- All UI/index.html contains embedded CSS and logic - no external dependencies
- app.mjs is ES module shared between browser (via <script type="module">) and tests
- Bridge mechanism copies all functions to window for HTML onclick attributes
- Tests use jsdom with setupDom() helper to populate required elements
- Development server (server.cjs) enables hot-reload style workflow
- Build process packages only index.html, app.mjs, electron.cjs via electron-builder