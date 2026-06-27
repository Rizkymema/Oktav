# Claude-Style Chat Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memoles area chat workspace menjadi lebih hangat, editorial, dan premium seperti Claude tanpa mengubah runtime orchestration, approval flow, atau perilaku task yang sudah berjalan.

**Architecture:** Perubahan dibatasi ke lapisan presentasi chat. Gunakan helper presentasi kecil yang pure untuk menjaga class mapping tetap testable, lalu refactor thread shell, bubble, composer, result attachment, dan details panel agar mengikuti hierarki visual baru tanpa mengubah shape data utama.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Vitest, react-dom/server

---

## File Map

- Modify: `components/workspace/WorkspaceInterface.tsx`
  - Menata ulang shell thread, onboarding rhythm, dan sticky composer wrapper.
- Modify: `components/workspace/PromptComposer.tsx`
  - Menurunkan noise visual composer sambil mempertahankan semua kontrol yang ada.
- Modify: `components/workspace/chat/MessageBubble.tsx`
  - Mengubah bubble user/assistant, metadata, code block, dan inline content tone.
- Modify: `components/workspace/chat/AssistantTypingBubble.tsx`
  - Menyamakan typing bubble dengan tone assistant baru.
- Modify: `components/workspace/chat/TaskResultCard.tsx`
  - Mengubah result card menjadi attachment result yang lebih ringan.
- Modify: `components/workspace/chat/TaskDetailsPanel.tsx`
  - Membuat panel detail lebih rapi dan lebih selaras dengan attachment style.
- Create: `lib/workspace/chat/chat-presentation.ts`
  - Pure helper untuk class mapping dan tone selection yang bisa diuji tanpa browser.
- Create: `tests/workspace/chat-presentation.test.ts`
  - Unit test untuk tone helper dan state mapping visual.
- Create: `tests/workspace/chat-components.test.tsx`
  - SSR markup tests untuk memastikan bubble, typing state, dan result attachment tetap merender struktur utama yang diharapkan.
- Create: `tests/workspace/prompt-composer.test.tsx`
  - SSR markup tests dengan mocked workspace context untuk memastikan composer shell lebih tenang.
- Create: `tests/workspace/workspace-interface.test.tsx`
  - SSR markup tests dengan mocked workspace context untuk memastikan shell thread dan onboarding baru dipakai.

### Task 1: Tambah Helper Presentasi yang Testable

**Files:**
- Create: `lib/workspace/chat/chat-presentation.ts`
- Test: `tests/workspace/chat-presentation.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, test } from 'vitest';

import {
  getAttachmentTone,
  getBubbleTone,
  getComposerChrome,
  getThreadShellTone,
} from '@/lib/workspace/chat/chat-presentation';

describe('chat presentation helpers', () => {
  test('returns warm assistant and restrained user bubble tones', () => {
    expect(getBubbleTone({ sender: 'assistant', kind: 'message' })).toMatchObject({
      container: 'border-[#2a2a24]',
      text: 'text-stone-100',
    });
    expect(getBubbleTone({ sender: 'user', kind: 'message' })).toMatchObject({
      container: 'bg-[#1c1b18]',
      text: 'text-stone-50',
    });
  });

  test('keeps error and approval attachments readable without neon glow', () => {
    expect(getAttachmentTone('waiting_approval')).toContain('border-amber-200/30');
    expect(getAttachmentTone('failed')).toContain('border-rose-200/30');
  });

  test('returns calmer shell tones for onboarding and active thread', () => {
    expect(getThreadShellTone('thread')).toContain('from-[#171512]');
    expect(getComposerChrome({ focused: true, dragging: false })).toContain('border-stone-200/18');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/workspace/chat-presentation.test.ts`

Expected: FAIL with `Cannot find module '@/lib/workspace/chat/chat-presentation'`

- [ ] **Step 3: Write minimal implementation**

