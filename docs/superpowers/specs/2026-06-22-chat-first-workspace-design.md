# Chat-First Workspace Design

## Goal

Mengubah workspace chat `AI ASSISTENT` agar terasa seperti produk AI modern seperti ChatGPT atau Claude:

- percakapan menjadi fokus utama layar
- bubble chat lebih bersih dan lebih mudah dibaca
- chat bisa di-scroll sampai pesan paling bawah dengan stabil
- ada state `assistant typing` dan `assistant working`
- hasil task ditampilkan rapi sebagai response AI, bukan dump log mentah

Targetnya adalah memperbaiki pengalaman chat tanpa membuang fondasi task runtime, artifact, dan agent execution yang sudah ada.

## Current Problems

Masalah yang terlihat dari implementasi saat ini:

- thread chat masih mencampur percakapan natural dengan log sistem mentah
- detail task seperti `Task ID`, progress, credit, artifact links, dan langkah teknis terlalu dominan di area chat
- auto-scroll belum terasa stabil saat chat bertambah
- user tidak mendapat indikator bahwa AI sedang berpikir atau bekerja
- hasil task selesai sering terasa duplikatif karena chat bubble dan task card sama-sama memuat banyak detail
- composer sticky sudah ada, tetapi pengalaman keseluruhan masih terasa seperti dashboard internal, belum seperti AI chat product

## Product Principles

1. Chat harus menjadi kontainer utama interaksi.
2. Jawaban assistant harus diprioritaskan dibanding log eksekusi.
3. Informasi sistem tetap tersedia, tetapi menjadi lapisan sekunder.
4. Scroll behavior harus predictable dan nyaman.
5. Status AI harus jelas walau belum ada streaming token.
6. Layout harus tetap kompatibel dengan task, artifact, dan mode multi-output yang sudah ada.

## Interaction Model

### 1. Chat-First Thread

Workspace akan memakai satu thread utama dengan pola berikut:

- bubble user di kanan
- bubble assistant di kiri
- max width pesan dibatasi agar nyaman dibaca
- composer sticky di bawah
- message spacing lebih longgar
- timestamp dan metadata dibuat lebih halus

Thread harus terasa seperti aplikasi AI umum, bukan seperti event log.

### 2. Assistant States

Tambahkan state UI percakapan:

- `assistantTyping`
  - muncul segera setelah user submit prompt
  - menampilkan bubble placeholder dengan animated dots

- `assistantWorking`
  - dipakai saat task backend sedang berjalan
  - menampilkan status singkat seperti:
    - `Generating image...`
    - `Preparing document...`
    - `Building presentation...`

- `assistantCompleted`
  - menampilkan jawaban final AI
  - bila ada artifact, hasilnya ditampilkan dalam result card yang ringkas

- `assistantFailed`
  - menampilkan error yang singkat dan bisa dimengerti user
  - log teknis tetap disembunyikan di detail panel

### 3. Task Details As Secondary UI

Semua detail teknis task tidak lagi ditampilkan mentah di alur chat utama.

Yang dipindahkan dari chat utama:

- `Task ID`
- `Langkah`
- `Pelaksana Agent`
- `Kredit`
- log langkah teknis
- artifact URL mentah
- status debug repetitif

Sebagai gantinya:

- bubble assistant berisi jawaban natural
- di bawah bubble assistant bisa muncul `Result Card`
- `Result Card` menampilkan:
  - status singkat
  - preview artifact bila ada
  - tombol `Open`
  - tombol `Download`
  - tombol `Details`

Tombol `Details` membuka panel detail teknis yang collapsible di dalam message group yang sama.

### 4. Auto-Scroll Behavior

Scroll behavior harus diubah menjadi lebih cerdas:

- bila user berada dekat bawah thread, message baru otomatis scroll ke bawah
- bila user sedang membaca pesan lama di atas, thread tidak memaksa scroll turun
- saat submit prompt baru, chat bergerak ke bawah agar bubble user dan typing bubble langsung terlihat
- saat task selesai, hasil baru tetap masuk ke viewport bila user masih dekat bawah

### 5. Sticky Composer

Composer tetap sticky, tetapi styling-nya akan lebih dekat ke AI chat product:

