# PROMPT UI/UX — HERMES ALL-IN-ONE AI WORKSPACE

Bertindak sebagai:

* Senior SaaS Product Designer
* Senior UI/UX Designer
* AI Workspace Product Architect
* Design System Specialist
* Senior Next.js Frontend Engineer
* Human–AI Interaction Designer

Tugas Anda adalah merancang dan mengimplementasikan UI/UX untuk halaman baru bernama:

# Hermes AI Workspace

Hermes AI Workspace adalah platform **All-in-One AI Agent berbasis Deep Research dan Multi-Agent Orchestration**.

Workspace ini menjadi pusat kerja pengguna untuk memberikan perintah kepada Hermes Core, memilih kemampuan AI berdasarkan format, membuat proyek, menjadwalkan pekerjaan, menghubungkan channel komunikasi, mengelola file lokal, melihat progres agent, dan mengunduh hasil pekerjaan.

Gunakan platform AI productivity modern sebagai referensi pola UX, tetapi jangan menyalin:

* Logo
* Nama produk
* Ilustrasi
* Aset visual
* Warna brand
* Layout pixel-per-pixel
* Identitas produk pihak lain

Gunakan identitas asli:

```text
Product: Hermes AI Workspace
Main Assistant: HermesClaw
Main Orchestrator: Hermes Core
```

---

# 1. TUJUAN PRODUK

Bangun sebuah AI workspace premium yang memungkinkan pengguna:

1. Mengirim prompt kepada HermesClaw.
2. Menentukan Goal atau tujuan pekerjaan.
3. Mengaktifkan Deep Research.
4. Memilih skill berdasarkan format output.
5. Memilih model AI secara otomatis atau manual.
6. Menghubungkan tools dan sumber data.
7. Membuat project baru.
8. Melihat riwayat project.
9. Menjalankan scheduled task.
10. Menggunakan template project.
11. Menghubungkan WhatsApp, Telegram, Discord, Slack, dan Line.
12. Mengakses file lokal melalui Desktop Access.
13. Memantau kredit, token, dan pemakaian model.
14. Melihat proses pekerjaan Hermes secara real-time.
15. Melihat dan mengunduh hasil pekerjaan.
16. Berpindah ke Virtual Office dan Control Center.

Halaman utama tersedia pada route:

```text
/workspace
```

---

# 2. FITUR UTAMA PRODUK

## 2.1 HermesClaw AI Assistant

HermesClaw adalah asisten utama pada workspace.

HermesClaw bertugas:

* Menerima prompt pengguna.
* Memahami tujuan pengguna.
* Menentukan skill yang sesuai.
* Memilih agent pelaksana.
* Memilih model AI.
* Menggunakan tools.
* Mengaktifkan Deep Research.
* Membuat task.
* Menampilkan progress.
* Menampilkan output.

HermesClaw tidak menjalankan seluruh task sendiri.

Hermes Core bertindak sebagai orchestrator yang membagi task ke agent khusus.

Contoh agent:

```text
Hermes Core
Project Builder Agent
Document Agent
Code Agent
Image Agent
Video Agent
Data & Sheets Agent
Research Agent
QA & Validation Agent
Security Agent
DevOps Agent
Knowledge Base Agent
```

---

## 2.2 Goal Mode

Sediakan tombol `Goal` pada prompt composer.

Pilihan Goal:

```text
Quick Task
Deep Research
Create Content
Build Project
Analyze Data
Automate Workflow
Improve Existing Work
Solve a Problem
```

Ketika Goal dipilih:

* Placeholder prompt berubah.
* Skill rekomendasi berubah.
* Template rekomendasi berubah.
* Agent rekomendasi berubah.
* Estimasi durasi ditampilkan.
* Tingkat kedalaman pekerjaan berubah.

Contoh:

```text
Goal: Deep Research
Recommended Agent: Research Agent
Recommended Output: Document
Estimated Duration: 5–15 minutes
```

---

## 2.3 Deep Research Mode

Sediakan mode khusus untuk pekerjaan yang memerlukan riset mendalam.

Fitur UI:

* Toggle Deep Research.
* Research depth.
* Source scope.
* Citation preference.
* Output format.
* Estimated execution time.
* Source validation.
* Research progress.

Pilihan Research Depth:

```text
Quick
Standard
Deep
Expert
```

