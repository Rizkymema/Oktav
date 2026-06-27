import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import type { HermesSkillDefinition } from '@/lib/hermes/contracts/skill';
import { getHermesReferenceSearchRoots } from '@/lib/hermes/reference/reference-config';
import type { Skill } from '@/lib/workspace/types';

const CATEGORY_MAP: Record<string, Skill['category']> = {
  apple: 'Productivity',
  'autonomous-ai-agents': 'Coding',
  creative: 'Design',
  communication: 'Productivity',
  devops: 'Automation',
  productivity: 'Productivity',
  'software-development': 'Coding',
  github: 'Coding',
  email: 'Productivity',
  'data-science': 'Data',
  research: 'Research',
  blockchain: 'Coding',
  mlops: 'Coding',
  'note-taking': 'Productivity',
  media: 'Content',
  'social-media': 'Content',
  'smart-home': 'Automation',
  dogfood: 'Productivity',
  yuanbao: 'Productivity',
};

const CATEGORY_RUNTIME_CONFIG: Record<
  Skill['category'],
  Pick<
    HermesSkillDefinition,
    'defaultAgent' | 'requiredTools' | 'validationRules' | 'outputFormats' | 'supportedArtifactIds'
  >
> = {
  Coding: {
    defaultAgent: 'Project Builder Agent',
    requiredTools: ['llm.generate_text', 'web.build_artifact', 'filesystem.write_artifact'],
    validationRules: ['source_required', 'artifact_required'],
    outputFormats: ['HTML', 'Source Code (ZIP)', 'React/Tailwind Code'],
    supportedArtifactIds: ['html', 'zip'],
  },
  Content: {
    defaultAgent: 'Document Agent',
    requiredTools: ['llm.generate_text', 'document.compose_markdown', 'filesystem.write_artifact'],
    validationRules: ['content_required', 'artifact_required'],
    outputFormats: ['DOCX', 'PDF', 'Markdown'],
    supportedArtifactIds: ['docx', 'pdf', 'md'],
  },
  Research: {
    defaultAgent: 'Document Agent',
    requiredTools: ['llm.generate_text', 'document.compose_markdown', 'filesystem.write_artifact'],
    validationRules: ['content_required'],
    outputFormats: ['Markdown', 'PDF'],
    supportedArtifactIds: ['md', 'pdf'],
  },
  Data: {
    defaultAgent: 'Data & Sheets Agent',
    requiredTools: ['llm.generate_text', 'sheet.build_dataset', 'filesystem.write_artifact'],
    validationRules: ['table_rows_required', 'artifact_required'],
    outputFormats: ['XLSX', 'CSV', 'JSON Summary'],
    supportedArtifactIds: ['xlsx', 'csv'],
  },
  Design: {
    defaultAgent: 'Image Agent',
    requiredTools: ['llm.generate_text', 'image.generate_asset', 'filesystem.write_artifact'],
    validationRules: ['artifact_required'],
    outputFormats: ['PNG', 'JPG', 'SVG'],
    supportedArtifactIds: ['png', 'jpg', 'svg'],
  },
  Automation: {
    defaultAgent: 'Project Builder Agent',
    requiredTools: ['llm.generate_text', 'web.build_artifact', 'filesystem.write_artifact'],
    validationRules: ['artifact_required'],
    outputFormats: ['Markdown', 'HTML', 'ZIP'],
    supportedArtifactIds: ['md', 'html', 'zip'],
  },
  Productivity: {
    defaultAgent: 'Document Agent',
    requiredTools: ['llm.generate_text', 'document.compose_markdown', 'filesystem.write_artifact'],
    validationRules: ['content_required'],
    outputFormats: ['Markdown', 'PDF'],
    supportedArtifactIds: ['md', 'pdf'],
  },
};

const toWorkspaceCategory = (rawCategory: string): Skill['category'] =>
  CATEGORY_MAP[rawCategory] ?? 'Productivity';

const extractDescriptionSync = (skillFilePath: string) => {
  try {
    const content = readFileSync(skillFilePath, 'utf8');
    const lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => !line.startsWith('#') && !line.startsWith('---') && !line.startsWith('<'));

    return lines[0] ?? 'Skill referensi dari Hermes Agent.';
  } catch {
    return 'Skill referensi dari Hermes Agent.';
  }
};

const collectSkillFilesSync = (root: string): string[] => {
  try {
    const entries = readdirSync(root, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const entryPath = path.join(root, entry.name);
      if (entry.isDirectory()) {
        files.push(...collectSkillFilesSync(entryPath));
        continue;
      }

      if (entry.isFile() && entry.name === 'SKILL.md') {
        files.push(entryPath);
      }
    }

    return files;
  } catch {
    return [];
  }
};

export const listReferenceWorkspaceSkillsSync = (): Skill[] => {
  const { referenceRoot, skillsRoot, optionalSkillsRoot } = getHermesReferenceSearchRoots();
  const skillFiles = [...collectSkillFilesSync(skillsRoot), ...collectSkillFilesSync(optionalSkillsRoot)];

  const uniqueByName = new Map<string, Skill>();
  for (const skillFilePath of skillFiles) {
    const relative = path.relative(referenceRoot, skillFilePath);
    const parts = relative.split(path.sep);
    const categoryFolder = parts[1] ?? 'productivity';
    const skillName = parts[2] ?? path.basename(path.dirname(skillFilePath));

    if (uniqueByName.has(skillName)) {
      continue;
    }

    uniqueByName.set(skillName, {
      name: skillName,
      description: extractDescriptionSync(skillFilePath),
      category: toWorkspaceCategory(categoryFolder),
      agent: 'Hermes Reference',
      supportedInputs: ['Prompt'],
      supportedOutputs: ['Guidance'],
      requiredTools: ['Hermes reference'],
      examplePrompts: [],
      limitations: ['Referensi skill dari repo Hermes lokal, bukan runtime langsung.'],
      estimatedCredits: 1,
      installed: false,
      source: 'hermes-reference',
    });
  }

  return [...uniqueByName.values()].sort((left, right) => left.name.localeCompare(right.name));
};

export const createReferenceSkillDefinition = (skill: Skill): HermesSkillDefinition => {
  const runtimeConfig = CATEGORY_RUNTIME_CONFIG[skill.category];

  return {
    name: skill.name,
    category: skill.category,
    description: skill.description,
    defaultAgent: runtimeConfig.defaultAgent,
    plannerHints: [
      `Gunakan pendekatan ${skill.category.toLowerCase()} untuk menyelesaikan permintaan pengguna.`,
      `Prioritaskan workflow skill ${skill.name}.`,
    ],
    requiredTools: runtimeConfig.requiredTools,
    validationRules: runtimeConfig.validationRules,
    outputFormats: runtimeConfig.outputFormats,
    supportedArtifactIds: runtimeConfig.supportedArtifactIds,
    examplePrompts: skill.examplePrompts,
  };
};

export const getReferenceSkillDefinitionByName = (name: string) => {
  const skill = listReferenceWorkspaceSkillsSync().find((entry) => entry.name === name);
  return skill ? createReferenceSkillDefinition(skill) : undefined;
};
