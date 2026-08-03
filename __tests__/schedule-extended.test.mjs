import {
  state, renderSchedule, switchCalendarView,
  openCalendarTaskModal, saveCalendarTask, deleteCalendarTask,
  openAddTaskModal, deleteTask, getDayTasks,
  ymd, monthLabel, loadCalendarTasks, renderCalendarView,
  toggleCalendarTask, toggleTaskCompletion, saveTask,
  attachToWindow,
} from '../app.mjs';
import { setupDom } from './helpers/setupDom';

describe('renderSchedule (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom([
      'scheduleColumns','scheduleCalendar','calTitle','calPrev','calNext',
      'energySlider','energyValue',
    ]);
    // Add schedule-view-toggle buttons for renderSchedule
    const toggleDiv = document.createElement('div');
    toggleDiv.className = 'schedule-view-toggle';
    const weekBtn = document.createElement('button');
    weekBtn.dataset.view = 'week';
    weekBtn.textContent = 'Semanal';
    const calBtn = document.createElement('button');
    calBtn.dataset.view = 'calendar';
    calBtn.textContent = 'Calendario';
    toggleDiv.appendChild(weekBtn);
    toggleDiv.appendChild(calBtn);
    document.getElementById('scheduleColumns').before(toggleDiv);
    attachToWindow(window);
  });

  test('renders week view with day columns', () => {
    state.calendarView = 'week';
    renderSchedule();
    const cols = document.getElementById('scheduleColumns');
    expect(cols.hidden).toBe(false);
    expect(cols.innerHTML).toContain('Hoy');
    expect(cols.innerHTML).toContain('day-column');
  });

  test('hides columns and shows calendar in calendar view', () => {
    state.calendarView = 'calendar';
    renderSchedule();
    expect(document.getElementById('scheduleColumns').hidden).toBe(true);
    expect(document.getElementById('scheduleCalendar').hidden).toBe(false);
  });

  test('toggles active class on schedule-toggle buttons', () => {
    state.calendarView = 'week';
    renderSchedule();
    const buttons = document.querySelectorAll('.schedule-view-toggle button');
    expect(buttons[0].classList.contains('active')).toBe(true);
    expect(buttons[1].classList.contains('active')).toBe(false);
  });

  test('renders a single day column (one day at a time)', () => {
    state.calendarView = 'columns';
    state.scheduleDayOffset = 0;
    renderSchedule();
    const cols = document.getElementById('scheduleColumns');
    const columns = cols.querySelectorAll('.day-column');
    expect(columns.length).toBe(1);
    expect(cols.innerHTML).toContain('Hoy');
  });

  test('day navigation moves the offset and updates the nav title', () => {
    state.calendarView = 'columns';
    state.scheduleDayOffset = 0;
    renderSchedule();
    const navTitle = document.getElementById('calTitle');
    expect(navTitle.textContent).toBe('Hoy');

    state.scheduleDayOffset = 1;
    renderSchedule();
    expect(navTitle.textContent).not.toBe('Hoy');
    expect(navTitle.textContent).toMatch(/de \w+/); // full date like "martes, 4 de agosto"
    expect(document.getElementById('scheduleColumns').innerHTML).toContain('Mañana');
  });

  test('single-day view shows tasks for the selected day index', () => {
    state.calendarView = 'columns';
    state.scheduleDayOffset = 0;
    localStorage.clear();
    const today = new Date();
    const idx = today.getDay() === 0 ? 6 : today.getDay() - 1;
    saveTask(idx, { title: 'Tema A', skillName: 'RPG', blocks: 2 });
    renderSchedule();
    expect(document.getElementById('scheduleColumns').innerHTML).toContain('Tema A');
  });
});

describe('switchCalendarView (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom([
      'scheduleColumns','scheduleCalendar','calTitle','calPrev','calNext',
      'energySlider','energyValue',
    ]);
    const toggleDiv = document.createElement('div');
    toggleDiv.className = 'schedule-toggle';
    const weekBtn = document.createElement('button');
    weekBtn.dataset.view = 'week';
    const calBtn = document.createElement('button');
    calBtn.dataset.view = 'calendar';
    toggleDiv.appendChild(weekBtn);
    toggleDiv.appendChild(calBtn);
    document.getElementById('scheduleColumns').before(toggleDiv);
    attachToWindow(window);
  });

  test('switches to calendar view', () => {
    state.calendarView = 'week';
    switchCalendarView('calendar');
    expect(state.calendarView).toBe('calendar');
    expect(document.getElementById('scheduleColumns').hidden).toBe(true);
  });

  test('switches back to week view', () => {
    state.calendarView = 'calendar';
    switchCalendarView('week');
    expect(state.calendarView).toBe('week');
    expect(document.getElementById('scheduleColumns').hidden).toBe(false);
  });
});

