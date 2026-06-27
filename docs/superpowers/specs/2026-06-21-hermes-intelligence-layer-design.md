# Hermes Intelligence Layer Design

## Tujuan

Membangun intelligence layer baru di dalam aplikasi `AI ASSISTENT` agar sistem memiliki pola kerja seperti Hermes Agent tanpa mengganti UI, fitur utama, identitas produk, struktur interaksi pengguna, atau arsitektur aplikasi Next.js yang sudah ada.

Target akhirnya adalah:

- UI workspace yang sekarang tetap menjadi permukaan utama aplikasi.
- Endpoint backend internal menyediakan orchestrator, planner, registry, tool execution, memory, approval, validation, dan retry flow.
- Data, task lifecycle, dan progress UI milik aplikasi ini tetap dipakai, lalu diperluas agar mendukung autonomous execution.
- Referensi dari `D:\Project Apk-Web\hermesagentai\hermes-agent-main` dipakai sebagai sumber konsep, flow, dan pola modular, bukan sebagai runtime dependency langsung.

## Kondisi Sistem Saat Ini

Codebase target berada di `D:\Project Apk-Web\AI ASSISTENT` dan saat ini memiliki:

- App Next.js App Router.
- Workspace UI aktif di `app/workspace/*` dan `components/workspace/*`.
- State utama di `lib/workspace/workspace-context.tsx`.
- Model data awal di `lib/workspace/types.ts`.
- Mock seed di `lib/workspace/mock-data.ts`.
- UI sudah memanggil endpoint:
  - `/api/hermes/overview`
  - `/api/hermes/control`
  - `/api/hermes/control/action`
  - `/api/hermes/tasks`

Masalah utama saat ini:

- Folder `app/api` untuk endpoint Hermes belum ada.
- Task, skill, tool, project, dan progress masih bertumpu pada mock/fallback.
- Belum ada orchestrator, planning engine, approval flow, execution graph, registry, memory, atau audit log yang nyata.

## Prinsip Desain

1. Jangan menyalin Hermes Agent mentah ke aplikasi ini.
2. Jangan mengganti shell UI, route workspace, atau flow pengguna yang sudah ada.
3. Semua kemampuan baru harus masuk lewat layer backend dan service internal.
4. Semua kontrak data baru harus tetap kompatibel dengan model UI yang sekarang.
5. Implementasi awal harus modular, typed, dan siap dipindah dari mock store ke persistence nyata.
6. Tool execution harus aman, punya level risiko, dan dapat dihentikan di approval boundary.

## Batas Arsitektur

### 1. UI Layer

Tetap dikelola oleh sistem yang sudah ada:

- `app/workspace/*`
- `components/workspace/*`
- `lib/workspace/*`

Tanggung jawab:

- menerima input user
- menampilkan task, log, status, artifact, notifikasi
- mem-poll progress runtime pada fase awal dan mendukung upgrade ke subscription-based updates
- memicu action control, approval, retry, cancel

### 2. Intelligence Layer

Layer baru yang akan ditambahkan di dalam codebase ini:

- `app/api/hermes/*`
- `lib/hermes/*`

Tanggung jawab:

- membaca goal pengguna
- menganalisis tujuan
- membuat plan dan subtask
- memilih agent, skill, dan tool
- mengeksekusi langkah secara bertahap
- memvalidasi output
- meminta approval untuk aksi berisiko
- menyimpan memory, event, dan task history
- mengirim progres yang siap dikonsumsi UI

### 3. Hermes Reference Boundary

Repo `D:\Project Apk-Web\hermesagentai\hermes-agent-main` dipakai untuk:

- mempelajari pola orchestrator
- mempelajari pola skill/tool registry
- mempelajari pendekatan permission, approval, retry, memory, logging
- mengambil inspirasi struktur status dan execution flow

Repo tersebut tidak dipakai sebagai:

- dependency runtime langsung
- backend service yang harus dijalankan oleh app ini
- basis rewrite untuk mengganti codebase target

## Flow Kerja Utama

Flow target yang akan diadopsi:

1. User mengirim goal dari `PromptComposer`.
2. UI memanggil `POST /api/hermes/tasks`.
3. API membangun `ExecutionRequest`.
4. `MainOrchestrator` memuat konteks minimum yang relevan.
5. `GoalAnalyzer` mengekstrak:
   - tujuan utama
   - output yang diminta
   - constraint
   - risiko
   - kebutuhan klarifikasi
6. Jika goal belum cukup jelas:
   - task masuk `planning`
   - sistem menghasilkan pesan klarifikasi
   - UI menerima status dan respon assistant
7. Jika goal jelas:
   - `PlanningEngine` membuat plan
   - task dipecah menjadi subtask
   - dependency dan eksekutor dipetakan
