// Tests for app.mjs timer functions: startTimer, pauseTimer, selectMode, timerComplete.
// Loads app.mjs directly as an ES module — no helper to spin up a vm context.

import {
  state, startTimer, pauseTimer, selectMode, timerComplete,
  attachToWindow,
} from '../app.mjs';
import { setupDom } from './helpers/setupDom';

describe('Timer (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    setupDom([
      'startBtn','timerTime','timerPhase','timerProgress',
      'breakOverlay','breakSuggestion','sessionsCount','totalMinutes',
      'streakCount','modeSelector','energySlider','energyValue',
    ]);
    // attachToWindow copies functions to window for inline onclick flows.
    // initApp() is intentionally NOT called — it triggers a full re-render
    // that touches DOM elements outside the timer scope.
    attachToWindow(window);
  });

  test('TC-1: startTimer decrements every second and updates state and button', () => {
    jest.useFakeTimers();
    const startTimeRemaining = state.timeRemaining;
    try {
      startTimer();
      expect(state.timerRunning).toBe(true);
      expect(document.getElementById('startBtn').textContent).toBe('Pausar');

      jest.advanceTimersByTime(3000);

      expect(state.timeRemaining).toBe(startTimeRemaining - 3);
    } finally {
      jest.useRealTimers();
    }
  });

  test('TC-2: pauseTimer stops decrementing and updates button text', () => {
    jest.useFakeTimers();
    try {
      startTimer();
      jest.advanceTimersByTime(2000);
      const beforePause = state.timeRemaining;

      pauseTimer();
      expect(state.timerRunning).toBe(false);
      expect(document.getElementById('startBtn').textContent).toBe('Continuar');

      jest.advanceTimersByTime(3000);
      expect(state.timeRemaining).toBe(beforePause);
    } finally {
      jest.useRealTimers();
    }
  });

  test('TC-3: selectMode("deep") resets timer state to deep work values', () => {
    selectMode('deep');
    expect(state.selectedMode).toBe('deep');
    expect(state.timeRemaining).toBe(35 * 60);
    expect(state.totalTime).toBe(35 * 60);
    expect(state.isBreak).toBe(false);
  });

  test('TC-4: timerComplete updates session counts and triggers post-work flow', () => {
    state.sessionsToday = 2;
    state.totalMinutesToday = 30;
    state.streak = 1;
    state.selectedMode = 'regular';
    state.isBreak = false;

    timerComplete();

    expect(state.sessionsToday).toBe(3);
    expect(state.totalMinutesToday).toBe(45);
    expect(state.streak).toBe(2);
    // showTimerCompleteModal opens a real modal — assertion by side effect:
    // a .modal-overlay ends up appended to document.body.
    expect(document.querySelector('.modal-overlay')).toBeTruthy();
  });
});