Pilihan Source Scope:

```text
Web
Uploaded Files
Knowledge Base
Connected Tools
All Available Sources
```

Saat Deep Research aktif, tampilkan tahapan:

```text
Understanding research goal
Creating research plan
Collecting sources
Validating information
Comparing findings
Generating report
Reviewing citations
Finalizing output
```

Jangan tampilkan chain-of-thought internal.

Tampilkan hanya operational progress yang aman.

---

# 3. SKILLS BERDASARKAN FORMAT

Tampilkan skill utama sebagai pill button atau card.

Skill wajib:

## 3.1 Slides

Kemampuan:

* Membuat presentasi.
* Mengedit presentasi.
* Membuat pitch deck.
* Membuat storyboard.
* Membuat training deck.
* Mengubah dokumen menjadi slide.
* Membuat visual presentation.

Agent utama:

```text
Document Agent
Design Agent
Research Agent
```

---

## 3.2 Documents

Kemampuan:

* Membuat proposal.
* Membuat laporan.
* Membuat business plan.
* Membuat kontrak draft.
* Membuat SOP.
* Membuat artikel.
* Membuat dokumen riset.
* Mengubah file ke PDF atau DOCX.

Agent utama:

```text
Document Agent
Research Agent
Knowledge Base Agent
```

---

## 3.3 Images

Kemampuan:

* Membuat gambar.
* Mengedit gambar.
* Membuat poster.
* Membuat desain social media.
* Membuat product visual.
* Membuat thumbnail.
* Membuat storyboard.

Agent utama:

```text
Image Agent
Design Agent
Project Builder Agent
```

---

## 3.4 Sheets

Kemampuan:

* Membaca spreadsheet.
* Membersihkan data.
* Menganalisis tabel.
* Membuat laporan finansial.
* Membuat proyeksi cash flow.
* Membuat dashboard data.
* Membuat formula.
* Mengekspor CSV atau XLSX.

Agent utama:

```text
Data & Sheets Agent
Research Agent
Knowledge Base Agent
```

---

## 3.5 Websites

Kemampuan:

* Membuat website.
* Membuat landing page.
* Menganalisis website.
* Membuat company profile.
* Mengedit halaman web.
* Membuat dashboard.
* Menjalankan website research.
* Membuat source code.

Agent utama:

```text
Project Builder Agent
Code Agent
QA & Validation Agent
DevOps Agent
```

---

## 3.6 Videos

Kemampuan:

* Membuat konsep video.
* Membuat script.
* Membuat storyboard.
* Membuat prompt text-to-video.
* Membuat image-to-video workflow.
* Mengedit struktur video.
* Membuat subtitle.
* Membuat shot list.

Agent utama:

```text
Video Agent
Image Agent
Document Agent
```

---

## 3.7 All Skills

Ketika dipilih, Hermes Core dapat menggabungkan beberapa skill.

Contoh:

```text
Deep Research
→ Document
→ Slides
→ Images
→ Website
```

---

# 4. STRUKTUR LAYOUT UTAMA

Gunakan layout:

```text
┌──────────────────────────────────────────────────────────────┐
│ Global Topbar                                                │
├──────┬──────────────────────┬────────────────────────────────┤
│ Icon │ Navigation Sidebar   │ Main AI Workspace              │
│ Rail │                      │                                │
│      │                      │                                │
└──────┴──────────────────────┴────────────────────────────────┘
```

Ukuran desktop:

```text
Topbar: 64px
Icon rail: 72px
Sidebar: 280px
Main content: fluid
Maximum content width: 1440px
```

Sidebar harus dapat di-collapse.

---

# 5. VISUAL DIRECTION

Desain harus terlihat:

* Premium SaaS.
* Modern.
* Clean.
* Profesional.
* Tenang.
* Produktif.
* Tidak terlalu ramai.
* Mudah digunakan pengguna baru.
* Nyaman digunakan dalam waktu lama.
* Setara produk AI productivity global.

Gunakan konsep:

```text
Dark professional SaaS
+ subtle glass surfaces
+ soft borders
+ layered depth
+ restrained futuristic accents
+ excellent readability
```

Hindari:

* Neon berlebihan.
* Gradient berlebihan.
* Border pada seluruh elemen.
* Animasi berlebihan.
* UI seperti game.
* Glow yang terlalu terang.
* Warna terlalu banyak.
* Layout terlalu padat.
* Menyalin desain platform lain secara identik.

