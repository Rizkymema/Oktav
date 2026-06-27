export interface HermesAgentDefinition {
  id: string;
  name: string;
  capabilities: string[];
  supportedSkills: string[];
  supportedOutputs: string[];
  allowedTools: string[];
  riskProfile: 'low' | 'medium' | 'high';
  source?: 'system' | 'hermes-reference' | 'hybrid';
}