- area bawah lebih bersih
- transisi antara thread dan composer lebih lembut
- ruang untuk input, model picker, output picker, dan actions tetap ada
- composer tidak terasa seperti panel dashboard yang berat

## UI Structure

Struktur baru di `WorkspaceInterface`:

1. `ChatViewport`
   - scroll container utama
   - menyimpan thread messages

2. `MessageGroup`
   - satu unit percakapan
   - bisa memuat bubble + result card + detail toggle

3. `AssistantTypingBubble`
   - placeholder animasi
   - dipakai saat assistant sedang berpikir

4. `TaskResultCard`
   - ringkasan hasil task
   - preview artifact + action buttons

5. `TaskDetailsDrawer` atau `TaskDetailsCollapse`
   - detail teknis hanya saat dibuka

6. `StickyComposerShell`
   - pembungkus composer yang lebih rapi

## Data Model Changes

State workspace perlu ditambah agar UI bisa memisahkan percakapan dan status runtime:

- `isAssistantTyping: boolean`
- `assistantStatusLabel?: string`
- `pendingTaskMessageId?: string`
- `message.kind`
  - `user`
  - `assistant`
  - `system_status`
  - `task_result`

Message assistant tidak lagi perlu menerima dump teks log. Message cukup menerima:

- natural language response
- optional artifact summary
- optional task reference

Detail teknis task dibaca dari task state aktif saat user membuka `Details`.

## Rendering Rules

### User Message

- bubble solid dan sederhana
- fokus pada keterbacaan
- tanpa kartu tambahan

### Assistant Message

- bubble lebih editorial dan rapi
- teks natural diprioritaskan
- code block dan image preview tetap didukung

### Artifact Result

Jika task menghasilkan output:

- image: tampilkan thumbnail besar yang rapi
- document/ppt/pdf: tampilkan icon + filename + format badge
- web/html/zip: tampilkan summary + CTA

### Detail Expansion

Saat user klik `Details`:

- munculkan panel teknis collapsible
- tampilkan task metadata dan log
- tidak mengubah posisi bubble utama

## Scroll And Layout Constraints

- `WorkspaceInterface` harus memisahkan viewport scroll dari sticky composer dengan jelas
- tidak boleh ada nested scroll yang membingungkan di area utama chat
- `LiveTaskCard` tidak lagi di-embed penuh ke tiap assistant message
- list message harus punya bottom padding yang cukup agar tidak tertutup composer

## Error Handling

Jika task gagal:

- assistant bubble menampilkan error yang singkat dan manusiawi
- contoh:
  - `Saya gagal membuat gambar itu. Silakan coba lagi atau ganti model.`
- detail error provider hanya muncul di `Details`

## Components Affected

File utama yang akan disentuh:

- `components/workspace/WorkspaceInterface.tsx`
- `components/workspace/LiveTaskCard.tsx`
- `components/workspace/PromptComposer.tsx`
- `lib/workspace/workspace-context.tsx`
- `lib/workspace/types.ts`

Kemungkinan komponen baru:

- `components/workspace/chat/AssistantTypingBubble.tsx`
- `components/workspace/chat/TaskResultCard.tsx`
- `components/workspace/chat/TaskDetailsPanel.tsx`
- `components/workspace/chat/MessageBubble.tsx`

## Testing Strategy

Minimal verifikasi:

- submit prompt baru menambahkan bubble user dan typing state
- assistant status berubah dari typing ke working ke completed
- auto-scroll turun saat user berada dekat bawah
- auto-scroll tidak memaksa turun saat user sedang membaca pesan lama
- result card tampil rapi untuk image/document outputs
- task details tetap bisa dibuka tanpa mengotori bubble utama

## Non-Goals

- belum menambah streaming token real-time
- belum membangun WebSocket/SSE chat
- belum mengubah backend response contract besar-besaran
- belum mendesain ulang seluruh dashboard workspace di luar chat area

## Implementation Decision

Keputusan final:

- gunakan `chat-first thread`
- gunakan `assistant typing + assistant working states`
- pindahkan detail teknis task ke panel sekunder
- pertahankan artifact dan task runtime yang sudah ada
- fokus pada pengalaman chat AI umum, bukan dashboard log
