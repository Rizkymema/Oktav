import { WorkspaceAdapter } from '@/lib/hermes/adapters/workspace-adapter';
import type { HermesRuntime } from '@/lib/hermes/index';
import { StatePersistence } from '@/lib/hermes/runtime/state-persistence';

export class HermesOverviewService {
  private readonly adapter = new WorkspaceAdapter();

  constructor(private readonly runtime: HermesRuntime) {}

  async getOverview() {
    const approvals = this.runtime.approvalManager.listAll();
    const latestApprovalByTask = new Map(
      approvals.map((approval) => [approval.taskId, approval] as const),
    );
    const tasks = this.runtime.taskManager
      .listTasks()
      .map((task) => this.adapter.toWorkspaceTask(task, latestApprovalByTask.get(task.id)));

    // Load dynamic persisted projects and notifications
    const projects = StatePersistence.loadProjects();
    const notifications = StatePersistence.loadNotifications();

    return {
      runtime: {
        model: this.runtime.model,
      },
      stats: {
        tasks: tasks.length,
        completed_tasks: tasks.filter((task) => task.status === 'completed').length,
        pending_approvals: this.runtime.approvalManager.listPending().length,
      },
      tasks,
      projects,
      notifications,
      approvals,
    };
  }
}
