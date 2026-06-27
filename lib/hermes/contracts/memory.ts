export interface HermesContextSnapshot {
  requestSummary: string;
  activeSkill?: string;
  activeProjectId?: string;
  latestOutputs: string[];
}

export interface HermesMemoryRecord {
  taskId: string;
  summary: string;
  updatedAt: string;
  context: HermesContextSnapshot;
}