---

# 6. DESIGN TOKENS

## Background

```text
App background:       #090B10
Topbar:               #10131A
Icon rail:            #0D1016
Sidebar:              #12161E
Panel:                #161B24
Elevated panel:       #1B212C
Input:                #181D27
Hover:                #222936
```

## Border

```text
Default: rgba(255,255,255,0.08)
Hover: rgba(255,255,255,0.14)
Active: rgba(99,102,241,0.60)
```

## Text

```text
Primary: #F5F7FB
Secondary: #A8B0BF
Muted: #727C8D
Disabled: #4E5663
```

## Accent

```text
Primary: #6366F1
Primary Hover: #7477FF
Secondary: #22D3EE
Success: #22C55E
Warning: #F59E0B
Danger: #EF4444
```

## Radius

```text
Small: 8px
Medium: 12px
Large: 16px
Extra Large: 22px
```

Gunakan accent hanya untuk:

* Active navigation.
* Primary CTA.
* Skill aktif.
* Focus ring.
* Progress.
* Status penting.

---

# 7. GLOBAL TOPBAR

## Bagian kiri

Tampilkan:

* Logo Hermes.
* Nama `Hermes Workspace`.
* Badge `Beta`.
* Sidebar toggle.
* Workspace switcher.

## Bagian kanan

Tampilkan:

* Hermes Gateway status.
* Virtual Office button.
* Control Center button.
* Desktop Access button.
* Notification button.
* Credits.
* Upgrade button opsional.
* User avatar.
* Profile menu.

Gateway status:

```text
Connected
Reconnecting
Offline
```

Gunakan titik status kecil dan tooltip.

---

# 8. ICON RAIL

Menu:

```text
Workspace
Virtual Office
Tasks
Projects
Agents
Outputs
Search
Help
Settings
```

Aturan:

* Icon outline.
* Tooltip saat hover.
* Active indicator.
* Badge jika ada notifikasi.
* Tidak menampilkan label permanen.

---

# 9. NAVIGATION SIDEBAR

## 9.1 Primary Menu

Tampilkan:

```text
New Project
Explore Skills
Scheduled Tasks
Projects
```

### New Project

Membuat workspace project baru.

Modal berisi:

* Project name.
* Project description.
* Default skill.
* Goal.
* Connected tools.
* Project folder.
* Knowledge source.
* Default agent.

### Explore Skills

Menampilkan katalog seluruh skill.

Filter:

* Content.
* Research.
* Coding.
* Data.
* Design.
* Automation.
* Productivity.

### Scheduled Tasks

Menampilkan:

* Active schedule.
* Upcoming schedule.
* Completed schedule.
* Failed schedule.
* Calendar view.
* List view.

### Projects

Menampilkan:

* Active.
* Draft.
* Completed.
* Failed.
* Archived.

---

## 9.2 Project History

Tampilkan daftar project terbaru.

Setiap item:

* Nama project.
* Skill.
* Status.
* Progress.
* Last update.
* Agent aktif.
* Context menu.

Status:

```text
Draft
Queued
Running
Waiting Approval
Completed
Failed
```

Tambahkan:

* Search.
* Filter.
* Pin.
* Rename.
* Duplicate.
* Archive.
* Delete dengan konfirmasi.

---

## 9.3 Connect IM Channel

Tampilkan icon:

```text
WhatsApp
Telegram
Discord
Slack
Line
```

Status:

```text
Connected
Not Connected
Error
Reconnecting
```

Klik icon membuka modal.

Modal channel berisi:

* Channel name.
* Connection status.
* Account.
* Bot name.
* Webhook status.
* Last activity.
* Connect button.
* Disconnect button.
* Test connection.
* Permission summary.

Jangan menyimpan credential rahasia di frontend.

---

## 9.4 Sidebar Footer

Tampilkan:

* Daily credits.
* Monthly credits.
* Storage usage.
* Current plan.
* Desktop connection.
* Settings.

---

# 10. MAIN HERO AREA

Tampilkan avatar HermesClaw.

Copy utama:

```text
Hi, I’m HermesClaw
```

Tagline:

```text
Your AI team is ready to research, create, analyze, and build.
```

Versi Indonesia:

