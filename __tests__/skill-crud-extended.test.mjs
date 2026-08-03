// Tests for app.mjs skill CRUD: deleteTaskFromSkill, confirmDeleteSkill,
// addSkillTask, updateSkill, updateStatus.

import {
  state, deleteTaskFromSkill, confirmDeleteSkill, addSkillTask,
  updateSkill, updateStatus, attachToWindow,
} from '../app.mjs';
import { setupDom } from './helpers/setupDom';

describe('deleteTaskFromSkill (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom(['skillsGrid', 'toastContainer']);
    window.confirm = jest.fn(() => true);
    attachToWindow(window);
  });

  test('removes task and recalculates progress', () => {
    state.skills = [{
      id: 's1', name: 'Godot', type: 'Game Dev', status: 'progress',
      progress: 67,
      tasks: [
        { text: 'Install', done: true },
        { text: 'Tutorial', done: false },
        { text: 'First scene', done: false },
      ],
    }];

    deleteTaskFromSkill('s1', 0, { stopPropagation: jest.fn() });
    document.getElementById('confirmDeleteTaskBtn').click();

    expect(state.skills[0].tasks).toHaveLength(2);
    expect(state.skills[0].tasks[0].text).toBe('Tutorial');
    // 0/2 done = 0%, status pending
    expect(state.skills[0].progress).toBe(0);
    expect(state.skills[0].status).toBe('pending');
  });

  test('confirm=false: does not delete', () => {
    state.skills = [{
      id: 's1', name: 'Godot', type: 'Game Dev', status: 'progress',
      progress: 50,
      tasks: [{ text: 'Task1', done: true }, { text: 'Task2', done: false }],
    }];

    deleteTaskFromSkill('s1', 0, { stopPropagation: jest.fn() });
    document.querySelector('[data-action="closeModal"]').click();

    expect(state.skills[0].tasks).toHaveLength(2);
  });
});

describe('confirmDeleteSkill (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom(['skillsGrid', 'toastContainer']);
    attachToWindow(window);
  });

  test('removes skill from state by id', () => {
    state.skills = [
      { id: 's1', name: 'Godot', type: 'Game Dev', status: 'pending', progress: 0, tasks: [] },
      { id: 's2', name: 'NiFi', type: 'Data', status: 'pending', progress: 0, tasks: [] },
    ];

    confirmDeleteSkill('s1');

    expect(state.skills).toHaveLength(1);
    expect(state.skills[0].id).toBe('s2');
  });
});

describe('addSkillTask (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom(['skillsGrid', 'toastContainer']);
    attachToWindow(window);
  });

  test('adds task to skill and recalculates progress', () => {
    state.skills = [{
      id: 's1', name: 'Godot', type: 'Game Dev', status: 'pending',
      progress: 0,
      tasks: [{ text: 'Existing', done: true }],
    }];

    addSkillTask('s1');

    // Modal should be open with taskDescription input
    expect(document.getElementById('taskDescription')).toBeTruthy();

    document.getElementById('taskDescription').value = 'New task';
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    document.getElementById('skillTaskForm').dispatchEvent(submitEvent);

    expect(state.skills[0].tasks).toHaveLength(2);
    expect(state.skills[0].tasks[1].text).toBe('New task');
    expect(state.skills[0].tasks[1].done).toBe(false);
    // 1/2 = 50%
    expect(state.skills[0].progress).toBe(50);
    expect(state.skills[0].status).toBe('progress');
  });
});

describe('updateSkill (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom(['skillsGrid', 'toastContainer']);
    attachToWindow(window);
  });

  test('edits skill name and type via modal form', () => {
    state.skills = [{
      id: 's1', name: 'Godot', type: 'Game Dev', status: 'pending', progress: 0, tasks: [],
    }];

    updateSkill('s1');

    expect(document.getElementById('editSkillName')).toBeTruthy();
    expect(document.getElementById('editSkillName').value).toBe('Godot');

    document.getElementById('editSkillName').value = 'Godot 4';
    document.getElementById('editSkillType').value = 'Engine Dev';
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    document.getElementById('updateSkillForm').dispatchEvent(submitEvent);

    expect(state.skills[0].name).toBe('Godot 4');
    expect(state.skills[0].type).toBe('Engine Dev');
  });
});

describe('updateStatus (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom(['skillsGrid']);
    attachToWindow(window);
  });

  test('changes skill status directly', () => {
    state.skills = [{
      id: 's1', name: 'Godot', type: 'Game Dev', status: 'pending', progress: 0, tasks: [],
    }];

    updateStatus('s1', 'blocked');

    expect(state.skills[0].status).toBe('blocked');
  });
});