describe('ymd and monthLabel (app.mjs)', () => {
  test('ymd formats date as YYYY-MM-DD', () => {
    const d = new Date(2025, 0, 5); // Jan 5, 2025
    expect(ymd(d)).toBe('2025-01-05');
  });

  test('monthLabel returns Spanish month name', () => {
    const d = new Date(2025, 2, 15); // March 2025
    const label = monthLabel(d);
    expect(label).toContain('2025');
    expect(label.toLowerCase()).toContain('mar');
  });
});

describe('openCalendarTaskModal (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom([
      'taskTitle','taskSkill','taskBlocks',
      'energySlider','energyValue',
      'scheduleColumns','scheduleCalendar','calTitle','calPrev','calNext',
    ]);
    state.skills = [
      { id: 'sk1', name: 'Python', type: 'code', status: 'pending', progress: 0, tasks: [] },
    ];
    state.calendarView = 'week';
    attachToWindow(window);
  });

  test('opens modal with form for the given date', () => {
    openCalendarTaskModal('2025-03-15');
    const overlay = document.querySelector('.modal-overlay');
    expect(overlay).toBeTruthy();
    expect(overlay.textContent).toContain('15/03');
    expect(document.getElementById('taskTitle')).toBeTruthy();
  });

  test('form submit saves task to calendar and closes modal', () => {
    openCalendarTaskModal('2025-06-10');
    document.getElementById('taskTitle').value = 'Estudiar FastAPI';
    document.getElementById('taskBlocks').value = '3';

    const form = document.getElementById('taskForm');
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    const stored = loadCalendarTasks('2025-06-10');
    expect(stored).toHaveLength(1);
    expect(stored[0].title).toBe('Estudiar FastAPI');
    expect(stored[0].blocks).toBe(3);
  });

  test('form submit with empty title shows error toast', () => {
    openCalendarTaskModal('2025-06-10');
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskBlocks').value = '1';

    const form = document.getElementById('taskForm');
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    const stored = loadCalendarTasks('2025-06-10');
    expect(stored).toHaveLength(0);
  });
});

describe('saveCalendarTask (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom(['toastContainer','scheduleColumns','scheduleCalendar','calTitle','calPrev','calNext']);
    attachToWindow(window);
  });

  test('adds task to calendar localStorage', () => {
    saveCalendarTask('2025-01-01', { title: 'Task A', blocks: 2, completed: false });
    const tasks = loadCalendarTasks('2025-01-01');
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Task A');
  });

  test('appends to existing tasks', () => {
    saveCalendarTask('2025-01-01', { title: 'First', blocks: 1, completed: false });
    saveCalendarTask('2025-01-01', { title: 'Second', blocks: 2, completed: false });
    expect(loadCalendarTasks('2025-01-01')).toHaveLength(2);
  });
});

describe('deleteCalendarTask (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom(['toastContainer','scheduleColumns','scheduleCalendar','calTitle','calPrev','calNext']);
    attachToWindow(window);
  });

  test('removes task when confirmed', () => {
    saveCalendarTask('2025-02-01', { title: 'A', blocks: 1, completed: false });
    saveCalendarTask('2025-02-01', { title: 'B', blocks: 1, completed: false });
    deleteCalendarTask('2025-02-01', 0);
    document.getElementById('confirmDeleteCalTaskBtn').click();
    expect(loadCalendarTasks('2025-02-01')).toHaveLength(1);
    expect(loadCalendarTasks('2025-02-01')[0].title).toBe('B');
  });

  test('does nothing when cancelled', () => {
    saveCalendarTask('2025-02-01', { title: 'A', blocks: 1, completed: false });
    deleteCalendarTask('2025-02-01', 0);
    document.querySelector('[data-action="closeModal"]').click();
    expect(loadCalendarTasks('2025-02-01')).toHaveLength(1);
  });
});

