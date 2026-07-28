const fs = require('fs');
const path = require('path');

/**
 * Loads the inline <script> from index.html into the calling jsdom window.
 *
 * Strategy (two-phase):
 *   1. Inject the <body> markup of index.html into the jsdom document so
 *      every `document.getElementById(...)` call inside the script resolves
 *      to a real element. (jsdom starts with an empty <body> by default.)
 *   2. Extract the LAST <script>...</script> block, compile it via
 *      `new Function(script)`, and call it with `window` as `this`. All
 *      `function foo()` declarations and `var x = ...` globals end up on
 *      `window`, so tests can call `window.startTimer()` directly.
 *
 * Why this works: the script's references to `document`, `localStorage`,
 * `window`, etc. all resolve to the jsdom bindings of the calling test.
 *
 * Usage:
 *   const { runScript } = require('./helpers/loadIndexHtml');
 *   let env;
 *   beforeEach(() => { env = runScript({ fetch: jest.fn() }); });
 *   test('timer starts', () => {
 *     window.state.timeRemaining = 60;
 *     window.startTimer();
 *     expect(window.state.timerRunning).toBe(true);
 *   });
 */

function runScript(overrides = {}) {
    const indexPath = path.resolve(__dirname, '..', '..', 'index.html');
    if (!fs.existsSync(indexPath)) {
        throw new Error(`index.html not found at ${indexPath}`);
    }

    const html = fs.readFileSync(indexPath, 'utf8');

    // ── Phase 1: populate jsdom with the <body> markup ──
    // Strip <script> blocks (jsdom would try to execute them; we want
    // control over execution in phase 2). Also strip <style> blocks
    // (they don't affect runtime behavior in jsdom).
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (!bodyMatch) {
        throw new Error('No <body> tag found in index.html');
    }
    let bodyHTML = bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, '');
    document.body.innerHTML = bodyHTML;

    // Also copy the <head> meta/link tags (CSP etc. — harmless in jsdom
    // but keeps the document structurally faithful).
    const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    if (headMatch) {
        const headHTML = headMatch[1].replace(/<script[\s\S]*?<\/script>/gi, '');
        const headEl = document.head;
        // jsdom doesn't support innerHTML on <head> cleanly; append nodes.
        const tmp = document.createElement('div');
        tmp.innerHTML = headHTML;
        while (tmp.firstChild) headEl.appendChild(tmp.firstChild);
    }

    // ── Phase 2: extract and execute the inline <script> ──
    const matches = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
    if (matches.length === 0) {
        throw new Error('No <script> tag found in index.html');
    }
    if (matches.length > 1) {
        console.warn(`loadIndexHtml: found ${matches.length} <script> blocks in index.html; using the last one.`);
    }
    const appScript = matches[matches.length - 1][1];

    if (!appScript.includes('startTimer') || !appScript.includes('sendMessage')) {
        throw new Error('Inline app script is missing expected functions (startTimer/sendMessage)');
    }

    // Stub `fetch` BEFORE the script runs, so its initial `checkOllama`
    // poll hits our override instead of trying a real network call.
    if (overrides.fetch) {
        window.fetch = overrides.fetch;
    }

    // `new Function(...)` runs in strict mode where `var x = ...` at the
    // top of the body becomes local to that function, NOT a property of
    // window. We need the script's top-level `var state`, `var MODES`,
    // `function startTimer`, etc. to become globals of the jsdom window
    // so tests can call `window.startTimer()` and read `window.state`.
    //
    // The inline script declares its state with `const MODES = ...`,
    // `let timerInterval = ...`, and `const state = {...}` — `const`/`let`
    // at top-level do NOT leak onto the global object (they sit in the
    // module/eval scope). `function foo()` declarations DO leak. So the
    // helpers are accessible via `window.startTimer` but `state` and
    // `MODES` are not — unless we explicitly re-export them.
    //
    // Trick: append a small tail that grabs those locals via `eval`'s
    // own scope and assigns them onto `this` (window). This works because
    // indirect eval shares the surrounding lexical scope.
    const evalFn = (0, eval); // indirect eval — preserves global scope
    const exportTail = `
;try { window.state = (typeof state !== 'undefined') ? state : null; } catch (e) {}
;try { window.MODES = (typeof MODES !== 'undefined') ? MODES : null; } catch (e) {}
;try { window.BREAK_ACTIVITIES = (typeof BREAK_ACTIVITIES !== 'undefined') ? BREAK_ACTIVITIES : null; } catch (e) {}
;try { window.timerInterval = (typeof timerInterval !== 'undefined') ? timerInterval : null; } catch (e) {}
;try { window.ollamaAvailable = (typeof ollamaAvailable !== 'undefined') ? ollamaAvailable : null; } catch (e) {}
`;
    evalFn.call(window, appScript + exportTail);

    return {
        // Back-compat: previous tests did `ctx = env.runScript()` then
        // `ctx.startTimer()`. The `window` alias lets them do the same
        // thing: `ctx.startTimer()` where ctx === window.
        window,
        document,
        navigator,
        localStorage,
        state: window.state,
        MODES: window.MODES,
        BREAK_ACTIVITIES: window.BREAK_ACTIVITIES,
        // Legacy alias — some tests use `env.runScript()` as if env was
        // a callable wrapper. Returns the window so `ctx.foo()` chains
        // still work.
        runScript: () => window,
    };
}

module.exports = { runScript };