```text
Tim AI Anda siap melakukan riset, membuat konten, menganalisis data, dan membangun project.
```

Background:

* Grid sangat halus.
* Radial light lembut.
* Tidak mengganggu keterbacaan.
* Tidak menggunakan glow kuat.

---

# 11. OMNI PROMPT COMPOSER

Prompt composer adalah pusat halaman.

Karakteristik:

* Panel besar.
* Radius 20–24px.
* Tinggi awal 180px.
* Auto-grow.
* Drag-and-drop.
* Paste image.
* Upload file.
* Multi-line.
* Sticky action row.

Placeholder:

```text
Tell Hermes what you want to research, create, analyze, automate, or build...
```

Versi Indonesia:

```text
Jelaskan apa yang ingin Anda riset, buat, analisis, otomatisasi, atau bangun bersama Hermes...
```

---

## 11.1 Attach Button

Menu:

```text
Upload File
Upload Image
Add Project File
Add Folder
Add URL
Connect Google Drive
Connect Local Desktop
```

Tampilkan attachment preview:

* File name.
* Type.
* Size.
* Remove.
* Upload progress.

---

## 11.2 Goal Button

Pilihan:

```text
Quick Task
Deep Research
Create Content
Build Project
Analyze Data
Automate Workflow
Improve Existing Work
Solve a Problem
```

Goal aktif ditampilkan sebagai pill.

---

## 11.3 Connect Tools

Tampilkan tools:

```text
Google Drive
Google Sheets
GitHub
Browser
Database
Knowledge Base
WhatsApp
Telegram
Local Files
API
Webhook
```

Setiap tool mempunyai:

* Icon.
* Connected state.
* Permission.
* Last sync.
* Configure action.

---

## 11.4 Skills Button

Menampilkan skill aktif.

Pengguna dapat memilih satu atau beberapa skill.

Contoh:

```text
Documents
Slides
Images
Websites
```

Jika lebih dari dua skill dipilih, tampilkan:

```text
Documents +2
```

---

## 11.5 Auto Model

Default:

```text
Auto Model
```

Auto Model memilih model berdasarkan:

* Jenis task.
* Skill.
* Goal.
* Complexity.
* Speed.
* Cost.
* Availability.
* Context length.

Pilihan UI:

```text
Auto Model
Fast
Balanced
High Quality
Local Model
Custom Model
```

Setiap pilihan menampilkan:

* Speed.
* Quality.
* Cost.
* Best use case.
* Recommended badge.

Nama model spesifik harus berasal dari konfigurasi backend, bukan hardcoded.

---

## 11.6 Send Action

Tombol send:

* Disabled saat prompt kosong.
* Loading saat submit.
* Error state jika gateway gagal.
* Shortcut tooltip.

Shortcut:

```text
Enter = Send
Shift + Enter = New Line
```

---

# 12. QUICK SKILLS SECTION

Tampilkan tombol:

```text
Slides
Documents
Images
Sheets
Websites
Videos
All Skills
```

Setiap skill memiliki:

* Icon.
* Label.
* Tooltip.
* Selected state.
* Hover state.
* Keyboard focus.
* Description singkat.

Ketika skill dipilih:

1. Placeholder berubah.
2. Template berubah.
3. Goal rekomendasi berubah.
4. Agent rekomendasi berubah.
5. Output format berubah.

---

# 13. EXPLORE SKILLS PAGE

Buat halaman:

```text
/workspace/skills
```

Tampilkan katalog skill.

Setiap skill card:

* Skill name.
* Description.
* Category.
* Agent.
* Supported inputs.
* Supported outputs.
* Required tools.
* Example prompts.
* Limitations.
* Estimated credits.
* Use Skill button.

Tambahkan section:

```text
Best Practices
Limitations
Recommended Inputs
Example Outputs
```

Tujuannya agar pengguna memahami kemampuan skill sebelum menjalankan project kompleks.

---

# 14. TRENDING PROJECTS DAN TEMPLATE

Tampilkan section:

```text
Trending Projects
```

Template awal:

```text
Startup Pitch Deck
Business Plan
Cash Flow Estimation
Product Cost Accounting
Promotional Poster
A/B Testing Analysis
Meeting Agenda
Research Report
Social Media Campaign
Landing Page
Company Profile
AI Automation Workflow
```

Setiap card mempunyai:

