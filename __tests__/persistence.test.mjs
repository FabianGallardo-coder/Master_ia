// Tests for app.mjs saveState / loadState roundtrip.

import { state, saveState, loadState, attachToWindow } from '../app.mjs';
import { setupDom } from './helpers/setupDom';

describe('Persistence (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    setupDom(['energySlider','energyValue']);
    attachToWindow(window);
  });

  test('TC-15: saveState then loadState restores all mutated state values', () => {
    state.energy = 4;
    state.selectedMode = 'deep';
    state.sessionsToday = 7;
    state.totalMinutesToday = 105;
    state.streak = 2;
    state.skills[0].progress = 50;

    saveState();

    state.energy = 3;
    state.selectedMode = 'regular';
    state.sessionsToday = 0;
    state.totalMinutesToday = 0;
    state.streak = 0;
    state.skills[0].progress = 0;

    loadState();

    expect(state.energy).toBe(4);
    expect(state.selectedMode).toBe('deep');
    expect(state.sessionsToday).toBe(7);
    expect(state.totalMinutesToday).toBe(105);
    expect(state.streak).toBe(2);
    expect(state.skills[0].progress).toBe(50);
  });
});