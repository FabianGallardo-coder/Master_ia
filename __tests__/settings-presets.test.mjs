// Tests for app.mjs applyPreset.

import { applyPreset, attachToWindow } from '../app.mjs';
import { setupDom } from './helpers/setupDom';

describe('Settings — applyPreset (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    // include every id applyPreset / saveSettings / checkOllama touch.
    setupDom([
      'temperature','tempValue','topP','topPValue','maxTokens',
      'ollamaUrl','modelSelect','customModel','systemPrompt',
      'devModeToggle','devModeToggleLabel','devModeSection','settingsStatus',
      'ollamaStatus','ollamaText','energySlider','energyValue',
      'sessionsCount','totalMinutes','streakCount',
    ]);
    // Seed the inputs applyPreset reads; loadState() doesn't run, so state.skills
    // is the module default. setInterval(checkOllama, 30000) was registered by
    // initApp() — we skipped initApp, so no timer is scheduled. Good.
    document.getElementById('ollamaUrl').value = 'http://localhost:11434';
    document.getElementById('modelSelect').value = 'qwen2.5-coder:3b';
    document.getElementById('temperature').value = '0.5';
    document.getElementById('topP').value = '0.5';
    document.getElementById('maxTokens').value = '512';
    attachToWindow(window);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('TC-14: applyPreset("preciso") sets the precise preset values on the DOM', () => {
    // Stub checkOllama so the real one (which calls fetch) doesn't run.
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('offline'));
    // Stub saveSettings indirectly via a globalThis spy — applyPreset calls
    // the closure-bound saveSettings, so we verify the side-effects instead.
    applyPreset('preciso');

    expect(document.getElementById('temperature').value).toBe('0.1');
    expect(document.getElementById('topP').value).toBe('0.1');
    expect(document.getElementById('maxTokens').value).toBe('256');
    expect(document.getElementById('tempValue').textContent).toBe('0.1');
  });
});