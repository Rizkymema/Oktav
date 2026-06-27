# AI ASSISTENT Workspace

Dashboard operator dan workspace eksekusi berbasis `Next.js` untuk menjalankan task AI, approval flow, artifact generation, dan video rendering dari satu sistem lokal.

## Ringkasan

Project ini menggabungkan beberapa lapisan utama:

- `Workspace UI` untuk mengirim prompt, memantau task, membuka artifact, dan mengelola project.
- `Hermes Hybrid Core` untuk routing task, planning, approval, sinkronisasi project, dan eksekusi tool.
- `Artifact pipeline` untuk menghasilkan dokumen, spreadsheet, gambar, HTML, ZIP, dan video.
- `Genvid local engine` yang sudah diimpor ke dalam repo untuk generasi video MP4.
- `Telegram integration` untuk channel bot dan sinkronisasi runtime.

Secara default aplikasi ini berjalan sebagai control center lokal di:

- Web app: `http://localhost:3000`
- Genvid API lokal: `http://127.0.0.1:8000`

## Nama Produk Alternatif

Jika Anda ingin mengganti nama `AI ASSISTENT`, ini opsi yang paling layak:

1. `Orkestra AI`  
   Cocok untuk sistem yang mengorkestrasi task, agent, tool, approval, dan artifact.
2. `Taskora Workspace`  
   Lebih modern dan cocok untuk dashboard produksi.
3. `Vektor AI Hub`  
   Kesan lebih teknikal dan rapi untuk platform operator.
4. `NaraFlow Studio`  
   Lebih halus untuk produk AI yang fokus pada konten dan workflow.
5. `ForgeDesk AI`  
   Kuat untuk positioning builder workspace.
6. `Ruang Operator AI`  
   Paling jelas jika ingin nuansa lokal/Indonesia.

Rekomendasi utama saya: `Orkestra AI`.

## Fitur Utama

- Prompt composer untuk task dokumen, web, gambar, spreadsheet, dan video.
- Runtime task dengan status `planning`, `running`, `waiting_approval`, `completed`, dan `failed`.
- Approval gate untuk aksi berisiko.
- Artifact output ke `public/artifacts`.
- Project sync otomatis dari task runtime.
- Model routing untuk OpenAI, OpenRouter, dan Google/Gemini.
- Video generation dengan dua jalur:
  - `Genvid` untuk render video lokal yang lebih lengkap.
  - `legacy_ffmpeg` sebagai fallback aman bila Genvid gagal.
- Embedded Genvid bootstrap dari repo ini sendiri, bukan dari folder eksternal aktif.

## Stack

- `Next.js 15`
- `React 19`
- `TypeScript`
- `Tailwind CSS`
- `Vitest`
- `ffmpeg-static`
- `sharp`
- `docx`, `pdf-lib`, `exceljs`, `pptxgenjs`, `jszip`
- `uv` + Python environment untuk engine `Genvid`

## Struktur Project

```text
app/
  api/hermes/            API runtime Hermes
  workspace/             halaman dashboard, projects, channels, skills
components/
  workspace/             UI shell, task card, prompt composer, chat surfaces
lib/
  hermes/                runtime core, orchestrator, registry, services, video
  workspace/             state UI, helpers, notification, project runtime
integrations/
  genvid/                engine video lokal yang sudah diimpor ke repo
scripts/
  start-genvid-local.ps1 bootstrap Genvid lokal dan generate config.yaml
public/
  artifacts/             semua hasil file runtime
tests/
  hermes/                test runtime Hermes
  workspace/             test UI workspace
```

## Alur Sistem

1. User mengirim prompt dari workspace.
2. Request masuk ke `/api/hermes/tasks`.
3. `TaskRequestResolver` menentukan skill, capability, dan output type.
4. `MainOrchestrator` membuat task, plan, dan jalankan toolchain.
5. `ToolExecutor` merender artifact sesuai jenis output.
6. Hasil disimpan ke `public/artifacts`.
7. Task, project, dan notification disinkronkan ke dashboard.

## Output yang Didukung

- `PDF`
- `DOCX`
- `PPTX`
- `XLSX`
- `CSV`
- `PNG`
- `JPG`
- `SVG`
- `HTML`
- `ZIP`
- `Markdown`
- `MP4`

