// Tests for app.mjs chat functions: sendMessage, checkOllama, addMessage.

import { sendMessage, checkOllama, attachToWindow } from '../app.mjs';
import { setupDom } from './helpers/setupDom';

describe('Chat (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom(['chatInput','chatMessages','sendBtn','ollamaStatus','ollamaText']);
    attachToWindow(window);
  });

  test('TC-11: sendMessage posts to /api/generate and adds user + assistant messages', async () => {
    const fetchMock = jest.fn();
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ models: [] }) });
    fetchMock.mockResolvedValue({ json: async () => ({ response: 'Hola!' }) });
    globalThis.fetch = fetchMock;
    await checkOllama();

    document.getElementById('chatInput').value = 'Hola';
    await sendMessage();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, opts] = fetchMock.mock.calls[1];
    expect(url.endsWith('/api/generate')).toBe(true);
    expect(opts.method).toBe('POST');
    const body = JSON.parse(opts.body);
    expect(body.prompt).toBe('Hola');
    expect(body.stream).toBe(false);

    // Real DOM assertions: chatMessages should contain two children
    const msgs = document.getElementById('chatMessages').querySelectorAll('.message');
    expect(msgs.length).toBe(2);
    expect(msgs[0].classList.contains('user')).toBe(true);
    expect(msgs[0].querySelector('.message-content').textContent).toBe('Hola');
    expect(msgs[1].classList.contains('assistant')).toBe(true);
    expect(msgs[1].querySelector('.message-content').textContent).toBe('Hola!');
  });

  test('TC-12: sendMessage does not call fetch when Ollama is unavailable', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: false });
    await checkOllama();
    const fetchMock = jest.fn();
    globalThis.fetch = fetchMock;

    document.getElementById('chatInput').value = 'Hola';
    await sendMessage();

    expect(fetchMock).not.toHaveBeenCalled();

    const msgs = document.getElementById('chatMessages').querySelectorAll('.message');
    expect(msgs.length).toBe(2);
    expect(msgs[1].classList.contains('assistant')).toBe(true);
    expect(msgs[1].querySelector('.message-content').textContent).toMatch(/Ollama no est/);
  });
});