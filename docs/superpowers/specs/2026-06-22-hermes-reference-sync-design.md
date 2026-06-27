# Hermes Reference Sync Design

**Tanggal:** 2026-06-22
**Project:** `D:\Project Apk-Web\AI ASSISTENT`
**Reference Source:** `D:\Project Apk-Web\hermesagentai\hermes-agent-main`

## Tujuan

Menyelaraskan project Next.js ini agar bekerja lebih mirip `hermes-agent-main` tanpa mengganti shell UI, route API, atau fitur workspace yang sudah ada. Integrasi dilakukan sebagai adapter yang:

- memakai repo referensi sebagai sumber capability dan behavior inti,
- hanya menambah data yang belum ada,
- mempertahankan route dan UX yang sekarang,
- mengurangi stub lokal yang membuat perilaku runtime berbeda dari sistem referensi.

## Scope

### Termasuk

- sinkronisasi capability runtime dari repo referensi: skills, kategorisasi, agent/tool mapping minimum, dan status instalasi,
- persistence untuk state kontrol runtime yang saat ini volatile,
- routing eksekusi `native` vs `reference` yang bisa memilih repo Hermes referensi saat cocok,
- inferensi skill/category/output yang berbasis registry aktif, bukan hardcoded switch semata,
- pengujian regresi untuk control actions, runtime sync, dan execution routing.

### Tidak termasuk

- menyalin seluruh source Python/CLI Hermes ke dalam app Next.js,
- mengganti UI workspace menjadi UI dari repo referensi,
- migrasi data operasional lama secara destruktif,
- menambahkan semua platform gateway repo referensi sebagai fitur UI baru bila belum ada route/fitur di app ini.

## Masalah Saat Ini

1. `HermesControlService` menampilkan skill referensi, tetapi `install_skill` hanya mengubah `installedReferenceSkillNames`; runtime planner tidak ikut berubah.
2. `SkillRegistry` bersifat statis; tidak ada register/unregister untuk skill referensi.
3. `MainOrchestrator.shouldUseNativeExecution()` selalu `true`, sehingga jalur eksekusi repo referensi tidak pernah dipilih pada runtime normal.
4. Inferensi kategori skill di `app/api/hermes/tasks/route.ts` masih hardcoded dan tidak mengikuti capability registry yang aktif.
5. State kontrol seperti model aktif dan skill referensi terpasang belum dipersist ke disk.

## Desain Arsitektur

### 1. Runtime Capability Sync

Tambahkan service sinkronisasi capability yang membaca repo referensi lokal dan menghasilkan definisi skill runtime tambahan yang kompatibel dengan app ini. Service ini akan:

- memetakan skill referensi ke `HermesSkillDefinition`,
- memberi default agent/tool/output berdasarkan kategori skill referensi,
- memuat hanya skill yang diaktifkan/terpasang ke `SkillRegistry`,
- menjaga seed bawaan tetap menjadi baseline sistem.

### 2. Mutable Runtime Registries

`SkillRegistry` akan dibuat mutable agar runtime dapat:

- register skill hasil sinkronisasi,
- unregister skill referensi saat dilepas,
- expose daftar skill aktif untuk analyzer/planner.

Kontrol install/uninstall akan memutakhirkan registry aktif, bukan hanya badge UI.

### 3. Runtime Settings Persistence

Tambahkan store untuk setting runtime seperti:

- `installedReferenceSkillNames`,
- `selectedModel`,
- `executionMode`.

Store ini dihydrate saat runtime dibuat agar restart tidak membuang sinkronisasi capability.

### 4. Execution Routing

Tambahkan strategi routing:

- `native`: pakai toolchain lokal/stub app ini,
- `reference`: delegasikan tugas ke `hermes-agent-main`,
- `auto`: pilih `reference` bila repo referensi tersedia dan task/capability cocok; fallback ke `native` jika tidak.

Mode default adalah `auto`, dengan pengecualian environment test yang tetap deterministik.

### 5. Dynamic Skill/Category Resolution

Jalur submit task akan memakai resolver runtime agar:

- skill yang dipilih UI divalidasi terhadap registry aktif,
- kategori task mengikuti capability skill aktif,
- selected skill reference yang sudah diinstall benar-benar bisa diproses.

## File Boundaries

### File baru

- `lib/hermes/reference/reference-skill-sync.ts`
  Memetakan skill referensi lokal menjadi definisi runtime.
- `lib/hermes/runtime/runtime-settings-store.ts`
  Menyimpan dan memuat state settings runtime.
- `tests/hermes/reference-skill-sync.test.ts`
  Menguji mapping dan sinkronisasi skill referensi.

### File yang diubah

- `lib/hermes/index.ts`
  Hydrate settings dan skill reference terpasang saat runtime dibangun.
- `lib/hermes/registry/skill-registry.ts`
  Tambah register/unregister/has/list aktif.
- `lib/hermes/services/hermes-control-service.ts`
  Install/uninstall/update model harus mengubah runtime aktif + persist settings.
- `lib/hermes/core/main-orchestrator.ts`
  Tambah selector execution mode yang realistis.
- `app/api/hermes/tasks/route.ts`
  Gunakan resolver skill/category berbasis runtime.
- `tests/hermes/services.test.ts` dan/atau `tests/hermes/orchestrator.test.ts`
  Tambah coverage untuk sync dan routing.

## Error Handling

- Jika repo referensi tidak tersedia, runtime tetap berjalan dengan seed lokal.
- Jika parsing skill referensi gagal, skill itu di-skip tanpa mematikan runtime.
- Jika mode `reference` dipilih tapi executable/uv gagal, task gagal dengan error aman dan tidak membocorkan detail internal sensitif.
- Install/uninstall skill yang tidak ditemukan akan return error terkontrol dari API control action.

## Testing

- unit test mapping skill referensi -> runtime definition,
- unit test install/uninstall benar-benar mengubah registry aktif,
- unit test execution-mode selector,
- regression test submit task dengan selected skill reference terpasang,
- verifikasi `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.

## Success Criteria

- skill referensi yang diinstall muncul sebagai capability runtime aktif, bukan sekadar list UI,
- selected skill reference bisa dipakai saat submit task,
- runtime memilih jalur eksekusi yang lebih dekat ke perilaku `hermes-agent-main`,
- restart runtime tidak menghilangkan skill terpasang dan model aktif,
- seluruh verifikasi proyek lulus tanpa merusak fitur workspace yang ada.
