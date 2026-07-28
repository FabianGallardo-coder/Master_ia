// Injects the `jest` global into ESM (.mjs) test files so they can call
// jest.useFakeTimers() etc. without an explicit import.

import { jest } from '@jest/globals';

if (typeof globalThis.jest === 'undefined') {
  globalThis.jest = jest;
}