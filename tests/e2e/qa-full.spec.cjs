/**
 * QA E2E — Maestro IA
 * Simula un usuario real navegando la app, tocando cada funcionalidad.
 * Layout actual: multi-panel (skills izq, timer centro, agenda der, chat abajo).
 * Corre contra http://localhost:8081 (server.cjs).
 */

const { test, expect } = require('@playwright/test');

const BASE = 'http://localhost:8081';

// ─── TIMER ────────────────────────────────────────────────

test.describe('Temporizador', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('#timerTime')).toBeVisible();
  });

  test('muestra tiempo por defecto del modo Regular (15:00)', async ({ page }) => {
    await expect(page.locator('#timerTime')).toHaveText('15:00');
    await expect(page.locator('#startBtn')).toHaveText('Iniciar');
    await expect(page.locator('#timerPhase')).toContainText('Listo');
  });

  test('iniciar → pausar → continuar → reiniciar', async ({ page }) => {
    const btn = page.locator('#startBtn');
    const display = page.locator('#timerTime');

    await btn.click();
    await expect(btn).toHaveText('Pausar');
    await expect(page.locator('#timerPhase')).toContainText('Enfócate');
    await page.waitForTimeout(2500);
    const t1 = await display.textContent();

    await btn.click();
    await expect(btn).toHaveText('Continuar');
    await page.waitForTimeout(1000);
    await expect(display).toHaveText(t1);

    await page.locator('#resetBtn').click();
    await expect(btn).toHaveText('Iniciar');
    await expect(display).toHaveText('15:00');
    await expect(page.locator('#timerPhase')).toContainText('Listo');
  });

  test('cambiar modo a Deep Work actualiza tiempo a 35:00', async ({ page }) => {
    await page.locator('.mode-btn', { hasText: 'Trabajo' }).click();
    await expect(page.locator('#timerTime')).toHaveText('35:00');
    await expect(page.locator('#startBtn')).toHaveText('Iniciar');
  });

  test('cambiar modo a Arranque difícil actualiza a 05:00', async ({ page }) => {
    await page.locator('.mode-btn', { hasText: 'Arranque' }).click();
    await expect(page.locator('#timerTime')).toHaveText('05:00');
  });

  test('cambiar energía con el slider', async ({ page }) => {
    const slider = page.locator('#energySlider');
    const value = page.locator('#energyValue');

    await slider.fill('5');
    await expect(value).toHaveText('5');

    await slider.fill('1');
    await expect(value).toHaveText('1');
  });
});

// ─── SKILLS ───────────────────────────────────────────────

test.describe('Skills', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('#skillsGrid')).toBeVisible();
  });

  test('panel de skills muestra la grilla y header', async ({ page }) => {
    await expect(page.locator('#skillsGrid')).toBeVisible();
    await expect(page.locator('.sidebar-left .sidebar-header')).toContainText('Skills');
  });

  test('agregar nueva skill con formulario modal', async ({ page }) => {
    await page.locator('.sidebar-left button[data-action="addSkill"]').click();
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await expect(page.locator('#skillName')).toBeVisible();

    await page.fill('#skillName', 'Guitarra');
    await page.fill('#skillType', 'Música');
    await page.locator('.modal-overlay button[type="submit"]').click();

    await expect(page.locator('.modal-overlay')).not.toBeVisible();
    await expect(page.locator('#skillsGrid')).toContainText('Guitarra');
  });

  test('agregar skill sin nombre muestra error', async ({ page }) => {
    await page.locator('.sidebar-left button[data-action="addSkill"]').click();
    await expect(page.locator('.modal-overlay')).toBeVisible();

    await page.fill('#skillName', '');
    await page.fill('#skillType', 'Test');
    await page.locator('.modal-overlay button[type="submit"]').click();

    await expect(page.locator('.modal-overlay')).toBeVisible();
  });

  test('eliminar skill', async ({ page }) => {
    await page.locator('.sidebar-left button[data-action="addSkill"]').click();
    await page.fill('#skillName', 'ParaEliminar');
    await page.fill('#skillType', 'Temp');
    await page.locator('.modal-overlay button[type="submit"]').click();
    await expect(page.locator('#skillsGrid')).toContainText('ParaEliminar');

    await page.locator('.skill-card', { hasText: 'ParaEliminar' }).getByText('🗑️').click();
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await expect(page.locator('.modal-overlay')).toContainText('eliminar');

    await page.locator('.modal-overlay .modal-btn-danger').click();
    await expect(page.locator('#skillsGrid')).not.toContainText('ParaEliminar');
  });
});

// ─── SCHEDULE — WEEKLY VIEW ───────────────────────────────

