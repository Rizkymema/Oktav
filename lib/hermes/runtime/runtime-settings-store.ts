import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { getRuntimeDataPath } from '@/lib/hermes/runtime/runtime-paths';

export type HermesExecutionMode = 'auto' | 'native' | 'reference';

export interface HermesRuntimeSettingsSnapshot {
  model?: string;
  installedReferenceSkillNames: string[];
  executionMode: HermesExecutionMode;
  toolEnabledState: Record<string, boolean>;
}

const DEFAULT_SETTINGS_PATH = getRuntimeDataPath('hermes-runtime-settings.json');

const resolveDefaultSettingsPath = () => {
  if (process.env.NODE_ENV === 'test') {
    return path.join(process.cwd(), '.tmp', `hermes-runtime-settings-test-${randomUUID()}.json`);
  }

  return DEFAULT_SETTINGS_PATH;
};

const DEFAULT_SETTINGS: HermesRuntimeSettingsSnapshot = {
  installedReferenceSkillNames: [],
  executionMode: 'auto',
  toolEnabledState: {},
};

export class RuntimeSettingsStore {
  constructor(private readonly settingsPath = resolveDefaultSettingsPath()) {}

  load(): HermesRuntimeSettingsSnapshot {
    try {
      if (!existsSync(this.settingsPath)) {
        return { ...DEFAULT_SETTINGS };
      }

      const raw = readFileSync(this.settingsPath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<HermesRuntimeSettingsSnapshot>;

      return {
        model: parsed.model,
        installedReferenceSkillNames: parsed.installedReferenceSkillNames ?? [],
        executionMode: parsed.executionMode ?? 'auto',
        toolEnabledState: parsed.toolEnabledState ?? {},
      };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  save(snapshot: HermesRuntimeSettingsSnapshot) {
    mkdirSync(path.dirname(this.settingsPath), { recursive: true });
    writeFileSync(this.settingsPath, JSON.stringify(snapshot, null, 2), 'utf8');
  }
}
