// Tests for app.mjs recordSession truncation and loadState resilience.

import {
  state, recordSession, loadState, saveState, attachToWindow,
} from '../app.mjs';
import { setupDom } from './helpers/setupDom';

describe('recordSession (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom(['energySlider', 'energyValue', 'toastContainer']);
    attachToWindow(window);
    state.sessionHistory = [];
  });

  test('appends session with correct fields', () => {
    recordSession('skill', 15, 'Godot', 'Test session');

    expect(state.sessionHistory).toHaveLength(1);
    const s = state.sessionHistory[0];
    expect(s.type).toBe('skill');
    expect(s.minutes).toBe(15);
    expect(s.linkedTo).toBe('Godot');
    expect(s.details).toBe('Test session');
    expect(s.energyGained).toBe(3); // floor(15/5)
  });

  test('truncates to last 100 sessions when history exceeds 100', () => {
    // Pre-fill 100 sessions
    for (let i = 0; i < 100; i++) {
      state.sessionHistory.push({ id: i, type: 'timer', minutes: 5 });
    }

    recordSession('timer', 10, null, '101st session');

    expect(state.sessionHistory).toHaveLength(100);
    // The oldest session (id:0) should be gone, replaced by the new one at the end
    expect(state.sessionHistory[0].id).toBe(1);
    expect(state.sessionHistory[99].minutes).toBe(10);
  });

  test('does not truncate under 100', () => {
    for (let i = 0; i < 50; i++) {
      state.sessionHistory.push({ id: i, type: 'timer', minutes: 5 });
    }

    recordSession('timer', 5);

    expect(state.sessionHistory).toHaveLength(51);
  });
});

describe('loadState resilience (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom(['energySlider', 'energyValue']);
    attachToWindow(window);
  });

  test('corrupted JSON: silently falls back to defaults', () => {
    localStorage.setItem('maestro_state', '{bad json!!!');
    state.energy = 99;

    loadState();

    // Should not crash; state keeps defaults (energy stays 99 because catch swallows)
    // then gets overwritten by getMode() reset at the bottom
    const mode = state.selectedMode || 'regular';
    expect(state.timeRemaining).toBe(15 * 60); // regular mode
  });

  test('empty localStorage: keeps defaults', () => {
    state.energy = 7;
    state.selectedMode = 'deep';

    loadState();

    // No saved state, so energy stays as-is (catch block doesn't touch it)
    // but timeRemaining/totalTime get reset from mode
    expect(state.timeRemaining).toBe(35 * 60); // deep mode
  });

  test('partial state: fills missing keys with defaults', () => {
    const partial = { energy: 2, selectedMode: 'low' };
    localStorage.setItem('maestro_state', JSON.stringify(partial));

    loadState();

    expect(state.energy).toBe(2);
    expect(state.selectedMode).toBe('low');
    // Missing keys get defaults: sessionsToday=0, streak=0, etc.
    expect(state.sessionsToday).toBe(0);
    expect(state.streak).toBe(0);
    expect(state.timeRemaining).toBe(10 * 60); // low mode
  });

  test('settings merge: new settings override old, missing keys keep defaults', () => {
    state.settings = {
      ollamaUrl: 'http://old:11434',
      model: 'old-model',
      systemPrompt: 'old prompt',
      temperature: 0.1,
      topP: 0.1,
      maxTokens: 100,
      devMode: false,
    };
    const saved = {
      energy: 3,
      settings: { ollamaUrl: 'http://new:11434', temperature: 0.9 },
    };
    localStorage.setItem('maestro_state', JSON.stringify(saved));

    loadState();

    expect(state.settings.ollamaUrl).toBe('http://new:11434');
    expect(state.settings.temperature).toBe(0.9);
    // model kept from original (not overridden)
    expect(state.settings.model).toBe('old-model');
    expect(state.settings.topP).toBe(0.1);
  });
});
