# Hermes Reference Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menyelaraskan capability dan runtime execution project AI ASSISTENT dengan repo `hermes-agent-main` tanpa mengganti UI dan API yang sudah ada.

**Architecture:** Runtime tetap berjalan di dalam Next.js app ini, tetapi registry skill dan keputusan execution mode dihydrate dari reference repo lokal. Control actions akan mengubah registry aktif dan settings yang dipersist ke disk agar restart aman.

**Tech Stack:** Next.js App Router, TypeScript, Vitest, Node.js filesystem APIs.

---

### Task 1: Runtime Settings Persistence

**Files:**
- Create: `lib/hermes/runtime/runtime-settings-store.ts`
- Modify: `lib/hermes/index.ts`
- Test: `tests/hermes/services.test.ts`

- [ ] **Step 1: Write the failing test**

Tambahkan test bahwa update model / install skill tersimpan dan dipakai ulang saat runtime dibuat ulang.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/hermes/services.test.ts`
Expected: FAIL karena settings runtime belum dipersist.

- [ ] **Step 3: Write minimal implementation**

Buat store settings disk-backed lalu hydrate di `createHermesRuntime()`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/hermes/services.test.ts`
Expected: PASS.

### Task 2: Reference Skill Sync To Registry

**Files:**
- Create: `lib/hermes/reference/reference-skill-sync.ts`
- Modify: `lib/hermes/registry/skill-registry.ts`
- Modify: `lib/hermes/services/hermes-control-service.ts`
- Modify: `lib/hermes/index.ts`
- Test: `tests/hermes/reference-skill-sync.test.ts`

- [ ] **Step 1: Write the failing test**

Tambahkan test bahwa install skill reference benar-benar menambah skill aktif ke runtime registry, dan uninstall melepaskannya.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/hermes/reference-skill-sync.test.ts`
Expected: FAIL karena registry masih statis.

- [ ] **Step 3: Write minimal implementation**

Tambahkan mapper skill referensi -> `HermesSkillDefinition`, registry mutable, dan control action yang menyinkronkan state ke registry aktif.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/hermes/reference-skill-sync.test.ts`
Expected: PASS.

### Task 3: Execution Routing Alignment

**Files:**
- Modify: `lib/hermes/core/main-orchestrator.ts`
- Test: `tests/hermes/orchestrator.test.ts`

- [ ] **Step 1: Write the failing test**

Tambahkan test selector execution mode untuk `auto`, `native`, `reference`, termasuk fallback test-mode.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/hermes/orchestrator.test.ts`
Expected: FAIL karena selector sekarang selalu native.

- [ ] **Step 3: Write minimal implementation**

Implementasikan resolver execution mode berbasis env + keberadaan reference root + selected skill/capability.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/hermes/orchestrator.test.ts`
Expected: PASS.

### Task 4: Dynamic Task Skill Resolution

**Files:**
- Modify: `app/api/hermes/tasks/route.ts`
- Modify: `lib/hermes/services/hermes-task-service.ts`
- Test: `tests/hermes/api.test.ts`

- [ ] **Step 1: Write the failing test**

Tambahkan test submit task dengan selected skill reference yang terpasang dan pastikan kategori/output tetap resolve dengan benar.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/hermes/api.test.ts`
Expected: FAIL karena route masih inferensi skill/category hardcoded.

- [ ] **Step 3: Write minimal implementation**

Tambahkan resolver skill/category berbasis runtime registry aktif.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/hermes/api.test.ts`
Expected: PASS.

### Task 5: Full Verification

**Files:**
- Verify only

- [ ] **Step 1: Run unit tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Run production build**

Run: `npm run build`
Expected: PASS.