* Thumbnail.
* Category.
* Title.
* Description.
* Estimated time.
* Estimated credits.
* Required skill.
* Recommended agent.
* Use Template.
* Preview.

Saat template dipilih:

1. Skill otomatis aktif.
2. Goal otomatis aktif.
3. Prompt template dimasukkan.
4. Tool rekomendasi tampil.
5. Prompt tidak langsung dijalankan.
6. Fokus kembali ke composer.

---

# 15. PROJECT MANAGEMENT

## 15.1 New Project

Flow:

```text
Click New Project
→ Enter project name
→ Select goal
→ Select skills
→ Select tools
→ Select output
→ Create workspace
```

Project detail menampilkan:

* Project overview.
* Chat history.
* Files.
* Outputs.
* Tasks.
* Agents.
* Tools.
* Sources.
* Schedule.
* Activity.
* Settings.

---

## 15.2 Project History

Tampilkan history pada sidebar dan halaman khusus.

Route:

```text
/workspace/projects
/workspace/projects/[projectId]
```

Filter:

* Status.
* Skill.
* Agent.
* Date.
* Source.
* Project type.

Sorting:

* Latest.
* Oldest.
* Name.
* Progress.
* Credits.
* Duration.

---

## 15.3 Project Detail

Tabs:

```text
Chat
Overview
Tasks
Files
Outputs
Agents
Research Sources
Execution
Schedule
Activity
Settings
```

---

# 16. SCHEDULED TASKS

Route:

```text
/workspace/scheduled
```

Fitur:

* Create schedule.
* Edit schedule.
* Pause.
* Resume.
* Run now.
* Duplicate.
* Delete.
* View history.

Trigger:

```text
One Time
Hourly
Daily
Weekly
Monthly
Custom Cron
Event Trigger
Webhook Trigger
```

Form:

* Task name.
* Prompt.
* Skill.
* Goal.
* Agent.
* Tools.
* Project.
* Date.
* Time.
* Timezone.
* Repeat.
* Notification.
* Retry.
* Output destination.

Contoh:

```text
Setiap Senin pukul 08:00
Ambil data analitik
Gunakan Skill Sheets
Buat ringkasan
Kirim melalui Telegram
```

---

# 17. CONNECT IM CHANNEL

Buat halaman atau modal:

```text
/workspace/channels
```

Channel:

* WhatsApp.
* Telegram.
* Discord.
* Slack.
* Line.

Setiap channel card:

* Logo.
* Status.
* Connected account.
* Last sync.
* Active automation.
* Incoming messages.
* Error count.
* Configure.
* Disconnect.
* Test.

Connection flow:

```text
Select Channel
→ Show Requirements
→ Enter Configuration
→ Authorize
→ Test Connection
→ Set Permissions
→ Activate
```

Permission examples:

* Read messages.
* Send messages.
* Receive files.
* Create task.
* Send result.
* Access group.
* Require approval.

---

# 18. DESKTOP ACCESS

Sediakan halaman atau modal:

```text
/workspace/desktop
```

Tujuan:

* Menghubungkan file lokal.
* Sinkronisasi folder.
* Mengirim file ke Hermes.
* Membuka output di komputer.
* Memantau status desktop connector.

Tampilkan:

* Download Desktop App.
* Operating system.
* Connection status.
* Connected device.
* Synced folder.
* Last sync.
* Storage usage.
* File permissions.
* Disconnect device.

Operating system:

```text
Windows
macOS
Linux
```

Security message:

```text
Hermes only accesses folders explicitly selected by the user.
```

Jangan menyimulasikan bahwa browser dapat mengakses seluruh file lokal tanpa izin.

---

# 19. NOTIFICATIONS

Notification Center menampilkan:

* Task completed.
* Task failed.
* Approval required.
* Scheduled task started.
* Scheduled task failed.
* Credits low.
* Channel disconnected.
* Desktop disconnected.
* New output.
* Agent error.
* Security warning.

Filter:

```text
All
Tasks
Projects
Channels
Credits
Security
System
```

Notification harus memiliki:

* Icon.
* Title.
* Description.
* Time.
* Read/unread.
* Open action.

---

# 20. CREDITS DAN MODEL USAGE

Tampilkan credits pada topbar dan sidebar.

Contoh:

```text
Daily Credits: 42 / 50
Monthly Credits: 840 / 1,000
```