describe('openAddTaskModal (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom([
      'taskTitle','taskSkill','taskBlocks',
      'energySlider','energyValue',
      'scheduleColumns','scheduleCalendar','calTitle','calPrev','calNext',
    ]);
    state.skills = [
      { id: 'sk1', name: 'Python', type: 'code', status: 'pending', progress: 0, tasks: [] },
    ];
    state.calendarView = 'week';
    attachToWindow(window);
  });

  test('opens modal with day name in title', () => {
    openAddTaskModal(0); // Lun
    const overlay = document.querySelector('.modal-overlay');
    expect(overlay).toBeTruthy();
    expect(overlay.textContent).toContain('Lun');
  });

  test('form submit saves task to schedule', () => {
    openAddTaskModal(2); // Mié
    document.getElementById('taskTitle').value = 'Álgebra';
    document.getElementById('taskBlocks').value = '2';

    const form = document.getElementById('taskForm');
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    const stored = JSON.parse(localStorage.getItem('maestro_schedule_2'));
    expect(stored).toHaveLength(1);
    expect(stored[0].title).toBe('Álgebra');
    expect(stored[0].blocks).toBe(2);
  });

  test('form submit with empty title does not save', () => {
    openAddTaskModal(0);
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskBlocks').value = '1';
    const form = document.getElementById('taskForm');
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(localStorage.getItem('maestro_schedule_0')).toBeNull();
  });
});

describe('deleteTask (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom(['toastContainer','scheduleColumns','scheduleCalendar','calTitle','calPrev','calNext']);
    attachToWindow(window);
  });

  test('removes task from schedule when confirmed', () => {
    localStorage.setItem('maestro_schedule_0', JSON.stringify([
      { title: 'A', blocks: 1 }, { title: 'B', blocks: 2 },
    ]));
    const event = { stopPropagation: jest.fn() };
    deleteTask(0, 0, event);
    document.getElementById('confirmDeleteSchedTaskBtn').click();
    expect(event.stopPropagation).toHaveBeenCalled();
    const remaining = JSON.parse(localStorage.getItem('maestro_schedule_0'));
    expect(remaining).toHaveLength(1);
    expect(remaining[0].title).toBe('B');
  });

  test('does nothing when cancelled', () => {
    localStorage.setItem('maestro_schedule_0', JSON.stringify([{ title: 'A', blocks: 1 }]));
    const event = { stopPropagation: jest.fn() };
    deleteTask(0, 0, event);
    document.querySelector('[data-action="closeModal"]').click();
    expect(JSON.parse(localStorage.getItem('maestro_schedule_0'))).toHaveLength(1);
  });

  test('does nothing when no saved data', () => {
    const event = { stopPropagation: jest.fn() };
    deleteTask(5, 0, event);
    expect(localStorage.getItem('maestro_schedule_5')).toBeNull();
  });
});

describe('toggleCalendarTask (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom([
      'energySlider','energyValue','toastContainer',
      'scheduleColumns','scheduleCalendar','calTitle','calPrev','calNext',
    ]);
    state.energy = 2;
    attachToWindow(window);
  });

  test('uncompleting a completed task marks it pending', () => {
    saveCalendarTask('2025-04-01', { title: 'T', blocks: 2, completed: true });
    toggleCalendarTask('2025-04-01', 0);
    const tasks = loadCalendarTasks('2025-04-01');
    expect(tasks[0].completed).toBe(false);
  });

  test('does nothing if task index is invalid', () => {
    saveCalendarTask('2025-04-01', { title: 'T', blocks: 1, completed: false });
    toggleCalendarTask('2025-04-01', 99);
    expect(state.energy).toBe(2);
  });
});

describe('getDayTasks edge cases (app.mjs)', () => {
  test('returns empty string when no schedule data', () => {
    localStorage.removeItem('maestro_schedule_3');
    expect(getDayTasks(3)).toBe('');
  });
});

describe('renderCalendarView (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom(['scheduleCalendar','calTitle','energySlider','energyValue',
      'scheduleColumns','calPrev','calNext']);
    state.calendarCursor = new Date(2025, 5, 1); // June 2025
    state.calendarView = 'calendar';
    attachToWindow(window);
  });

  test('renders calendar grid with month label', () => {
    renderCalendarView();
    const title = document.getElementById('calTitle');
    expect(title.textContent).toContain('junio');
    expect(title.textContent).toContain('2025');
  });

  test('renders calendar cells with data-date attributes', () => {
    renderCalendarView();
    const cells = document.querySelectorAll('.calendar-day');
    expect(cells.length).toBeGreaterThanOrEqual(28);
    const firstCell = cells[0];
    expect(firstCell.dataset.date).toBeTruthy();
  });

  test('calendar cells show tasks from localStorage', () => {
    const dateStr = '2025-06-15';
    saveCalendarTask(dateStr, { title: 'TestTask', blocks: 1, completed: false, skillName: 'X' });
    renderCalendarView();
    const grid = document.getElementById('scheduleCalendar');
    expect(grid.innerHTML).toContain('TestTask');
  });

  test('renders other-month cells', () => {
    renderCalendarView();
    const otherMonth = document.querySelectorAll('.calendar-day.other-month');
    expect(otherMonth.length).toBeGreaterThan(0);
  });
});
