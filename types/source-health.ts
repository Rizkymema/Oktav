export type SourceHealthStatus = 'live' | 'idle' | 'offline' | 'missing';

export interface SourceHealthEntry {
  key: string;
  label: string;
  description: string;
  status: SourceHealthStatus;
  totalTasks: number;
  activeTasks: number;
  failedTasks: number;
  lastActivityAt: string | null;
  lastAgent: string | null;
}

