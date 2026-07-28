// Tests for app.mjs skill addSkill modal flow.

import { state, addSkill, attachToWindow } from '../app.mjs';
import { setupDom } from './helpers/setupDom';

describe('Skill CRUD (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom(['skillsGrid']);
    attachToWindow(window);
  });

  test('TC-6: addSkill opens a modal; submitting the form adds a pending skill to state', () => {
    const before = state.skills.length;

    addSkill();

    // The modal was opened; skillForm is in the DOM
    expect(document.getElementById('skillForm')).toBeTruthy();

    // Fill the form fields and submit
    document.getElementById('skillName').value = 'Houdini FX';
    document.getElementById('skillType').value = 'VFX';
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    document.getElementById('skillForm').dispatchEvent(submitEvent);

    // New skill was pushed
    expect(state.skills.length).toBe(before + 1);
    const newSkill = state.skills[state.skills.length - 1];
    expect(newSkill.name).toBe('Houdini FX');
    expect(newSkill.type).toBe('VFX');
    expect(newSkill.status).toBe('pending');
    expect(newSkill.progress).toBe(0);
    expect(Array.isArray(newSkill.tasks)).toBe(true);
    expect(newSkill.tasks.length).toBe(0);
  });
});