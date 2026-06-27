import { WorkspaceAdapter } from '@/lib/hermes/adapters/workspace-adapter';
import type { HermesRuntime } from '@/lib/hermes/index';
import { getReferenceSkillDefinitionByName } from '@/lib/hermes/reference/reference-skill-sync';
import type { HermesExecutionMode } from '@/lib/hermes/runtime/runtime-settings-store';
import { HermesReferenceCatalog } from '@/lib/hermes/reference/hermes-reference-catalog';
import type { Skill } from '@/lib/workspace/types';

type ControlActionInput =
  | { action: 'toggle_tool'; name: string; enabled: boolean }
  | { action: 'install_skill'; identifier: string }
  | { action: 'uninstall_skill'; name: string }
  | { action: 'update_model'; provider?: string; model: string }
  | { action: 'update_execution_mode'; mode: HermesExecutionMode };

type ControlSkill = Skill & {
  installed: boolean;
  source: 'system' | 'hermes-reference';
};

export class HermesControlService {
  private readonly adapter = new WorkspaceAdapter();
  private readonly referenceCatalog = new HermesReferenceCatalog();

  constructor(private readonly runtime: HermesRuntime) {}

  async getControlState() {
    const runtimeSkills: ControlSkill[] = this.runtime.skillRegistry.list().map((skill) => ({
      ...this.adapter.toWorkspaceSkill(skill),
      installed: true,
      source: this.runtime.installedReferenceSkillNames.has(skill.name)
        ? ('hermes-reference' as const)
        : ('system' as const),
    }));

    const referenceSkills = await this.referenceCatalog.listSkills();
    const mergedSkills: ControlSkill[] = [...runtimeSkills];

    for (const referenceSkill of referenceSkills) {
      if (mergedSkills.some((skill) => skill.name === referenceSkill.name)) {
        continue;
      }

      mergedSkills.push({
        ...referenceSkill,
        installed: this.runtime.installedReferenceSkillNames.has(referenceSkill.name),
        source: 'hermes-reference',
      });
    }

    return {
      warning: '',
      tools: this.runtime.toolRegistry.list().map((tool) => this.adapter.toWorkspaceTool(tool)),
      skills: mergedSkills,
    };
  }

  async handleAction(input: ControlActionInput) {
    switch (input.action) {
      case 'toggle_tool':
        this.runtime.toolRegistry.setEnabled(input.name, input.enabled);
        this.persistRuntimeSettings();
        return { ok: true };
      case 'install_skill': {
        const definition = getReferenceSkillDefinitionByName(input.identifier);
        if (!definition) {
          throw new Error(`Skill referensi ${input.identifier} tidak ditemukan.`);
        }

        this.runtime.installedReferenceSkillNames.add(input.identifier);
        this.runtime.skillRegistry.register(definition);
        this.persistRuntimeSettings();
        return { ok: true };
      }
      case 'uninstall_skill':
        this.runtime.installedReferenceSkillNames.delete(input.name);
        this.runtime.skillRegistry.unregister(input.name);
        this.persistRuntimeSettings();
        return { ok: true };
      case 'update_model':
        this.runtime.model = input.model;
        this.persistRuntimeSettings();
        return { ok: true };
      case 'update_execution_mode':
        this.runtime.executionMode = input.mode;
        this.persistRuntimeSettings();
        return { ok: true };
      default:
        throw new Error('Aksi control tidak didukung.');
    }
  }

  private persistRuntimeSettings() {
    this.runtime.settingsStore.save({
      model: this.runtime.model,
      installedReferenceSkillNames: [...this.runtime.installedReferenceSkillNames].sort(),
      executionMode: this.runtime.executionMode,
      toolEnabledState: this.runtime.toolRegistry.getEnabledState(),
    });
  }
}
