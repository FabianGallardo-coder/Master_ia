// Tests for app.mjs calendar functions: renderCalendarView, toggleCalendarTask.

import {
  state, renderCalendarView, toggleCalendarTask, attachToWindow,
} from '../app.mjs';
import { setupDom } from './helpers/setupDom';

describe('Calendar (app.mjs)', () => {
  beforeEach(() => {
    // Pin "today" to 2026-07-15 BEFORE the script runs. jest fake timers
    // monkey-patch the global Date used by `new Date()`.
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 6, 15, 10, 0, 0));

    localStorage.clear();
    document.body.innerHTML = '';
    setupDom(['scheduleCalendar','calTitle','energySlider','energyValue','scheduleColumns']);
    attachToWindow(window);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('TC-9: renderCalendarView produces 35 cells with one "today" cell', () => {
    state.calendarCursor = new Date(2026, 6, 1);
    renderCalendarView();

    const grid = document.getElementById('scheduleCalendar');
    const cells = grid.querySelectorAll('.calendar-day');
    // For July 2026 (cursor below) renderCalendarView pads to 35 cells.
    expect(cells.length).toBe(35);

    const todayCells = grid.querySelectorAll('.calendar-day.today');
    expect(todayCells.length).toBe(1);
    expect(todayCells[0].getAttribute('data-date')).toBe('2026-07-15');
  });

  test('TC-10: toggleCalendarTask flips completed and awards energy on completion', () => {
    localStorage.setItem(
      'maestro_calendar_2026-07-15',
      JSON.stringify([{ title: 'A', completed: false, blocks: 1 }])
    );
    state.energy = 2;

    toggleCalendarTask('2026-07-15', 0);

    const stored = JSON.parse(localStorage.getItem('maestro_calendar_2026-07-15'));
    expect(stored[0].completed).toBe(true);
    expect(state.energy).toBe(3);
  });
});
