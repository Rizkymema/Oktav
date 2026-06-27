import type { ChatMessage, Project, Task } from '@/lib/workspace/types';

export type ProjectRuntimeFile = {
  name: string;
  type: string;
  size: string;
  time: string;
  url: string;
};

const normalize = (value: string) => value.trim().toLowerCase();

export const resolveProjectTasks = (project: Project, tasks: Task[]) => {
  const projectTaskId = project.id.replace(/^prj-/, '');
  const projectName = normalize(project.name);

  return tasks.filter((task) => {
    if (task.projectId === project.id) {
      return true;
    }

    if (task.id === projectTaskId) {
      return true;
    }

    return normalize(task.prompt).includes(projectName);
  });
};

export const resolveProjectArtifacts = (tasks: Task[]): ProjectRuntimeFile[] =>
  tasks.flatMap((task) =>
    task.downloadItems.map((item) => ({
      name: item.label,
      type:
        task.requestedOutputType?.toUpperCase() ??
        item.label.split('.').pop()?.toUpperCase() ??
        'FILE',
      size: 'Runtime Artifact',
      time: task.createdTime,
      url: item.url,
    })),
  );

export const resolveProjectMessages = (taskIds: string[], messages: ChatMessage[]) => {
  const taskIdSet = new Set(taskIds);
  return messages.filter((message) => message.taskId && taskIdSet.has(message.taskId));
};

export const buildProjectWorkspaceIntent = (project: Project) => ({
  projectId: project.id,
  projectName: project.name,
  projectType: project.type,
  prompt: `Lanjutkan project "${project.name}" dan kerjakan perubahan berikut pada output ${project.type}.`,
});