8. `AgentRegistry`, `SkillRegistry`, dan `ToolRegistry` memilih executor yang sesuai.
9. `TaskManager` menjalankan subtask berdasarkan dependency graph.
10. `ToolExecutor` mengeksekusi tool yang dibutuhkan melalui `PermissionManager`.
11. Jika action berisiko:
   - sistem membuat `ApprovalRequest`
   - task pindah ke `waiting_approval`
12. Setelah subtask selesai:
   - `ValidationEngine` memeriksa output
13. Jika gagal:
   - `RetryEngine` memutuskan retry, fallback tool, partial replan, atau fail
14. `ProgressTracker` dan `AuditLogger` mencatat seluruh event
15. `OverviewService` mengubah state runtime menjadi bentuk yang cocok untuk UI workspace

## Lifecycle Task

Status utama yang akan dipakai:

- `queued`
- `planning`
- `ready`
- `running`
- `waiting_dependency`
- `waiting_approval`
- `validating`
- `retrying`
- `completed`
- `failed`
- `cancelled`

Status tambahan seperti `researching` atau `generating` akan dipertahankan sebagai `phase`, bukan status utama lifecycle.

Contoh:

- `status: running`
- `phase: researching`

Pendekatan ini menjaga kompatibilitas UI sekarang sambil menambah model runtime yang lebih kuat.

## Komponen Baru

### Core

- `MainOrchestrator`
  - entry point execution untuk task baru
  - memanggil analyzer, planner, dan task manager
- `GoalAnalyzer`
  - menilai intent, output, constraint, dan kebutuhan klarifikasi
- `PlanningEngine`
  - membuat task breakdown, dependency, dan candidate executor
- `TaskManager`
  - mengelola task induk, subtask, dan transisi status
- `ValidationEngine`
  - memvalidasi output per skill dan per jenis hasil
- `RetryEngine`
  - menentukan retry strategy dan batas percobaan

### Registry

- `AgentRegistry`
  - mendeskripsikan agent yang ada di sistem Anda
- `SkillRegistry`
  - mendeskripsikan skill UI sekaligus hints eksekusi
- `ToolRegistry`
  - mendeskripsikan tool, schema, risk level, approval requirement

### Runtime

- `ToolExecutor`
  - eksekusi tool melalui interface seragam
- `PermissionManager`
  - guardrail agent-to-tool access
- `ApprovalManager`
  - approval queue untuk aksi berisiko
- `ProgressTracker`
  - menyusun event dan progress summary
- `AuditLogger`
  - mencatat event yang penting untuk observability dan traceability
- `EventBus`
  - menyalurkan event antar-komponen runtime

### Memory

- `ContextManager`
  - membangun konteks minimum per langkah
- `MemoryManager`
  - menyimpan session summary, task results, decision trail
- `TaskHistoryStore`
  - persistence adapter awal untuk riwayat task

### Service / Adapter

- `HermesTaskService`
- `HermesOverviewService`
- `HermesControlService`
- `WorkspaceAdapter`

Service ini akan mengubah runtime state menjadi bentuk yang sudah dipakai oleh UI sekarang.

## Agent, Skill, dan Tool Strategy

### Agent Registry

Agent yang sudah dikenal UI dipertahankan:

- `Document Agent`
- `Image Agent`
- `Data & Sheets Agent`
- `Project Builder Agent`
- `Video Agent`

Masing-masing agent akan diberi metadata:

- `id`
- `name`
- `capabilities`
- `supportedSkills`
- `supportedOutputs`
- `allowedTools`
- `riskProfile`

### Skill Registry

Skill yang sudah ada dipertahankan:

- `Slides`
- `Documents`
- `Images`
- `Sheets`
- `Websites`
- `Videos`

Skill ditingkatkan dari metadata UI menjadi kontrak eksekusi:

- `defaultAgent`
- `goalPatterns`
- `plannerHints`
- `requiredTools`
- `validationRules`
- `outputFormats`
- `artifactPolicy`

### Tool Registry

Tool awal untuk MVP akan bersifat native TypeScript dan aman:

- `llm.generate_text`
- `filesystem.write_artifact`
- `document.compose_markdown`
- `document.compose_outline`
- `image.generate_stub`
- `sheet.build_dataset`
- `web.build_component_stub`
- `task.request_approval`

Tool berikut akan disiapkan kontraknya tetapi belum semuanya dieksekusi nyata di MVP:

- terminal
- git
- docker
- remote API
- database mutation

Semua tool punya:

- `inputSchema`
- `outputSchema`
- `enabled`
- `riskLevel`
- `requiresApproval`

## Memory dan Context Management

### Context Rules

Sistem tidak akan mengirim seluruh histori percakapan ke model.

Konteks dibagi menjadi:

- `request context`
  - prompt aktif
  - selected skill
  - selected model
  - active project
- `task context`
  - plan
  - subtask status
  - tool outputs relevan
- `execution context`
  - artefak sementara
  - retry count
  - approval state

### Memory Rules

MVP akan memakai persistence sederhana lebih dulu:

