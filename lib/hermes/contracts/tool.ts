export type HermesToolRiskLevel = 'safe' | 'guarded' | 'dangerous';

export interface HermesToolDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  enabled: boolean;
  riskLevel: HermesToolRiskLevel;
  requiresApproval: boolean;
  aliases?: string[];
  capabilities?: string[];
  source?: 'system' | 'hermes-reference' | 'hybrid';
  referenceModules?: string[];
  referenceToolsets?: string[];
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}