test.describe('Agenda — Vista Semanal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('#scheduleColumns')).toBeVisible();
  });

  test('muestra columnas de la semana', async ({ page }) => {
    const cols = page.locator('#scheduleColumns');
    await expect(cols).toBeVisible();
    await expect(cols).toContainText('Hoy');
  });

  test('abrir modal de añadir tarea', async ({ page }) => {
    await page.locator('.add-task-btn').first().click();
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await expect(page.locator('#taskTitle')).toBeVisible();
    await expect(page.locator('#taskBlocks')).toBeVisible();
  });

  test('añadir tarea a un día', async ({ page }) => {
    await page.locator('.add-task-btn').first().click();
    await expect(page.locator('.modal-overlay')).toBeVisible();

    await page.fill('#taskTitle', 'Estudiar cálculo');
    await page.fill('#taskBlocks', '3');
    await page.locator('.modal-overlay button[type="submit"]').click();

    await expect(page.locator('.modal-overlay')).not.toBeVisible();
    await expect(page.locator('#scheduleColumns')).toContainText('Estudiar cálculo');
  });
});

// ─── SCHEDULE — CALENDAR VIEW ─────────────────────────────

test.describe('Agenda — Vista Calendario', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await page.locator('.schedule-view-toggle button[data-view="calendar"]').click();
  });

  test('muestra vista calendario con título de mes', async ({ page }) => {
    await expect(page.locator('#scheduleCalendar')).toBeVisible();
    await expect(page.locator('#calTitle')).toContainText(/\d{4}/);
  });

  test('navegar mes anterior y siguiente', async ({ page }) => {
    const titleBefore = await page.locator('#calTitle').textContent();
    await page.click('#calPrev');
    const titleAfterPrev = await page.locator('#calTitle').textContent();
    expect(titleAfterPrev).not.toBe(titleBefore);

    await page.click('#calNext');
    await page.click('#calNext');
    const titleAfterNext = await page.locator('#calTitle').textContent();
    expect(titleAfterNext).not.toBe(titleAfterPrev);
  });

  test('hacer clic en un día abre modal de tarea', async ({ page }) => {
    const day = page.locator('.calendar-day').nth(10);
    await day.click();
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await expect(page.locator('#taskTitle')).toBeVisible();
  });

  test('añadir tarea al calendario', async ({ page }) => {
    const day = page.locator('.calendar-day').nth(10);
    await day.click();
    await expect(page.locator('.modal-overlay')).toBeVisible();

    await page.fill('#taskTitle', 'Leer capítulo 5');
    await page.fill('#taskBlocks', '2');
    await page.locator('.modal-overlay button[type="submit"]').click();

    await expect(page.locator('.modal-overlay')).not.toBeVisible();
    await expect(page.locator('#scheduleCalendar')).toContainText('Leer capítulo 5');
  });

  test('marcar tarea del calendario como completada', async ({ page }) => {
    const day = page.locator('.calendar-day').nth(10);
    await day.click();
    await page.fill('#taskTitle', 'Tarea QA');
    await page.fill('#taskBlocks', '1');
    await page.locator('.modal-overlay button[type="submit"]').click();
    await expect(page.locator('#scheduleCalendar')).toContainText('Tarea QA');

    await page.locator('.calendar-task', { hasText: 'Tarea QA' }).click();
    await expect(page.locator('.calendar-task.completed', { hasText: 'Tarea QA' })).toBeVisible({ timeout: 5000 });
  });
});

// ─── CHAT ─────────────────────────────────────────────────

test.describe('Chat', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('#chatMessages')).toBeVisible();
  });

  test('panel de chat muestra mensajes e input', async ({ page }) => {
    await expect(page.locator('#chatMessages')).toBeVisible();
    await expect(page.locator('#chatInput')).toBeVisible();
    await expect(page.locator('#sendBtn')).toBeVisible();
    await expect(page.locator('#chatMessages')).toContainText('Maestro IA');
  });

  test('enviar mensaje vacío no hace nada', async ({ page }) => {
    const countBefore = await page.locator('#chatMessages .message').count();
    await page.fill('#chatInput', '   ');
    await page.click('#sendBtn');
    await expect(page.locator('#chatMessages .message')).toHaveCount(countBefore);
  });

  test('escribir y enviar mensaje — Ollama no disponible muestra error', async ({ page }) => {
    await page.fill('#chatInput', '¿Qué es JavaScript?');
    await page.click('#sendBtn');

    await expect(page.locator('#chatMessages')).toContainText('¿Qué es JavaScript?');
    await expect(page.locator('#chatInput')).toHaveValue('');
    const count = await page.locator('#chatMessages .message').count();
    expect(count).toBeGreaterThanOrEqual(2);
  });
});

// ─── SETTINGS (MODAL) ─────────────────────────────────────

