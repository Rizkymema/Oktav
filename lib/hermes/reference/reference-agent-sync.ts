import type { HermesAgentDefinition } from '@/lib/hermes/contracts/agent';

type ReferenceAgentProfile = {
  capabilities: string[];
  supportedOutputs?: string[];
};

const REFERENCE_AGENT_PROFILES: Record<string, ReferenceAgentProfile> = {
  'Document Agent': {
    capabilities: [
      'documents',
      'slides',
      'structured-writing',
      'proposal-generation',
      'research-synthesis',
      'memory-assisted-writing',
      'session-search',
      'clarification-driven-planning',
    ],
    supportedOutputs: ['PPTX', 'PDF', 'DOCX', 'Markdown'],
  },
  'Image Agent': {
    capabilities: ['image-generation', 'poster-creation', 'moodboard', 'vision-analysis', 'visual-iteration'],
    supportedOutputs: ['PNG', 'JPG', 'SVG'],
  },
  'Data & Sheets Agent': {
    capabilities: ['data-cleaning', 'sheet-analysis', 'table-reporting', 'web-extraction', 'file-inspection'],
    supportedOutputs: ['XLSX', 'CSV', 'JSON Summary'],
  },
  'Project Builder Agent': {
    capabilities: [
      'frontend-build',
      'code-assembly',
      'project-scaffolding',
      'browser-automation',
      'terminal-execution',
      'delegation',
      'workflow-automation',
      'code-sandbox',
    ],
    supportedOutputs: ['HTML', 'TSX', 'ZIP', 'Source Code (ZIP)', 'React/Tailwind Code'],
  },
  'Video Agent': {
    capabilities: [
      'storyboard',
      'script-writing',
      'subtitle-preparation',
      'video-rendering',
      'voiceover-generation',
      'storyboard-to-video',
    ],
    supportedOutputs: ['MP4', 'MP4 Video', 'Subtitle SRT', 'Markdown Shot List', 'PDF'],
  },
};

const dedupe = (values: string[]) => [...new Set(values)];

export const mergeSeedAgentsWithReferenceProfiles = (
  agents: HermesAgentDefinition[],
): HermesAgentDefinition[] =>
  agents.map((agent) => {
    const profile = REFERENCE_AGENT_PROFILES[agent.name];
    if (!profile) {
      return {
        ...agent,
        source: agent.source ?? 'system',
      };
    }

    return {
      ...agent,
      capabilities: dedupe([...(agent.capabilities ?? []), ...profile.capabilities]),
      supportedOutputs: dedupe([...(agent.supportedOutputs ?? []), ...(profile.supportedOutputs ?? [])]),
      source: 'hybrid',
    };
  });

