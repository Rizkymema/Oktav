export type HermesArtifactCapability =
  | 'chat'
  | 'document'
  | 'presentation'
  | 'spreadsheet'
  | 'image'
  | 'video'
  | 'web';

export interface HermesArtifactDefinition {
  id: string;
  label: string;
  extensions: string[];
  capability: HermesArtifactCapability;
  defaultSkill: string;
  defaultAgent: string;
  artifactInstructions: string;
  preferredModelTags: string[];
}