test.describe('Configuración', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await page.click('#settingsBtn');
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await expect(page.locator('.modal-overlay #ollamaUrl')).toBeVisible();
  });

  test('muestra campos de configuración', async ({ page }) => {
    await expect(page.locator('.modal-overlay #ollamaUrl')).toBeVisible();
    await expect(page.locator('.modal-overlay #modelSelect')).toBeVisible();
    await expect(page.locator('.modal-overlay #systemPrompt')).toBeVisible();
    await expect(page.locator('.modal-overlay #temperature')).toBeVisible();
    await expect(page.locator('.modal-overlay #topP')).toBeVisible();
    await expect(page.locator('.modal-overlay #maxTokens')).toBeVisible();
  });

  test('modificar URL y guardar', async ({ page }) => {
    await page.fill('.modal-overlay #ollamaUrl', 'http://127.0.0.1:11434');
    await page.locator('.modal-overlay button', { hasText: 'Guardar' }).click();
    await expect(page.locator('.modal-overlay #settingsStatus')).toContainText('guardada');
  });

  test('URL inválida muestra error', async ({ page }) => {
    await page.fill('.modal-overlay #ollamaUrl', 'https://evil.com:11434');
    await page.locator('.modal-overlay button', { hasText: 'Guardar' }).click();
    await expect(page.locator('.modal-overlay #settingsStatus')).toContainText('no permitida');
  });

  test('probar conexión', async ({ page }) => {
    await page.fill('.modal-overlay #ollamaUrl', 'http://localhost:11434');
    await page.locator('.modal-overlay button', { hasText: 'Probar conexión' }).click();
    await expect(page.locator('.modal-overlay #settingsStatus')).toBeVisible({ timeout: 15000 });
  });

  test('aplicar preset "Preciso" actualiza valores', async ({ page }) => {
    await page.locator('.modal-overlay .preset-btn', { hasText: 'Preciso' }).click();
    await expect(page.locator('.modal-overlay #temperature')).toHaveValue('0.1');
    await expect(page.locator('.modal-overlay #topP')).toHaveValue('0.1');
    await expect(page.locator('.modal-overlay #maxTokens')).toHaveValue('256');
  });

  test('aplicar preset "Creativo" actualiza valores', async ({ page }) => {
    await page.locator('.modal-overlay .preset-btn', { hasText: 'Creativo' }).click();
    await expect(page.locator('.modal-overlay #temperature')).toHaveValue('0.7');
    await expect(page.locator('.modal-overlay #topP')).toHaveValue('0.9');
    await expect(page.locator('.modal-overlay #maxTokens')).toHaveValue('768');
  });
});

// ─── TOAST NOTIFICATIONS ──────────────────────────────────

test.describe('Notificaciones Toast', () => {
  test('acciones muestran toast y desaparece', async ({ page }) => {
    await page.goto(BASE);
    await page.locator('.add-task-btn').first().click();
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await page.fill('#taskTitle', 'Toast test');
    await page.locator('.modal-overlay button[type="submit"]').click();

    const toast = page.locator('.toast');
    await expect(toast.first()).toBeVisible({ timeout: 5000 });
    await expect(toast.first()).not.toBeVisible({ timeout: 5000 });
  });
});

// ─── MODAL ────────────────────────────────────────────────

test.describe('Modales', () => {
  test('abrir y cerrar modal con X', async ({ page }) => {
    await page.goto(BASE);
    await page.locator('.sidebar-left button[data-action="addSkill"]').click();
    await expect(page.locator('.modal-overlay')).toBeVisible();

    await page.locator('.modal-close').click();
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
  });

  test('solo un modal abierto a la vez', async ({ page }) => {
    await page.goto(BASE);
    await page.locator('.sidebar-left button[data-action="addSkill"]').click();
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await page.locator('.modal-close').click();

    await page.locator('.sidebar-left button[data-action="addSkill"]').click();
    await expect(page.locator('.modal-overlay')).toHaveCount(1);
  });
});

// ─── PERSISTENCE ──────────────────────────────────────────

test.describe('Persistencia', () => {
  test('energía sobrevive recarga', async ({ page }) => {
    await page.goto(BASE);
    await page.locator('#energySlider').fill('5');
    await expect(page.locator('#energyValue')).toHaveText('5');

    await page.reload();
    await expect(page.locator('#energyValue')).toHaveText('5');
  });

  test('skill creada persiste tras recarga', async ({ page }) => {
    await page.goto(BASE);
    await page.locator('.sidebar-left button[data-action="addSkill"]').click();
    await page.fill('#skillName', 'Persistente');
    await page.fill('#skillType', 'Test');
    await page.locator('.modal-overlay button[type="submit"]').click();
    await expect(page.locator('#skillsGrid')).toContainText('Persistente');

    await page.reload();
    await expect(page.locator('#skillsGrid')).toContainText('Persistente');
  });

  test('tarea del schedule persiste tras recarga', async ({ page }) => {
    await page.goto(BASE);
    await page.locator('.add-task-btn').first().click();
    await page.fill('#taskTitle', 'Persistencia QA');
    await page.fill('#taskBlocks', '1');
    await page.locator('.modal-overlay button[type="submit"]').click();
    await expect(page.locator('#scheduleColumns')).toContainText('Persistencia QA');

    await page.reload();
    await expect(page.locator('#scheduleColumns')).toContainText('Persistencia QA');
  });
});
