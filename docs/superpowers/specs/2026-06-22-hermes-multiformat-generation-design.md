# Hermes Multi-Format Generation Design

## Goal

Menambahkan fondasi yang rapi agar workspace `AI ASSISTENT` bisa:

- menampilkan hanya model yang benar-benar sesuai dengan provider API aktif
- memilih model berdasarkan kapabilitas output
- memahami target output seperti `pptx`, `pdf`, `docx`, `xlsx`, `image`, `video`, `html`, dan `zip`
- meneruskan task ke runtime Hermes dengan instruksi artifact yang konsisten

Perubahan ini harus memperbaiki sinkronisasi antara UI model picker, route backend, task planner, dan hasil artifact tanpa mengganti arsitektur Next.js yang sudah ada.

## Current Problems

- `app/api/hermes/models/route.ts` dan `app/api/hermes/chat/route.ts` memiliki mapping model yang terpisah dan mudah drift.
- Sistem belum punya registry pusat untuk menentukan model mana yang aktif, valid, dan cocok untuk jenis output tertentu.
- Task runtime belum membawa metadata output target, sehingga prompt ke runtime masih generik.
- UI composer masih berfokus pada skill umum dan belum memberi user pilihan target artifact yang eksplisit.
- Artifact yang berhasil disalin ke `public/artifacts` belum dibedakan berdasarkan strategi output.

## Design Principles

1. Gunakan satu sumber kebenaran untuk provider dan model.
2. Pisahkan registry metadata dari route handler.
3. Biarkan UI tetap sederhana, tetapi beri target output yang jelas.
4. Jangan memutus flow task runtime yang sudah berjalan.
5. Gunakan fallback aman ketika provider/model yang diminta tidak tersedia.
6. Pastikan prompt ke runtime selalu menyebut jenis artifact yang harus dibuat.

## Architecture

### 1. Model Registry

Tambahkan modul baru di `lib/hermes/models/` untuk:

- membaca provider aktif dari environment
- mendefinisikan katalog model internal
- mengeluarkan daftar model siap UI
- memfilter model berdasarkan capability
- memilih model fallback terbaik

Capability awal:

- `chat`
- `document`
- `presentation`
- `spreadsheet`
- `image`
- `video`
- `web`

Provider yang didukung oleh fondasi ini:

- `openrouter`
- `openai`
- `google`

Aturan penting:

- jika `OPENROUTER_API_KEY` aktif, model OpenRouter dapat dipakai lintas capability sesuai metadata registry
- jika `OPENAI_API_KEY` aktif, model direct OpenAI dapat dipakai untuk `chat` dan `document`, dan dapat ditandai siap `image` atau `video` jika nanti endpoint terkait diaktifkan
- jika `GEMINI_API_KEY` atau `GOOGLE_API_KEY` aktif, model Gemini direct dapat dipakai untuk `chat` dan `document`

### 2. Artifact Registry

Tambahkan modul baru di `lib/hermes/artifacts/` untuk mendefinisikan output format:

- `pptx`
- `pdf`
- `docx`
- `xlsx`
- `csv`
- `png`
- `jpg`
- `svg`
- `mp4`
- `html`
- `md`
- `zip`

Setiap artifact type menyimpan:

- `id`
- `label`
- `extensions`
- `capability`
- `defaultSkill`
- `defaultAgent`
- `artifactInstructions`
- `preferredModelTags`

Contoh:

- `pptx` memerlukan capability `presentation`
- `pdf` memerlukan capability `document`
- `png` memerlukan capability `image`
- `mp4` memerlukan capability `video`

### 3. Generation Service

Tambahkan service baru di `lib/hermes/services/` untuk:

- menggabungkan model registry dan artifact registry
- me-resolve model yang dipilih user
- me-resolve target output dari skill atau prompt
- menghasilkan daftar model untuk UI
- menghasilkan prompt instruction yang aman untuk route chat dan task runtime

Route menjadi tipis:

- `app/api/hermes/models/route.ts` hanya mengembalikan hasil registry
- `app/api/hermes/chat/route.ts` hanya meminta service untuk memilih provider/model dan merutekan request

### 4. Runtime Integration

Kontrak task ditambah metadata berikut:

- `requestedOutputType`
- `requestedOutputLabel`
- `requestedCapability`
- `resolvedModel`

`GoalAnalyzer` akan:

- membaca target output dari skill atau prompt
- mengisi capability yang dibutuhkan
- meminta klarifikasi jika output tidak jelas untuk permintaan artifact

`PlanningEngine` akan:

- memasukkan target artifact ke input subtask
- memastikan plan summary menyebut output yang harus dibuat

`MainOrchestrator` akan:

- memilih model final via registry
- menambahkan instruksi artifact ke query Python Hermes
- tetap menyalin hasil ke `public/artifacts`

## UI Changes

`PromptComposer` dan `WorkspaceContext` akan ditingkatkan agar:

- user dapat memilih target output dari daftar ringkas
- pilihan output otomatis memengaruhi skill jika relevan
- model picker menampilkan badge capability yang konsisten dengan registry
- submit task mengirim `outputType` dan `model` secara eksplisit ke backend

Fokus UI tetap pragmatis:

- tidak menambah wizard baru
- tidak menambah panel berat
- cukup selector output yang jelas dan konsisten

## Data Flow

1. User memilih model opsional dan target output.
2. UI mengirim `prompt`, `model`, `selectedSkill`, dan `outputType`.
3. `tasks/route.ts` me-resolve skill/output lalu membuat task.
4. `GoalAnalyzer` menentukan capability target.
5. `PlanningEngine` menyusun tool plan dan summary output.
6. `MainOrchestrator` memilih model final dan menyuntikkan instruksi artifact ke runtime Hermes.
7. Runtime menghasilkan file dan file disalin ke `public/artifacts`.
8. UI menampilkan download item berdasarkan artifact yang ditemukan.

## Validation and Fallback

- Jika model yang dipilih user tidak cocok dengan capability output, service fallback ke model kompatibel terbaik.
- Jika provider direct gagal, route masih boleh fallback ke OpenRouter bila tersedia.
- Jika tidak ada provider aktif, route mengembalikan daftar fallback informatif tanpa mengklaim model benar-benar siap.
- Jika target output tidak bisa dideteksi, task tetap jalan sebagai `document` umum, kecuali prompt terlalu ambigu.

## File Structure

```txt
app/
  api/
    hermes/
      chat/route.ts
      models/route.ts
      tasks/route.ts

components/
  workspace/
    PromptComposer.tsx

lib/
  hermes/
    artifacts/
      artifact-registry.ts
      artifact-types.ts
    models/
      model-registry.ts
      model-types.ts
    services/
      hermes-generation-service.ts
    core/
      goal-analyzer.ts
      planning-engine.ts
      main-orchestrator.ts
    contracts/
      task.ts
  workspace/
    types.ts
    workspace-context.tsx
```

## Testing Strategy

Tambahkan test untuk:

- registry model dan filtering capability
- registry artifact dan inference output
- task route agar `outputType` dan `model` masuk ke task input
- planner/analyzer agar output target dipetakan benar

## Non-Goals

- belum membuat endpoint native baru untuk generate video/image direct
- belum membuat upload file sungguhan dari composer
- belum menambah persistence database
- belum mengubah Python Hermes runtime secara struktural

## Implementation Decision

Keputusan final:

- gunakan `provider registry + artifact capability layer`
- refactor route menjadi tipis
- tambahkan metadata output ke task runtime
- pertahankan alur artifact `public/artifacts`
- pilih fallback aman bila model user tidak kompatibel
