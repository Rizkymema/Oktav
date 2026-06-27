import type { HermesAgentDefinition } from '@/lib/hermes/contracts/agent';

export const hermesSeedAgents: HermesAgentDefinition[] = [
  {
    id: 'document-agent',
    name: 'Document Agent',
    capabilities: ['documents', 'slides', 'structured-writing', 'proposal-generation'],
    supportedSkills: ['Slides', 'Documents'],
    supportedOutputs: ['PPTX', 'PDF', 'DOCX', 'Markdown'],
    allowedTools: ['llm.generate_text', 'document.compose_outline', 'document.compose_markdown', 'filesystem.write_artifact'],
    riskProfile: 'low',
  },
  {
    id: 'image-agent',
    name: 'Image Agent',
    capabilities: ['image-generation', 'poster-creation', 'moodboard'],
    supportedSkills: ['Images'],
    supportedOutputs: ['PNG', 'JPG'],
    allowedTools: ['llm.generate_text', 'image.generate_asset', 'filesystem.write_artifact'],
    riskProfile: 'medium',
  },
  {
    id: 'data-sheets-agent',
    name: 'Data & Sheets Agent',
    capabilities: ['data-cleaning', 'sheet-analysis', 'table-reporting'],
    supportedSkills: ['Sheets'],
    supportedOutputs: ['XLSX', 'CSV', 'JSON Summary'],
    allowedTools: ['llm.generate_text', 'sheet.build_dataset', 'filesystem.write_artifact'],
    riskProfile: 'medium',
  },
  {
    id: 'project-builder-agent',
    name: 'Project Builder Agent',
    capabilities: ['frontend-build', 'code-assembly', 'project-scaffolding'],
    supportedSkills: ['Websites'],
    supportedOutputs: ['HTML', 'TSX', 'ZIP'],
    allowedTools: ['llm.generate_text', 'web.build_artifact', 'filesystem.write_artifact', 'task.request_approval'],
    riskProfile: 'high',
  },
  {
    id: 'video-agent',
    name: 'Video Agent',
    capabilities: ['storyboard', 'script-writing', 'subtitle-preparation'],
    supportedSkills: ['Videos'],
    supportedOutputs: ['Markdown Shot List', 'Subtitle SRT', 'PDF'],
    allowedTools: ['llm.generate_text', 'document.compose_markdown', 'image.generate_asset', 'video.generate_mp4', 'filesystem.write_artifact'],
    riskProfile: 'low',
  },
];
