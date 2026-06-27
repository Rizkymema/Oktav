'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import {
  buildAssistantTaskMessage,
  getAssistantWorkingLabel,
  upsertTaskAssistantMessage,
} from './chat/chat-helpers';
import { createProjectNotification } from './notification-factory';
import { mockSkills } from './mock-data';
import {
  ChatMessage,
  NotificationItem,
  Project,
  Skill,
  Task,
  WorkspaceModelOption,
  WorkspaceOutputOption,
} from './types';

interface WorkspaceContextProps {
  promptInput: string;
  setPromptInput: (p: string) => void;
  selectedSkill: string | null;
  setSelectedSkill: (s: string | null) => void;
  selectedModel: string;
  setSelectedModel: (m: string) => void;
  availableModels: WorkspaceModelOption[];
  selectedOutputType: string;
  setSelectedOutputType: (outputType: string) => void;
  availableOutputTypes: WorkspaceOutputOption[];
  deepResearchMode: boolean;
  setDeepResearchMode: (d: boolean) => void;
  researchDepth: 'Quick' | 'Standard' | 'Deep' | 'Expert';
  setResearchDepth: (d: 'Quick' | 'Standard' | 'Deep' | 'Expert') => void;
  researchScope: 'Web' | 'Uploaded Files' | 'Knowledge Base' | 'Connected Tools' | 'All Available Sources';
  setResearchScope: (
    s: 'Web' | 'Uploaded Files' | 'Knowledge Base' | 'Connected Tools' | 'All Available Sources',
  ) => void;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  connected: boolean;
  loading: boolean;
  runtimeModel: string;
  credits: { used: number; max: number };
  controlSkills: Skill[];
  controlTools: Array<{ name: string; description: string; enabled: boolean }>;
  controlWarning: string;
  isControlLoading: boolean;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  isAssistantTyping: boolean;
  assistantStatusLabel: string | null;
  activeTaskId: string | null;
  setActiveTaskId: (id: string | null) => void;
  notifications: NotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  refreshGateway: () => Promise<void>;
  refreshControl: () => Promise<void>;
  handleToggleTool: (name: string, currentEnabled: boolean) => Promise<void>;
  handleInstallSkill: (name: string) => Promise<boolean>;
  handleUninstallSkill: (name: string) => Promise<boolean>;
  handleModelUpdate: (mName: string) => Promise<void>;
  handleSubmitPrompt: (userText: string) => Promise<void>;
  handleCancelTask: (taskId: string) => Promise<void>;
  handleRetryTask: (taskId: string) => Promise<void>;
  handleApprovalResponse: (
    approvalId: string,
    status: 'approved' | 'rejected',
    responseNote?: string,
  ) => Promise<void>;
  createNewProject: (name: string, desc: string, skill: string, goal: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextProps | undefined>(undefined);

const createMessageId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const createTimestamp = () =>
  new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

const isProjectPrompt = (prompt: string) => {
  const lower = prompt.toLowerCase();
  const taskKeywords = [
    'buat',
    'bikin',
    'create',
    'generate',
    'render',
    'design',
    'susun',
    'tulis',
    'sintesis',
    'analisis',
    'draft',
    'proyek',
    'project',
    'slides',
    'presentasi',
    'proposal',
    'dokumen',
    'document',
    'poster',
    'website',
    'landing page',
    'excel',
    'sheet',
    'tabel',
    'scraping',
    'crawler',
  ];

  return taskKeywords.some((keyword) => lower.includes(keyword));
};

const inferTargetAgent = (selectedSkill: string | null) => {
  if (selectedSkill === 'Slides' || selectedSkill === 'Documents' || selectedSkill === 'Videos') {
    return 'Document Agent';
  }
  if (selectedSkill === 'Images') {
    return 'Image Agent';
  }
  if (selectedSkill === 'Sheets') {
    return 'Data & Sheets Agent';
  }
  if (selectedSkill === 'Websites') {
    return 'Project Builder Agent';
  }
  return '';
};

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [promptInput, setPromptInput] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('auto');
  const [availableModels, setAvailableModels] = useState<WorkspaceModelOption[]>([
    {
      id: 'auto',
      name: 'Auto Model',
      desc: 'Pilih model terbaik berdasarkan format output.',
      badge: 'Recommended',
      capabilities: ['chat', 'document', 'presentation', 'spreadsheet', 'image', 'video', 'web'],
    },
    {
      id: 'openai/gpt-4o',
      name: 'GPT-4o',
      desc: 'Model flagship untuk dokumen dan presentasi.',
      badge: 'Direct',
      capabilities: ['chat', 'document', 'presentation', 'spreadsheet', 'web'],
    },
    {
      id: 'google/gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      desc: 'Model cepat untuk drafting dan analisis.',
      badge: 'Direct',
      capabilities: ['chat', 'document', 'spreadsheet', 'web'],
    },
  ]);
  const [selectedOutputType, setSelectedOutputType] = useState('auto');
  const [availableOutputTypes] = useState<WorkspaceOutputOption[]>([
    { id: 'pdf', label: 'PDF', desc: 'Dokumen final siap dibagikan' },
    { id: 'pptx', label: 'PPTX', desc: 'Deck presentasi atau pitch deck' },
    { id: 'docx', label: 'DOCX', desc: 'Dokumen Word terstruktur' },
    { id: 'xlsx', label: 'XLSX', desc: 'Workbook spreadsheet' },
    { id: 'png', label: 'PNG', desc: 'Poster, foto, atau visual' },
    { id: 'mp4', label: 'MP4', desc: 'Output video bila engine tersedia' },
    { id: 'html', label: 'HTML', desc: 'Landing page atau halaman web' },
    { id: 'zip', label: 'ZIP', desc: 'Paket source code atau multi-file' },
  ]);
  const [deepResearchMode, setDeepResearchMode] = useState(false);
  const [researchDepth, setResearchDepth] = useState<'Quick' | 'Standard' | 'Deep' | 'Expert'>(
    'Standard',
  );
  const [researchScope, setResearchScope] = useState<
    'Web' | 'Uploaded Files' | 'Knowledge Base' | 'Connected Tools' | 'All Available Sources'
  >('All Available Sources');
  const [projectsState, setProjectsState] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [runtimeModel, setRuntimeModel] = useState('gpt-4o-mini');
  const [credits, setCredits] = useState({ used: 12, max: 50 });
  const [controlSkills, setControlSkills] = useState<Skill[]>(mockSkills);
  const [controlTools, setControlTools] = useState<
    Array<{ name: string; description: string; enabled: boolean }>
  >([]);
  const [controlWarning, setControlWarning] = useState('');
  const [isControlLoading, setIsControlLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const [assistantStatusLabel, setAssistantStatusLabel] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [notificationsState, setNotificationsState] = useState<NotificationItem[]>([]);

  const projects = projectsState;
  const notifications = notificationsState;

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const controlPollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const notifiedTaskIdsRef = useRef<Set<string>>(new Set());
  const isFirstFetchRef = useRef(true);

  useEffect(() => {
    fetch('/api/hermes/models')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.models) && data.models.length > 0) {
          setAvailableModels(data.models);
        }
      })
      .catch((err) => console.error('Gagal memuat model dari backend:', err));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const projectName = params.get('projectName');
    const projectType = params.get('projectType');
    const focus = params.get('focus');

