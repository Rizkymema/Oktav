Bertindak sebagai AI System Architect, Autonomous Agent Engineer, dan Software Engineer.

Saya ingin mengembangkan sistem AI Agent milik saya agar memiliki cara kerja seperti Hermes Agent, tetapi tetap menggunakan UI, fitur, database, API, dan arsitektur aplikasi saya sendiri.

Jangan mengintegrasikan atau menyalin Hermes Agent secara langsung. Pelajari dan adaptasikan konsep, flow, serta pola kerja utamanya menjadi implementasi baru yang kompatibel dengan sistem saya.

Konsep utama yang ingin diadopsi:
- Main orchestrator sebagai pengatur seluruh agent
- Analisis tujuan pengguna
- Planning dan task breakdown otomatis
- Delegasi tugas ke sub-agent
- Tools dan function calling
- Sistem skills yang modular
- Memory dan context management
- Eksekusi file, terminal, API, database, Docker, dan Git
- Monitoring progres dan live logs
- Testing, validation, retry, dan self-correction
- Approval pengguna untuk tindakan berisiko
- Error handling dan recovery
- Penyimpanan riwayat task dan hasil eksekusi

Fitur yang sudah ada di sistem saya harus tetap digunakan dan tidak diganti. Sistem baru hanya menambahkan intelligence layer dan autonomous execution flow seperti Hermes Agent.

Flow utama yang diinginkan:

User memberikan tujuan
→ sistem memahami dan mengklarifikasi tujuan
→ orchestrator membuat rencana
→ task dipecah menjadi beberapa langkah
→ orchestrator memilih agent, skill, dan tool
→ agent mengeksekusi tugas
→ sistem memantau progres dan log
→ hasil diuji dan divalidasi
→ jika gagal, sistem melakukan retry atau perbaikan
→ jika berisiko, meminta approval pengguna
→ hasil akhir disimpan dan ditampilkan kepada pengguna

Buat output berupa:
1. Arsitektur sistem
2. Flow kerja lengkap
3. Komponen yang perlu ditambahkan
4. Struktur orchestrator dan sub-agent
5. Sistem tools dan skills
6. Memory dan context management
7. Task lifecycle dan status
8. Permission dan security
9. Struktur database
10. Struktur folder project
11. API dan event flow
12. Tahapan implementasi dari MVP sampai production

Pastikan hasilnya modular, scalable, aman, mudah dikembangkan, dan tidak merusak fitur yang sudah tersedia di sistem saya.