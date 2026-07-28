// Tests for app.mjs skill toggleTask progress recomputation.

import { state, toggleTask, attachToWindow } from '../app.mjs';
import { setupDom } from './helpers/setupDom';

describe('Skill progress (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom(['skillsGrid']);
    attachToWindow(window);

    state.skills = [{
      id: 'test', name: 'Test Skill', type: 'Test',
      status: 'progress', progress: 0,
      tasks: [
        { text: 'A', done: true },
        { text: 'B', done: false },
        { text: 'C', done: false }
      ]
    }];
  });

  test('TC-5a: toggleTask recomputes progress 1/3 -> 33%, status progress', () => {
    state.skills[0].tasks[0].done = true;
    state.skills[0].tasks[1].done = false;
    state.skills[0].tasks[2].done = false;

    toggleTask('test', 1);

    const skill = state.skills[0];
    expect(skill.tasks[1].done).toBe(true);
    expect(skill.progress).toBe(Math.round((2 / 3) * 100));
    expect(skill.status).toBe('progress');
  });

  test('TC-5b: completing all tasks yields 100% / done', () => {
    state.skills[0].tasks.forEach(t => (t.done = true));
    toggleTask('test', 0);
    state.skills[0].tasks[0].done = true;
    state.skills[0].tasks[1].done = true;
    state.skills[0].tasks[2].done = true;
    toggleTask('test', 0);
    toggleTask('test', 0);
    const skill = state.skills[0];
    expect(skill.progress).toBe(100);
    expect(skill.status).toBe('done');
  });

  test('TC-5c: toggling one off after full completion -> 2/3 -> 67%, status progress', () => {
    state.skills[0].tasks[0].done = true;
    state.skills[0].tasks[1].done = true;
    state.skills[0].tasks[2].done = true;

    toggleTask('test', 0);
    const skill = state.skills[0];
    expect(skill.progress).toBe(Math.round((2 / 3) * 100));
    expect(skill.status).toBe('progress');
  });
});