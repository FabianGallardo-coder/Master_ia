// Tests for app.mjs clearAllData — wipes localStorage and resets state.

import { state, clearAllData, attachToWindow } from '../app.mjs';
import { setupDom } from './helpers/setupDom';

describe('clearAllData (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom(['toastContainer']);
    if (typeof window !== 'undefined') {
      delete window.location;
      window.location = { reload: jest.fn() };
    }
    attachToWindow(window);
  });

  test('clears every non-canonical localStorage key (data wiped, canonical re-persisted)', () => {
    localStorage.setItem('maestro_state', JSON.stringify({ x: 1 }));
    localStorage.setItem('maestro_schedule_0', JSON.stringify([{ a: 1 }]));
    localStorage.setItem('user_pref', 'whatever');

    clearAllData();

    // All user data is gone — only the canonical state snapshot remains.
    expect(localStorage.getItem('maestro_schedule_0')).toBeNull();
    expect(localStorage.getItem('user_pref')).toBeNull();
    const stored = JSON.parse(localStorage.getItem('maestro_state'));
    // The persisted snapshot is the reset initial state, not the user's data.
    expect(stored.energy).toBe(3);
  });

  test('resets state to initial defaults (energy, sessions, skills)', () => {
    state.energy = 99;
    state.sessionsToday = 50;
    state.totalMinutesToday = 999;
    state.streak = 42;
    state.sessionHistory = [{ id: 1 }];
    state.skills = [{ id: 'custom', name: 'X' }];

    clearAllData();

    expect(state.energy).toBe(3);
    expect(state.sessionsToday).toBe(0);
    expect(state.totalMinutesToday).toBe(0);
    expect(state.streak).toBe(0);
    expect(state.sessionHistory).toEqual([]);
    expect(Array.isArray(state.skills)).toBe(true);
    expect(state.skills.length).toBeGreaterThan(0);
    expect(state.skills.find(s => s.id === 'rpgmaker')).toBeTruthy();
  });

  test('persists the cleared state back to localStorage', () => {
    state.energy = 77;
    clearAllData();
    const stored = JSON.parse(localStorage.getItem('maestro_state'));
    expect(stored.energy).toBe(3);
  });
});