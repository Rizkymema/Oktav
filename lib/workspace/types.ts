export interface Task {
  id: string;
  source: string;
  status:
    | 'queued'
    | 'planning'
    | 'ready'
    | 'running'
    | 'researching'
    | 'generating'
    | 'validating'
    | 'waiting_dependency'
    | 'waiting_approval'
    | 'retrying'
    | 'completed'
    | 'failed'
    | 'cancelled';
  category: 'project' | 'document' | 'runtime' | 'general' | 'image' | 'data';
  agent: string;
  prompt: string;
  summary: string;
  progress: number;
  createdTime: string;
  logs: string[];
  outputFiles: string[];
  downloadItems: Array<{ label: string; url: string }>;
  outputContent?: string;
  creditsUsed?: number;
  durationSeconds?: number;
  phase?: string;
  approvalState?: 'pending' | 'approved' | 'rejected';
  approvalRequestId?: string;
  approvalActionType?: string;
  approvalReason?: string;
  requestedOutputType?: string;
  resolvedModel?: string;
  projectId?: string;
}

export type ChatMessageKind = 'message' | 'system_status' | 'task_result' | 'error';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  kind: ChatMessageKind;
  text: string;
  timestamp: string;
  taskId?: string;
  skill?: string;
  model?: string;
}

export interface WorkspaceModelOption {
  id: string;
  name: string;
  desc: string;
  badge?: string;
  capabilities: string[];
}

export interface WorkspaceOutputOption {
  id: string;
  label: string;
  desc: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  path: string;
  category: string;
  type: string;
  file_count: number;
  size_bytes: number;
  status: 'draft' | 'queued' | 'running' | 'waiting_approval' | 'completed' | 'failed';
  lastUpdate: string;
  activeAgent?: string;
  progress?: number;
}

export interface Skill {
  name: string;
  description: string;
  category: 'Content' | 'Research' | 'Coding' | 'Data' | 'Design' | 'Automation' | 'Productivity';
  agent: string;
  supportedInputs: string[];
  supportedOutputs: string[];
  requiredTools: string[];
  examplePrompts: string[];
  limitations: string[];
  estimatedCredits: number;
  installed?: boolean;
  source?: 'system' | 'hermes-reference';
}

export interface Template {
  title: string;
  skill: string;
  desc: string;
  prompt: string;
  category: string;
  estimatedTime: string;
  estimatedCredits: number;
  recommendedAgent: string;
}

export interface IMChannel {
  name: string;
  type: 'whatsapp' | 'telegram' | 'discord' | 'slack' | 'line';
  status: 'connected' | 'not_connected' | 'error' | 'reconnecting';
  account?: string;
  botName?: string;
  webhookUrl?: string;
  token?: string;
  lastActivity?: string;
  errorCount?: number;
  permissions: string[];
}

export interface NotificationItem {
  id: string;
  type: 'tasks' | 'projects' | 'channels' | 'credits' | 'security' | 'system';
  title: string;
  description: string;
  time: string;
  read: boolean;
  taskId?: string;
  projectId?: string;
  actionUrl?: string;
  actionLabel?: string;
}
