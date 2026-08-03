import {
  state, runEvaluation, clearEvaluationResults, initApp,
  showToast, createToastContainer, openModal, closeModal,
  attachToWindow, saveSettings, loadSettings, applyPreset,
  testConnection, sendMessage, addMessage, checkOllama,
  recordSession, showTimerCompleteModal, linkTypeChanged,
} from '../app.mjs';
import { setupDom } from './helpers/setupDom';

describe('clearEvaluationResults (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom(['evalResults','settingsStatus']);
    attachToWindow(window);
  });

  test('clears eval results innerHTML', () => {
    document.getElementById('evalResults').innerHTML = '<div>old results</div>';
    clearEvaluationResults();
    expect(document.getElementById('evalResults').innerHTML).toBe('');
  });
});

describe('runEvaluation (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom([
      'evalPrompt','evalConfigs','evalResults','settingsStatus',
      'customModel','energySlider','energyValue',
      'ollamaUrl','modelSelect','systemPrompt','temperature','topP','maxTokens',
      'devModeToggle','devModeSection',
    ]);
    state.settings.ollamaUrl = 'http://localhost:11434';
    state.settings.model = 'qwen2.5-coder:3b';
    state.settings.systemPrompt = 'test prompt';
    // Add checkboxes to evalConfigs
    document.getElementById('evalConfigs').innerHTML = `
      <input type="checkbox" value="preciso" checked>
      <input type="checkbox" value="equilibrado">
    `;
    attachToWindow(window);
  });

  test('shows error when prompt is empty', async () => {
    document.getElementById('evalPrompt').value = '';
    await runEvaluation();
    expect(document.getElementById('settingsStatus').textContent).toContain('Por favor ingrese');
  });

  test('shows error when no configs selected', async () => {
    document.getElementById('evalPrompt').value = 'test';
    document.getElementById('evalConfigs').querySelectorAll('input').forEach(cb => cb.checked = false);
    await runEvaluation();
    expect(document.getElementById('settingsStatus').textContent).toContain('Por favor seleccione');
  });

  test('runs evaluation successfully with mocked fetch', async () => {
    document.getElementById('evalPrompt').value = '¿Qué es Python?';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ response: 'Python es un lenguaje' }),
    });
    await runEvaluation();
    expect(document.getElementById('evalResults').innerHTML).toContain('Preciso');
    expect(document.getElementById('settingsStatus').textContent).toContain('completada');
    global.fetch.mockRestore();
  });

  test('handles HTTP error in evaluation', async () => {
    document.getElementById('evalPrompt').value = 'test';
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });
    await runEvaluation();
    expect(document.getElementById('evalResults').innerHTML).toContain('Error HTTP');
    global.fetch.mockRestore();
  });

  test('handles network error in evaluation', async () => {
    document.getElementById('evalPrompt').value = 'test';
    global.fetch = jest.fn().mockRejectedValue(new Error('Network fail'));
    await runEvaluation();
    expect(document.getElementById('evalResults').innerHTML).toContain('Network fail');
    expect(document.getElementById('settingsStatus').textContent).toContain('Error');
    global.fetch.mockRestore();
  });
});

describe('showToast (app.mjs)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('creates toast container if missing', () => {
    showToast('Hello', 'info');
    expect(document.getElementById('toastContainer')).toBeTruthy();
  });

  test('appends toast with correct message', () => {
    showToast('Test message', 'success');
    const container = document.getElementById('toastContainer');
    const toast = container.querySelector('.toast');
    expect(toast.textContent).toBe('Test message');
    expect(toast.classList.contains('toast-success')).toBe(true);
  });

  test('removes toast after timeout', () => {
    jest.useFakeTimers();
    try {
      showToast('Temp toast', 'error');
      const container = document.getElementById('toastContainer');
      expect(container.children.length).toBe(1);
      jest.advanceTimersByTime(3000);
      expect(container.children.length).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });

  test('removes container when last toast expires', () => {
    jest.useFakeTimers();
    try {
      showToast('Only toast', 'info');
      const container = document.getElementById('toastContainer');
      jest.advanceTimersByTime(3000);
      expect(document.getElementById('toastContainer')).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  test('reuses existing container', () => {
    const existing = document.createElement('div');
    existing.id = 'toastContainer';
    document.body.appendChild(existing);
    showToast('msg', 'info');
    expect(existing.children.length).toBe(1);
  });
});

describe('openModal / closeModal (app.mjs)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('creates modal overlay with content and title', () => {
    openModal('<p>content</p>', 'My Title');
    const overlay = document.querySelector('.modal-overlay');
    expect(overlay).toBeTruthy();
    expect(overlay.textContent).toContain('My Title');
    expect(overlay.textContent).toContain('content');
  });

  test('removes existing modal before creating new one', () => {
    openModal('<p>first</p>', 'First');
    openModal('<p>second</p>', 'Second');
    const modals = document.querySelectorAll('.modal-overlay');
    expect(modals.length).toBe(1);
    expect(modals[0].textContent).toContain('Second');
  });

  test('closeModal removes the overlay', () => {
    openModal('<p>test</p>', 'Test');
    expect(document.querySelector('.modal-overlay')).toBeTruthy();
    closeModal();
    expect(document.querySelector('.modal-overlay')).toBeNull();
  });
});