Klik membuka usage drawer.

Usage drawer:

* Credits remaining.
* Daily usage.
* Monthly usage.
* Usage by skill.
* Usage by project.
* Usage by model.
* Estimated reset.
* Upgrade option.

Credit state:

```text
Healthy
Low
Critical
Exhausted
```

Saat credits habis:

* Jangan menghapus prompt.
* Simpan sebagai draft.
* Tampilkan opsi model lokal jika tersedia.
* Tampilkan waktu reset.
* Tampilkan upgrade option.

---

# 21. LIVE TASK EXECUTION

Setelah prompt dikirim:

```text
Prompt Submitted
→ Task Created
→ Hermes Core Planning
→ Agent Assigned
→ Tools Connected
→ Work Running
→ QA Validation
→ Output Finalized
```

Task card menampilkan:

* Task title.
* Agent.
* Skill.
* Goal.
* Status.
* Progress.
* Current step.
* Elapsed time.
* Estimated remaining time.
* Credits used.
* Pause.
* Cancel.
* Open detail.

Status:

```text
Queued
Planning
Running
Researching
Generating
Validating
Waiting Approval
Completed
Failed
Cancelled
```

---

# 22. EXECUTION PROGRESS

Contoh operational event:

```text
Task received
Research plan created
Research Agent assigned
12 sources collected
Sources validated
Document Agent assigned
Draft generated
QA validation completed
Output finalized
```

Jangan tampilkan:

* Private chain-of-thought.
* Hidden reasoning.
* Secret.
* Raw credential.
* API key.

Sediakan:

* Progress bar.
* Stepper.
* Expandable log.
* Execution trace link.
* Agent activity.
* Tool activity.

---

# 23. OUTPUT RESULT

Ketika selesai, tampilkan:

* Status completed.
* Output summary.
* Preview.
* Generated files.
* Source list.
* Credits used.
* Total duration.
* Agent used.
* Continue editing.
* Create new version.
* Export.
* Share.
* Download.
* Open project.

Output types:

```text
PPTX
PDF
DOCX
XLSX
CSV
PNG
JPG
ZIP
HTML
MP4
Markdown
Source Code
```

---

# 24. SECURITY DAN PRIVACY UX

Tampilkan status keamanan secara jelas namun tidak menakutkan.

Fitur:

* Connected tool permissions.
* Data source permissions.
* Local folder access.
* Channel permissions.
* Credential status.
* Session activity.
* Revoke access.
* Delete project data.
* Export project data.

Untuk data bisnis sensitif:

* Tampilkan badge `Sensitive Data`.
* Tampilkan model privacy status.
* Tampilkan source destination.
* Tampilkan warning sebelum berbagi data.
* Tampilkan approval sebelum menggunakan external model jika policy memerlukannya.

---

# 25. CLEAN WORKFLOW PRINCIPLES

Gunakan prinsip UX:

1. Pengguna dapat mulai mengetik dalam satu klik.
2. Pengguna tidak wajib memilih model.
3. Auto Model menjadi default.
4. Skill mudah ditemukan.
5. Goal mudah dipahami.
6. Fitur lanjutan disembunyikan melalui progressive disclosure.
7. Template tidak langsung menjalankan task.
8. Running task selalu mudah ditemukan.
9. Project history selalu tersedia.
10. Detail teknis ditempatkan di expandable panel.
11. Tidak menampilkan informasi terlalu banyak di halaman utama.
12. Status tidak hanya bergantung pada warna.
13. Semua destructive action memerlukan konfirmasi.
14. Semua channel menampilkan status koneksi nyata.
15. Prompt tidak hilang ketika error.

---

# 26. RESPONSIVE DESIGN

## Desktop

* Icon rail tampil.
* Sidebar tampil.
* Skill row horizontal.
* Template grid 4 kolom.
* Composer lebar.

## Tablet

* Sidebar dapat collapse.
* Template grid 2 kolom.
* Composer tetap lebar.
* Project panel menjadi drawer.

## Mobile

* Topbar ringkas.
* Sidebar menjadi drawer.
* Bottom navigation.
* Skill horizontal scroll.
* Template 1 kolom.
* Composer sticky.
* Action sekunder masuk overflow menu.
* Running task tampil sebagai bottom sheet.

---

# 27. ACCESSIBILITY