    if (focus !== 'compose' || !projectName || promptInput.trim().length > 0) {
      return;
    }

    setPromptInput(
      `Lanjutkan project "${projectName}" dan kerjakan perubahan berikut pada output ${projectType || 'project'}.`,
    );

    if (projectType) {
      setSelectedSkill(projectType);
    }
  }, [promptInput]);

  const setProjects = (value: React.SetStateAction<Project[]>) => {
    setProjectsState((prev) => {
      const nextVal = typeof value === 'function' ? (value as Function)(prev) : value;
      fetch('/api/hermes/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects: nextVal }),
      }).catch((e) => console.error('Gagal menyimpan projects ke backend:', e));
      return nextVal;
    });
  };

  const setNotifications = (value: React.SetStateAction<NotificationItem[]>) => {
    setNotificationsState((prev) => {
      const nextVal = typeof value === 'function' ? (value as Function)(prev) : value;
      fetch('/api/hermes/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications: nextVal }),
      }).catch((e) => console.error('Gagal menyimpan notifications ke backend:', e));
      return nextVal;
    });
  };

  const refreshGateway = useCallback(async () => {
    try {
      const res = await fetch('/api/hermes/overview');
      if (!res.ok) {
        setConnected(true);
        setLoading(false);
        return;
      }

      const data = await res.json();

      setConnected(true);
      if (data.runtime?.model) {
        setRuntimeModel(data.runtime.model);
      }

      if (data.stats) {
        setCredits({
          used: Number(data.stats.completed_tasks || 12),
          max: Math.max(50, Number(data.stats.tasks || 50)),
        });
      }

      if (data.projects) {
        setProjectsState(data.projects);
      }
      if (data.notifications) {
        setNotificationsState(data.notifications);
      }

      if (data.tasks) {
        const formattedTasks: Task[] = data.tasks.map((task: any) => {
          if (task.source && task.agent && task.downloadItems) {
            return {
              ...task,
              phase: task.phase,
              approvalState: task.approvalState,
              approvalRequestId: task.approvalRequestId,
              approvalActionType: task.approvalActionType,
              approvalReason: task.approvalReason,
              requestedOutputType: task.requestedOutputType,
              resolvedModel: task.resolvedModel,
            } as Task;
          }

          const summary = task.result_summary || task.error_summary || task.current_step || '-';
          return {
            id: task.id,
            source: task.source_name || task.channel || 'Hermes Workspace',
            status: task.status,
            category: 'general',
            agent: task.agent_name || 'Code Agent',
            prompt: task.prompt || '-',
            summary,
            progress: Number(task.progress_percent || 0),
            createdTime: task.created_at
              ? new Date(task.created_at).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '-',
            logs: (task.logs || []).map(
              (log: any) =>
                `[${log.created_at ? new Date(log.created_at).toLocaleTimeString('id-ID') : '-'}] ${log.message || ''}`,
            ),
            outputFiles: (task.download_urls || []).map((item: any) => item.label || 'file'),
            downloadItems: (task.download_urls || []).map((item: any) => ({
              label: item.label || 'Download',
              url: item.url || '#',
            })),
            outputContent: task.result_summary || task.error_summary || '',
            creditsUsed: task.credits_used || 1,
            durationSeconds: task.duration_seconds || 15,
            phase: task.phase,
            approvalState: task.approval_state,
            approvalRequestId: task.approval_request_id,
            approvalActionType: task.approval_action_type,
            approvalReason: task.approval_reason,
            requestedOutputType: task.requested_output_type,
            resolvedModel: task.resolved_model,
            projectId: task.project_id || task.projectId,
          };
        });

        setTasks(formattedTasks);

        formattedTasks.forEach((task) => {
          if (isFirstFetchRef.current) {
            if (task.status === 'completed' || task.status === 'failed') {
              notifiedTaskIdsRef.current.add(task.id);
            }
            return;
          }

          if (
            (task.status === 'completed' || task.status === 'failed') &&
            !notifiedTaskIdsRef.current.has(task.id)
          ) {
            notifiedTaskIdsRef.current.add(task.id);

            const message = buildAssistantTaskMessage(task);
            setMessages((prev) =>
              upsertTaskAssistantMessage(prev, {
                taskId: task.id,
                kind: message.kind,
                text: message.text,
                timestamp: createTimestamp(),
              }),
            );

            if (activeTaskId === task.id) {
              setIsAssistantTyping(false);
              setAssistantStatusLabel(null);
            }
          }
        });

        isFirstFetchRef.current = false;
      }
    } catch (_error) {
      setConnected(true);
    } finally {
      setLoading(false);
    }
  }, [activeTaskId]);

  const refreshControl = useCallback(async () => {
    setIsControlLoading(true);
    try {
      const res = await fetch('/api/hermes/control');
      if (!res.ok) {
        setControlWarning('');
        setIsControlLoading(false);
        return;
      }

      const data = await res.json();

      if (data.warning) {
        setControlWarning(data.warning);
      } else {
        setControlWarning('');

        if (data.tools) {
          setControlTools(
            (data.tools || []).map((tool: any) => ({
              name: tool.name,
              description: tool.description || 'Hermes CLI tool.',
              enabled: tool.enabled,
            })),
          );
        }

        if (data.skills) {
          setControlSkills(
            (data.skills || []).map((skill: any) => ({
              name: skill.name,
              category: skill.category || 'General',
              description: skill.description || 'Skill terinstal.',
              agent: skill.agent || 'Hermes Reference',
              supportedInputs: skill.supportedInputs || [],
              supportedOutputs: skill.supportedOutputs || [],
              requiredTools: skill.requiredTools || [],
              examplePrompts: skill.examplePrompts || [],
              limitations: skill.limitations || [],
              estimatedCredits: skill.estimatedCredits || 1,
              installed: Boolean(skill.installed),
              source: skill.source || 'system',
            })),
          );
        }
      }
    } catch (_error) {
      setControlWarning('');
    } finally {
      setIsControlLoading(false);
    }
  }, []);

  const handleToggleTool = async (name: string, currentEnabled: boolean) => {
    try {
      setControlTools((prev) =>
        prev.map((tool) => (tool.name === name ? { ...tool, enabled: !currentEnabled } : tool)),
      );

      const res = await fetch('/api/hermes/control/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_tool', name, enabled: !currentEnabled }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengubah status tool.');
      }

      refreshControl();
    } catch (err: any) {
      console.error(err);
      refreshControl();
    }
  };

  const handleInstallSkill = async (name: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/hermes/control/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'install_skill', identifier: name }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menginstal skill.');
      }

      refreshControl();
      return true;
    } catch (err: any) {
      console.error(err);
      return false;
    }
  };

  const handleUninstallSkill = async (name: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/hermes/control/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'uninstall_skill', name }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menghapus skill.');
      }

      refreshControl();
      return true;
    } catch (err: any) {
      console.error(err);
      return false;
    }
  };

  const handleModelUpdate = async (modelName: string) => {
    try {
      setSelectedModel(modelName);
      const res = await fetch('/api/hermes/control/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_model', model: modelName }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengganti model.');
      }

      refreshControl();
      refreshGateway();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSubmitPrompt = async (userText: string) => {
    if (!userText.trim()) {
      return;
    }

    setPromptInput('');

    const timestamp = createTimestamp();
    setMessages((prev) => [
      ...prev,
      {
        id: createMessageId('user'),
        sender: 'user',
        kind: 'message',
        text: userText,
        timestamp,
        skill: selectedSkill || undefined,
        model: selectedModel,
      },
    ]);

    const taskIntent = selectedSkill !== null || deepResearchMode || isProjectPrompt(userText);
    const workingLabel = getAssistantWorkingLabel({
      selectedSkill,
      outputType: selectedOutputType === 'auto' ? undefined : selectedOutputType,
    });

    setIsAssistantTyping(true);
    setAssistantStatusLabel(taskIntent ? workingLabel : 'Thinking...');

    if (!taskIntent) {
      try {
        const res = await fetch('/api/hermes/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: userText,
            model: selectedModel,
            outputType: selectedOutputType === 'auto' ? undefined : selectedOutputType,
            selectedSkill,
          }),
        });

        if (!res.ok) {
          throw new Error('API Gagal merespon');
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('Stream tidak didukung');

        const decoder = new TextDecoder();
        const msgId = createMessageId('assistant');

        setMessages((prev) => [
          ...prev,
          {
            id: msgId,
            sender: 'assistant',
            kind: 'message',
            text: '',
            timestamp: createTimestamp(),
          },
        ]);

        let completeText = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          completeText += chunk;

          setMessages((prev) =>
            prev.map((msg) => (msg.id === msgId ? { ...msg, text: completeText } : msg))
          );
        }
      } catch (err: any) {
        setMessages((prev) => [
          ...prev,
          {
            id: createMessageId('assistant'),
            sender: 'assistant',
            kind: 'error',
            text: `Error: ${err.message || 'Gagal terhubung ke modul chat.'}`,
            timestamp: createTimestamp(),
          },
        ]);
      } finally {
        setIsAssistantTyping(false);
        setAssistantStatusLabel(null);
      }
      return;
    }

    const targetAgent = inferTargetAgent(selectedSkill);

    try {
      const res = await fetch('/api/hermes/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: selectedSkill ? `[Skill: ${selectedSkill}] ${userText}` : userText,
          agent_name: targetAgent || undefined,
          model: selectedModel,
          outputType: selectedOutputType === 'auto' ? undefined : selectedOutputType,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to dispatch task');
      }

      const data = await res.json();
      const newTaskId = data.task?.id;

      if (newTaskId) {
        setActiveTaskId(newTaskId);
        setMessages((prev) =>
          upsertTaskAssistantMessage(prev, {
            taskId: newTaskId,
            kind: 'system_status',
            text: workingLabel,
            timestamp: createTimestamp(),
          }),
        );
        setIsAssistantTyping(false);
        setAssistantStatusLabel(null);

        const newNotif: NotificationItem = {
          id: createMessageId('notif'),
          type: 'tasks',
          title: 'Tugas Baru Diinisiasi',
          description: `Tugas "${userText.slice(0, 30)}..." berhasil ditambahkan ke antrian Hermes Core.`,
          time: 'Baru saja',
          read: false,
          taskId: newTaskId,
          actionUrl: '/workspace',
          actionLabel: 'Open Workspace',
        };
        setNotifications((prev) => [newNotif, ...prev]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId('assistant'),
          sender: 'assistant',
          kind: 'error',
          text: `Error: ${err.message || 'Gagal mengirim tugas ke Hermes Core.'}`,
          timestamp: createTimestamp(),
        },
      ]);
      setIsAssistantTyping(false);
      setAssistantStatusLabel(null);
    }
  };

  const handleCancelTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/hermes/tasks/${taskId}/cancel`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal membatalkan task.');
      }
      await refreshGateway();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRetryTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/hermes/tasks/${taskId}/retry`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal me-retry task.');
      }
      if (data.task?.id) {
        setActiveTaskId(data.task.id);
      }
      await refreshGateway();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprovalResponse = async (
    approvalId: string,
    status: 'approved' | 'rejected',
    responseNote?: string,
  ) => {
    try {
      const res = await fetch(`/api/hermes/approvals/${approvalId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          reviewedBy: 'workspace-operator',
          responseNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memproses approval.');
      }
      if (data.task?.id) {
        setActiveTaskId(data.task.id);
      }
      await refreshGateway();
    } catch (err) {
      console.error(err);
    }
  };

  const createNewProject = (name: string, desc: string, skill: string, goal: string) => {
    const newProject: Project = {
      id: `prj-${Math.random().toString(36).substring(7)}`,
      name,
      description: desc,
      path: `d:/Project Apk-Web/hermes-projects/${name.toLowerCase().replace(/\s+/g, '-')}`,
      category: 'General',
      type: skill,
      file_count: 0,
      size_bytes: 0,
      status: 'draft',
      lastUpdate: 'Baru saja',
      activeAgent: 'Hermes Core',
      progress: 0,
    };
    setProjects((prev) => [newProject, ...prev]);
    setNotifications((prev) => [createProjectNotification({ kind: 'created', project: newProject }), ...prev]);
  };

  useEffect(() => {
    refreshGateway();
    refreshControl();

    pollTimerRef.current = setInterval(refreshGateway, 4000);
    controlPollTimerRef.current = setInterval(refreshControl, 15000);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
      if (controlPollTimerRef.current) {
        clearInterval(controlPollTimerRef.current);
      }
    };
  }, [refreshControl, refreshGateway]);

  return (
    <WorkspaceContext.Provider
      value={{
        promptInput,
        setPromptInput,
        selectedSkill,
        setSelectedSkill,
        selectedModel,
        setSelectedModel,
        selectedOutputType,
        setSelectedOutputType,
        deepResearchMode,
        setDeepResearchMode,
        researchDepth,
        setResearchDepth,
        researchScope,
        setResearchScope,
        availableModels,
        availableOutputTypes,
        projects,
        setProjects,
        tasks,
        setTasks,
        connected,
        loading,
        runtimeModel,
        credits,
        controlSkills,
        controlTools,
        controlWarning,
        isControlLoading,
        messages,
        setMessages,
        isAssistantTyping,
        assistantStatusLabel,
        activeTaskId,
        setActiveTaskId,
        notifications,
        setNotifications,
        refreshGateway,
        refreshControl,
        handleToggleTool,
        handleInstallSkill,
        handleUninstallSkill,
        handleModelUpdate,
        handleSubmitPrompt,
        handleCancelTask,
        handleRetryTask,
        handleApprovalResponse,
        createNewProject,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