describe('sendMessage error path (app.mjs)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    setupDom([
      'chatInput','chatMessages','sendBtn','ollamaStatus','ollamaText',
      'customModel','energySlider','energyValue',
      'ollamaUrl','modelSelect','systemPrompt','temperature','topP','maxTokens',
    ]);
    attachToWindow(window);
  });

  test('shows error message when fetch throws', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    await checkOllama();
    global.fetch.mockRestore();

    document.getElementById('chatInput').value = 'hello';
    global.fetch = jest.fn().mockRejectedValue(new Error('Conn refused'));
    await sendMessage();
    const msgArea = document.getElementById('chatMessages');
    expect(msgArea.textContent).toContain('Conn refused');
    expect(msgArea.textContent).toContain('Error');
    global.fetch.mockRestore();
  });

  test('does nothing when message is empty', async () => {
    document.getElementById('chatInput').value = '   ';
    await sendMessage();
    expect(document.getElementById('chatMessages').textContent).toBe('');
  });
});

describe('showTimerCompleteModal linkType handler (app.mjs)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    setupDom([
      'linkType','skillSelect','taskDay','taskSelect',
      'taskDetailSelection','skillSelection','taskSelection',
      'energySlider','energyValue',
      'timerCompleteType','timerCompleteSkill','timerCompleteDay',
      'timerCompleteTask','timerCompleteBlocks',
    ]);
    state.skills = [
      { id: 'sk1', name: 'Python', type: 'code', status: 'pending', progress: 0, tasks: [] },
    ];
    attachToWindow(window);
  });

  test('linkType onchange toggles skill/task selector visibility', () => {
    showTimerCompleteModal(25);
    const linkType = document.getElementById('linkType');
    linkType.value = 'skill';
    linkTypeChanged();
    expect(document.getElementById('skillSelector').style.display).toBe('block');
    expect(document.getElementById('taskSelector').style.display).toBe('none');

    linkType.value = 'task';
    linkTypeChanged();
    expect(document.getElementById('taskSelector').style.display).toBe('block');
    expect(document.getElementById('skillSelector').style.display).toBe('none');

    linkType.value = 'none';
    linkTypeChanged();
    expect(document.getElementById('skillSelector').style.display).toBe('none');
    expect(document.getElementById('taskSelector').style.display).toBe('none');
  });
});

