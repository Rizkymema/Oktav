import fs from 'node:fs';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, test } from 'vitest';

const stateFiles = [
  path.join(process.cwd(), '.tmp', 'hermes-projects-state.json'),
  path.join(process.cwd(), '.tmp', 'hermes-notifications-state.json'),
  path.join(process.cwd(), '.tmp', 'hermes-channels-state.json'),
];

const cleanupStateFiles = () => {
  for (const filePath of stateFiles) {
    try {
      fs.unlinkSync(filePath);
    } catch {}
  }
};

beforeEach(() => {
  cleanupStateFiles();
});

afterEach(() => {
  cleanupStateFiles();
});

describe('StatePersistence', () => {
  test('defaults to empty persisted collections instead of mock workspace data', async () => {
    const { StatePersistence } = await import('@/lib/hermes/runtime/state-persistence');

    expect(StatePersistence.loadProjects()).toEqual([]);
    expect(StatePersistence.loadNotifications()).toEqual([]);
    expect(StatePersistence.loadChannels()).toEqual([]);
  });
});
