import { existsSync } from 'node:fs';
import path from 'node:path';

import type { HermesToolDefinition } from '@/lib/hermes/contracts/tool';
import { getHermesReferenceSearchRoots } from '@/lib/hermes/reference/reference-config';

type ReferenceToolCatalogEntry = {
  localToolId: string;
  capabilities: string[];
  referenceModules: string[];
  referenceToolNames: string[];
  referenceToolsets: string[];
  descriptionSuffix: string;
};

const REFERENCE_TOOL_CATALOG: ReferenceToolCatalogEntry[] = [
  {
    localToolId: 'llm.generate_text',
    capabilities: ['reasoning', 'clarification', 'multi-agent-synthesis'],
    referenceModules: ['clarify_tool.py', 'mixture_of_agents_tool.py', 'skills_tool.py'],
    referenceToolNames: ['clarify', 'mixture_of_agents', 'skill_view'],
    referenceToolsets: ['clarify', 'moa', 'skills'],
    descriptionSuffix: 'Diperkaya pola klarifikasi, skill loading, dan reasoning multi-agent dari repo referensi Hermes.',
  },
  {
    localToolId: 'document.compose_markdown',
    capabilities: ['memory-assisted-writing', 'web-research', 'session-search', 'skill-loading'],
    referenceModules: ['memory_tool.py', 'web_tools.py', 'session_search_tool.py', 'skills_tool.py'],
    referenceToolNames: ['memory', 'web_search', 'web_extract', 'session_search', 'skill_view'],
    referenceToolsets: ['memory', 'web', 'session_search', 'skills'],
    descriptionSuffix: 'Memakai peta kapabilitas memory, web research, dan session search dari Hermes reference.',
  },
  {
    localToolId: 'document.compose_outline',
    capabilities: ['clarification', 'planning', 'task-breakdown'],
    referenceModules: ['clarify_tool.py', 'todo_tool.py', 'skills_tool.py'],
    referenceToolNames: ['clarify', 'todo', 'skill_view'],
    referenceToolsets: ['clarify', 'todo', 'skills'],
    descriptionSuffix: 'Disejajarkan dengan workflow klarifikasi dan perincian tugas dari Hermes reference.',
  },
  {
    localToolId: 'image.generate_asset',
    capabilities: ['image-generation', 'vision-analysis', 'visual-iteration'],
    referenceModules: ['image_generation_tool.py', 'vision_tools.py', 'browser_tool.py'],
    referenceToolNames: ['image_generate', 'vision_analyze', 'browser_get_images'],
    referenceToolsets: ['image_gen', 'vision', 'browser'],
    descriptionSuffix: 'Mengikuti permukaan image generation dan vision analysis dari Hermes reference.',
  },
  {
    localToolId: 'sheet.build_dataset',
    capabilities: ['web-extraction', 'file-search', 'tabular-collection'],
    referenceModules: ['web_tools.py', 'file_tools.py', 'session_search_tool.py'],
    referenceToolNames: ['web_extract', 'search_files', 'session_search'],
    referenceToolsets: ['web', 'file', 'session_search'],
    descriptionSuffix: 'Diperkaya alur ekstraksi web, pencarian file, dan pengumpulan data tabular.',
  },
  {
    localToolId: 'web.build_artifact',
    capabilities: [
      'terminal-execution',
      'file-operations',
      'browser-automation',
      'delegation',
      'code-sandbox',
      'workflow-automation',
    ],
    referenceModules: [
      'terminal_tool.py',
      'read_terminal_tool.py',
      'file_tools.py',
      'browser_tool.py',
      'code_execution_tool.py',
      'delegate_tool.py',
      'todo_tool.py',
    ],
    referenceToolNames: [
      'terminal',
      'read_terminal',
      'read_file',
      'write_file',
      'patch',
      'search_files',
      'browser_navigate',
      'browser_snapshot',
      'execute_code',
      'delegate_task',
      'todo',
    ],
    referenceToolsets: ['terminal', 'file', 'browser', 'code_execution', 'delegation', 'todo'],
    descriptionSuffix: 'Diselaraskan dengan terminal, file, browser, delegation, dan code sandbox dari Hermes reference.',
  },
  {
    localToolId: 'filesystem.write_artifact',
    capabilities: ['artifact-persistence', 'file-operations'],
    referenceModules: ['file_tools.py'],
    referenceToolNames: ['write_file', 'patch'],
    referenceToolsets: ['file'],
    descriptionSuffix: 'Tetap memakai writer lokal, dengan boundary artifact mengikuti operasi file Hermes reference.',
  },
  {
    localToolId: 'task.request_approval',
    capabilities: ['human-approval', 'risky-action-gate'],
    referenceModules: ['approval.py', 'write_approval.py'],
    referenceToolNames: ['approval', 'write_approval'],
    referenceToolsets: ['approval'],
    descriptionSuffix: 'Mengikuti gate approval dan risky-action review seperti pada Hermes reference.',
  },
  {
    localToolId: 'video.generate_mp4',
    capabilities: ['video-generation', 'voiceover-generation', 'storyboard-to-video'],
    referenceModules: ['video_generation_tool.py', 'tts_tool.py', 'image_generation_tool.py', 'vision_tools.py'],
    referenceToolNames: ['video_generate', 'text_to_speech', 'image_generate', 'video_analyze'],
    referenceToolsets: ['video_gen', 'tts', 'image_gen', 'video'],
    descriptionSuffix: 'Mengikuti pola image-to-video, TTS, dan analisis visual dari Hermes reference.',
  },
];

const dedupe = (values: string[]) => [...new Set(values)];

const filterAvailableModules = (modules: string[]) => {
  const { toolsRoot } = getHermesReferenceSearchRoots();
  return modules.filter((moduleName) => existsSync(path.join(toolsRoot, moduleName)));
};

export const listReferenceWorkspaceToolCatalogSync = (): ReferenceToolCatalogEntry[] =>
  REFERENCE_TOOL_CATALOG.map((entry) => ({
    ...entry,
    referenceModules: filterAvailableModules(entry.referenceModules),
  })).filter((entry) => entry.referenceModules.length > 0);

export const mergeSeedToolsWithReferenceCatalog = (
  tools: HermesToolDefinition[],
): HermesToolDefinition[] => {
  const overlayById = new Map(
    listReferenceWorkspaceToolCatalogSync().map((entry) => [entry.localToolId, entry]),
  );

  return tools.map((tool) => {
    const overlay = overlayById.get(tool.id);
    if (!overlay) {
      return {
        ...tool,
        source: tool.source ?? 'system',
      };
    }

    return {
      ...tool,
      description: `${tool.description} ${overlay.descriptionSuffix}`.trim(),
      aliases: dedupe([...(tool.aliases ?? []), ...overlay.referenceToolNames]),
      capabilities: dedupe([...(tool.capabilities ?? []), ...overlay.capabilities]),
      source: 'hybrid',
      referenceModules: overlay.referenceModules,
      referenceToolsets: overlay.referenceToolsets,
    };
  });
};
