import {
  state, resetTimer, endBreak, updateTaskListForDay,
  startBreak, timerComplete, getMode, attachToWindow,
} from '../app.mjs';
import { setupDom } from './helpers/setupDom';

describe('resetTimer (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom([
      'startBtn','timerTime','timerPhase','timerProgress',
      'breakOverlay','breakSuggestion','breakTimer','endBreakBtn',
      'energySlider','energyValue',
    ]);
    attachToWindow(window);
  });

  test('resets timer to work mode values and clears running state', () => {
    state.timerRunning = true;
    state.isBreak = true;
    state.timeRemaining = 999;
    state.totalTime = 999;
    document.getElementById('startBtn').textContent = 'Pausar';

    resetTimer();

    expect(state.timerRunning).toBe(false);
    expect(state.isBreak).toBe(false);
    const mode = getMode();
    expect(state.timeRemaining).toBe(mode.work * 60);
    expect(state.totalTime).toBe(mode.work * 60);
    expect(document.getElementById('startBtn').textContent).toBe('Iniciar');
  });

  test('works when timer is not running', () => {
    state.timerRunning = false;
    state.timeRemaining = 5;
    resetTimer();
    expect(state.timeRemaining).toBe(getMode().work * 60);
  });
});

describe('endBreak (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom([
      'startBtn','timerTime','timerPhase','timerProgress',
      'breakOverlay','breakSuggestion','breakTimer','endBreakBtn',
      'energySlider','energyValue',
    ]);
    attachToWindow(window);
  });

  test('clears break overlay and resets to work mode', () => {
    state.isBreak = true;
    state.timeRemaining = 300;
    state.totalTime = 300;
    document.getElementById('breakOverlay').classList.add('active');
    document.getElementById('startBtn').textContent = 'Descansar';

    endBreak();

    expect(state.isBreak).toBe(false);
    expect(document.getElementById('breakOverlay').classList.contains('active')).toBe(false);
    const mode = getMode();
    expect(state.timeRemaining).toBe(mode.work * 60);
    expect(state.totalTime).toBe(mode.work * 60);
    expect(document.getElementById('startBtn').textContent).toBe('Iniciar');
  });
});

describe('updateTaskListForDay (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom([
      'timerCompleteTask','taskDetailSelection',
      'timerCompleteType','timerCompleteSkill','timerCompleteBlocks',
    ]);
    attachToWindow(window);
  });

  test('shows "no tasks" when no schedule for the day', () => {
    updateTaskListForDay(3);
    const select = document.getElementById('timerCompleteTask');
    expect(select.innerHTML).toContain('No hay tareas');
    expect(document.getElementById('taskDetailSelection').style.display).toBe('none');
  });

  test('populates tasks from localStorage for the given day', () => {
    const tasks = [
      { title: 'Leer capítulo 1', skillName: 'Lectura', blocks: 2 },
      { title: 'Ejercicios', skillName: 'Math', blocks: 1 },
    ];
    localStorage.setItem('maestro_schedule_0', JSON.stringify(tasks));

    updateTaskListForDay(0);
    const select = document.getElementById('timerCompleteTask');
    expect(select.innerHTML).toContain('Leer capítulo 1');
    expect(select.innerHTML).toContain('Ejercicios');
    expect(select.querySelectorAll('option').length).toBe(3); // placeholder + 2 tasks
    expect(document.getElementById('taskDetailSelection').style.display).toBe('block');
  });

  test('hides task detail when schedule exists but has 0 tasks', () => {
    localStorage.setItem('maestro_schedule_1', JSON.stringify([]));
    updateTaskListForDay(1);
    expect(document.getElementById('taskDetailSelection').style.display).toBe('none');
  });
});

describe('startBreak full flow (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom([
      'startBtn','timerTime','timerPhase','timerProgress',
      'breakOverlay','breakSuggestion','breakTimer','endBreakBtn',
      'energySlider','energyValue',
    ]);
    attachToWindow(window);
  });

  test('startBreak activates break overlay and sets isBreak', () => {
    jest.useFakeTimers();
    try {
      startBreak();
    expect(state.isBreak).toBe(true);
      expect(document.getElementById('breakOverlay').classList.contains('active')).toBe(true);
      const mode = getMode();
      expect(state.timeRemaining).toBe(mode.break * 60);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('timerComplete break path (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom([
      'startBtn','timerTime','timerPhase','timerProgress',
      'breakOverlay','breakSuggestion','breakTimer','endBreakBtn',
      'energySlider','energyValue',
    ]);
    attachToWindow(window);
  });

  test('break completion resets to work mode', () => {
    state.isBreak = true;
    state.timeRemaining = 0;
    document.getElementById('breakOverlay').classList.add('active');

    timerComplete();

    expect(state.isBreak).toBe(false);
    expect(document.getElementById('breakOverlay').classList.contains('active')).toBe(false);
    const mode = getMode();
    expect(state.timeRemaining).toBe(mode.work * 60);
    expect(document.getElementById('startBtn').textContent).toBe('Iniciar');
  });
});
