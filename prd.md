# PRD — Multi-Role AI Agent Skill System

**Versi:** 1.0  
**Tanggal:** 17 Mei 2026  
**Status:** Draft  
**Pemilik Produk:** Tim Internal

---

## 1. Ringkasan Eksekutif

Dokumen ini mendefinisikan persyaratan produk untuk membangun **Multi-Role AI Agent Skill System** — sebuah koleksi file `skill.md` terstruktur yang mengaktifkan GitHub Copilot (dan AI agent lain yang kompatibel) agar dapat berperilaku sebagai spesialis dari setiap peran dalam ekosistem pengembangan website & aplikasi.

Sistem ini terinspirasi dari pendekatan [Vercel Agent Skills](https://github.com/vercel-labs/agent-skills), [Agency Agents](https://github.com/msitarzewski/agency-agents), dan [Superpowers](https://github.com/obra/superpowers.git) — dikombinasikan dengan context engineering modern dari [Anthropic Claude Code](https://docs.anthropic.com/en/docs/claude-code).

---

## 2. Latar Belakang & Problem Statement

### Masalah
- AI agent generik tidak memiliki kedalaman konteks peran spesifik (misalnya, seorang **Security Penetration Tester** membutuhkan pola pikir berbeda dari **UX Researcher**)
- Tim pengembangan sering mengulang prompt yang sama untuk setiap peran
- Tidak ada standar skill file yang merepresentasikan seluruh struktur tim digital

### Peluang
- Framework agent skill modern (VS Code `.github/copilot-instructions.md`, shadcn AI, skills.sh) memungkinkan pembuatan skill yang dapat dipakai ulang
- Satu repositori skill yang mencakup 100+ peran dapat menjadi **standard toolkit** untuk agentic development workflow

---

## 3. Tujuan & Sasaran

| # | Tujuan | Metrik Keberhasilan |
|---|--------|---------------------|
| 1 | Setiap peran memiliki skill file yang dapat diaktifkan sebagai agent | 100% peran tercover |
| 2 | Skill file mengikuti format standar yang konsisten | Review lolos template checklist |
| 3 | Agent mampu menghasilkan output berkualitas senior-level | Peer review rating ≥ 4/5 |
| 4 | Sistem dapat dikembangkan modular per kategori | Penambahan peran baru < 30 menit |

---

## 4. Target Pengguna

- **Developer individu** yang ingin AI agent memahami konteks pekerjaan spesifik mereka
- **Tim engineering** yang membutuhkan konsistensi output AI di seluruh peran
- **Freelancer & Startup** yang menjalankan banyak peran sekaligus
- **Tech Lead & Architect** yang merancang workflow agentic untuk tim

---

## 5. Scope Produk

### 5.1 Struktur Skill File (Format Standar)

Setiap skill file (`skill.md`) mengikuti struktur berikut:

```markdown
---
name: [Nama Peran]
category: [Kategori]
applyTo: "**" | "*.tsx" | dst.
---

## Role
[Deskripsi peran dalam 2–3 kalimat]

## Core Responsibilities
- ...

## Mindset & Principles
- ...

## Output Standards
- ...

## Tools & Stack
- ...

## Do / Don't
| Do | Don't |
|----|-------|
| ... | ... |
```

### 5.2 Kategori & Peran yang Harus Dicover

#### Produk & Strategi
* Product Manager
* Associate Product Manager
* Technical Product Manager
* Product Owner
* Business Analyst
* System Analyst
* Project Manager
* Scrum Master
* Agile Coach

---

#### UI/UX & Design
* UI Designer
* UX Designer
* UX Researcher
* Product Designer
* Interaction Designer
* Visual Designer
* Graphic Designer
* Motion Designer
* Brand Designer
* Design System Designer
* Illustrator
* 3D Designer
* Animation Designer
* Creative Director

---

#### Frontend Development
* Frontend Developer
* Frontend Engineer
* Web Developer
* React Developer
* Next.js Developer
* Vue Developer
* Angular Developer
* TypeScript Developer
* JavaScript Developer
* UI Engineer
* Accessibility Engineer
* Performance Engineer

---

#### Mobile Development
* Android Developer
* iOS Developer
* Flutter Developer
* React Native Developer
* Mobile Engineer
* Cross Platform Developer
* Kotlin Developer
* Swift Developer

---

#### Backend Development
* Backend Developer
* Backend Engineer
* API Developer
* API Engineer
* Node.js Developer
* Golang Developer
* Python Developer
* Django Developer
* Laravel Developer
* PHP Developer
* Java Developer
* Spring Boot Developer
* .NET Developer
* Ruby on Rails Developer
* Microservices Engineer

---

#### Database & Data
* Database Administrator (DBA)
* Database Engineer
* Data Engineer
* Data Analyst
* Data Scientist
* Big Data Engineer
* ETL Developer
* BI Developer

---

#### DevOps & Infrastructure
* DevOps Engineer
* Cloud Engineer
* Infrastructure Engineer
* Platform Engineer
* Site Reliability Engineer (SRE)
* Kubernetes Engineer
* Docker Engineer
* CI/CD Engineer
* Network Engineer
* Linux Engineer
* System Administrator

---

#### Cyber Security
* Cyber Security Engineer
* Security Analyst
* Penetration Tester
* Ethical Hacker
* Application Security Engineer
* Cloud Security Engineer
* Security Researcher
* SOC Analyst
* Incident Response Analyst
* Vulnerability Analyst
* Malware Analyst
* Digital Forensic Analyst

---

#### AI & Machine Learning
* AI Engineer
* Machine Learning Engineer
* Deep Learning Engineer
* NLP Engineer
* Computer Vision Engineer
* Prompt Engineer
* LLM Engineer
* AI Researcher
* AI Automation Engineer
* MLOps Engineer
* Generative AI Engineer

---

#### QA & Testing
* QA Engineer
* Software Tester
* Automation QA Engineer
* Test Engineer
* Performance Tester
* Security Tester
* Manual Tester
* QA Analyst

---

#### Game & Interactive
* Game Developer
* Unity Developer
* Unreal Engine Developer
* AR Developer
* VR Developer

---

#### Content & Marketing
* Content Creator
* Content Strategist
* Copywriter
* SEO Specialist
* Digital Marketing Specialist
* Social Media Manager
* Community Manager
* Branding Specialist
* Performance Marketing Specialist
* Email Marketing Specialist
* Growth Hacker

---

#### Support & Operations
* Technical Support
* Customer Support
* Helpdesk Engineer
* IT Support
* Operations Manager
* Customer Success Manager

---

#### Leadership & Management
* CTO
* VP Engineering
* Engineering Manager
* Tech Lead
* Team Lead
* Software Architect
* Solution Architect
* Enterprise Architect

---

#### Specialized Roles
* Blockchain Developer
* Web3 Developer
* Smart Contract Engineer
* IoT Engineer
* Embedded Engineer
* Robotics Engineer
* FinOps Engineer
* Accessibility Specialist
* Localization Engineer
* CRM Developer
* ERP Developer
* Salesforce Developer
* SAP Consultant

---

#### Freelancer / Hybrid Roles
* Fullstack Developer
* Fullstack Engineer
* Indie Hacker
* No-Code Developer
* Low-Code Developer
* Technical Consultant
* Startup Builder
* SaaS Developer
* Automation Engineer
* AI Content Engineer

---

## 6. Persyaratan Teknis

### 6.1 Kompatibilitas Platform
| Platform | Format | Lokasi |
|----------|--------|--------|
| VS Code / GitHub Copilot | `.instructions.md` | `.github/` atau `.vscode/` |
| Cursor AI | `.cursorrules` | Root project |
| Claude Code | `CLAUDE.md` | Root project |
| Generic Agent | `skill.md` | `/skills/[kategori]/[peran].md` |

### 6.2 Struktur Repositori

```
skills/
├── product/
│   ├── product-manager.md
│   ├── product-owner.md
│   └── ...
├── design/
│   ├── ui-designer.md
│   ├── ux-researcher.md
│   └── ...
├── frontend/
├── backend/
├── mobile/
├── devops/
├── security/
├── ai-ml/
├── qa/
├── data/
├── leadership/
├── content/
├── specialized/
└── hybrid/
```

### 6.3 Standar Kualitas Konten Skill
- **Specificity:** Setiap skill harus mencerminkan pengambilan keputusan nyata dari peran tersebut
- **Actionability:** Output agent harus dapat langsung digunakan (kode, dokumen, analisis)
- **Security-aware:** Peran terkait keamanan wajib memuat prinsip OWASP Top 10
- **Context-aware:** Gunakan `applyTo` untuk membatasi aktivasi skill pada file yang relevan

---

## 7. Persyaratan Non-Fungsional

| Aspek | Persyaratan |
|-------|-------------|
| **Maintainability** | Setiap skill file independen, perubahan satu tidak mempengaruhi lainnya |
| **Scalability** | Arsitektur folder mendukung penambahan 50+ peran baru |
| **Consistency** | Semua skill menggunakan template yang sama (validasi via linter) |
| **Discoverability** | Index utama (`README.md`) menampilkan seluruh skill dengan deskripsi singkat |

---

## 8. Milestone & Roadmap

| Fase | Deliverable | Target |
|------|-------------|--------|
| **Fase 1** | Template standar + 10 skill prioritas (PM, FE, BE, UX, DevOps, QA, Security, AI, Data, Lead) | Sprint 1 |
| **Fase 2** | 50% peran tercover (prioritas kategori utama) | Sprint 2–3 |
| **Fase 3** | 100% peran tercover + index README | Sprint 4–5 |
| **Fase 4** | Integrasi `.instructions.md` untuk VS Code workspace | Sprint 6 |

---

## 9. Referensi & Inspirasi

| Sumber | Keterangan |
|--------|------------|
| [Vercel Agent Skills](https://github.com/vercel-labs/agent-skills) | Format skill resmi dari Vercel |
| [Agency Agents](https://github.com/msitarzewski/agency-agents) | Multi-agent agency model |
| [Superpowers](https://github.com/obra/superpowers) | AI superpower toolkit |
| [UI/UX Pro Max Skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | Skill spesialis design |
| [Awesome Cursorrules](https://github.com/PatrickJS/awesome-cursorrules) | Koleksi cursor rules per stack |
| [Context Engineering Intro](https://github.com/coleam00/context-engineering-intro) | Prinsip context engineering |
| [Anthropic Claude Code](https://docs.anthropic.com/en/docs/claude-code) | Best practice agentic coding |
| [shadcn AI Docs](https://ui.shadcn.com/docs/ai) | AI integration patterns |
| [skills.sh](https://www.skills.sh) | Skill management platform |
| [agentskill.sh](https://agentskill.sh) | Agent skill registry |
| [impeccable.style](https://impeccable.style) | Design & style reference |

---

## 10. Pertanyaan Terbuka

- [ ] Apakah satu peran dapat memiliki lebih dari satu variasi skill (junior vs senior)?
- [ ] Apakah skill akan dipublikasikan sebagai open-source repositori?
- [ ] Bagaimana mekanisme versioning ketika tool/framework berubah?
- [ ] Apakah akan ada CLI tool untuk mengaktifkan skill secara otomatis ke workspace?

---

*Dokumen ini akan diperbarui seiring perkembangan proyek. Semua perubahan material harus melalui review Product Owner.*
* Technical Product Manager
* Product Owner
* Business Analyst
* System Analyst
* Project Manager
* Scrum Master
* Agile Coach

---

## UI/UX & Design

* UI Designer
* UX Designer
* UX Researcher
* Product Designer
* Interaction Designer
* Visual Designer
* Graphic Designer
* Motion Designer
* Brand Designer
* Design System Designer
* Illustrator
* 3D Designer
* Animation Designer
* Creative Director

---

## Frontend Development

* Frontend Developer
* Frontend Engineer
* Web Developer
* React Developer
* Next.js Developer
* Vue Developer
* Angular Developer
* TypeScript Developer
* JavaScript Developer
* UI Engineer
* Accessibility Engineer
* Performance Engineer

---

## Mobile Development

* Android Developer
* iOS Developer
* Flutter Developer
* React Native Developer
* Mobile Engineer
* Cross Platform Developer
* Kotlin Developer
* Swift Developer

---

## Backend Development

* Backend Developer
* Backend Engineer
* API Developer
* API Engineer
* Node.js Developer
* Golang Developer
* Python Developer
* Django Developer
* Laravel Developer
* PHP Developer
* Java Developer
* Spring Boot Developer
* .NET Developer
* Ruby on Rails Developer
* Microservices Engineer

---

## Database & Data

* Database Administrator (DBA)
* Database Engineer
* Data Engineer
* Data Analyst
* Data Scientist
* Big Data Engineer
* ETL Developer
* BI Developer

---

## DevOps & Infrastructure

* DevOps Engineer
* Cloud Engineer
* Infrastructure Engineer
* Platform Engineer
* Site Reliability Engineer (SRE)
* Kubernetes Engineer
* Docker Engineer
* CI/CD Engineer
* Network Engineer
* Linux Engineer
* System Administrator

---

## Cyber Security

* Cyber Security Engineer
* Security Analyst
* Penetration Tester
* Ethical Hacker
* Application Security Engineer
* Cloud Security Engineer
* Security Researcher
* SOC Analyst
* Incident Response Analyst
* Vulnerability Analyst
* Malware Analyst
* Digital Forensic Analyst

---

## AI & Machine Learning

* AI Engineer
* Machine Learning Engineer
* Deep Learning Engineer
* NLP Engineer
* Computer Vision Engineer
* Prompt Engineer
* LLM Engineer
* AI Researcher
* AI Automation Engineer
* MLOps Engineer
* Generative AI Engineer

---

## QA & Testing

* QA Engineer
* Software Tester
* Automation QA Engineer
* Test Engineer
* Performance Tester
* Security Tester
* Manual Tester
* QA Analyst

---

## Game & Interactive

* Game Developer
* Unity Developer
* Unreal Engine Developer
* AR Developer
* VR Developer

---

## Content & Marketing

* Content Creator
* Content Strategist
* Copywriter
* SEO Specialist
* Digital Marketing Specialist
* Social Media Manager
* Community Manager
* Branding Specialist
* Performance Marketing Specialist
* Email Marketing Specialist
* Growth Hacker

---

## Support & Operations

* Technical Support
* Customer Support
* Helpdesk Engineer
* IT Support
* Operations Manager
* Customer Success Manager

---

## Leadership & Management

* CTO
* VP Engineering
* Engineering Manager
* Tech Lead
* Team Lead
* Software Architect
* Solution Architect
* Enterprise Architect

---

## Specialized Roles

* Blockchain Developer
* Web3 Developer
* Smart Contract Engineer
* IoT Engineer
* Embedded Engineer
* Robotics Engineer
* FinOps Engineer
* Accessibility Specialist
* Localization Engineer
* CRM Developer
* ERP Developer
* Salesforce Developer
* SAP Consultant

---

## Freelancer / Hybrid Roles

* Fullstack Developer
* Fullstack Engineer
* Indie Hacker
* No-Code Developer
* Low-Code Developer
* Technical Consultant
* Startup Builder
* SaaS Developer
* Automation Engineer
* AI Content Engineer