## Environment Variable

Salin `.env.example` menjadi `.env.local`, lalu isi sesuai kebutuhan.

### Provider AI

- `OPENAI_API_KEY`
- `VIDEO_API_KEY`
- `OPENROUTER_API_KEY`
- `GEMINI_API_KEY`
- `GOOGLE_API_KEY`

### Reference Workspace

- `HERMES_REFERENCE_ROOT`

Digunakan bila Anda ingin mengambil skill referensi dari repo Hermes lokal lain.

### Genvid

- `GENVID_ENABLED`
- `GENVID_API_URL`
- `GENVID_ROOT`
- `GENVID_AUTO_START`
- `GENVID_START_COMMAND`
- `GENVID_HEALTH_TIMEOUT_MS`
- `GENVID_POLL_INTERVAL_MS`
- `GENVID_POLL_TIMEOUT_MS`
- `GENVID_FRAME_TEMPLATE`
- `GENVID_SCENE_COUNT`
- `GENVID_LLM_BASE_URL`
- `GENVID_LLM_MODEL`
- `GENVID_FALLBACK_MODE`

## Cara Menjalankan

### 1. Install dependency web

```bash
npm install
```

### 2. Jalankan aplikasi web

```bash
npm run dev
```

### 3. Jalankan Genvid lokal

Jika `GENVID_AUTO_START=true`, runtime akan mencoba menyalakan Genvid sendiri saat diperlukan.

Untuk start manual:

```powershell
powershell -ExecutionPolicy Bypass -File ".\scripts\start-genvid-local.ps1"
```

Script ini akan:

- membaca `.env.local`
- membangun `integrations/genvid/config.yaml`
- memilih provider LLM untuk Genvid
- menjalankan `uv sync`
- menyalakan API Genvid di `127.0.0.1:8000`

## Endpoint Penting

- `GET /api/hermes/overview`
- `GET /api/hermes/tasks`
- `POST /api/hermes/tasks`
- `POST /api/hermes/approvals/[approvalId]/respond`
- `POST /api/hermes/tasks/[taskId]/retry`
- `POST /api/hermes/tasks/[taskId]/cancel`

## Video Generation

Sistem video saat ini memakai pola berikut:

1. Runtime mencoba `Genvid` lebih dulu bila `GENVID_ENABLED=true`.
2. Bila render Genvid berhasil, MP4 final diunduh dan disalin ke `public/artifacts`.
3. Bila Genvid gagal, runtime fallback ke render MP4 lokal berbasis `ffmpeg-static`.

Konfigurasi default yang paling stabil untuk penggunaan lokal saat ini:

- `GENVID_FRAME_TEMPLATE=1080x1920/static_default.html`
- `GENVID_FALLBACK_MODE=legacy_ffmpeg`

## Penyimpanan Artifact

Semua artifact ditulis ke:

```text
public/artifacts/
```

Contoh hasil:

- proposal bisnis
- deck presentasi
- poster PNG
- halaman HTML
- video MP4

## Verifikasi dan Testing

Command yang umum dipakai:

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

Catatan:

- beberapa test UI workspace lama bisa gagal bila snapshot atau behavior lama belum ikut dirapikan
- untuk validasi video, cek file MP4 hasil di `public/artifacts` dan verifikasi dengan `ffprobe` bila perlu

## Catatan Operasional

- Jangan simpan secret di source code.
- Gunakan `.env.local` untuk konfigurasi lokal.
- `public/artifacts` adalah folder output runtime, bukan tempat source manual.
- Engine Genvid sudah dipindahkan ke dalam repo ini di `integrations/genvid`, jadi Anda tidak perlu lagi bergantung pada folder `D:\genvid` saat runtime aktif di project ini.

## Arah Pengembangan Berikutnya

- rebranding UI dari `AI ASSISTENT` ke nama produk final
- merapikan test workspace yang masih lama
- menambah preview artifact non-image yang lebih kaya
- menambah monitoring error untuk jalur Genvid dan fallback video
- menambah halaman settings operator yang lebih eksplisit untuk provider/model/video engine

## Lisensi Internal

Project ini saat ini lebih tepat dianggap sebagai workspace internal/private build sampai kebijakan lisensi final ditentukan.
