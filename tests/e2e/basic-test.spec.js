/**
 * Pruebas E2E básicas para Maestro IA
 * Verifica que la aplicación se lanza correctamente y los elementos principales están presentes
 */

const { test, expect } = require('@playwright/test');

test.describe('Maestro IA Application', () => {
  test('should launch the application and show main elements', async ({ page }) => {
    // Navegar a la aplicación (asumiendo que está corriendo en localhost:3000 o similar)
    // En un entorno real de desarrollo de Electron, podríamos necesitar:
    // await page.goto('http://localhost:3000'); // si usamos un dev server
    // O para Electron empaquetado, usaríamos el enfoque de electron.launch de arriba

    // Por ahora, vamos a cargar el archivo index.html directamente
    // Esto funciona para testing básico, aunque no prueba el entorno Electron completo
    await page.goto('file://' + process.cwd() + '/index.html');

    // Verificar que el título de la aplicación es correcto
    await expect(page).toHaveTitle(/Maestro IA/);

    // Verificar que los elementos principales de la UI están presentes
    const logo = page.locator('.logo');
    await expect(logo).toBeVisible();
    await expect(logo).toHaveText(/Maestro IA/);

    // Verificar que las pestañas están presentes
    const tabs = page.locator('.tab');
    await expect(tabs).toHaveCount(5); // Temporizador, Skills, Agenda, Chat, Configuración

    // Verificar que la primera pestaña (Temporizador) esté activa por defecto
    const firstTab = page.locator('.tab.active');
    await expect(firstTab).toHaveText(/Temporizador/);

    // Verificar que el panel de temporizador está visible
    const timerPanel = page.locator('#timer-panel');
    await expect(timerPanel).toBeVisible();

    // Verificar elementos del temporizador
    const timerDisplay = page.locator('#timerTime');
    await expect(timerDisplay).toBeVisible();
    await expect(timerDisplay).toHaveText(/15:00/); // Tiempo por defecto para modo regular

    // Verificar botones de control del temporizador
    const startBtn = page.locator('#startBtn');
    await expect(startBtn).toBeVisible();
    await expect(startBtn).toHaveText(/Iniciar/);

    const resetBtn = page.locator('#resetBtn');
    await expect(resetBtn).toBeVisible();
    await expect(resetBtn).toHaveText(/Reiniciar/);

    // Verificar que el widget de energía está presente
    const energyWidget = page.locator('.energy-widget');
    await expect(energyWidget).toBeVisible();

    const energySlider = page.locator('#energySlider');
    await expect(energySlider).toBeVisible();

    const energyValue = page.locator('#energyValue');
    await expect(energyValue).toHaveText('3'); // Valor por defecto
  });

  test('should be able to switch between tabs', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/index.html');

    // Verificar estado inicial
    await expect(page.locator('.tab.active')).toHaveText(/Temporizador/);
    await expect(page.locator('#timer-panel')).toBeVisible();
    await expect(page.locator('#skills-panel')).not.toBeVisible();

    // Hacer clic en la pestaña de Skills
    await page.click('.tab[data-tab="skills"]');

    // Verificar que cambió la pestaña activa
    await expect(page.locator('.tab.active')).toHaveText(/Skills/);
    await expect(page.locator('#skills-panel')).toBeVisible();
    await expect(page.locator('#timer-panel')).not.toBeVisible();

    // Hacer clic en la pestaña de Agenda
    await page.click('.tab[data-tab="schedule"]');

    // Verificar que cambió la pestaña activa
    await expect(page.locator('.tab.active')).toHaveText(/Agenda/);
    await expect(page.locator('#schedule-panel')).toBeVisible();
    await expect(page.locator('#skills-panel')).not.toBeVisible();

    // Hacer clic en la pestaña de Chat
    await page.click('.tab[data-tab="chat"]');

    // Verificar que cambió la pestaña activa
    await expect(page.locator('.tab.active')).toHaveText(/Maestro IA/);
    await expect(page.locator('#chat-panel')).toBeVisible();
    await expect(page.locator('#schedule-panel')).not.toBeVisible();

    // Hacer clic en la pestaña de Configuración
    await page.click('.tab[data-tab="settings"]');

    // Verificar que cambió la pestaña activa
    await expect(page.locator('.tab.active')).toHaveText(/⚙️/); // Ícono de configuración
    await expect(page.locator('#settings-panel')).toBeVisible();
    await expect(page.locator('#chat-panel')).not.toBeVisible();
  });

  test('should be able to adjust energy level', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/index.html');

    const energySlider = page.locator('#energySlider');
    const energyValue = page.locator('#energyValue');

    // Verificar valor inicial
    await expect(energyValue).toHaveText('3');

    // Mover el slider a valor 5
    await energySlider.fill('5');

    // Verificar que el valor se actualizó
    await expect(energyValue).toHaveText('5');

    // Mover el slider a valor 1
    await energySlider.fill('1');

    // Verificar que el valor se actualizó
    await expect(energyValue).toHaveText('1');
  });

  test('should be able to start and pause timer', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/index.html');

    const startBtn = page.locator('#startBtn');
    const timerDisplay = page.locator('#timerTime');
    const timerPhase = page.locator('#timerPhase');

    // Estado inicial
    await expect(startBtn).toHaveText(/Iniciar/);
    await expect(timerDisplay).toHaveText(/15:00/); // Tiempo por defecto para modo regular
    await expect(timerPhase).toHaveText(/Listo para comenzar/);

    // Hacer clic en iniciar
    await startBtn.click();

    // Verificar que el botón cambió a "Pausar"
    await expect(startBtn).toHaveText(/Pausar/);

    // Esperar un poco y verificar que el tiempo haya disminuido
    await page.waitForTimeout(2000); // Esperar 2 segundos

    // Después de 2 segundos, el tiempo debería ser aproximadamente 14:58
    // (partiendo de 15:00 y restando 2 segundos)
    await expect(timerDisplay).toHaveText(/14:(5[8-9]|[0-4][0-9])/); // Entre 14:50 y 14:59
    await expect(timerPhase).toHaveText(/Enfócate/);

    // Hacer clic nuevamente para pausar
    await startBtn.click();

    // Verificar que el botón cambió a "Continuar"
    await expect(startBtn).toHaveText(/Continuar/);
    // Después de pausar, debería seguir mostrando "Enfócate" ya que sigue siendo tiempo de trabajo
    await expect(timerPhase).toHaveText(/Enfócate/);

    // Guardar el tiempo actual para verificar que se detiene
    const pausedTime = await timerDisplay.textContent();

    // Esperar 2 segundos más
    await page.waitForTimeout(2000);

    // Verificar que el tiempo no cambió (está pausado)
    await expect(timerDisplay).toHaveText(pausedTime);
  });
});