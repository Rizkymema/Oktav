# Claude-Style Chat Polish Design

## Goal

Merapikan pengalaman chat di `AI ASSISTENT` agar terasa lebih dekat ke Claude:

- lebih hangat
- lebih editorial
- whitespace lebih lega
- bubble lebih lembut
- terasa premium, tenang, dan mudah dibaca

Targetnya bukan meniru Claude secara mentah, tetapi mengambil kualitas rasa visualnya sambil mempertahankan runtime, task flow, approval flow, artifact flow, dan shell workspace yang sudah ada.

## Scope

Perubahan dibatasi ke area chat dan komponen yang langsung membentuk pengalaman percakapan:

- `components/workspace/WorkspaceInterface.tsx`
- `components/workspace/PromptComposer.tsx`
- `components/workspace/chat/MessageBubble.tsx`
- `components/workspace/chat/AssistantTypingBubble.tsx`
- `components/workspace/chat/TaskResultCard.tsx`

Perubahan tidak boleh mengubah contract data utama, endpoint runtime, orkestrasi task, maupun approval action yang sudah stabil.

## Current Problems

Masalah utama dari UI saat ini:

- nuansa visual masih terlalu neon dan terlalu "dashboard internal"
- bubble assistant terlalu berat dan kontrasnya agresif
- composer terlalu ramai sehingga menggeser fokus dari isi percakapan
- task result terasa seperti kartu sistem terpisah, belum seperti lampiran jawaban assistant
- onboarding, quick skills, dan thread belum punya ritme visual yang konsisten
- metadata seperti model, skill, dan timestamp masih terlalu menonjol

Hasilnya UI sudah berfungsi, tetapi belum terasa setenang atau se-premium produk chat AI modern.

## Product Principles

1. Percakapan adalah pusat layar.
2. Isi jawaban assistant harus lebih dominan daripada kontrol teknis.
3. Teknologi tetap kuat di belakang, tetapi tampilannya tenang di depan.
4. Task result harus terasa seperti bagian dari jawaban, bukan dashboard widget.
5. Composer harus kaya fitur, tetapi visualnya tetap ringan.
6. Perubahan visual tidak boleh merusak alur kerja yang sudah jalan.

## Visual Direction

### Palette

Palet digeser dari cyan-neon gelap ke netral hangat:

- background dasar: charcoal, stone, warm slate
- surface utama: tinted off-black atau warm graphite
- text utama: soft white, bukan putih dingin
- text sekunder: muted stone/ash
- accent: muted brass, sand, atau cyan lembut hanya untuk state penting

Accent kuat hanya dipakai untuk:

- tombol kirim aktif
- state `waiting_approval`
- state berhasil atau gagal
- link dan call-to-action penting

### Surface Style

Permukaan komponen harus:

- lebih flat
- lebih lembut
- shadow lebih tersembunyi
- border lebih halus
- blur dan glow dikurangi drastis

Tujuannya supaya layar terasa lebih dewasa dan tidak seperti template AI generik.

### Typography And Spacing

Aturan tipografi:

- heading lebih jarang dipakai
- body text jadi fokus utama
- line-height diperlebar untuk kenyamanan baca
- metadata diperkecil dan ditenangkan

Aturan spacing:

- jarak antar message diperlebar
- padding bubble assistant sedikit lebih lega dari bubble user
- composer mendapat napas visual lebih besar
- onboarding stack tidak lagi terasa rapat

## Layout Changes

### 1. Workspace Interface

`WorkspaceInterface` tetap mempertahankan arsitektur sekarang:

- viewport scroll utama
- onboarding state saat belum ada pesan
- conversation thread saat pesan sudah ada
- sticky composer di bawah

Yang berubah adalah komposisi visualnya:

- background dibuat lebih tenang dan kurang radial-glow
- max width thread disetel untuk kenyamanan baca editorial
- padding atas dan bawah dibuat lebih seimbang
- sticky composer shell dibuat lebih menyatu dengan thread
- gradient penutup bawah dibuat lebih halus

### Onboarding State

Onboarding tetap memakai:

- hero
- composer
- quick skills
- trending projects

Tetapi tampilannya diubah agar:

- hero tidak terlalu seperti splash card
- composer menjadi fokus utama
- quick skills terasa seperti opsi ringan, bukan badge flashy
- trending section tampil sebagai secondary discovery area

### 2. Message Bubble

### Assistant Bubble

Bubble assistant akan:

- memakai background yang lebih lembut
- border tipis yang hampir tidak terasa
- radius besar tetapi lebih natural
- shadow tipis dan tenang
- metadata di atas bubble dengan tone sekunder

Avatar assistant akan dipertahankan, tetapi:

- lebih subtle
- warna lebih kalem
- tidak memakai gradient yang terlalu terang

