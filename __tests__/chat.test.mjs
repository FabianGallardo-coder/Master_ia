// Tests for app.mjs chat functions: sendMessage, checkOllama, addMessage, stopChat.

import { sendMessage, checkOllama, stopChat, attachToWindow } from '../app.mjs';
import { setupDom } from './helpers/setupDom';

describe('Chat (app.mjs)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupDom(['chatInput','chatMessages','sendBtn','stopBtn','ollamaStatus','ollamaText']);
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

  test('TC-13: sendMessage shows a typing indicator while fetching and removes it on response', async () => {
    // First call: checkOllama models endpoint. Second call: /api/generate.
    const fetchMock = jest.fn();
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ models: [] }) });
    fetchMock.mockResolvedValue({ json: async () => ({ response: 'Listo.' }) });
    globalThis.fetch = fetchMock;
    await checkOllama();

    document.getElementById('chatInput').value = 'Pregunta';
    const p = sendMessage();

    // Synchronously, the typing indicator should already be in the DOM.
    const typing = document.querySelector('#chatMessages .message.typing');
    expect(typing).not.toBeNull();
    expect(typing.querySelector('.typing-dots')).not.toBeNull();
    expect(document.getElementById('sendBtn').disabled).toBe(true);
    expect(document.getElementById('stopBtn').hidden).toBe(false);

    await p;

    expect(document.querySelector('#chatMessages .message.typing')).toBeNull();
    const last = document.querySelector('#chatMessages .message:last-child');
    expect(last.classList.contains('assistant')).toBe(true);
    expect(last.querySelector('.message-content').textContent).toBe('Listo.');
    expect(document.getElementById('sendBtn').disabled).toBe(false);
    expect(document.getElementById('stopBtn').hidden).toBe(true);
  });

  test('TC-14: stopChat aborts the in-flight request and surfaces a "Generación detenida." message', async () => {
    const fetchMock = jest.fn();
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ models: [] }) });
    // /api/generate returns a promise we resolve manually so the test can abort it.
    let resolveGen;
    fetchMock.mockImplementationOnce(() => new Promise(res => { resolveGen = res; }));
    globalThis.fetch = fetchMock;
    await checkOllama();

    document.getElementById('chatInput').value = 'Largo';
    const p = sendMessage();

    // Indicator is up, request is in flight.
    expect(document.querySelector('#chatMessages .message.typing')).not.toBeNull();

    stopChat();
    // Manually resolve the (already-aborted) fetch to let the catch run.
    resolveGen({ json: async () => ({ response: '' }) });
    await p;

    expect(document.querySelector('#chatMessages .message.typing')).toBeNull();
    const last = document.querySelector('#chatMessages .message:last-child');
    expect(last.classList.contains('assistant')).toBe(true);
    expect(last.querySelector('.message-content').textContent).toBe('Generación detenida.');
    expect(document.getElementById('sendBtn').disabled).toBe(false);
    expect(document.getElementById('stopBtn').hidden).toBe(true);
  });
});