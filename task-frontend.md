# Checklist Tugas Frontend: Hermes AI Workspace

Dokumen ini berisi daftar tugas pengembangan, pemolesan visual, interaksi, dan pengujian antarmuka pengguna (frontend) untuk modul **Hermes AI Workspace** berbasis Next.js, Tailwind CSS, dan TypeScript.

---

## 🎨 Fase 1: Sistem Desain, Tema & Layout Utama
- [ ] **Sinkronisasi Desain Balesin AI**
  - [ ] Audit variabel warna HSL kustom (gelap, borders, accent-cyan, indigo) di `app/globals.css`.
  - [ ] Pastikan warna latar belakang gelap premium (`#050814`, `#090b10`) terintegrasi merata di seluruh sub-page.
  - [ ] Setup visual gradient border tipis (`border-white/5` dan `border-white/10`) untuk batas panel.
- [ ] **Background Overlay & Grid Mesh**
  - [ ] Tambahkan mesh grid halus pada background shell utama.
  - [ ] Buat efek sorotan cahaya radial (`radial-gradient` dengan opacity rendah) yang mengikuti posisi kursor atau menetap di area hero.
- [ ] **Shell & Sidebar Collapsible**
  - [ ] Buat animasi transisi halus (`transition-all duration-300`) saat sidebar vertikal di-collapse atau di-expand.
  - [ ] Sediakan bottom bar navigation khusus mobile yang intuitif jika lebar layar di bawah `md` breakpoint.

---

## 💬 Fase 2: Pemolesan Komponen Interaktif & State
- [ ] **Prompt Composer Tingkat Lanjut**
  - [ ] Implementasikan auto-growing textarea (tinggi bertambah dinamis seiring jumlah baris teks input).
  - [ ] Tambahkan handler keyboard: `Enter` untuk mengirim prompt, dan `Shift + Enter` untuk membuat baris baru.
  - [ ] Implementasikan visual drag-and-drop file loader dengan visual overlay state "Drop file here".
  - [ ] Buat preview badge file terunggah (PDF, DOCX, XLSX, PNG) lengkap dengan tombol hapus (ikon `X`).
- [ ] **Model & Goal Selector Dropdown**
  - [ ] Buat custom dropdown menu untuk pemilihan Model AI (Claude, Gemini, GPT, DeepSeek) dengan animasi slide-up mikro.
  - [ ] Tambahkan badge visual kecil "New" atau "Fast" di samping nama model.
  - [ ] Hubungkan Goal Selector (Quick Task, Deep Research) ke composer untuk mengubah perilaku input fields secara dinamis.
- [ ] **Live Progress VPS Stepper**
  - [ ] Implementasikan visual stepper progres pengerjaan (ikon centang hijau untuk langkah selesai, spinner berputar untuk langkah aktif).
  - [ ] Buat logs console mini bergaya terminal gelap dengan scrolling otomatis ke bawah saat baris log baru bertambah.
  - [ ] Desain kartu luaran artifact akhir (tautan unduhan dokumen PDF/PPTX) dengan ikon berkas yang sesuai dan tombol copy link cepat.

---

## ✨ Fase 3: Animasi, Transisi & Micro-Interactions
- [ ] **Loading States & Shimmer Skeletons**
  - [ ] Rancang template skeleton loading shimmer untuk halaman daftar proyek (`/workspace/projects`) saat data awal sedang dimuat.
  - [ ] Buat skeleton loading card untuk panel instalasi skill pada halaman `/workspace/skills`.
- [ ] **Interactive Hover & Click Effects**
  - [ ] Tambahkan efek glow tipis pada tombol utama (`ds-btn-primary`) saat kursor melayang (hover).
  - [ ] Terapkan efek scaling mikro (`active:scale-95` atau `hover:scale-[1.02]`) pada tombol pengiriman prompt dan kartu template.
  - [ ] Buat efek glow border berseri pada kartu template trending saat hover.
- [ ] **Notification Center Animations**
  - [ ] Animasikan pembukaan laci notifikasi dari sebelah kanan dengan efek transisi slide-in (`translate-x-full` ke `translate-x-0`).

---

## 📱 Fase 4: Aksesibilitas, SEO & Responsivitas Mobile
- [ ] **Responsivitas Komponen**
  - [ ] Pastikan composer prompt tetap mudah diakses pada layar ponsel kecil dengan padding input yang pas.
  - [ ] Buat layout grid kartu proyek dari 2-kolom (desktop) menjadi 1-kolom (mobile) secara responsif.
- [ ] **Aksesibilitas Keyboard & Screen Reader (a11y)**
  - [ ] Terapkan focus ring yang kontras (`focus:ring-2 focus:ring-accent-cyan`) pada semua input text, button, dan select fields.
  - [ ] Pastikan kontras warna teks abu-abu (`text-slate-400`, `text-slate-500`) memenuhi standar keterbacaan WCAG AA.
- [ ] **SEO Metadata Halaman**
  - [ ] Definisikan proper metadata title dan description untuk masing-masing route workspace.

---

## 🚀 Fase 5: Optimasi & Verifikasi Kode Frontend
- [ ] **Dynamic Importing & Code Splitting**
  - [ ] Gunakan `next/dynamic` untuk memecah dialog modal global (Create Project, Connect Tools, IM Connect Wizard) agar tidak memperbesar ukuran file bundle awal (initial JS bundle).
- [ ] **Pengujian Kelayakan Visual**
  - [ ] Verifikasi kebersihan kode dari teks boilerplate non-Hermes (pastikan tidak ada kata "Skywork" atau "SkyClaw" yang bocor).
  - [ ] Uji fungsionalitas UI di beberapa resolusi layar (Safari iOS, Chrome Desktop, Firefox).