Wajib:

* Semantic HTML.
* Keyboard navigation.
* Visible focus.
* ARIA label.
* Tooltip.
* Focus trap.
* WCAG AA contrast.
* Reduced motion.
* Screen-reader status.
* Tidak menggunakan warna sebagai satu-satunya indikator.
* Minimum click target 40px.

---

# 28. MICRO-INTERACTIONS

Gunakan animasi:

* Sidebar collapse.
* Skill selection.
* Composer focus.
* Card hover.
* Modal opening.
* Task progress.
* Notification arrival.
* Status transition.

Durasi:

```text
150–250ms
```

Jangan menggunakan animasi berulang yang mengganggu.

---

# 29. STATE YANG WAJIB DIBUAT

```text
Loading
Empty
Error
Offline
Disconnected
Reconnecting
Low Credits
No Project
No Channel
No Scheduled Task
Task Running
Task Failed
Task Completed
Waiting Approval
```

Offline banner:

```text
Hermes Gateway is offline. Your prompt will remain saved as a draft until the connection is restored.
```

---

# 30. REKOMENDASI STRUKTUR FILE

```text
app/
└── workspace/
    ├── page.tsx
    ├── loading.tsx
    ├── error.tsx
    ├── skills/
    │   └── page.tsx
    ├── projects/
    │   ├── page.tsx
    │   └── [projectId]/
    │       └── page.tsx
    ├── scheduled/
    │   └── page.tsx
    ├── channels/
    │   └── page.tsx
    └── desktop/
        └── page.tsx

components/
└── workspace/
    ├── WorkspaceShell.tsx
    ├── WorkspaceTopbar.tsx
    ├── WorkspaceIconRail.tsx
    ├── WorkspaceSidebar.tsx
    ├── HermesClawHero.tsx
    ├── PromptComposer.tsx
    ├── GoalSelector.tsx
    ├── DeepResearchSelector.tsx
    ├── SkillSelector.tsx
    ├── ModelSelector.tsx
    ├── ToolSelector.tsx
    ├── AttachmentManager.tsx
    ├── TrendingProjects.tsx
    ├── TemplateCard.tsx
    ├── ProjectHistory.tsx
    ├── ProjectCard.tsx
    ├── ScheduledTaskCard.tsx
    ├── ChannelConnector.tsx
    ├── DesktopAccessCard.tsx
    ├── CreditsIndicator.tsx
    ├── NotificationCenter.tsx
    ├── LiveTaskCard.tsx
    ├── ExecutionProgress.tsx
    ├── OutputPreview.tsx
    ├── GeneratedFileCard.tsx
    ├── WorkspaceEmptyState.tsx
    └── WorkspaceMobileNavigation.tsx

lib/
└── workspace/
    ├── types.ts
    ├── mock-data.ts
    ├── skills-config.ts
    ├── templates-config.ts
    ├── agents-config.ts
    └── workspace-store.ts
```

Sesuaikan dengan struktur project existing.

---

# 31. MOCK DATA DAN UI SIMULATOR

Pada tahap UI/UX, gunakan mock data.

Simulasikan progress:

```text
0%    Task created
10%   Understanding goal
20%   Creating plan
35%   Assigning agents
50%   Collecting information
65%   Generating output
80%   Validating result
92%   Finalizing files
100%  Completed
```

Pisahkan mock service dari UI agar mudah diganti dengan API Hermes.

---

# 32. INTEGRASI DENGAN DASHBOARD EXISTING

Tambahkan navigasi dari:

```text
Landing Page
Virtual Office
Control Center
Agent Workspace
```

Menu:

```text
Open AI Workspace
```

Pada Hermes Workspace sediakan:

```text
Open Virtual Office
Open Control Center
View Active Agents
View Task Monitor
```

Jangan mengubah fitur Virtual Office existing.

---

# 33. LARANGAN IMPLEMENTASI

Jangan:

* Menyalin brand Skywork.
* Menggunakan nama SkyClaw.
* Menggunakan aset Skywork.
* Menyalin UI pixel-per-pixel.
* Menampilkan chain-of-thought.
* Menampilkan secret.
* Menyimpan API key di frontend.
* Menggunakan localStorage untuk credential.
* Menghapus fitur dashboard existing.
* Mengubah backend pada tahap UI/UX.
* Menggunakan data production.
* Membuat channel connection palsu terlihat sebagai koneksi nyata.
* Membuat browser seolah dapat mengakses seluruh local storage komputer.

