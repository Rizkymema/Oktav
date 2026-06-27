import type { HermesArtifactCapability } from '@/lib/hermes/artifacts/artifact-types';

export type HermesModelSource = 'openai-direct' | 'google-direct' | 'openrouter' | 'virtual';

export interface HermesProviderConfig {
  openRouterApiKey?: string;
  openAiApiKey?: string;
  geminiApiKey?: string;
  googleApiKey?: string;
}

export interface HermesModelDefinition {
  id: string;
  name: string;
  description: string;
  badge?: string;
  source: HermesModelSource;
  capabilities: HermesArtifactCapability[];
  upstreamModel?: string;
}

export interface HermesUiModelOption {
  id: string;
  name: string;
  desc: string;
  badge?: string;
  capabilities: HermesArtifactCapability[];
}
