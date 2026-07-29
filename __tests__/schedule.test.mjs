// Tests for app.mjs schedule functions: saveTask, getDayTasks, toggleTaskCompletion.

import { state, saveTask, getDayTasks, toggleTaskCompletion, attachToWindow } from '../app.mjs';
import { setupDom } from './helpers/setupDom';

describe('Schedule (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom(['energySlider','energyValue','scheduleColumns','scheduleCalendar']);
    attachToWindow(window);
  });

  test('TC-7: saveTask writes to localStorage and getDayTasks returns the task HTML', () => {
    const task = { title: 'NiFi', skillName: 'Apache', blocks: 3, completed: false };
    saveTask(2, task);

    const html = getDayTasks(2);
    expect(html).toContain('NiFi');
    expect(html).toContain('Apache');
    expect(html).toContain('3bl');

    const stored = JSON.parse(localStorage.getItem('maestro_schedule_2'));
    expect(stored).toHaveLength(1);
    expect(stored[0].title).toBe('NiFi');
  });

  test('TC-8: toggleTaskCompletion awards energy = blocks when task is completed', () => {
    const initial = [{ title: 'X', skillName: 'Y', blocks: 2, completed: false }];
    localStorage.setItem('maestro_schedule_0', JSON.stringify(initial));
    state.energy = 1;

    toggleTaskCompletion(0, 0);

    expect(state.energy).toBe(3);
    const updated = JSON.parse(localStorage.getItem('maestro_schedule_0'));
    expect(updated[0].completed).toBe(true);
  });
});