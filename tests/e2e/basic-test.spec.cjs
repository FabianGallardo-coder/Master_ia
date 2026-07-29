const { test, expect } = require('@playwright/test');
const BASE = 'http://localhost:8081';

test.describe('Maestro IA Application', () => {
  test('should launch and show main elements', async ({ page }) => {
    await page.goto(BASE);
    await expect(page).toHaveTitle(/Maestro IA/);
    const logo = page.locator('.titlebar-logo');
    await expect(logo).toBeVisible();
    const timerDisplay = page.locator('#timerTime');
    await expect(timerDisplay).toBeVisible();
    await expect(timerDisplay).toHaveText('15:00');
    const startBtn = page.locator('#startBtn');
    await expect(startBtn).toBeVisible();
    await expect(startBtn).toHaveText(/Iniciar/);
    const resetBtn = page.locator('#resetBtn');
    await expect(resetBtn).toBeVisible();
    const energySlider = page.locator('#energySlider');
    await expect(energySlider).toBeVisible();
    const skillsGrid = page.locator('#skillsGrid');
    await expect(skillsGrid).toBeVisible();
    const scheduleColumns = page.locator('#scheduleColumns');
    await expect(scheduleColumns).toBeVisible();
    const chatInput = page.locator('#chatInput');
    await expect(chatInput).toBeVisible();
  });

  test('should be able to adjust energy level', async ({ page }) => {
    await page.goto(BASE);
    const energySlider = page.locator('#energySlider');
    const energyValue = page.locator('#energyValue');
    await expect(energyValue).toHaveText('3');
    await energySlider.fill('5');
    await expect(energyValue).toHaveText('5');
    await energySlider.fill('1');
    await expect(energyValue).toHaveText('1');
  });

  test('should show skills sidebar and schedule', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('.sidebar-header')).toHaveCount(2);
    const skillsHeader = page.locator('.sidebar-left .sidebar-header h2');
    await expect(skillsHeader).toContainText('Skills');
    const scheduleHeader = page.locator('.sidebar-right .sidebar-header h2');
    await expect(scheduleHeader).toContainText('Agenda');
    const dayColumns = page.locator('.day-column');
    await expect(dayColumns).toHaveCount(3);
  });

  test('should switch schedule between week and calendar views', async ({ page }) => {
    await page.goto(BASE);
    // Start in week view
    await expect(page.locator('#scheduleColumns')).toBeVisible();
    await expect(page.locator('#scheduleCalendar')).toBeHidden();
    // Click calendar button
    await page.click('.schedule-view-toggle button[data-view="calendar"]');
    await page.waitForTimeout(300);
    await expect(page.locator('#scheduleCalendar')).toBeVisible();
    await expect(page.locator('#scheduleColumns')).toBeHidden();
    // Click week button
    await page.click('.schedule-view-toggle button[data-view="columns"]');
    await page.waitForTimeout(300);
    await expect(page.locator('#scheduleColumns')).toBeVisible();
    await expect(page.locator('#scheduleCalendar')).toBeHidden();
  });

  test('should open and close settings modal', async ({ page }) => {
    await page.goto(BASE);
    await page.click('#settingsBtn');
    const modal = page.locator('.modal-overlay');
    await expect(modal).toBeVisible();
    await expect(modal.locator('.modal-title')).toContainText('Configuración');
    await page.click('.modal-close');
    await expect(modal).not.toBeVisible();
  });

  test('should allow chat input', async ({ page }) => {
    await page.goto(BASE);
    const input = page.locator('#chatInput');
    await expect(input).toBeVisible();
    await input.fill('Hola');
    await expect(input).toHaveValue('Hola');
    const sendBtn = page.locator('#sendBtn');
    await expect(sendBtn).toBeVisible();
  });
});