Gunakan status `Mock`, `Demo`, atau `Not Connected` selama backend belum tersedia.

---

# 34. OUTPUT IMPLEMENTASI

Hasilkan:

1. Halaman `/workspace`.
2. Halaman Explore Skills.
3. Halaman Projects.
4. Halaman Scheduled Tasks.
5. Halaman Channels.
6. Halaman Desktop Access.
7. Prompt composer.
8. Goal selector.
9. Deep Research mode.
10. Skill selector.
11. Auto Model selector.
12. Connect Tools.
13. Trending templates.
14. Project history.
15. Credits indicator.
16. Notification center.
17. Mock live task.
18. Output preview.
19. Loading state.
20. Empty state.
21. Error state.
22. Offline state.
23. Responsive layout.
24. Accessible UI.
25. Reusable components.

---

# 35. VERIFICATION

Jalankan:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Manual verification:

* `/workspace` dapat dibuka.
* Prompt dapat diketik.
* Goal dapat dipilih.
* Deep Research dapat diaktifkan.
* Skill dapat dipilih.
* Model dapat dipilih.
* Tool dapat dipilih.
* File dapat ditambahkan secara mock.
* Template mengisi prompt.
* Project baru dapat dibuat secara mock.
* Scheduled task dapat dibuat secara mock.
* Channel modal dapat dibuka.
* Desktop Access dapat dibuka.
* Credits dapat dilihat.
* Notification dapat dibuka.
* Mock task berjalan.
* Progress tampil.
* Output tampil.
* Mobile responsive.
* Virtual Office tidak rusak.
* Control Center tidak rusak.

---

# 36. ACCEPTANCE CRITERIA

* [ ] Branding sepenuhnya menggunakan Hermes.
* [ ] UI terlihat sebagai SaaS AI premium.
* [ ] Prompt composer menjadi fokus utama.
* [ ] Deep Research terlihat jelas tetapi tidak mengganggu.
* [ ] Semua skill utama tersedia.
* [ ] Project Management tersedia.
* [ ] Scheduled Tasks tersedia.
* [ ] Project History tersedia.
* [ ] Trending Projects tersedia.
* [ ] Connect IM Channel tersedia.
* [ ] Desktop Access tersedia.
* [ ] Notification tersedia.
* [ ] Credits tersedia.
* [ ] Live task progress tersedia.
* [ ] Output preview tersedia.
* [ ] Desain desktop, tablet, dan mobile baik.
* [ ] TypeScript tidak error.
* [ ] Build berhasil.
* [ ] Tidak ada regression.
* [ ] Tidak ada secret pada frontend.

---

# 37. URUTAN PENGERJAAN

## Phase 1 — Audit

* Audit stack.
* Audit component.
* Audit design system.
* Audit route.
* Audit authentication.

## Phase 2 — Design Foundation

* Tokens.
* Typography.
* Layout.
* Responsive rules.
* Shared components.

## Phase 3 — Workspace Shell

* Topbar.
* Icon rail.
* Sidebar.
* Project history.
* Credits.

## Phase 4 — HermesClaw Composer

* Hero.
* Prompt.
* Goal.
* Deep Research.
* Skills.
* Tools.
* Model.
* Attachments.

## Phase 5 — Project Discovery

* Explore Skills.
* Trending Projects.
* Templates.
* Recent Projects.

## Phase 6 — Project Management

* New Project.
* Project History.
* Project Detail.
* Project tabs.

## Phase 7 — Automation and Integration

* Scheduled Tasks UI.
* Channel Connector UI.
* Desktop Access UI.
* Notification Center.

## Phase 8 — Task Experience

* Mock task.
* Progress.
* Agent assignment.
* Logs.
* Completed output.

## Phase 9 — Quality Assurance

* Loading state.
* Empty state.
* Error state.
* Offline state.
* Accessibility.
* Responsive.
* TypeScript.
* Lint.
* Build.
* Regression test.

Setelah setiap phase:

1. Laporkan file yang dibuat.
2. Laporkan file yang diubah.
3. Jalankan TypeScript check.
4. Jangan mengubah backend.
5. Jangan melakukan deployment production.
6. Jangan menghapus fitur existing.
