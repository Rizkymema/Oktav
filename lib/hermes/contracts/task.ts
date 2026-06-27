import type { HermesApprovalRequest } from '@/lib/hermes/contracts/approval';
import type { HermesExecutionEvent } from '@/lib/hermes/contracts/event';

export type HermesTaskStatus =
  | 'queued'
  | 'planning'
  | 'ready'
  | 'running'
  | 'waiting_dependency'
  | 'waiting_approval'
  | 'validating'
  | 'retrying'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type HermesTaskPhase =
  | 'goal_analysis'
  | 'clarification'
  | 'planning'
  | 'delegation'
  | 'executing_tool'
  | 'researching'
  | 'generating'
  | 'validating'
  | 'approval_required'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type HermesTaskCategory = 'project' | 'document' | 'runtime' | 'general' | 'image' | 'data';

export interface HermesTaskCreateInput {
  id?: string;
  goal: string;
  category: HermesTaskCategory;
  source: string;
  prompt: string;
  selectedSkill?: string;
  outputType?: string;
  selectedModel?: string;
  projectId?: string;
}

export interface HermesSubTask {
  id: string;
  taskId: string;
  title: string;
  status: HermesTaskStatus;
  dependsOn: string[];
  agentId?: string;
  skillId?: string;
  toolIds: string[];
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export interface HermesTaskRecord {
  id: string;
  goal: string;
  source: string;
  prompt: string;
  category: HermesTaskCategory;
  status: HermesTaskStatus;
  phase: HermesTaskPhase;
  projectId?: string;
  agentId?: string;
  skillId?: string;
  requestedOutputType?: string;
  requestedOutputLabel?: string;
  requestedCapability?: string;
  resolvedModel?: string;
  summary: string;
  progress: number;
  attemptCount: number;
  approvalState?: HermesApprovalRequest['status'];
  result?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  logs: string[];
  events: HermesExecutionEvent[];
  subTasks: HermesSubTask[];
  outputFiles: string[];
  downloadItems: Array<{ label: string; url: string }>;
}
