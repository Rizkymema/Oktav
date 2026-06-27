import type { SourceHealthEntry } from '@/types/source-health';

export interface LiveSummary {
  generatedAt: string;
  workspace: {
    name: string;
    projectsCount: number;
    activeTasksCount: number;
    lastUpdatedAt: string | null;
  };
  gateway: {
    publicUrl: string;
    model: string;
    tasksCount: number;
    completedTasksCount: number;
    failedTasksCount: number;
  };
  control: {
    connected: boolean;
    skillsCount: number;
    toolsCount: number;
    warning: string | null;
  };
  sourceHealth: SourceHealthEntry[];
}
