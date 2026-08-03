// Tests for energy cap Math.min(5,...) in toggleTaskCompletion
// and toggleCalendarTask.

import {
  state, toggleTaskCompletion, toggleCalendarTask, attachToWindow,
} from '../app.mjs';
import { setupDom } from './helpers/setupDom';

describe('Energy cap — toggleTaskCompletion (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom(['energySlider', 'energyValue', 'scheduleColumns', 'scheduleCalendar', 'toastContainer']);
    attachToWindow(window);
  });

  test('completing a task caps energy at 5', () => {
    state.energy = 4;
    const tasks = [{ title: 'Big Task', skillName: '', blocks: 5, completed: false }];
    localStorage.setItem('maestro_schedule_0', JSON.stringify(tasks));

    toggleTaskCompletion(0, 0);

    // 4 + 5 blocks = 9, capped at 5
    expect(state.energy).toBe(5);
  });

  test('completing a task with energy already at 5 stays at 5', () => {
    state.energy = 5;
    const tasks = [{ title: 'Task', skillName: '', blocks: 3, completed: false }];
    localStorage.setItem('maestro_schedule_0', JSON.stringify(tasks));

    toggleTaskCompletion(0, 0);

    expect(state.energy).toBe(5);
  });

  test('completing a small task awards correct energy', () => {
    state.energy = 0;
    const tasks = [{ title: 'Task', skillName: '', blocks: 2, completed: false }];
    localStorage.setItem('maestro_schedule_0', JSON.stringify(tasks));

    toggleTaskCompletion(0, 0);

    expect(state.energy).toBe(2);
  });

  test('un-completing a task does not deduct energy', () => {
    state.energy = 3;
    const tasks = [{ title: 'Task', skillName: '', blocks: 2, completed: true }];
    localStorage.setItem('maestro_schedule_0', JSON.stringify(tasks));

    toggleTaskCompletion(0, 0);

    expect(state.energy).toBe(3);
    const updated = JSON.parse(localStorage.getItem('maestro_schedule_0'));
    expect(updated[0].completed).toBe(false);
  });
});

describe('Energy cap — toggleCalendarTask (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom(['energySlider', 'energyValue', 'scheduleColumns', 'scheduleCalendar', 'toastContainer', 'calTitle']);
    attachToWindow(window);
  });

  test('completing a calendar task caps energy at 5', () => {
    state.energy = 4;
    const tasks = [{ title: 'Big Task', blocks: 5, completed: false }];
    localStorage.setItem('maestro_calendar_2026-07-15', JSON.stringify(tasks));

    toggleCalendarTask('2026-07-15', 0);

    expect(state.energy).toBe(5);
  });

  test('completing a calendar task with energy at 5 stays at 5', () => {
    state.energy = 5;
    const tasks = [{ title: 'Task', blocks: 3, completed: false }];
    localStorage.setItem('maestro_calendar_2026-07-15', JSON.stringify(tasks));

    toggleCalendarTask('2026-07-15', 0);

    expect(state.energy).toBe(5);
  });

  test('un-completing a calendar task does not deduct energy', () => {
    state.energy = 3;
    const tasks = [{ title: 'Task', blocks: 2, completed: true }];
    localStorage.setItem('maestro_calendar_2026-07-15', JSON.stringify(tasks));

    toggleCalendarTask('2026-07-15', 0);

    expect(state.energy).toBe(3);
    const updated = JSON.parse(localStorage.getItem('maestro_calendar_2026-07-15'));
    expect(updated[0].completed).toBe(false);
  });
});
