// Tests for app.mjs isAllowedOllamaUrl allowlist.

import { isAllowedOllamaUrl } from '../app.mjs';

describe('isAllowedOllamaUrl (app.mjs)', () => {
  test('accepts http://localhost:11434', () => {
    expect(isAllowedOllamaUrl('http://localhost:11434')).toBe(true);
  });

  test('accepts http://127.0.0.1:11434', () => {
    expect(isAllowedOllamaUrl('http://127.0.0.1:11434')).toBe(true);
  });

  test('accepts http://[::1]:11434', () => {
    expect(isAllowedOllamaUrl('http://[::1]:11434')).toBe(true);
  });

  test('accepts https on loopback', () => {
    expect(isAllowedOllamaUrl('https://localhost:11434')).toBe(true);
  });

  test('rejects non-loopback hostname', () => {
    expect(isAllowedOllamaUrl('http://evil.com:11434')).toBe(false);
    expect(isAllowedOllamaUrl('https://api.example.com')).toBe(false);
  });

  test('rejects non-http(s) protocols', () => {
    expect(isAllowedOllamaUrl('ftp://localhost:11434')).toBe(false);
    expect(isAllowedOllamaUrl('file:///etc/passwd')).toBe(false);
    expect(isAllowedOllamaUrl('javascript:alert(1)')).toBe(false);
  });

  test('rejects 0.0.0.0 (binds all interfaces)', () => {
    expect(isAllowedOllamaUrl('http://0.0.0.0:11434')).toBe(false);
  });

  test('rejects malformed input', () => {
    expect(isAllowedOllamaUrl('')).toBe(false);
    expect(isAllowedOllamaUrl(null)).toBe(false);
    expect(isAllowedOllamaUrl(undefined)).toBe(false);
    expect(isAllowedOllamaUrl(123)).toBe(false);
    expect(isAllowedOllamaUrl('not a url')).toBe(false);
  });
});
