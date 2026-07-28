// Tests for app.mjs testConnection.

import { testConnection, attachToWindow } from '../app.mjs';
import { setupDom } from './helpers/setupDom';

describe('Settings — testConnection (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    setupDom(['ollamaUrl','settingsStatus']);
    document.getElementById('ollamaUrl').value = 'http://localhost:11434';
    attachToWindow(window);
  });

  test('TC-13: testConnection shows OK status with model name when fetch resolves ok', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ models: [{ name: 'qwen2.5-coder:3b' }] })
    });
    globalThis.fetch = fetchMock;

    await testConnection();

    const status = document.getElementById('settingsStatus');
    expect(status.textContent).toContain('Conexión OK');
    expect(status.textContent).toContain('qwen2.5-coder:3b');
  });
});