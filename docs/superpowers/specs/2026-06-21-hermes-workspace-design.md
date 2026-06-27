# Spesifikasi Desain: Hermes AI Workspace (Sederhana & Terfokus)

Dokumen ini mendokumentasikan spesifikasi desain dan alur interaksi untuk pemolesan antarmuka pengguna **Hermes AI Workspace** menggunakan **Pendekatan 1 (Minimalist High-Dense SaaS)**. Desain ini berfokus secara eksklusif pada fitur AI Workspace utama dan menghilangkan seluruh fitur yang terkait dengan Control Center lama.

---

## 1. Penyederhanaan Fitur & Navigasi
Sesuai instruksi pengguna, semua tautan, tombol, modal, dan antarmuka yang merujuk ke **Control Center** dihapus sepenuhnya dari workspace. 

### A. Komponen Sidebar (`WorkspaceSidebar.tsx`)
* **Dihapus**:
  * Navigasi ke *Explore Skills* (`/workspace/skills`).
  * Navigasi ke *Scheduled Tasks* (`/workspace/scheduled`).
  * Panel *Connect IM Channel* (WhatsApp, Telegram, Discord, Slack, Line).
  * Tombol *Desktop Access / Sync*.
  * Tautan bantuan/pengaturan dan status Gateway yang merujuk ke Control Center di bagian footer sidebar.
* **Dipertahankan**:
  * Tombol **New Project** di bagian atas (membuka modal pembuatan proyek).
  * Navigasi tunggal ke **AI Workspace Home** (`/workspace`).
  * Panel **Project History** dengan filter pencarian instan.
  * Tampilan **Daily Limit** (Credits).

### B. Komponen Topbar (`WorkspaceTopbar.tsx`)
* **Dihapus**:
  * Tombol *Desktop Access* (ikon download).
  * Tombol *IM / Notifications* dari header jika tidak digunakan atau diganti dengan representasi statis yang tidak membuka modal eksternal.
* **Dipertahankan**:
  * Tombol toggle pelipat sidebar (collapsible sidebar trigger).
  * Detail informasi status project aktif.

### C. Komponen Shell (`WorkspaceShell.tsx`)
* **Dihapus**:
  * Modal global *Connect Tools*.
  * Modal global *Connect IM Channel*.
  * Modal global *Desktop Access & File Sync*.
* **Dipertahankan**:
  * Modal global **Create New Project** (Inisiasi Project Baru).

---

## 2. Detail Sistem Desain & Visual (Pendekatan 1)
* **Skema Warna**: Memperkuat tema gelap obsidian premium (`#050814`) dengan aksen cyan elektrik (`#00d2ff`) di seluruh sub-komponen.
* **Batas Panel**: Menggunakan batas hairline tipis (`border-white/5` atau `border-white/10`) sebagai pembatas antar panel dashboard tanpa efek bayangan kosmetik yang tebal.
* **Interactive Radial Glow**:
  * Menangkap koordinat pointer kursor mouse operator via event handler `onMouseMove` di grid shell utama (`WorkspaceShell.tsx`).
  * Menggerakkan sorotan cahaya (`radial-gradient` dengan opasitas sangat rendah) secara dinamis mengikuti pointer kursor menggunakan `translate3d(x, y, 0)` untuk kinerja rendering 60fps yang mulus.
* **Collapsible Sidebar**:
  * Mengganti unmount conditional rendering `{!isSidebarCollapsed && <WorkspaceSidebar />}` dengan transisi lebar CSS transisi halus `transition-all duration-300 ease-in-out` (lebar `w-0` ke `w-[280px]` dan `opacity-0` ke `opacity-100`) agar sidebar terlipat dengan mulus di browser.

---

## 3. Alur Interaksi & State Komponen

### A. Prompt Composer (`PromptComposer.tsx`)
* **Auto-growing Textarea**:
  * Tinggi baris textarea bertambah secara otomatis seiring jumlah baris teks input (tinggi minimum 100px, tinggi maksimum 220px) dengan scrollbar minimalis saat mencapai tinggi maksimal.
* **Keyboard Shortcuts**:
  * Menekan tombol `Enter` secara langsung akan memicu submit form.
  * Menekan tombol `Shift + Enter` akan menyisipkan baris baru (`\n`) tanpa memicu submit.
* **Drag-and-Drop File Loader**:
  * Area composer memiliki drop-zone internal dengan visual overlay state semi-transparan berlabel *"Drop file here"* saat file diseret di atas composer.
  * Mendukung penanganan berkas bertipe PDF, DOCX, XLSX, dan PNG.
  * Setelah file di-drop, sistem memicu simulasi loading pengunggahan singkat (progress bar meluncur cepat selama 800ms) sebelum memunculkan preview badge berkas dengan tombol hapus cepat (ikon `X`).
  * *Bypass Tools* yang membuka modal Control Center dihapus dari control bar composer.

### B. Live Task Stepper & Console (`LiveTaskCard.tsx`)
* **Progress Stepper**: Menampilkan indikator langkah VPS (stepper) dengan visual centang hijau untuk langkah selesai, spinner cyan berputar untuk langkah aktif, dan penanda abu-abu untuk langkah mendatang.
* **Mini Terminal Console**: Log konsol mini bergaya monospaced dengan autoscroll otomatis ke bagian paling bawah setiap kali ada baris log baru yang ditambahkan.
* **Download Artifact Card**: Menyajikan tombol unduh visual yang premium untuk tautan dokumen PDF/PPTX tiruan hasil pemrosesan AI, lengkap dengan tombol salin link instan.

---

## 4. Pengujian & Verifikasi Visual
* Memastikan seluruh kode bersih dari kata-kata branding asisten lama (*Skywork* atau *SkyClaw*) dan diganti secara konsisten dengan asisten **HermesClaw**.
* Melakukan dynamic importing modal dialog pembuatan proyek untuk memecah initial JS bundle size.