```ts
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
      container: 'border-rose-200/30 bg-[#2a1718]',
      text: 'text-rose-50',
    };
  }

  if (input.kind === 'system_status') {
    return {
      container: 'border-stone-200/10 bg-[#181714]',
      text: 'text-stone-200',
    };
  }

  if (input.sender === 'user') {
    return {
      container: 'border-[#3a352c] bg-[#1c1b18]',
      text: 'text-stone-50',
    };
  }

  return {
    container: 'border-[#2a2a24] bg-[#141412]',
    text: 'text-stone-100',
  };
};

export const getAttachmentTone = (status: Task['status']) => {
  if (status === 'completed') return 'border-emerald-200/25 bg-emerald-100/[0.06] text-emerald-50';
  if (status === 'failed') return 'border-rose-200/30 bg-rose-100/[0.05] text-rose-50';
  if (status === 'waiting_approval') return 'border-amber-200/30 bg-amber-100/[0.06] text-amber-50';
  return 'border-stone-200/12 bg-white/[0.025] text-stone-100';
};

export const getThreadShellTone = (mode: 'onboarding' | 'thread') =>
  mode === 'onboarding'
    ? 'bg-[radial-gradient(circle_at_top,rgba(120,113,108,0.16),transparent_32%),linear-gradient(180deg,#12110f_0%,#090909_100%)]'
    : 'bg-[radial-gradient(circle_at_top,rgba(120,113,108,0.12),transparent_28%),linear-gradient(180deg,#171512_0%,#0a0a09_100%)]';

export const getComposerChrome = (input: ComposerChromeInput) => {
  if (input.dragging) return 'border-stone-200/22 bg-[#181614]/96 shadow-[0_24px_60px_rgba(0,0,0,0.28)]';
  if (input.focused) return 'border-stone-200/18 bg-[#141311]/96 shadow-[0_18px_45px_rgba(0,0,0,0.24)]';
  return 'border-white/8 bg-[#12110f]/92 shadow-[0_14px_35px_rgba(0,0,0,0.18)]';
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/workspace/chat-presentation.test.ts`

Expected: PASS with `3 passed`

- [ ] **Step 5: Commit**

```bash
git add lib/workspace/chat/chat-presentation.ts tests/workspace/chat-presentation.test.ts
git commit -m "test: add chat presentation helpers"
```

### Task 2: Refactor Bubble, Typing, dan Result Attachment

**Files:**
- Modify: `components/workspace/chat/MessageBubble.tsx`
- Modify: `components/workspace/chat/AssistantTypingBubble.tsx`
- Modify: `components/workspace/chat/TaskResultCard.tsx`
- Modify: `components/workspace/chat/TaskDetailsPanel.tsx`
- Test: `tests/workspace/chat-components.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import AssistantTypingBubble from '@/components/workspace/chat/AssistantTypingBubble';
import MessageBubble from '@/components/workspace/chat/MessageBubble';
import TaskResultCard from '@/components/workspace/chat/TaskResultCard';
import type { ChatMessage, Task } from '@/lib/workspace/types';

const assistantMessage: ChatMessage = {
  id: 'assistant-1',
  sender: 'assistant',
  kind: 'task_result',
  text: 'Dokumen proposal sudah siap. Saya lampirkan hasilnya di bawah.',
  timestamp: '10:15',
  skill: 'Documents',
  model: 'claude-sonnet',
};

const completedTask: Task = {
  id: 'task-1',
  source: 'Workspace',
  status: 'completed',
  category: 'document',
  agent: 'Document Agent',
  prompt: 'buat proposal kerja sama',
  summary: 'Proposal siap diunduh.',
  progress: 100,
  createdTime: '10:10',
  logs: [],
  outputFiles: ['proposal.pdf'],
  downloadItems: [{ label: 'proposal.pdf', url: '/artifacts/proposal.pdf' }],
  requestedOutputType: 'pdf',
};

describe('chat components', () => {
  test('renders assistant message with subtle metadata and warm surface', () => {
    const markup = renderToStaticMarkup(<MessageBubble message={assistantMessage} />);
    expect(markup).toContain('HermesClaw');
    expect(markup).toContain('border-[#2a2a24]');
    expect(markup).toContain('text-stone-400');
  });

  test('renders typing bubble with thinking label', () => {
    const markup = renderToStaticMarkup(<AssistantTypingBubble label="Preparing document..." />);
    expect(markup).toContain('Preparing document...');
    expect(markup).toContain('bg-[#141412]');
  });

  test('renders result card as attachment with open result action', () => {
    const markup = renderToStaticMarkup(<TaskResultCard task={completedTask} />);
    expect(markup).toContain('Open Result');
    expect(markup).toContain('Proposal siap diunduh.');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/workspace/chat-components.test.tsx`

