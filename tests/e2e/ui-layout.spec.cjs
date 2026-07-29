/**
 * QA Visual — Interactive Layout Overlap Detection
 *
 * Navigates every major feature, captures bounding boxes of the main layout
 * panels, and asserts they never overlap (no CSS overlap).
 *
 * Panels under surveillance:
 *   .sidebar-left   → Skills panel
 *   .main-content   → Timer + Stats + Chat
 *   .sidebar-right  → Schedule
 */

const { test, expect } = require('@playwright/test');

const BASE = 'http://localhost:8081';

// ─── Bounding-box overlap utility ──────────────────────────

/**
 * Two rectangles overlap iff they intersect on BOTH the X and Y axes.
 * If they are separated on at least one axis, there is no overlap.
 */
function assertNoOverlap(boxA, boxB, label) {
  const noOverlapX = boxA.x + boxA.width <= boxB.x || boxB.x + boxB.width <= boxA.x;
  const noOverlapY = boxA.y + boxA.height <= boxB.y || boxB.y + boxB.height <= boxA.y;
  const overlap = !noOverlapX && !noOverlapY;
  expect.soft(overlap, `${label}: panels should NOT overlap`).toBe(false);
}

/**
 * Capture bounding boxes for the 3 main panels.
 * Returns a map keyed by short names.
 */
async function capturePanelBoxes(page) {
  const selectors = {
    left: '.sidebar-left',
    center: '.main-content',
    right: '.sidebar-right',
  };
  const boxes = {};
  for (const [key, sel] of Object.entries(selectors)) {
    const el = page.locator(sel);
    await expect(el).toBeVisible();
    boxes[key] = await el.boundingBox();
  }
  return boxes;
}

/**
 * Assert all panels have zero overlap with each other.
 */
function assertAllPanelsNoOverlap(boxes) {
  const names = Object.keys(boxes);
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      assertNoOverlap(boxes[names[i]], boxes[names[j]], `${names[i]} vs ${names[j]}`);
    }
  }
}

// ─── Helpers ───────────────────────────────────────────────

async function closeModalIfOpen(page) {
  const modal = page.locator('.modal-overlay');
  if (await modal.isVisible().catch(() => false)) {
    const closeBtn = modal.locator('.modal-close');
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
      await expect(modal).not.toBeVisible();
    }
  }
}

// ─── Tests ─────────────────────────────────────────────────

test.describe('QA Visual — No Superposición de Paneles', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Ensure all main containers are present
    await expect(page.locator('.sidebar-left')).toBeVisible();
    await expect(page.locator('.main-content')).toBeVisible();
    await expect(page.locator('.sidebar-right')).toBeVisible();
    await expect(page.locator('.chat-panel-center')).toBeVisible();
  });

  test('1. Carga inicial — sin superposición', async ({ page }) => {
    const boxes = await capturePanelBoxes(page);
    assertAllPanelsNoOverlap(boxes);
  });

  test('2. Iniciar temporizador — sin superposición', async ({ page }) => {
    const startBtn = page.locator('#startBtn');
    await expect(startBtn).toBeVisible();
    await startBtn.click();
    await expect(page.locator('#startBtn')).toHaveText('Pausar');
    const boxes = await capturePanelBoxes(page);
    assertAllPanelsNoOverlap(boxes);
  });

  test('3. Modo Deep Work + slider energía — sin superposición', async ({ page }) => {
    await page.locator('.mode-btn', { hasText: 'Trabajo' }).click();
    await expect(page.locator('#timerTime')).toHaveText('35:00');
    await page.locator('#energySlider').fill('5');
    await expect(page.locator('#energyValue')).toHaveText('5');
    const boxes = await capturePanelBoxes(page);
    assertAllPanelsNoOverlap(boxes);
  });

  test('4. Modal de configuración — paneles sin superposición (modal se superpone intencionalmente)', async ({ page }) => {
    // Open settings modal
    await page.locator('#settingsBtn').click();
    await expect(page.locator('.modal-overlay')).toBeVisible();
    // Panels behind modal should still not overlap each other
    const boxes = await capturePanelBoxes(page);
    assertAllPanelsNoOverlap(boxes);
    await closeModalIfOpen(page);
  });

  test('5. Agregar skill — sin superposición', async ({ page }) => {
    await page.locator('.sidebar-left button[data-action="addSkill"]').click();
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await page.fill('#skillName', 'Piano');
    await page.fill('#skillType', 'Música');
    await page.locator('.modal-overlay button[type="submit"]').click();
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
    await expect(page.locator('#skillsGrid')).toContainText('Piano');
    const boxes = await capturePanelBoxes(page);
    assertAllPanelsNoOverlap(boxes);
  });

  test('6. Añadir tarea a la agenda — sin superposición', async ({ page }) => {
    await page.locator('.add-task-btn').first().click();
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await page.fill('#taskTitle', 'Revisar layout');
    await page.fill('#taskBlocks', '2');
    await page.locator('.modal-overlay button[type="submit"]').click();
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
    await expect(page.locator('#scheduleColumns')).toContainText('Revisar layout');
    const boxes = await capturePanelBoxes(page);
    assertAllPanelsNoOverlap(boxes);
  });

  test('7. Vista calendario — sin superposición', async ({ page }) => {
    await page.locator('.schedule-view-toggle button[data-view="calendar"]').click();
    await expect(page.locator('#scheduleCalendar')).toBeVisible();
    // Navigate months
    await page.locator('#calPrev').click();
    await page.waitForTimeout(200);
    await page.locator('#calNext').click();
    await page.waitForTimeout(200);
    const boxes = await capturePanelBoxes(page);
    assertAllPanelsNoOverlap(boxes);
  });

  test('8. Chat — enviar mensaje (sin Ollama) — sin superposición', async ({ page }) => {
    await page.fill('#chatInput', '¿Cómo van los paneles?');
    await page.locator('#sendBtn').click();
    await expect(page.locator('#chatMessages')).toContainText('¿Cómo van los paneles?');
    const boxes = await capturePanelBoxes(page);
    assertAllPanelsNoOverlap(boxes);
  });

  test('9. Ciclo completo: timer + skill + tarea + chat — sin superposición', async ({ page }) => {
    // Start timer
    await page.locator('#startBtn').click();
    await expect(page.locator('#startBtn')).toHaveText('Pausar');
    // Add skill
    await page.locator('.sidebar-left button[data-action="addSkill"]').click();
    await page.fill('#skillName', 'Dibujo');
    await page.fill('#skillType', 'Arte');
    await page.locator('.modal-overlay button[type="submit"]').click();
    await expect(page.locator('#skillsGrid')).toContainText('Dibujo');
    // Add task
    await page.locator('.add-task-btn').first().click();
    await page.fill('#taskTitle', 'Test final');
    await page.fill('#taskBlocks', '1');
    await page.locator('.modal-overlay button[type="submit"]').click();
    await expect(page.locator('#scheduleColumns')).toContainText('Test final');
    // Chat
    await page.fill('#chatInput', 'Fin del test');
    await page.locator('#sendBtn').click();
    await expect(page.locator('#chatMessages')).toContainText('Fin del test');
    // Final overlap check
    const boxes = await capturePanelBoxes(page);
    assertAllPanelsNoOverlap(boxes);
  });

});
