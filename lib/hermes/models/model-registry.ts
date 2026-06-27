import type {
  HermesModelDefinition,
  HermesProviderConfig,
  HermesUiModelOption,
} from '@/lib/hermes/models/model-types';
import type { HermesArtifactCapability } from '@/lib/hermes/artifacts/artifact-types';

const hasRealKey = (value?: string) =>
  Boolean(value && !value.includes('MASUKKAN_') && value.trim().length > 0);

const HERMES_MODEL_CATALOG: HermesModelDefinition[] = [
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    description: 'Model flagship serbaguna untuk dokumen, slide, dan web.',
    badge: 'Direct',
    source: 'openai-direct',
    upstreamModel: 'gpt-4o',
    capabilities: ['chat', 'document', 'presentation', 'spreadsheet', 'web'],
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Model cepat untuk drafting dan automasi ringan.',
    badge: 'Direct',
    source: 'openai-direct',
    upstreamModel: 'gpt-4o-mini',
    capabilities: ['chat', 'document', 'spreadsheet', 'web'],
  },
  {
    id: 'openai/gpt-image-1',
    name: 'GPT Image 1',
    description: 'Model generasi visual untuk poster, foto, dan image artifact.',
    badge: 'Image',
    source: 'openai-direct',
    upstreamModel: 'gpt-image-1',
    capabilities: ['image'],
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Model cepat untuk drafting, analisis, dan dokumen umum.',
    badge: 'Direct',
    source: 'google-direct',
    upstreamModel: 'gemini-2.5-flash',
    capabilities: ['chat', 'document', 'spreadsheet', 'web'],
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Model reasoning dan penulisan kuat via OpenRouter.',
    badge: 'OpenRouter',
    source: 'openrouter',
    upstreamModel: 'anthropic/claude-3.5-sonnet',
    capabilities: ['chat', 'document', 'presentation', 'spreadsheet', 'web'],
  },
  {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1',
    description: 'Model reasoning untuk planning dan logika kompleks via OpenRouter.',
    badge: 'OpenRouter',
    source: 'openrouter',
    upstreamModel: 'deepseek/deepseek-r1',
    capabilities: ['chat', 'document', 'spreadsheet', 'web'],
  },
  {
    id: 'openai/gpt-4o-router',
    name: 'GPT-4o via OpenRouter',
    description: 'Fallback GPT-4o lewat OpenRouter bila direct tidak dipilih.',
    badge: 'OpenRouter',
    source: 'openrouter',
    upstreamModel: 'openai/gpt-4o',
    capabilities: ['chat', 'document', 'presentation', 'spreadsheet', 'web'],
  },
];

const AUTO_MODEL: HermesUiModelOption = {
  id: 'auto',
  name: 'Auto Model',
  desc: 'Pilih model terbaik berdasarkan format output dan provider aktif.',
  badge: 'Recommended',
  capabilities: ['chat', 'document', 'presentation', 'spreadsheet', 'image', 'video', 'web'],
};

export const createModelRegistry = (config: HermesProviderConfig) => {
  const availableSources = {
    openrouter: hasRealKey(config.openRouterApiKey),
    openai: hasRealKey(config.openAiApiKey),
    google: hasRealKey(config.geminiApiKey) || hasRealKey(config.googleApiKey),
  };

  const availableModels = HERMES_MODEL_CATALOG.filter((model) => {
    if (model.source === 'openai-direct') {
      return availableSources.openai;
    }

    if (model.source === 'google-direct') {
      return availableSources.google;
    }

    if (model.source === 'openrouter') {
      return availableSources.openrouter;
    }

    return true;
  });

  const listForCapability = (capability: HermesArtifactCapability) =>
    availableModels.filter((model) => model.capabilities.includes(capability));

  const listForUi = (): HermesUiModelOption[] => [
    AUTO_MODEL,
    ...availableModels.map((model) => ({
      id: model.id,
      name: model.name,
      desc: model.description,
      badge: model.badge,
      capabilities: model.capabilities,
    })),
  ];

  const resolveModel = (input: {
    requestedModelId?: string | null;
    capability: HermesArtifactCapability;
  }): HermesModelDefinition | undefined => {
    const requestedId = input.requestedModelId?.trim();
    const compatibleModels = listForCapability(input.capability);

    if (requestedId && requestedId !== 'auto' && compatibleModels.some((model) => model.id === requestedId)) {
      return compatibleModels.find((model) => model.id === requestedId);
    }

    const preferenceOrder: HermesArtifactCapability[] = [
      input.capability,
      'document',
      'chat',
    ];

    for (const preferredCapability of preferenceOrder) {
      const preferred = availableModels.find((model) => model.capabilities.includes(preferredCapability));
      if (preferred) {
        if (preferredCapability === input.capability || input.capability === 'video') {
          return preferred;
        }
      }
    }

    return compatibleModels[0] ?? availableModels[0];
  };

  return {
    listAll: () => availableModels,
    listForCapability,
    listForUi,
    resolveModel,
  };
};
