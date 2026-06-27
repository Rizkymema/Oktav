# Hermes Intelligence Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan intelligence layer bergaya Hermes ke aplikasi `AI ASSISTENT` dengan tetap mempertahankan UI workspace, model fitur, dan alur pengguna yang sudah ada.

**Architecture:** Implementasi dilakukan secara native di Next.js melalui endpoint `app/api/hermes/*` dan runtime modular di `lib/hermes/*`. Runtime memakai registry, orchestrator, planner, in-memory task store, approval flow, validation, retry, dan adapter yang mengubah state runtime menjadi format yang sudah dipakai oleh `workspace-context`.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5, Tailwind CSS, Node.js runtime route handlers, Vitest untuk unit test runtime dan service.

---

## File Structure

### Runtime baru

- Create: `lib/hermes/contracts/agent.ts`
- Create: `lib/hermes/contracts/task.ts`
- Create: `lib/hermes/contracts/tool.ts`
- Create: `lib/hermes/contracts/event.ts`
- Create: `lib/hermes/contracts/approval.ts`
- Create: `lib/hermes/contracts/memory.ts`
- Create: `lib/hermes/seed/agents.ts`
- Create: `lib/hermes/seed/skills.ts`
- Create: `lib/hermes/seed/tools.ts`
- Create: `lib/hermes/registry/agent-registry.ts`
- Create: `lib/hermes/registry/skill-registry.ts`
- Create: `lib/hermes/registry/tool-registry.ts`
- Create: `lib/hermes/runtime/event-bus.ts`
- Create: `lib/hermes/runtime/audit-logger.ts`
- Create: `lib/hermes/runtime/progress-tracker.ts`
- Create: `lib/hermes/runtime/permission-manager.ts`
- Create: `lib/hermes/runtime/approval-manager.ts`
- Create: `lib/hermes/runtime/tool-executor.ts`
- Create: `lib/hermes/memory/context-manager.ts`
- Create: `lib/hermes/memory/task-history-store.ts`
- Create: `lib/hermes/memory/memory-manager.ts`
- Create: `lib/hermes/core/goal-analyzer.ts`
- Create: `lib/hermes/core/planning-engine.ts`
- Create: `lib/hermes/core/validation-engine.ts`
- Create: `lib/hermes/core/retry-engine.ts`
- Create: `lib/hermes/core/task-manager.ts`
- Create: `lib/hermes/core/main-orchestrator.ts`
- Create: `lib/hermes/adapters/workspace-adapter.ts`
- Create: `lib/hermes/services/hermes-overview-service.ts`
- Create: `lib/hermes/services/hermes-control-service.ts`
- Create: `lib/hermes/services/hermes-task-service.ts`
- Create: `lib/hermes/index.ts`

### API

- Create: `app/api/hermes/overview/route.ts`
- Create: `app/api/hermes/control/route.ts`
- Create: `app/api/hermes/control/action/route.ts`
- Create: `app/api/hermes/tasks/route.ts`
- Create: `app/api/hermes/tasks/[taskId]/route.ts`
- Create: `app/api/hermes/tasks/[taskId]/retry/route.ts`
- Create: `app/api/hermes/tasks/[taskId]/cancel/route.ts`
- Create: `app/api/hermes/approvals/route.ts`
- Create: `app/api/hermes/approvals/[approvalId]/respond/route.ts`

### Workspace integration

- Modify: `lib/workspace/types.ts`
- Modify: `lib/workspace/workspace-context.tsx`
- Modify: `components/workspace/LiveTaskCard.tsx`
- Modify: `lib/workspace/mock-data.ts`

### Testing

- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `tests/hermes/task-manager.test.ts`
- Create: `tests/hermes/orchestrator.test.ts`
- Create: `tests/hermes/services.test.ts`
- Create: `tests/hermes/api.test.ts`

---

### Task 1: Siapkan Infrastruktur Test dan Kontrak Runtime

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `lib/hermes/contracts/agent.ts`
- Create: `lib/hermes/contracts/task.ts`
- Create: `lib/hermes/contracts/tool.ts`
- Create: `lib/hermes/contracts/event.ts`
- Create: `lib/hermes/contracts/approval.ts`
- Create: `lib/hermes/contracts/memory.ts`
- Test: `tests/hermes/task-manager.test.ts`

- [ ] **Step 1: Tulis failing test untuk task store dasar**
- [ ] **Step 2: Jalankan test untuk memastikan gagal karena modul runtime belum ada**
- [ ] **Step 3: Tambahkan script test dan konfigurasi Vitest**
- [ ] **Step 4: Implementasikan contracts typed untuk task, subtask, event, approval, tool, skill, dan memory**
- [ ] **Step 5: Jalankan test lagi sampai lulus**

### Task 2: Bangun Registry dan Seed Bergaya Hermes

**Files:**
- Create: `lib/hermes/seed/agents.ts`
- Create: `lib/hermes/seed/skills.ts`
- Create: `lib/hermes/seed/tools.ts`
- Create: `lib/hermes/registry/agent-registry.ts`
- Create: `lib/hermes/registry/skill-registry.ts`
- Create: `lib/hermes/registry/tool-registry.ts`
- Test: `tests/hermes/orchestrator.test.ts`

- [ ] **Step 1: Tulis failing test untuk lookup agent, skill, dan tool**
- [ ] **Step 2: Jalankan test dan verifikasi kegagalan yang benar**
- [ ] **Step 3: Implementasikan seed registry berdasarkan skill dan agent yang sudah ada di UI**
- [ ] **Step 4: Tambahkan metadata planner hints, validation rules, dan risk level tool**
- [ ] **Step 5: Jalankan test sampai lulus**

