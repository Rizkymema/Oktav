# Chat-First Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengubah workspace chat menjadi chat-first AI interface dengan auto-scroll yang benar, typing state, dan result card yang rapi.

**Architecture:** Pisahkan kontrak chat dari task runtime dengan menambah helper state dan komponen chat khusus. Bubble assistant hanya menampilkan percakapan dan hasil ringkas, sementara detail task dipindah ke panel sekunder yang bisa dibuka saat dibutuhkan.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Vitest

---

### Task 1: Add Chat Helper Utilities And Tests

**Files:**
- Create: `lib/workspace/chat/chat-helpers.ts`
- Create: `tests/workspace/chat-helpers.test.ts`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement helper functions for task messaging and scroll heuristics**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

### Task 2: Introduce Chat Message Contracts And Status State

**Files:**
- Modify: `lib/workspace/types.ts`
- Modify: `lib/workspace/workspace-context.tsx`
- Test: `tests/workspace/chat-helpers.test.ts`

- [ ] **Step 1: Add chat message type definitions and pending assistant state**
- [ ] **Step 2: Route prompt submission through typing/working/completed states**
- [ ] **Step 3: Replace duplicate task-complete chat insertion with structured task result message**
- [ ] **Step 4: Run tests**
- [ ] **Step 5: Commit**

### Task 3: Build Chat-First UI Components

**Files:**
- Create: `components/workspace/chat/MessageBubble.tsx`
- Create: `components/workspace/chat/AssistantTypingBubble.tsx`
- Create: `components/workspace/chat/TaskResultCard.tsx`
- Create: `components/workspace/chat/TaskDetailsPanel.tsx`
- Modify: `components/workspace/LiveTaskCard.tsx`

- [ ] **Step 1: Implement assistant/user bubble components**
- [ ] **Step 2: Implement task result card and collapsible details panel**
- [ ] **Step 3: Simplify live task card so it works as secondary details UI**
- [ ] **Step 4: Run targeted tests or lint if no component test harness exists**
- [ ] **Step 5: Commit**

### Task 4: Redesign Workspace Thread Layout And Scroll Behavior

**Files:**
- Modify: `components/workspace/WorkspaceInterface.tsx`
- Modify: `app/globals.css`
- Modify: `components/workspace/PromptComposer.tsx`

- [ ] **Step 1: Create dedicated scroll viewport with stable bottom padding**
- [ ] **Step 2: Add auto-scroll logic that respects user reading older messages**
- [ ] **Step 3: Update sticky composer shell and thread spacing**
- [ ] **Step 4: Run lint/build checks**
- [ ] **Step 5: Commit**

### Task 5: Final Verification

**Files:**
- Modify: `docs/superpowers/specs/2026-06-22-chat-first-workspace-design.md`
- Modify: `docs/superpowers/plans/2026-06-22-chat-first-workspace-plan.md`

- [ ] **Step 1: Run `npm test`**
- [ ] **Step 2: Run `npm run lint`**
- [ ] **Step 3: Run `npm run build`**
- [ ] **Step 4: Fix any remaining regressions**
- [ ] **Step 5: Commit**
