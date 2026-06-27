import path from 'node:path';

const DEFAULT_HERMES_REFERENCE_ROOT = 'D:\\Project Apk-Web\\hermesagentai\\hermes-agent-main';

const normalizeEnvPath = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? path.normalize(trimmed) : undefined;
};

export const resolveHermesReferenceRoot = () =>
  normalizeEnvPath(process.env.HERMES_REFERENCE_ROOT) ?? DEFAULT_HERMES_REFERENCE_ROOT;

export const getHermesReferenceSearchRoots = () => {
  const referenceRoot = resolveHermesReferenceRoot();

  return {
    referenceRoot,
    skillsRoot: path.join(referenceRoot, 'skills'),
    optionalSkillsRoot: path.join(referenceRoot, 'optional-skills'),
    toolsRoot: path.join(referenceRoot, 'tools'),
  };
};

export { DEFAULT_HERMES_REFERENCE_ROOT };
