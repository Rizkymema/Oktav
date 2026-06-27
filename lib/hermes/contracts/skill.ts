export interface HermesSkillDefinition {
  name: string;
  category: 'Content' | 'Research' | 'Coding' | 'Data' | 'Design' | 'Automation' | 'Productivity';
  description: string;
  defaultAgent: string;
  plannerHints: string[];
  requiredTools: string[];
  validationRules: string[];
  outputFormats: string[];
  supportedArtifactIds?: string[];
  examplePrompts: string[];
}
