// Tests for app.mjs completeTimerWithLinking, completeTimerWithoutLinking,
// and timerComplete break-completion path.

import {
  state, selectMode, completeTimerWithLinking, completeTimerWithoutLinking,
  timerComplete, attachToWindow,
} from '../app.mjs';
import { setupDom } from './helpers/setupDom';

describe('completeTimerWithLinking (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom([
      'linkType', 'skillSelect', 'taskDay',
      'energySlider', 'energyValue', 'skillsGrid',
      'scheduleColumns', 'scheduleCalendar', 'toastContainer',
      'breakOverlay', 'breakSuggestion', 'breakTimer',
      'timerTime', 'timerPhase', 'timerProgress', 'startBtn',
    ]);
    attachToWindow(window);
  });

  test('skill path: adds done task to skill, awards energy, caps at 5', () => {
    state.skills = [
      { id: 's1', name: 'Godot', type: 'Game Dev', status: 'pending', progress: 0, tasks: [] },
    ];
    state.energy = 4;
    state.selectedMode = 'regular'; // 15 min work
    document.getElementById('linkType').value = 'skill';
    document.getElementById('skillSelect').value = 's1';

    completeTimerWithLinking();

    expect(state.skills[0].tasks).toHaveLength(1);
    expect(state.skills[0].tasks[0].done).toBe(true);
    expect(state.skills[0].progress).toBe(100);
    // 15 min -> +3 energy, capped at 5
    expect(state.energy).toBe(5);
  });

  test('task path: pushes completed task to schedule, awards energy', () => {
    const tasks = [{ title: 'Read Ch1', skillName: 'NiFi', blocks: 2, completed: false }];
    localStorage.setItem('maestro_schedule_0', JSON.stringify(tasks));
    state.energy = 1;
    state.selectedMode = 'regular'; // 15 min work
    document.getElementById('linkType').value = 'task';
    document.getElementById('taskDay').value = '0';

    completeTimerWithLinking();

    const updated = JSON.parse(localStorage.getItem('maestro_schedule_0'));
    expect(updated).toHaveLength(2);
    expect(updated[1].completed).toBe(true);
    expect(updated[1].blocks).toBe(3); // ceil(15/5)
    // 15 min -> +3 energy
    expect(state.energy).toBe(4);
  });

  test('no linking (none): does not push to skill or schedule', () => {
    state.skills = [
      { id: 's1', name: 'Godot', type: 'Game Dev', status: 'pending', progress: 0, tasks: [] },
    ];
    state.energy = 1;
    state.selectedMode = 'regular';
    document.getElementById('linkType').value = 'none';

    completeTimerWithLinking();

    expect(state.skills[0].tasks).toHaveLength(0);
  });
});

describe('completeTimerWithoutLinking (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom([
      'energySlider', 'energyValue', 'toastContainer',
      'breakOverlay', 'breakSuggestion', 'breakTimer',
      'timerTime', 'timerPhase', 'timerProgress', 'startBtn',
    ]);
    attachToWindow(window);
  });

  test('awards energy based on mode duration and caps at 5', () => {
    state.energy = 4;
    state.selectedMode = 'deep'; // 35 min work

    completeTimerWithoutLinking();

    // 35 min -> floor(35/5)=7, capped at 5
    expect(state.energy).toBe(5);
  });

  test('awards correct energy for short mode', () => {
    state.energy = 0;
    state.selectedMode = 'hard'; // 5 min work

    completeTimerWithoutLinking();

    // 5 min -> floor(5/5)=1
    expect(state.energy).toBe(1);
  });
});

describe('timerComplete break path (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom([
      'startBtn', 'timerTime', 'timerPhase', 'timerProgress',
      'breakOverlay', 'breakSuggestion', 'breakTimer',
      'sessionsCount', 'totalMinutes', 'streakCount',
      'modeSelector', 'energySlider', 'energyValue', 'toastContainer',
    ]);
    attachToWindow(window);
  });

  test('break completion: resets timer to work mode and hides break overlay', () => {
    state.selectedMode = 'regular';
    state.isBreak = true;
    document.getElementById('breakOverlay').classList.add('active');

    timerComplete();

    // Note: timerComplete break path does NOT reset isBreak (only endBreak does)
    expect(state.timeRemaining).toBe(15 * 60); // regular mode work time
    expect(state.totalTime).toBe(15 * 60);
    expect(document.getElementById('breakOverlay').classList.contains('active')).toBe(false);
    expect(document.getElementById('startBtn').textContent).toBe('Iniciar');
  });

  test('work completion: does NOT auto-start break', () => {
    state.selectedMode = 'regular';
    state.isBreak = false;
    state.sessionsToday = 0;

    timerComplete();

    expect(state.isBreak).toBe(false);
    expect(state.sessionsToday).toBe(1);
    // Modal should be present
    expect(document.querySelector('.modal-overlay')).toBeTruthy();
  });
});