### User Bubble

Bubble user tetap berbeda agar hirarki percakapan jelas, tetapi:

- lebih padat
- lebih bersih
- tidak memakai glow atau warna yang terlalu menyala

### Message Content

Konten teks di bubble:

- line-height diperlebar
- heading markdown dipertahankan tetapi diturunkan intensitas visualnya
- link dan bold tetap ada
- code block dibuat lebih rapi dan lebih dekat ke gaya editor premium

Code block akan:

- memakai surface gelap yang netral
- header kecil yang tenang
- tombol copy yang lebih subtle

### 3. Task Result As Attachment

`TaskResultCard` akan diubah secara visual menjadi assistant attachment.

Karakter baru:

- lebih kecil secara visual
- tidak lebih dominan daripada jawaban text
- menyatu di bawah bubble assistant
- progress, preview, dan CTA tetap ada

Urutan visual:

1. status chip singkat
2. judul hasil atau ringkasan singkat
3. preview artifact jika ada
4. CTA utama seperti `Open Result`
5. aksi sekunder seperti `Details`

### Status Treatment

Status memakai tone yang lebih dewasa:

- `completed`: lembut dan positif
- `waiting_approval`: hangat dan jelas, tetapi tidak berisik
- `failed`: tegas tetapi tidak agresif
- `running`: tenang dan informatif

### Details Panel

Panel detail tetap tersedia dan tidak berubah perilaku. Yang berubah hanya tampilannya:

- lebih rapi
- lebih terstruktur
- tidak terasa seperti dump debug kasar

### 4. Prompt Composer

`PromptComposer` tetap mendukung:

- prompt input
- attachment preview
- output picker
- goal picker
- deep research toggle
- research configuration
- model picker
- send action

Tetapi prioritas visual diubah.

### Primary Layer

Yang harus paling terlihat:

- textarea
- placeholder yang jelas
- tombol kirim

### Secondary Layer

Kontrol lain diposisikan sebagai lapisan kedua:

- output
- goal
- deep research
- model
- attachment

Konsekuensinya:

- border, warna, dan shadow tiap control diperkecil
- dropdown tetap kaya informasi, tetapi trigger-nya tidak berteriak
- footer shortcut dibuat lebih halus

### Composer Shell

Container composer akan:

- lebih flat
- lebih editorial
- lebih dekat ke "writing surface"
- tidak lagi seperti control deck

### 5. Assistant Typing State

`AssistantTypingBubble` akan mengikuti gaya bubble assistant:

- avatar subtle
- bubble lembut
- indikator titik lebih halus
- label seperti `Thinking...` atau status runtime tetap ada

Typing state harus memberi rasa bahwa sistem sedang bekerja, tanpa terlihat terlalu teknis.

## Interaction Rules

1. Isi chat selalu menjadi fokus utama.
2. Metadata hanya membantu konteks, bukan mengambil perhatian.
3. Saat artifact tersedia, tampilkan sebagai attachment yang menyatu di bawah jawaban assistant.
4. Saat task masih berjalan, tampilkan status secukupnya.
5. Saat task gagal, tampilkan kegagalan dengan bahasa manusia dan visual yang tetap rapi.

## Responsive Rules

### Desktop

- reading width tetap nyaman
- composer cukup lebar tetapi tidak full bleed
- task attachment punya ruang preview yang layak

### Mobile

- bubble width diperlebar agar tidak terlalu sempit
- avatar dan metadata dipadatkan
- composer controls tetap bisa diakses tanpa memakan tinggi layar berlebihan
- spacing tetap lega, tetapi tidak boros viewport

## Non-Goals

Perubahan ini tidak mencakup:

- redesign total sidebar atau topbar workspace
- perubahan ke runtime orchestration
- perubahan ke API route Hermes
- streaming token real-time
- upload file asli end-to-end
- perubahan struktur task state

## Testing Strategy

Verifikasi minimum setelah implementasi:

- thread chat tetap auto-scroll normal
- sticky composer tidak menutupi pesan terakhir
- bubble assistant dan user tampil jelas di desktop dan mobile
- task result tetap muncul untuk task yang punya artifact
- details panel tetap bisa dibuka dan ditutup
- state `waiting_approval`, `completed`, `failed`, dan running tetap terbaca jelas
- composer tetap bisa submit prompt, ganti model, ganti output, dan toggle research tanpa error
- build, lint, dan typecheck tetap lolos

## Implementation Decision

Keputusan final:

- gunakan arah `Claude-style` yang hangat, editorial, dan tenang
- pertahankan struktur runtime dan perilaku task yang sudah ada
- fokus pada komposisi thread, bubble, composer, dan result attachment
- hilangkan kesan neon dashboard tanpa membuang kekuatan fitur workspace
