import { afterEach, describe, expect, test, vi } from 'vitest';

describe('Hermes reference config', () => {
  const originalRoot = process.env.HERMES_REFERENCE_ROOT;

  afterEach(() => {
    if (originalRoot === undefined) {
      delete process.env.HERMES_REFERENCE_ROOT;
    } else {
      process.env.HERMES_REFERENCE_ROOT = originalRoot;
    }
    vi.resetModules();
  });

  test('uses env override when HERMES_REFERENCE_ROOT is provided', async () => {
    process.env.HERMES_REFERENCE_ROOT = 'E:\\custom\\hermes-reference';
    const { resolveHermesReferenceRoot } = await import('@/lib/hermes/reference/reference-config');

    expect(resolveHermesReferenceRoot()).toBe('E:\\custom\\hermes-reference');
  });

  test('falls back to local Hermes repository path when env is empty', async () => {
    process.env.HERMES_REFERENCE_ROOT = '   ';
    const { resolveHermesReferenceRoot } = await import('@/lib/hermes/reference/reference-config');

    expect(resolveHermesReferenceRoot()).toBe('D:\\Project Apk-Web\\hermesagentai\\hermes-agent-main');
  });
});