- in-memory runtime store
- file-backed JSON store untuk task history dan event trail

Informasi yang disimpan:

- task
- subtask
- event log
- approval request
- final summary
- generated artifact metadata

## Approval, Permission, Validation, dan Retry

### Permission

Permission ditentukan per agent dan per tool.

Contoh:

- `Image Agent` tidak boleh menjalankan tool terminal
- `Project Builder Agent` boleh membuat artifact code, tetapi write ke path sensitif harus lewat approval

### Approval

Approval diwajibkan untuk:

- delete file
- overwrite path penting
- command terminal berisiko
- outbound webhook/post
- database write
- deployment/publish

### Validation

Validation minimal:

- output ada
- output sesuai skill yang diminta
- artifact metadata valid
- error kosong tidak dianggap sukses

### Retry

Retry dibatasi maksimal 2 atau 3 kali dan bisa berupa:

- retry tool yang sama
- fallback ke tool lain
- partial replan
- fail permanen dengan reason yang jelas

## Struktur Data

Entity inti:

### Task

- `id`
- `goal`
- `status`
- `phase`
- `category`
- `projectId`
- `agentId`
- `skillId`
- `summary`
- `progress`
- `attemptCount`
- `approvalState`
- `result`
- `error`
- `createdAt`
- `updatedAt`

### SubTask

- `id`
- `taskId`
- `title`
- `status`
- `dependsOn`
- `agentId`
- `skillId`
- `toolIds`
- `input`
- `output`

### ExecutionEvent

- `id`
- `taskId`
- `type`
- `message`
- `timestamp`
- `metadata`

### ApprovalRequest

- `id`
- `taskId`
- `actionType`
- `reason`
- `payload`
- `status`
- `createdAt`

## Struktur Folder Target

```txt
app/
  api/
    hermes/
      overview/route.ts
      tasks/route.ts
      tasks/[taskId]/route.ts
      tasks/[taskId]/retry/route.ts
      tasks/[taskId]/cancel/route.ts
      control/route.ts
      control/action/route.ts
      approvals/route.ts
      approvals/[approvalId]/respond/route.ts

lib/
  hermes/
    adapters/
      workspace-adapter.ts
      mock-adapter.ts
    contracts/
      agent.ts
      task.ts
      tool.ts
      event.ts
      approval.ts
      memory.ts
    core/
      main-orchestrator.ts
      goal-analyzer.ts
      planning-engine.ts
      task-manager.ts
      validation-engine.ts
      retry-engine.ts
    memory/
      context-manager.ts
      memory-manager.ts
      task-history-store.ts
    registry/
      agent-registry.ts
      skill-registry.ts
      tool-registry.ts
    runtime/
      tool-executor.ts
      approval-manager.ts
      permission-manager.ts
      progress-tracker.ts
      audit-logger.ts
      event-bus.ts
    services/
      hermes-overview-service.ts
      hermes-control-service.ts
      hermes-task-service.ts
    seed/
      agents.ts
      skills.ts
      tools.ts
```

## Tahapan Implementasi

### MVP 1

- buat contracts runtime
- buat registry agent, skill, tool
- buat task manager in-memory
- buat progress tracker dan overview service
- buat endpoint `/api/hermes/overview`
- buat endpoint `/api/hermes/tasks`
- hubungkan UI ke backend internal nyata

### MVP 2

- buat orchestrator, goal analyzer, planning engine
- buat subtask lifecycle
- tambahkan execution event trail
- tambahkan control endpoint untuk skill/tool registry

### MVP 3

- buat permission manager, approval manager, dan approval API
- aktifkan tool executor awal
- aktifkan waiting approval flow di task runtime

### MVP 4

- buat validation engine dan retry engine
- tambahkan context manager dan memory manager
- simpan task history dan artifact metadata

### Hardening

- persistence database nyata
- SSE atau WebSocket untuk live progress
- RBAC
- audit trail permanen
- test coverage lebih luas
- sandbox terminal/tool yang lebih ketat

## Risiko dan Batasan

- Codebase target belum punya backend runtime, jadi MVP awal akan mulai dari in-memory store dan file-backed history.
- Beberapa kemampuan Hermes asli, seperti tool executor yang sangat luas, tidak akan disalin penuh pada fase awal.
- Tool berisiko seperti terminal, git, dan docker sebaiknya hanya dikontrakkan lebih dulu pada MVP, lalu diaktifkan bertahap.
- UI saat ini masih polling; live streaming progress akan datang setelah fondasi task/event stabil.

## Keputusan Implementasi

Keputusan final untuk implementasi:

- gunakan pendekatan hybrid adapter layer
- implementasikan intelligence layer secara native di aplikasi Next.js ini
- pertahankan seluruh UI dan fitur produk yang sudah ada
- adaptasikan flow Hermes ke kontrak TypeScript internal
- mulai dari fondasi orchestration dan task runtime, bukan dari fitur tool berat
