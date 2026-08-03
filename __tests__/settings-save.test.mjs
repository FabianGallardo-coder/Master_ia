// Tests for app.mjs saveSettings (URL validation flow), loadSettings,
// and testConnection failure paths.

import {
  state, saveSettings, loadSettings, testConnection, attachToWindow,
} from '../app.mjs';
import { setupDom } from './helpers/setupDom';

describe('saveSettings (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom([
      'ollamaUrl', 'modelSelect', 'systemPrompt', 'temperature', 'topP',
      'maxTokens', 'devModeToggle', 'settingsStatus', 'toastContainer',
      'ollamaStatus', 'ollamaText',
    ]);
    attachToWindow(window);
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: false });
  });

  test('valid URL: saves all fields to state.settings', () => {
    document.getElementById('ollamaUrl').value = 'http://localhost:11434';
    document.getElementById('modelSelect').value = 'qwen2.5-coder:3b';
    document.getElementById('systemPrompt').value = 'Test prompt';
    document.getElementById('temperature').value = '0.5';
    document.getElementById('topP').value = '0.8';
    document.getElementById('maxTokens').value = '1024';
    document.getElementById('devModeToggle').checked = true;

    saveSettings();

    expect(state.settings.ollamaUrl).toBe('http://localhost:11434');
    expect(state.settings.model).toBe('qwen2.5-coder:3b');
    expect(state.settings.systemPrompt).toBe('Test prompt');
    expect(state.settings.temperature).toBe(0.5);
    expect(state.settings.topP).toBe(0.8);
    expect(state.settings.maxTokens).toBe(1024);
    expect(state.settings.devMode).toBe(true);
  });

  test('URL with trailing slash: strips it before saving', () => {
    document.getElementById('ollamaUrl').value = 'http://127.0.0.1:11434/';
    document.getElementById('modelSelect').value = 'qwen2.5-coder:3b';
    document.getElementById('systemPrompt').value = '';
    document.getElementById('temperature').value = '0.7';
    document.getElementById('topP').value = '0.9';
    document.getElementById('maxTokens').value = '512';
    document.getElementById('devModeToggle').checked = false;

    saveSettings();

    expect(state.settings.ollamaUrl).toBe('http://127.0.0.1:11434');
  });

  test('non-loopback URL: rejects and shows error status', () => {
    document.getElementById('ollamaUrl').value = 'http://evil.com:11434';
    const original = state.settings.ollamaUrl;

    saveSettings();

    expect(state.settings.ollamaUrl).toBe(original);
    const status = document.getElementById('settingsStatus');
    expect(status.textContent).toContain('no permitida');
  });

  test('empty URL: rejects', () => {
    document.getElementById('ollamaUrl').value = '';
    const original = state.settings.ollamaUrl;

    saveSettings();

    expect(state.settings.ollamaUrl).toBe(original);
  });
});

describe('loadSettings (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom([
      'ollamaUrl', 'modelSelect', 'systemPrompt', 'temperature', 'tempValue',
      'topP', 'topPValue', 'maxTokens', 'devModeToggle', 'customModel',
      'evalConfigs', 'toastContainer',
    ]);
    attachToWindow(window);
  });

  test('populates form from state.settings', () => {
    state.settings.ollamaUrl = 'http://localhost:11434';
    state.settings.model = 'qwen2.5-coder:3b';
    state.settings.temperature = 0.3;
    state.settings.topP = 0.5;
    state.settings.maxTokens = 256;
    state.settings.devMode = false;

    loadSettings();

    expect(document.getElementById('ollamaUrl').value).toBe('http://localhost:11434');
    expect(document.getElementById('modelSelect').value).toBe('qwen2.5-coder:3b');
    expect(document.getElementById('temperature').value).toBe('0.3');
    expect(document.getElementById('tempValue').textContent).toBe('0.3');
    expect(document.getElementById('topP').value).toBe('0.5');
    expect(document.getElementById('topPValue').textContent).toBe('0.5');
    expect(document.getElementById('maxTokens').value).toBe('256');
    expect(document.getElementById('devModeToggle').checked).toBe(false);
  });

  test('unknown model: switches to custom model input', () => {
    state.settings.model = 'my-custom-model:latest';

    loadSettings();

    expect(document.getElementById('modelSelect').value).toBe('custom');
    expect(document.getElementById('customModel').value).toBe('my-custom-model:latest');
  });
});

describe('testConnection failure paths (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom(['ollamaUrl', 'settingsStatus', 'toastContainer']);
    document.getElementById('ollamaUrl').value = 'http://localhost:11434';
    attachToWindow(window);
  });

  test('non-ok response: shows error status', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });

    await testConnection();

    const status = document.getElementById('settingsStatus');
    expect(status.textContent).toContain('500');
  });

  test('network error: shows connection error', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

    await testConnection();

    const status = document.getElementById('settingsStatus');
    expect(status.textContent).toContain('ECONNREFUSED');
  });

  test('disallowed URL: shows error without fetching', async () => {
    document.getElementById('ollamaUrl').value = 'http://evil.com:11434';
    const fetchMock = jest.fn();
    globalThis.fetch = fetchMock;

    await testConnection();

    expect(fetchMock).not.toHaveBeenCalled();
    const status = document.getElementById('settingsStatus');
    expect(status.textContent).toContain('no permitida');
  });
});
