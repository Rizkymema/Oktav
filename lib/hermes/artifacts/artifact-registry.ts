import type { HermesArtifactDefinition } from '@/lib/hermes/artifacts/artifact-types';

const HERMES_ARTIFACT_TYPES: HermesArtifactDefinition[] = [
  {
    id: 'pptx',
    label: 'PowerPoint Presentation',
    extensions: ['.pptx'],
    capability: 'presentation',
    defaultSkill: 'Slides',
    defaultAgent: 'Document Agent',
    artifactInstructions: 'Buat presentasi yang dapat dibuka sebagai file PPTX final.',
    preferredModelTags: ['presentation', 'document'],
  },
  {
    id: 'pdf',
    label: 'PDF Document',
    extensions: ['.pdf'],
    capability: 'document',
    defaultSkill: 'Documents',
    defaultAgent: 'Document Agent',
    artifactInstructions: 'Buat dokumen final dalam format PDF yang siap dibagikan.',
    preferredModelTags: ['document'],
  },
  {
    id: 'docx',
    label: 'Word Document',
    extensions: ['.docx'],
    capability: 'document',
    defaultSkill: 'Documents',
    defaultAgent: 'Document Agent',
    artifactInstructions: 'Buat dokumen Word terstruktur dengan heading dan isi lengkap.',
    preferredModelTags: ['document'],
  },
  {
    id: 'xlsx',
    label: 'Excel Workbook',
    extensions: ['.xlsx'],
    capability: 'spreadsheet',
    defaultSkill: 'Sheets',
    defaultAgent: 'Data & Sheets Agent',
    artifactInstructions: 'Buat workbook spreadsheet final dengan tabel yang rapi.',
    preferredModelTags: ['spreadsheet', 'data'],
  },
  {
    id: 'csv',
    label: 'CSV Dataset',
    extensions: ['.csv'],
    capability: 'spreadsheet',
    defaultSkill: 'Sheets',
    defaultAgent: 'Data & Sheets Agent',
    artifactInstructions: 'Buat dataset CSV final yang dapat langsung diimpor.',
    preferredModelTags: ['spreadsheet', 'data'],
  },
  {
    id: 'png',
    label: 'PNG Image',
    extensions: ['.png'],
    capability: 'image',
    defaultSkill: 'Images',
    defaultAgent: 'Image Agent',
    artifactInstructions: 'Buat gambar final dalam format PNG resolusi tinggi.',
    preferredModelTags: ['image', 'visual'],
  },
  {
    id: 'jpg',
    label: 'JPG Image',
    extensions: ['.jpg', '.jpeg'],
    capability: 'image',
    defaultSkill: 'Images',
    defaultAgent: 'Image Agent',
    artifactInstructions: 'Buat foto atau visual final dalam format JPG.',
    preferredModelTags: ['image', 'visual'],
  },
  {
    id: 'svg',
    label: 'SVG Graphic',
    extensions: ['.svg'],
    capability: 'image',
    defaultSkill: 'Images',
    defaultAgent: 'Image Agent',
    artifactInstructions: 'Buat graphic vector final dalam format SVG.',
    preferredModelTags: ['image', 'vector'],
  },
  {
    id: 'mp4',
    label: 'MP4 Video',
    extensions: ['.mp4'],
    capability: 'video',
    defaultSkill: 'Videos',
    defaultAgent: 'Video Agent',
    artifactInstructions: 'Buat video final dalam format MP4 bila engine video tersedia.',
    preferredModelTags: ['video'],
  },
  {
    id: 'html',
    label: 'HTML Website',
    extensions: ['.html'],
    capability: 'web',
    defaultSkill: 'Websites',
    defaultAgent: 'Project Builder Agent',
    artifactInstructions: 'Buat halaman web final dalam format HTML.',
    preferredModelTags: ['web', 'frontend'],
  },
  {
    id: 'md',
    label: 'Markdown Document',
    extensions: ['.md'],
    capability: 'document',
    defaultSkill: 'Documents',
    defaultAgent: 'Document Agent',
    artifactInstructions: 'Buat dokumen markdown yang rapi dan siap pakai.',
    preferredModelTags: ['document'],
  },
  {
    id: 'zip',
    label: 'ZIP Package',
    extensions: ['.zip'],
    capability: 'web',
    defaultSkill: 'Websites',
    defaultAgent: 'Project Builder Agent',
    artifactInstructions: 'Bungkus hasil akhir sebagai paket ZIP bila terdiri dari banyak file.',
    preferredModelTags: ['package', 'web'],
  },
];

const PROMPT_RULES: Array<{ pattern: RegExp; artifactId: string }> = [
  { pattern: /\b(ppt|pptx|slide|slides|presentasi|pitch deck|deck)\b/i, artifactId: 'pptx' },
  { pattern: /\bpdf\b/i, artifactId: 'pdf' },
  { pattern: /\b(docx|word|dokumen)\b/i, artifactId: 'docx' },
  { pattern: /\b(xlsx|excel|spreadsheet|sheet)\b/i, artifactId: 'xlsx' },
  { pattern: /\bcsv\b/i, artifactId: 'csv' },
  { pattern: /\b(png|poster|image|gambar|foto|photo)\b/i, artifactId: 'png' },
  { pattern: /\b(jpg|jpeg)\b/i, artifactId: 'jpg' },
  { pattern: /\b(svg|vector)\b/i, artifactId: 'svg' },
  { pattern: /\b(mp4|video|reel)\b/i, artifactId: 'mp4' },
  { pattern: /\b(html|website|landing page|web)\b/i, artifactId: 'html' },
  { pattern: /\b(zip|source code|paket)\b/i, artifactId: 'zip' },
];

const SKILL_DEFAULTS: Record<string, string> = {
  Slides: 'pptx',
  Documents: 'pdf',
  Images: 'png',
  Sheets: 'xlsx',
  Websites: 'html',
  Videos: 'mp4',
};

export const createArtifactRegistry = () => {
  const definitions = [...HERMES_ARTIFACT_TYPES];

  const getById = (artifactId?: string | null) =>
    definitions.find((artifact) => artifact.id === artifactId?.toLowerCase());

  const getByExtension = (extension?: string | null) =>
    definitions.find((artifact) =>
      artifact.extensions.includes((extension ?? '').toLowerCase()),
    );

  const inferFromSkill = (skillName?: string | null) => {
    const artifactId = skillName ? SKILL_DEFAULTS[skillName] : undefined;
    return getById(artifactId);
  };

  const inferFromPrompt = (prompt: string) => {
    const rule = PROMPT_RULES.find(({ pattern }) => pattern.test(prompt));
    return rule ? getById(rule.artifactId) : undefined;
  };

  const resolve = (input: {
    outputType?: string | null;
    selectedSkill?: string | null;
    prompt?: string | null;
  }): HermesArtifactDefinition => {
    return (
      getById(input.outputType) ??
      inferFromSkill(input.selectedSkill) ??
      inferFromPrompt(input.prompt ?? '') ??
      getById('pdf') ??
      definitions[0]
    );
  };

  return {
    list: () => definitions,
    getById,
    getByExtension,
    inferFromSkill,
    inferFromPrompt,
    resolve,
  };
};