Expected: FAIL because the current markup still uses older cyan-heavy classes and does not match the new structure assertions.

- [ ] **Step 3: Write minimal implementation**

```tsx
// MessageBubble.tsx
import { getBubbleTone } from '@/lib/workspace/chat/chat-presentation';

const tone = getBubbleTone({ sender: message.sender, kind: message.kind });

<div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
  {!isUser && (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-200/12 bg-[#1a1916] text-[10px] font-semibold tracking-[0.18em] text-stone-200">
      HC
    </div>
  )}
  <div className="flex max-w-[min(100%,44rem)] flex-col gap-2">
    <div className="flex flex-wrap items-center gap-2 px-1 text-[11px] text-stone-400">
      <span>{isUser ? 'Anda' : 'HermesClaw'}</span>
      <span>•</span>
      <span>{message.timestamp}</span>
    </div>
    <div className={`w-full rounded-[24px] border px-5 py-4 ${tone.container} ${tone.text}`}>
      <MessageContent text={message.text} />
    </div>
  </div>
</div>
```

```tsx
// AssistantTypingBubble.tsx
<div className="flex gap-3">
  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-200/12 bg-[#1a1916] text-[10px] font-semibold tracking-[0.18em] text-stone-200">
    HC
  </div>
  <div className="max-w-[30rem] rounded-[24px] border border-[#2a2a24] bg-[#141412] px-5 py-4 text-stone-100 shadow-[0_14px_35px_rgba(0,0,0,0.18)]">
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 animate-bounce rounded-full bg-stone-300 [animation-delay:-0.2s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-stone-400/80 [animation-delay:-0.1s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-stone-500/70" />
      </div>
      <span className="text-sm text-stone-300">{label || 'Thinking...'}</span>
    </div>
  </div>
</div>
```

```tsx
// TaskResultCard.tsx
import { getAttachmentTone } from '@/lib/workspace/chat/chat-presentation';

const statusTone = getAttachmentTone(task.status);

<div className="space-y-3 rounded-[24px] border border-white/8 bg-[#12110f] p-4 shadow-[0_14px_35px_rgba(0,0,0,0.18)]">
  <div className="flex flex-wrap items-start justify-between gap-3">
    <div className="space-y-2">
      <div className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${statusTone}`}>
        {task.status.replace('_', ' ')}
      </div>
      <div>
        <p className="text-sm font-medium text-stone-100">{task.summary || task.prompt}</p>
        <p className="mt-1 text-xs text-stone-400">{task.agent}</p>
      </div>
    </div>
  </div>
</div>
```

```tsx
// TaskDetailsPanel.tsx
<div className="rounded-[22px] border border-white/8 bg-[#0f0f0d] p-3">
  <LiveTaskCard task={task} />
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/workspace/chat-components.test.tsx`

Expected: PASS with `3 passed`

- [ ] **Step 5: Commit**

```bash
git add components/workspace/chat/MessageBubble.tsx components/workspace/chat/AssistantTypingBubble.tsx components/workspace/chat/TaskResultCard.tsx components/workspace/chat/TaskDetailsPanel.tsx tests/workspace/chat-components.test.tsx
git commit -m "feat: apply claude-style chat surfaces"
```

### Task 3: Sederhanakan Composer Tanpa Menghilangkan Fitur

**Files:**
- Modify: `components/workspace/PromptComposer.tsx`
- Modify: `lib/workspace/chat/chat-presentation.ts`
- Test: `tests/workspace/prompt-composer.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('@/lib/workspace/workspace-context', () => ({
  useWorkspace: () => ({
    promptInput: 'Buatkan proposal kerja sama yang rapi',
    setPromptInput: vi.fn(),
    selectedSkill: 'Documents',
    setSelectedSkill: vi.fn(),
    selectedModel: 'claude-sonnet',
    setSelectedModel: vi.fn(),
    availableModels: [{ id: 'claude-sonnet', name: 'Claude Sonnet', desc: 'Warm writer', capabilities: ['write'] }],
    selectedOutputType: 'pdf',
    setSelectedOutputType: vi.fn(),
    availableOutputTypes: [{ id: 'pdf', label: 'PDF', desc: 'Portable document' }],
    deepResearchMode: false,
    setDeepResearchMode: vi.fn(),
    researchDepth: 'Standard',
    setResearchDepth: vi.fn(),
    researchScope: 'Web',
    setResearchScope: vi.fn(),
    handleSubmitPrompt: vi.fn(),
  }),
}));

