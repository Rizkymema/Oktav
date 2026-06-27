import type { NotificationItem, Project, Task } from '@/lib/workspace/types';

const humanTime = () => 'Baru saja';

const trimPrompt = (prompt: string) =>
  prompt.replace(/^\[Skill:.*?\]\s*/i, '').trim();

export const createTaskStatusNotification = (
  task: Task,
  projectId: string,
): NotificationItem => {
  const taskPrompt = trimPrompt(task.prompt);

  if (task.status === 'waiting_approval') {
    return {
      id: `notif-task-${task.id}-approval`,
      type: 'tasks',
      title: 'Approval Diperlukan',
      description: task.approvalReason || `Task "${taskPrompt}" menunggu approval operator.`,
      time: humanTime(),
      read: false,
      taskId: task.id,
      projectId,
      actionUrl: `/workspace/projects/${projectId}?tab=tasks&taskId=${task.id}`,
      actionLabel: 'Review Approval',
    };
  }

  if (task.status === 'completed') {
    return {
      id: `notif-task-${task.id}`,
      type: 'tasks',
      title: 'Tugas Selesai',
      description: `Task "${taskPrompt}" selesai dan artifact siap dibuka dari workspace project.`,
      time: humanTime(),
      read: false,
      taskId: task.id,
      projectId,
      actionUrl: `/workspace/projects/${projectId}?tab=files`,
      actionLabel: 'Open Files',
    };
  }

  return {
    id: `notif-task-${task.id}`,
    type: 'tasks',
    title: 'Tugas Gagal',
    description: `Task "${taskPrompt}" gagal diproses. Buka detail task untuk melihat penyebabnya.`,
    time: humanTime(),
    read: false,
    taskId: task.id,
    projectId,
    actionUrl: `/workspace/projects/${projectId}?tab=tasks&taskId=${task.id}`,
    actionLabel: 'Open Task',
  };
};

export const createProjectNotification = (input: {
  kind: 'created' | 'deleted';
  project: Project;
}): NotificationItem => {
  const { project } = input;

  if (input.kind === 'created') {
    return {
      id: `notif-project-${project.id}-created`,
      type: 'projects',
      title: 'Proyek Baru Dibuat',
      description: `Proyek "${project.name}" berhasil diinisiasi di workspace.`,
      time: humanTime(),
      read: false,
      projectId: project.id,
      actionUrl: `/workspace/projects/${project.id}`,
      actionLabel: 'Open Project',
    };
  }

  return {
    id: `notif-project-${project.id}-deleted`,
    type: 'projects',
    title: 'Proyek Dihapus',
    description: `Proyek "${project.name}" telah dihapus dari workspace lokal.`,
    time: humanTime(),
    read: false,
    projectId: project.id,
  };
};

