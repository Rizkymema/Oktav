import type { ChatMessageKind, Task } from '@/lib/workspace/types';

type BubbleInput = {
  sender: 'user' | 'assistant';
  kind: ChatMessageKind;
};

type ComposerChromeInput = {
  focused: boolean;
  dragging: boolean;
};

export const getBubbleTone = (input: BubbleInput) => {
  if (input.kind === 'error') {
    return {
      container: 'border-red-200/60',
      surface: 'bg-red-50/50',
      text: 'text-red-700',
    };
  }

  if (input.kind === 'system_status') {
    return {
      container: 'border-slate-200/60',
      surface: 'bg-slate-50/50',
      text: 'text-slate-600',
    };
  }

  if (input.sender === 'user') {
    return {
      container: 'border-transparent bg-indigo-600',
      surface: 'bg-indigo-600',
      text: 'text-white',
    };
  }

  return {
    container: 'border-slate-200',
    surface: 'bg-white',
    text: 'text-slate-800',
  };
};

export const getAttachmentTone = (status: Task['status']) => {
  if (status === 'completed') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (status === 'failed') {
    return 'border-rose-200 bg-rose-50 text-rose-700';
  }

  if (status === 'waiting_approval') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  return 'border-slate-200 bg-slate-50 text-slate-700';
};

export const getThreadShellTone = (mode: 'onboarding' | 'thread') =>
  mode === 'onboarding'
    ? 'bg-white bg-radial-glow'
    : 'bg-white';

export const getComposerChrome = (input: ComposerChromeInput) => {
  if (input.dragging) {
    return 'border-indigo-300 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.10)]';
  }

  if (input.focused) {
    return 'border-slate-300 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]';
  }

  return 'border-slate-200 bg-white shadow-[0_14px_35px_rgba(15,23,42,0.06)]';
};
