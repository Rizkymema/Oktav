import path from 'node:path';

import { afterEach, describe, expect, test } from 'vitest';

import {
  getRuntimeDataDir,
  getRuntimeDataPath,
} from '@/lib/hermes/runtime/runtime-paths';

afterEach(() => {
  delete process.env.VERCEL;
  delete process.env.VERCEL_ENV;
});

describe('runtime paths', () => {
  test('uses workspace .tmp outside Vercel runtime', () => {
    expect(getRuntimeDataDir()).toBe(path.join(process.cwd(), '.tmp'));
    expect(getRuntimeDataPath('state.json')).toBe(path.join(process.cwd(), '.tmp', 'state.json'));
  });

  test('uses /tmp on Vercel runtime', () => {
    process.env.VERCEL = '1';

    expect(getRuntimeDataDir()).toBe(path.join('/tmp', 'hermes-runtime'));
    expect(getRuntimeDataPath('state.json')).toBe(path.join('/tmp', 'hermes-runtime', 'state.json'));
  });
});
