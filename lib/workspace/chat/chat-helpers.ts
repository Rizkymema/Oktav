import type { ChatMessage, ChatMessageKind, Task } from '@/lib/workspace/types';

const HUMAN_OUTPUT_NAMES: Record<string, string> = {
  png: 'PNG',
  jpg: 'JPG',
  jpeg: 'JPG',
  svg: 'SVG',
  pdf: 'PDF',
  docx: 'DOCX',
  pptx: 'PPTX',
  xlsx: 'XLSX',
  csv: 'CSV',
  html: 'HTML',
  zip: 'ZIP',
  mp4: 'MP4',
};

const toSentenceCase = (value: string) =>
  value.length > 0 ? value[0].toUpperCase() + value.slice(1) : value;

const normalizePrompt = (value: string) =>
  value
    .replace(/^\[Skill:.*?\]\s*/i, '')
    .replace(/^(buatkan|bikin|buat|generate|create)\s+(saya\s+)?/i, '')
    .trim();

export const getAssistantWorkingLabel = (input: {
  selectedSkill?: string | null;
  outputType?: string | null;
}) => {
  const outputType = input.outputType?.toLowerCase();

  if (outputType === 'png' || outputType === 'jpg' || outputType === 'jpeg' || outputType === 'svg') {
    return 'Generating image...';
  }

  if (outputType === 'pptx') {
    return 'Preparing presentation...';
  }

  if (outputType === 'pdf' || outputType === 'docx') {
    return 'Preparing document...';
  }

  if (outputType === 'xlsx' || outputType === 'csv') {
    return 'Preparing spreadsheet...';
  }

  if (outputType === 'html' || outputType === 'zip') {
    return 'Building web output...';
  }

  if (outputType === 'mp4' || input.selectedSkill === 'Videos') {
    return 'Preparing video output...';
  }

  return 'Thinking...';
};

export const isNearBottom = (input: {
  scrollTop: number;
  clientHeight: number;
  scrollHeight: number;
  threshold?: number;
}) => {
  const threshold = input.threshold ?? 96;
  return input.scrollHeight - (input.scrollTop + input.clientHeight) <= threshold;
};

export const buildAssistantTaskMessage = (task: Task) => {
  const normalizedPrompt = normalizePrompt(task.prompt);
  const outputType = task.requestedOutputType?.toLowerCase() ?? task.downloadItems[0]?.label.split('.').pop()?.toLowerCase() ?? 'file';
  const outputLabel = HUMAN_OUTPUT_NAMES[outputType] ?? outputType.toUpperCase();

  if (task.status === 'waiting_approval') {
    return {
      kind: 'system_status' as const,
      text: `Task "${normalizedPrompt}" menunggu approval operator sebelum dilanjutkan.`,
    };
  }

  if (task.status === 'failed') {
    return {
      kind: 'task_result' as const,
      text: `Saya gagal menyelesaikan permintaan "${normalizedPrompt}". Buka detail task untuk melihat penyebab teknisnya.`,
    };
  }

  if (task.status === 'completed') {
    return {
      kind: 'task_result' as const,
      text: `${toSentenceCase(normalizedPrompt)} sudah siap. Saya lampirkan hasil ${outputLabel}-nya di bawah.`,
    };
  }

  return {
    kind: 'system_status' as const,
    text: getAssistantWorkingLabel({
      selectedSkill: task.agent,
      outputType: task.requestedOutputType,
    }),
  };
};

export const upsertTaskAssistantMessage = (
  messages: ChatMessage[],
  input: {
    taskId: string;
    kind: ChatMessageKind;
    text: string;
    timestamp: string;
  },
) => {
  const existingIndex = messages.findIndex(
    (message) => message.sender === 'assistant' && message.taskId === input.taskId,
  );

  const nextMessage: ChatMessage = {
    id:
      existingIndex >= 0
        ? messages[existingIndex].id
        : `assistant-task-${input.taskId}`,
    sender: 'assistant',
    kind: input.kind,
    text: input.text,
    timestamp: input.timestamp,
    taskId: input.taskId,
  };

  if (existingIndex >= 0) {
    return messages.map((message, index) =>
      index === existingIndex ? { ...message, ...nextMessage } : message,
    );
  }

  return [...messages, nextMessage];
};