### Task 3: Implementasikan Task Runtime, Event Bus, Memory, Approval, dan Tool Executor

**Files:**
- Create: `lib/hermes/runtime/event-bus.ts`
- Create: `lib/hermes/runtime/audit-logger.ts`
- Create: `lib/hermes/runtime/progress-tracker.ts`
- Create: `lib/hermes/runtime/permission-manager.ts`
- Create: `lib/hermes/runtime/approval-manager.ts`
- Create: `lib/hermes/runtime/tool-executor.ts`
- Create: `lib/hermes/memory/context-manager.ts`
- Create: `lib/hermes/memory/task-history-store.ts`
- Create: `lib/hermes/memory/memory-manager.ts`
- Create: `lib/hermes/core/task-manager.ts`
- Test: `tests/hermes/task-manager.test.ts`

- [ ] **Step 1: Tulis failing test untuk create task, append event, update status, retry count, cancel, dan approval queue**
- [ ] **Step 2: Jalankan test dan pastikan gagal**
- [ ] **Step 3: Implementasikan in-memory task manager, event bus, progress tracker, approval manager, memory manager, dan persistence file sederhana**
- [ ] **Step 4: Implementasikan tool executor awal dengan tool aman dan approval boundary**
- [ ] **Step 5: Jalankan test sampai lulus**

### Task 4: Implementasikan Goal Analyzer, Planner, Validation, Retry, dan Orchestrator

**Files:**
- Create: `lib/hermes/core/goal-analyzer.ts`
- Create: `lib/hermes/core/planning-engine.ts`
- Create: `lib/hermes/core/validation-engine.ts`
- Create: `lib/hermes/core/retry-engine.ts`
- Create: `lib/hermes/core/main-orchestrator.ts`
- Test: `tests/hermes/orchestrator.test.ts`

- [ ] **Step 1: Tulis failing test untuk flow submit goal menjadi task breakdown**
- [ ] **Step 2: Tulis failing test untuk clarification, approval-required flow, successful completion, dan retry**
- [ ] **Step 3: Jalankan test dan verifikasi semua failure berasal dari fitur yang belum ada**
- [ ] **Step 4: Implementasikan analyzer, planner, validator, retry, dan orchestrator menggunakan registry/runtime yang sudah dibuat**
- [ ] **Step 5: Jalankan test sampai lulus**

### Task 5: Tambahkan Service Layer dan API Facade

**Files:**
- Create: `lib/hermes/adapters/workspace-adapter.ts`
- Create: `lib/hermes/services/hermes-overview-service.ts`
- Create: `lib/hermes/services/hermes-control-service.ts`
- Create: `lib/hermes/services/hermes-task-service.ts`
- Create: `lib/hermes/index.ts`
- Create: `app/api/hermes/overview/route.ts`
- Create: `app/api/hermes/control/route.ts`
- Create: `app/api/hermes/control/action/route.ts`
- Create: `app/api/hermes/tasks/route.ts`
- Create: `app/api/hermes/tasks/[taskId]/route.ts`
- Create: `app/api/hermes/tasks/[taskId]/retry/route.ts`
- Create: `app/api/hermes/tasks/[taskId]/cancel/route.ts`
- Create: `app/api/hermes/approvals/route.ts`
- Create: `app/api/hermes/approvals/[approvalId]/respond/route.ts`
- Test: `tests/hermes/services.test.ts`
- Test: `tests/hermes/api.test.ts`

- [ ] **Step 1: Tulis failing test untuk overview, control, task submit, retry, cancel, approval list, dan approval response**
- [ ] **Step 2: Jalankan test dan verifikasi kegagalan**
- [ ] **Step 3: Implementasikan adapter yang mengubah runtime state ke bentuk `workspace-context`**
- [ ] **Step 4: Implementasikan semua route handler Node runtime**
- [ ] **Step 5: Jalankan test sampai lulus**

### Task 6: Hubungkan Workspace UI ke Runtime Nyata

**Files:**
- Modify: `lib/workspace/types.ts`
- Modify: `lib/workspace/workspace-context.tsx`
- Modify: `components/workspace/LiveTaskCard.tsx`
- Modify: `lib/workspace/mock-data.ts`

- [ ] **Step 1: Tulis failing test atau type-level expectation untuk status task baru**
- [ ] **Step 2: Perluas union status dan phase agar kompatibel dengan runtime baru**
- [ ] **Step 3: Sesuaikan context agar support detail task, approval refresh, retry, dan cancel yang berasal dari API nyata**
- [ ] **Step 4: Sesuaikan `LiveTaskCard` agar status baru tetap tampil benar dan cancel memakai API**
- [ ] **Step 5: Jalankan test sampai lulus**

### Task 7: Verifikasi Akhir

**Files:**
- None

- [ ] **Step 1: Jalankan `npm run test`**
- [ ] **Step 2: Jalankan `npm run lint`**
- [ ] **Step 3: Jalankan `npx tsc --noEmit`**
- [ ] **Step 4: Jalankan `npm run build`**
- [ ] **Step 5: Catat gap, limitasi, dan pekerjaan lanjut jika ada**

---

## Self-Review

- Spec coverage:
  - arsitektur layer -> Task 1-5
  - flow eksekusi -> Task 3-5
  - registry agent/skill/tool -> Task 2
  - memory/context -> Task 3
  - approval/permission -> Task 3 dan 5
  - retry/validation -> Task 4
  - API dan folder -> Task 5
  - integrasi UI -> Task 6
- Placeholder scan:
  - tidak ada TODO/TBD
- Type consistency:
  - semua runtime entity diikat lebih dulu di Task 1 agar task berikutnya mengacu pada nama tipe yang sama
