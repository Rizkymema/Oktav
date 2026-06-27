import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import type { Skill } from '@/lib/workspace/types';
import { getHermesReferenceSearchRoots } from '@/lib/hermes/reference/reference-config';

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
};

const toWorkspaceCategory = (rawCategory: string): Skill['category'] =>
  CATEGORY_MAP[rawCategory] ?? 'Productivity';

const extractDescription = async (skillFilePath: string) => {
  try {
    const content = await readFile(skillFilePath, 'utf8');
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

const collectSkillFiles = async (root: string): Promise<string[]> => {
  const entries = await readdir(root, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectSkillFiles(entryPath)));
      continue;
    }

    if (entry.isFile() && entry.name === 'SKILL.md') {
      files.push(entryPath);
    }
  }

  return files;
};

export class HermesReferenceCatalog {
  async listSkills(): Promise<Skill[]> {
    const { referenceRoot, skillsRoot, optionalSkillsRoot } = getHermesReferenceSearchRoots();
    const roots = [skillsRoot, optionalSkillsRoot];

    const skillFiles = (await Promise.all(roots.map((root) => collectSkillFiles(root).catch(() => [])))).flat();
    const mapped = await Promise.all(
      skillFiles.map(async (skillFilePath) => {
        const relative = path.relative(referenceRoot, skillFilePath);
        const parts = relative.split(path.sep);
        const categoryFolder = parts[1] ?? 'productivity';
        const skillName = parts[2] ?? path.basename(path.dirname(skillFilePath));

        return {
          name: skillName,
          description: await extractDescription(skillFilePath),
          category: toWorkspaceCategory(categoryFolder),
          agent: 'Hermes Reference',
          supportedInputs: ['Prompt'],
          supportedOutputs: ['Guidance'],
          requiredTools: ['Hermes reference'],
          examplePrompts: [],
          limitations: ['Referensi skill dari repo Hermes lokal, bukan runtime langsung.'],
          estimatedCredits: 1,
          installed: false,
          source: 'hermes-reference' as const,
        } satisfies Skill;
      }),
    );

    const uniqueByName = new Map<string, Skill>();
    for (const skill of mapped) {
      if (!uniqueByName.has(skill.name)) {
        uniqueByName.set(skill.name, skill);
      }
    }

    return [...uniqueByName.values()].sort((left, right) => left.name.localeCompare(right.name));
  }
}