import PromptComposer from '@/components/workspace/PromptComposer';

describe('prompt composer', () => {
  test('renders a calmer writing surface with subdued controls', () => {
    const markup = renderToStaticMarkup(<PromptComposer />);
    expect(markup).toContain('bg-[#12110f]/92');
    expect(markup).toContain('text-stone-100');
    expect(markup).toContain('rounded-full bg-stone-100 text-stone-950');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/workspace/prompt-composer.test.tsx`

Expected: FAIL because the current composer still renders darker cyan-accent chrome and does not contain the calmer stone-toned shell classes.

- [ ] **Step 3: Write minimal implementation**

```tsx
// PromptComposer.tsx
import { getComposerChrome } from '@/lib/workspace/chat/chat-presentation';

const composerChrome = getComposerChrome({ focused: isFocused, dragging: isDragging });
const triggerClassName =
  'flex h-8 items-center gap-1.5 rounded-xl border border-white/8 bg-white/[0.035] px-3 py-1.5 text-xs font-medium text-stone-300 transition hover:bg-white/[0.06] hover:text-stone-100';

<form className={`relative rounded-[28px] border p-3.5 backdrop-blur-xl transition-all duration-300 ${composerChrome}`}>
  <textarea
    className="min-h-[96px] max-h-[220px] w-full resize-none bg-transparent px-4 py-2 text-[15px] leading-7 text-stone-100 placeholder:text-stone-500 focus:outline-none"
  />
  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/8 px-3 pt-3">
    <div className="flex flex-wrap items-center gap-1.5">
      <button type="button" className={triggerClassName}>Output: PDF</button>
      <button type="button" className={triggerClassName}>Goal: Quick Task</button>
      <button type="button" className={triggerClassName}>Deep Research</button>
    </div>
    <div className="flex items-center gap-2">
      <button type="button" className={triggerClassName}>Claude Sonnet</button>
      <button type="submit" className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-950 transition hover:bg-stone-50">
        <Send className="h-4 w-4" />
      </button>
    </div>
  </div>
</form>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/workspace/prompt-composer.test.tsx`

Expected: PASS with `1 passed`

- [ ] **Step 5: Commit**

```bash
git add components/workspace/PromptComposer.tsx lib/workspace/chat/chat-presentation.ts tests/workspace/prompt-composer.test.tsx
git commit -m "feat: simplify workspace composer chrome"
```

### Task 4: Recompose Workspace Thread, Onboarding, dan Sticky Shell

**Files:**
- Modify: `components/workspace/WorkspaceInterface.tsx`
- Modify: `lib/workspace/chat/chat-presentation.ts`
- Test: `tests/workspace/workspace-interface.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import WorkspaceInterface from '@/components/workspace/WorkspaceInterface';

vi.mock('@/lib/workspace/workspace-context', () => ({
  useWorkspace: () => ({
    messages: [
      {
        id: 'assistant-1',
        sender: 'assistant',
        kind: 'task_result',
        text: 'Proposal sudah siap.',
        timestamp: '10:30',
      },
    ],
    tasks: [],
    selectedSkill: null,
    setSelectedSkill: vi.fn(),
    isAssistantTyping: false,
    assistantStatusLabel: null,
  }),
}));

describe('workspace interface', () => {
  test('renders the calmer thread shell and narrower reading width', () => {
    const markup = renderToStaticMarkup(<WorkspaceInterface />);
    expect(markup).toContain('#171512');
    expect(markup).toContain('max-w-3xl');
    expect(markup).toContain('bg-[#12110f]/88');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/workspace/workspace-interface.test.tsx`

Expected: FAIL because the current workspace shell still uses the older radial cyan background and a wider conversation container.

- [ ] **Step 3: Write minimal implementation**

```tsx
// WorkspaceInterface.tsx
import { getThreadShellTone } from '@/lib/workspace/chat/chat-presentation';

const shellTone = getThreadShellTone(messages.length === 0 ? 'onboarding' : 'thread');

return (
  <div className={`relative flex h-full w-full flex-col overflow-hidden ${shellTone}`}>
    <div
      ref={scrollViewportRef}
      onScroll={handleThreadScroll}
      className="flex-1 overflow-y-auto px-4 pb-52 pt-6 md:px-8 md:pb-60 md:pt-8"
    >
      <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col">
        {messages.length === 0 ? <OnboardingState /> : <ConversationThread />}
      </div>
    </div>

    {messages.length > 0 && (
      <>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#0a0a09] via-[#0a0a09]/90 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 px-4 pb-5 md:px-8 md:pb-7">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-[30px] border border-white/8 bg-[#12110f]/88 p-2.5 shadow-[0_18px_45px_rgba(0,0,0,0.18)] backdrop-blur-xl">
              <PromptComposer />
            </div>
          </div>
        </div>
      </>
    )}
  </div>
);
```

```tsx
// ConversationThread within WorkspaceInterface.tsx
<div className="mx-auto flex w-full max-w-3xl flex-col gap-7 pb-8">
  {messages.map((message) => {
    const task = message.taskId ? tasks.find((item) => item.id === message.taskId) : null;
    const isAssistantMessage = message.sender === 'assistant';

    return (
      <div key={message.id} className="space-y-3">
        <MessageBubble message={message} />
        {isAssistantMessage && task && (
          <div className="pl-11">
            <TaskResultCard task={task} />
          </div>
        )}
      </div>
    );
  })}
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/workspace/workspace-interface.test.tsx`

Expected: PASS with `1 passed`

- [ ] **Step 5: Commit**

```bash
git add components/workspace/WorkspaceInterface.tsx lib/workspace/chat/chat-presentation.ts tests/workspace/workspace-interface.test.tsx
git commit -m "feat: recompose workspace chat shell"
```

### Task 5: Full Verification dan Manual QA

**Files:**
- Modify: none
- Test: `tests/workspace/chat-presentation.test.ts`
- Test: `tests/workspace/chat-components.test.tsx`
- Test: `tests/workspace/prompt-composer.test.tsx`
- Test: `tests/workspace/workspace-interface.test.tsx`

- [ ] **Step 1: Run focused workspace tests**

Run: `npx vitest run tests/workspace/chat-helpers.test.ts tests/workspace/chat-presentation.test.ts tests/workspace/chat-components.test.tsx tests/workspace/prompt-composer.test.tsx tests/workspace/workspace-interface.test.tsx tests/workspace/project-runtime.test.ts`

Expected: PASS with all workspace tests green.

- [ ] **Step 2: Run full test suite**

Run: `npm test`

Expected: PASS with all Vitest suites green.

- [ ] **Step 3: Run lint**

Run: `npm run lint`

Expected: PASS with no ESLint errors.

- [ ] **Step 4: Run typecheck**

Run: `npx tsc --noEmit`

Expected: PASS with no TypeScript errors.

- [ ] **Step 5: Run production build**

Run: `npm run build`

Expected: PASS with Next.js production build succeeding.

- [ ] **Step 6: Manual QA checklist**

```md
- Buka `/workspace` dan pastikan onboarding terlihat lebih tenang, tidak neon.
- Kirim prompt baru dan cek bubble user muncul rapi di kanan.
- Pastikan `AssistantTypingBubble` muncul sebelum hasil final.
- Jalankan task yang menghasilkan artifact dan cek result card tampil sebagai attachment, bukan dashboard card besar.
- Cek task `waiting_approval` tetap jelas dan action details masih bisa dibuka.
- Uji mobile width di DevTools dan pastikan bubble tidak terlalu sempit serta composer tidak menutupi pesan terakhir.
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: polish workspace chat experience"
```