describe('initApp (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom([
      'modeSelector','energySlider','energyValue','startBtn','resetBtn','endBreakBtn',
      'sendBtn','chatInput','modelSelect','customModel',
      'temperature','tempValue','topP','topPValue',
      'devModeToggle','devModeSection','devModeToggleLabel',
      'ollamaUrl','systemPrompt','maxTokens',
      'scheduleColumns','scheduleCalendar','calTitle','calPrev','calNext',
      'timerTime','timerPhase','timerProgress',
      'breakOverlay','breakSuggestion','breakTimer',
      'sessionsCount','totalMinutes','streakCount',
      'skillsGrid','addSkillBtn','chatMessages','ollamaStatus','ollamaText',
      'settingsStatus','statusUrl',
      'evalPrompt','evalConfigs','evalResults',
      'testConnectionBtn','saveSettingsBtn','runEvaluationBtn','clearEvaluationBtn',
    ]);
    // Add tabs for initApp
    const tab1 = document.createElement('button');
    tab1.className = 'tab';
    tab1.dataset.tab = 'timer';
    const panel1 = document.createElement('div');
    panel1.id = 'timer-panel';
    panel1.className = 'panel';
    const tab2 = document.createElement('button');
    tab2.className = 'tab';
    tab2.dataset.tab = 'skills';
    const panel2 = document.createElement('div');
    panel2.id = 'skills-panel';
    panel2.className = 'panel';
    document.body.appendChild(tab1);
    document.body.appendChild(panel1);
    document.body.appendChild(tab2);
    document.body.appendChild(panel2);
    // schedule-toggle buttons
    const toggleDiv = document.createElement('div');
    toggleDiv.className = 'schedule-toggle';
    const weekBtn = document.createElement('button');
    weekBtn.dataset.view = 'week';
    const calBtn = document.createElement('button');
    calBtn.dataset.view = 'calendar';
    toggleDiv.appendChild(weekBtn);
    toggleDiv.appendChild(calBtn);
    document.getElementById('scheduleColumns').before(toggleDiv);
  });

  test('binds tab click to toggle active panel', () => {
    initApp(window, document);
    const tabs = document.querySelectorAll('.tab');
    tabs[0].click();
    expect(tabs[0].classList.contains('active')).toBe(true);
    expect(document.getElementById('timer-panel').classList.contains('active')).toBe(true);
    expect(document.getElementById('skills-panel').classList.contains('active')).toBe(false);
  });

  test('energySlider input updates state.energy', () => {
    initApp(window, document);
    const slider = document.getElementById('energySlider');
    slider.value = 4;
    slider.dispatchEvent(new Event('input'));
    expect(state.energy).toBe(4);
    expect(String(document.getElementById('energyValue').textContent)).toBe('4');
  });

  test('startBtn click calls startTimer', () => {
    initApp(window, document);
    document.getElementById('startBtn').click();
    expect(state.timerRunning).toBe(true);
  });

  test('devModeToggle changes label text', () => {
    initApp(window, document);
    const toggle = document.getElementById('devModeToggle');
    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));
    expect(state.settings.devMode).toBe(true);
    expect(document.getElementById('devModeToggleLabel').textContent).toContain('Desactivar');
  });

  test('devModeToggle unchecked shows activate label', () => {
    initApp(window, document);
    const toggle = document.getElementById('devModeToggle');
    toggle.checked = false;
    toggle.dispatchEvent(new Event('change'));
    expect(state.settings.devMode).toBe(false);
    expect(document.getElementById('devModeToggleLabel').textContent).toContain('Activar');
  });

  test('is idempotent via __bound flags', () => {
    initApp(window, document);
    initApp(window, document);
    const startBtn = document.getElementById('startBtn');
    expect(startBtn['__bound_click']).toBe(true);
  });
});

describe('addMessage (app.mjs)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    setupDom(['chatMessages']);
  });

  test('appends user message with correct class', () => {
    addMessage('Hello', 'user');
    const container = document.getElementById('chatMessages');
    const msg = container.querySelector('.message.user');
    expect(msg).toBeTruthy();
    expect(msg.textContent).toContain('Hello');
  });

  test('appends assistant message with avatar', () => {
    addMessage('Hi there', 'assistant');
    const container = document.getElementById('chatMessages');
    const msg = container.querySelector('.message.assistant');
    expect(msg).toBeTruthy();
    expect(msg.textContent).toContain('Hi there');
    expect(msg.textContent).toContain('🎓');
  });
});

describe('recordSession (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    state.sessionHistory = [];
  });

  test('pushes session with correct structure', () => {
    recordSession('timer', 25, 'Python', 'Deep work');
    expect(state.sessionHistory).toHaveLength(1);
    const s = state.sessionHistory[0];
    expect(s.type).toBe('timer');
    expect(s.minutes).toBe(25);
    expect(s.linkedTo).toBe('Python');
    expect(s.details).toBe('Deep work');
    expect(s.energyGained).toBe(5);
  });

  test('defaults linkedTo and details to null', () => {
    recordSession('task', 10);
    expect(state.sessionHistory[0].linkedTo).toBeNull();
    expect(state.sessionHistory[0].details).toBeNull();
  });
});

describe('applyPreset (app.mjs)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    setupDom([
      'temperature','tempValue','topP','topPValue','maxTokens',
      'ollamaUrl','modelSelect','systemPrompt','devModeToggle',
      'customModel','settingsStatus','energySlider','energyValue',
    ]);
    state.settings.ollamaUrl = 'http://localhost:11434';
    state.settings.model = 'qwen2.5-coder:3b';
    state.settings.systemPrompt = 'test';
    attachToWindow(window);
  });

  test('applies preciso preset values', () => {
    applyPreset('preciso');
    expect(document.getElementById('temperature').value).toBe('0.1');
    expect(document.getElementById('topP').value).toBe('0.1');
    expect(document.getElementById('maxTokens').value).toBe('256');
  });

  test('applies creativo preset values', () => {
    applyPreset('creativo');
    expect(document.getElementById('temperature').value).toBe('0.7');
    expect(document.getElementById('topP').value).toBe('0.9');
    expect(document.getElementById('maxTokens').value).toBe('768');
  });
});
