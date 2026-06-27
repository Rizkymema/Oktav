# Hermes AI Workspace (Sederhana & Terfokus) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memoles visual dan interaksi frontend Hermes AI Workspace dengan Pendekatan 1 (SaaS minimalis gelap, hover radial glow mengikuti mouse) serta menyederhanakan navigasi dengan membuang fitur Control Center, menyisakan hanya AI Workspace utama.

**Architecture:** Merampingkan komponen layout shell, sidebar, dan topbar untuk mematikan rujukan ke Control Center. Menambahkan state pelacak posisi mouse di grid shell utama untuk memposisikan dynamic radial glow. Menambahkan event listener file drop dan tinggi dinamis (auto-growing) pada Prompt Composer.

**Tech Stack:** Next.js 15 (App Router), React 19, Tailwind CSS, Lucide React icons.

---

### Task 1: Perampingan Sidebar Layout
**Files:**
- Modify: `components/workspace/WorkspaceSidebar.tsx`

- [ ] **Step 1: Edit WorkspaceSidebar.tsx untuk merampingkan navigasi dan menghapus komponen terkait Control Center**
  Kita akan membuang tautan "Explore Skills" dan "Scheduled Tasks", panel "Connect IM Channel", tombol "Desktop Access", serta footer link bantuan dan status gateway.

  Ganti isi `components/workspace/WorkspaceSidebar.tsx` dengan kode berikut yang bersih:
  ```tsx
  'use client';

  import React, { useState } from 'react';
  import Link from 'next/link';
  import { usePathname } from 'next/navigation';
  import {
    Home,
    Folder,
    Plus,
    Search,
    Layers,
    Sparkles,
    Settings,
    HelpCircle
  } from 'lucide-react';
  import { useWorkspace } from '@/lib/workspace/workspace-context';

  export default function WorkspaceSidebar({ 
    isCollapsed,
    onOpenNewProject
  }: {
    isCollapsed: boolean;
    onOpenNewProject: () => void;
  }) {
    const pathname = usePathname();
    const { projects, credits, connected } = useWorkspace();
    const [projectSearch, setProjectSearch] = useState('');

    // Filter projects based on search query
    const filteredProjects = projects.filter(p => 
      p.name.toLowerCase().includes(projectSearch.toLowerCase())
    );

    return (
      <aside className={`relative z-10 flex h-full flex-col border-r border-white/10 bg-[#12161e] select-none shrink-0 transition-all duration-300 ${
        isCollapsed ? 'w-0 overflow-hidden border-r-0 opacity-0 pointer-events-none' : 'w-[280px] opacity-100'
      }`}>
        {/* Sidebar Header Button: New Project */}
        <div className="p-4 border-b border-white/10">
          <button
            onClick={onOpenNewProject}
            className="ds-btn-primary w-full py-3.5 text-xs rounded-xl hover:opacity-90 flex items-center justify-center gap-2 font-bold tracking-wide"
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </button>
        </div>

        {/* Main Navigation Links */}
        <div className="px-4 py-4 space-y-1">
          <Link
            href="/workspace"
            className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-xs font-semibold tracking-wide transition ${
              pathname === '/workspace'
                ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 shadow-[0_0_12px_rgba(0,210,255,0.06)]'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Home className="h-4 w-4" />
              <span>Workspace Home</span>
            </div>
            <span className="text-[9px] bg-accent-cyan/20 text-accent-cyan px-1.5 py-0.5 rounded-full font-bold">Live</span>
          </Link>
        </div>

        {/* Projects History Panel */}
        <div className="flex-1 overflow-hidden flex flex-col px-4 py-2 min-h-0">
          <div className="flex items-center justify-between px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <span>Project History</span>
            <Layers className="h-3.5 w-3.5" />
          </div>

          {/* Mini search inside sidebar history */}
          <div className="relative mb-3 px-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-600" />
            <input
              type="text"
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              placeholder="Cari project..."
              className="w-full rounded-lg border border-white/5 bg-[#090b10] py-1.5 pl-8 pr-3 text-[11px] text-white placeholder-slate-600 focus:border-accent-cyan/50 focus:outline-none"
            />
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((p) => {
                const isProjActive = pathname === `/workspace/projects/${p.id}`;
                return (
                  <Link
                    key={p.name}
                    href={`/workspace/projects/${p.id}`}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs transition ${
                      isProjActive
                        ? 'bg-white/10 text-white font-semibold border border-white/5'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                    <div className={`h-2 w-2 rounded-full shrink-0 ${
                      p.status === 'completed' ? 'bg-emerald-400' :
                      p.status === 'failed' ? 'bg-rose-400' :
                      p.status === 'running' ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'
                    }`} />
                    <div className="truncate flex-1">
                      <p className="truncate font-medium">{p.name}</p>
                      <span className="text-[9px] text-slate-500 font-bold block">{p.type}</span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="text-[10px] text-slate-600 text-center py-5">
                Tidak ada riwayat proyek
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Footer Displays */}
        <div className="p-4 border-t border-white/10 space-y-4">
          {/* Daily Credits Display */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              <span>Daily Limit</span>
              <span className="text-white font-extrabold">{credits.used} / {credits.max}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-accent-cyan to-indigo-500 transition-all duration-500" 
                style={{ width: `${(credits.used / credits.max) * 100}%` }}
              />
            </div>
          </div>

          {/* System status */}
          <div className="flex items-center justify-between px-2 pt-1">
            <span className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                {connected ? 'Gateway: Live' : 'Gateway: Offline'}
              </span>
            </span>
          </div>
        </div>
      </aside>
    );
  }
  ```

---

### Task 2: Perampingan Topbar Layout
**Files:**
- Modify: `components/workspace/WorkspaceTopbar.tsx`

- [ ] **Step 1: Edit WorkspaceTopbar.tsx untuk menghapus ikon shortcut non-Workspace**
  Kita akan membuang tombol Desktop Access (ikon download) dan tombol notifikasi karena drawer notifikasi tidak lagi relevan tanpa Control Center.

  Ganti isi `components/workspace/WorkspaceTopbar.tsx` dengan kode berikut:
  ```tsx
  'use client';

  import React from 'react';
  import { Menu, Sparkles, ChevronRight } from 'lucide-react';
  import { useWorkspace } from '@/lib/workspace/workspace-context';

  export default function WorkspaceTopbar({
    onToggleSidebar,
    isSidebarCollapsed
  }: {
    onToggleSidebar: () => void;
    isSidebarCollapsed: boolean;
  }) {
    const { projects, activeProjectId } = useWorkspace();

    const activeProject = projects.find(p => p.id === activeProjectId);

    return (
      <header className="flex h-14 items-center justify-between border-b border-white/10 bg-[#0a0e1c] px-4 select-none relative z-25">
        <div className="flex items-center gap-3">
          <button 
            onClick={onToggleSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition"
            title={isSidebarCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span className="text-slate-500">Workspace</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
            <span className="text-white flex items-center gap-1.5">
              {activeProject ? activeProject.name : 'HermesClaw Workspace'}
              {activeProject && (
                <span className="text-[9px] bg-accent-cyan/15 text-accent-cyan px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  {activeProject.goal}
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[10px] font-bold text-accent-cyan bg-accent-cyan/10 border border-accent-cyan/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
            <Sparkles className="h-3 w-3 animate-pulse" />
            <span>HermesClaw AI</span>
          </div>
        </div>
      </header>
    );
  }
  ```

---

### Task 3: Shell Layout & Mouse-Tracking Radial Glow
**Files:**
- Modify: `components/workspace/WorkspaceShell.tsx`

- [ ] **Step 1: Edit WorkspaceShell.tsx untuk mengimplementasikan mouse-tracking glow dan dynamic imports**
  Kita akan:
  1. Menambahkan custom mouse listener `onMouseMove` untuk melacak koordinat kursor mouse.
  2. Me-render gelembung cahaya radial (`radial-gradient`) absolut yang diposisikan secara real-time mengikuti kursor.
  3. Menghapus modal-modal Control Center (`isToolsOpen`, `isIMOpen`, `isDesktopOpen`).
  4. Menggunakan `next/dynamic` untuk mengimpor modal Create Project (`isNewProjectOpen`) secara dinamis.

  Ganti isi `components/workspace/WorkspaceShell.tsx` dengan kode berikut:
  ```tsx
  'use client';

  import React, { useState, useEffect, useRef } from 'react';
  import dynamic from 'next/dynamic';
  import WorkspaceIconRail from './WorkspaceIconRail';
  import WorkspaceSidebar from './WorkspaceSidebar';
  import WorkspaceTopbar from './WorkspaceTopbar';
  import { useWorkspace } from '@/lib/workspace/workspace-context';

  // Import Modal Pembuatan Project secara dinamis untuk mengoptimalkan JS bundle size
  const DynamicCreateProjectModal = dynamic(
    () => import('./CreateProjectModal'),
    { loading: () => <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm" /> }
  );

  export default function WorkspaceShell({ 
    children 
  }: { 
    children: React.ReactNode 
  }) {
    // Layout states
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);

    // Mouse coordinates state for dynamic radial gradient glow
    const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
    const shellRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!shellRef.current) return;
      const rect = shellRef.current.getBoundingClientRect();
      setMouseCoords({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    };

    return (
      <div 
        ref={shellRef}
        onMouseMove={handleMouseMove}
        className="flex h-screen w-screen overflow-hidden bg-[#050814] text-slate-100 font-sans relative"
      >
        
        {/* Background mesh grid */}
        <div className="absolute inset-0 bg-grid opacity-25 pointer-events-none z-0" />
        
        {/* Dynamic mouse-tracking radial gradient glow (Approach 1) */}
        <div 
          className="absolute pointer-events-none z-0 transition-opacity duration-300 ease-out"
          style={{
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0, 210, 255, 0.04) 0%, rgba(0, 210, 255, 0.005) 50%, transparent 100%)',
            left: `${mouseCoords.x - 200}px`,
            top: `${mouseCoords.y - 200}px`,
            transform: 'translate3d(0,0,0)', // GPU acceleration
          }}
        />

        {/* LEFT MOST: Icon Rail (Permanent) */}
        <WorkspaceIconRail onToggleNotifications={() => {}} />

        {/* LEFT: Navigation Sidebar (Collapsible with smooth transition) */}
        <WorkspaceSidebar 
          isCollapsed={isSidebarCollapsed}
          onOpenNewProject={() => setIsNewProjectOpen(true)}
        />

        {/* RIGHT: Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden relative z-10">
          
          {/* Top Header bar */}
          <WorkspaceTopbar 
            onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            isSidebarCollapsed={isSidebarCollapsed}
          />

          {/* Content body container */}
          <div className="flex-1 overflow-hidden relative">
            {children}
          </div>
        </div>

        {/* GLOBAL MODAL: CREATE NEW PROJECT (Loaded dynamically) */}
        {isNewProjectOpen && (
          <DynamicCreateProjectModal 
            onClose={() => setIsNewProjectOpen(false)}
          />
        )}

      </div>
    );
  }
  ```

---

### Task 4: Membuat File Modal Create Project Dinamis
**Files:**
- Create: `components/workspace/CreateProjectModal.tsx`

- [ ] **Step 1: Buat berkas CreateProjectModal.tsx**
  Memisahkan dialog pembuatan project ke berkas terpisah agar didukung penuh oleh pemecahan berkas Next.js.

  Tulis berkas `components/workspace/CreateProjectModal.tsx` dengan kode berikut:
  ```tsx
  'use client';

  import React, { useState } from 'react';
  import { X, Folder } from 'lucide-react';
  import { useWorkspace } from '@/lib/workspace/workspace-context';

  export default function CreateProjectModal({
    onClose
  }: {
    onClose: () => void;
  }) {
    const { createNewProject } = useWorkspace();
    const [newProjName, setNewProjName] = useState('');
    const [newProjDesc, setNewProjDesc] = useState('');
    const [newProjSkill, setNewProjSkill] = useState('Documents');
    const [newProjGoal, setNewProjGoal] = useState('Quick Task');

    const handleCreateProjectSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newProjName.trim()) return;

      createNewProject(newProjName.trim(), newProjDesc.trim(), newProjSkill, newProjGoal);
      setNewProjName('');
      setNewProjDesc('');
      onClose();
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
        <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0a0e1c] p-6 shadow-2xl animate-fade-in">
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Folder className="h-4.5 w-4.5 text-accent-cyan" />
            Inisiasi Project Baru
          </h3>
          <p className="mt-1.5 text-xs text-slate-400">Buat workspace project baru untuk dieksekusi secara terfokus oleh tim AI agent.</p>

          <form onSubmit={handleCreateProjectSubmit} className="mt-6 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Nama Project</label>
              <input 
                type="text" 
                value={newProjName}
                onChange={(e) => setNewProjName(e.target.value)}
                placeholder="Contoh: Medicare App Pitch Deck" 
                className="w-full rounded-xl border border-white/10 bg-[#050814] px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-accent-cyan focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Deskripsi Project</label>
              <textarea 
                value={newProjDesc}
                onChange={(e) => setNewProjDesc(e.target.value)}
                placeholder="Tulis tujuan proyek atau sasaran bisnis proyek ini..." 
                className="w-full rounded-xl border border-white/10 bg-[#050814] px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-accent-cyan focus:outline-none min-h-[70px] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Default Skill</label>
                <select 
                  value={newProjSkill}
                  onChange={(e) => setNewProjSkill(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#050814] px-4 py-2.5 text-xs text-white focus:border-accent-cyan focus:outline-none"
                >
                  <option>Slides</option>
                  <option>Documents</option>
                  <option>Sheets</option>
                  <option>Websites</option>
                  <option>Videos</option>
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Goal Utama</label>
                <select 
                  value={newProjGoal}
                  onChange={(e) => setNewProjGoal(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#050814] px-4 py-2.5 text-xs text-white focus:border-accent-cyan focus:outline-none"
                >
                  <option>Quick Task</option>
                  <option>Deep Research</option>
                  <option>Create Content</option>
                  <option>Build Project</option>
                  <option>Analyze Data</option>
                </select>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full rounded-2xl bg-accent-cyan py-3.5 text-xs font-bold text-slate-950 hover:bg-opacity-90 transition mt-4"
            >
              Buat Project Workspace
            </button>
          </form>
        </div>
      </div>
    );
  }
  ```

---

### Task 5: Pemolesan Prompt Composer & File Drop Listener
**Files:**
- Modify: `components/workspace/PromptComposer.tsx`

- [ ] **Step 1: Edit PromptComposer.tsx untuk auto-growing, keyboard shortcuts, dan drag-and-drop file**
  Kita akan mengimplementasikan auto-growing textarea menggunakan React ref, shortcut keyboard Enter (submit) & Shift+Enter (baris baru), serta drag-and-drop listener dengan visual overlay.

  Ganti isi `components/workspace/PromptComposer.tsx` dengan berkas yang telah dipoles berikut:
  ```tsx
  'use client';

  import React, { useState, useRef, useEffect } from 'react';
  import { 
    Plus, 
    Target, 
    Sparkles, 
    X, 
    ChevronDown, 
    Send,
    Globe
  } from 'lucide-react';
  import { useWorkspace } from '@/lib/workspace/workspace-context';

  export default function PromptComposer() {
    const {
      promptInput,
      setPromptInput,
      selectedSkill,
      setSelectedSkill,
      selectedModel,
      setSelectedModel,
      deepResearchMode,
      setDeepResearchMode,
      researchDepth,
      setResearchDepth,
      researchScope,
      setResearchScope,
      handleSubmitPrompt
    } = useWorkspace();

    // Textarea ref for auto-growing
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Drag-and-drop state
    const [isDragging, setIsDragging] = useState(false);

    // Local Dropdowns
    const [goalOpen, setGoalOpen] = useState(false);
    const [researchConfigOpen, setResearchConfigOpen] = useState(false);
    const [modelOpen, setModelOpen] = useState(false);
    const [activeGoal, setActiveGoal] = useState('Quick Task');

    // Attachment states
    const [attachments, setAttachments] = useState<Array<{ name: string; size: string; progress?: number }>>([]);

    const goals = [
      'Quick Task',
      'Deep Research',
      'Create Content',
      'Build Project',
      'Analyze Data',
      'Automate Workflow'
    ];

    const modelOptions = [
      { name: 'Auto Model', desc: 'Pilihan otomatis berdasarkan kompleksitas tugas', badge: 'Recommended' },
      { name: 'Fast', desc: 'Model super cepat untuk instruksi harian ringan', badge: 'Speed' },
      { name: 'High Quality', desc: 'Gunakan model tercanggih (Gemini 3.5 Pro)', badge: 'Pro' }
    ];

    // Auto-grow height trigger
    useEffect(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`;
    }, [promptInput]);

    const handleGoalSelect = (goal: string) => {
      setActiveGoal(goal);
      setGoalOpen(false);
      if (goal === 'Deep Research') {
        setDeepResearchMode(true);
      } else {
        setDeepResearchMode(false);
      }
    };

    // Drag & Drop Handlers
    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const newFiles: Array<{ name: string; size: string; progress: number }> = [];
        
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          const file = e.dataTransfer.files[i];
          const sizeMB = file.size / (1024 * 1024);
          const sizeStr = sizeMB < 1 
            ? `${Math.round(file.size / 1024)} KB` 
            : `${sizeMB.toFixed(1)} MB`;

          newFiles.push({
            name: file.name,
            size: sizeStr,
            progress: 0
          });
        }

        setAttachments(prev => [...prev, ...newFiles]);

        // Simulasikan progress upload
        newFiles.forEach((file, index) => {
          let currentProgress = 0;
          const interval = setInterval(() => {
            currentProgress += 20;
            setAttachments(prev => {
              const copy = [...prev];
              const idx = copy.findIndex(f => f.name === file.name);
              if (idx !== -1) {
                copy[idx] = { ...copy[idx], progress: currentProgress };
              }
              return copy;
            });

            if (currentProgress >= 100) {
              clearInterval(interval);
            }
          }, 150);
        });
      }
    };

    const handleAddMockAttachment = () => {
      const mockFiles = [
        { name: 'data_penjualan_2026.csv', size: '240 KB', progress: 100 },
        { name: 'referensi_desain_mood.png', size: '1.2 MB', progress: 100 },
        { name: 'outline_laporan.docx', size: '48 KB', progress: 100 }
      ];
      const randomFile = mockFiles[Math.floor(Math.random() * mockFiles.length)];
      setAttachments(prev => [...prev, randomFile]);
    };

    const handleRemoveAttachment = (idx: number) => {
      setAttachments(prev => prev.filter((_, i) => i !== idx));
    };

    const onSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!promptInput.trim()) return;
      handleSubmitPrompt(promptInput);
    };

    // Helper checking if any attachment is still uploading
    const isUploading = attachments.some(f => f.progress !== undefined && f.progress < 100);

    return (
      <div className="space-y-3 w-full">
        <form 
          onSubmit={onSubmit} 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-3xl border p-3 shadow-2xl backdrop-blur-lg select-none transition-all duration-300 ${
            isDragging 
              ? 'border-accent-cyan bg-accent-cyan/5 scale-[1.01]' 
              : 'border-white/10 bg-[#0c1020]/90'
          }`}
        >
          {/* Drag & Drop Visual Overlay State */}
          {isDragging && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#050814]/90 rounded-3xl border border-dashed border-accent-cyan pointer-events-none animate-pulse">
              <div className="text-center">
                <Plus className="h-8 w-8 text-accent-cyan mx-auto mb-2" />
                <p className="text-sm font-bold text-white">Drop file ke sini</p>
                <p className="text-xs text-slate-500 mt-1">Format PDF, DOCX, XLSX, PNG aman diunggah</p>
              </div>
            </div>
          )}
          
          {/* Prompt Input Textarea */}
          <textarea
            ref={textareaRef}
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder={
              selectedSkill 
                ? `Jelaskan apa yang ingin Anda riset, buat, atau analisis dengan skill ${selectedSkill} bersama HermesClaw...` 
                : "Jelaskan apa yang ingin Anda riset, buat, analisis, otomatisasi, atau bangun bersama HermesClaw..."
            }
            rows={3}
            className="w-full resize-none bg-transparent px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none min-h-[100px] max-h-[220px] scrollbar-thin"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e);
              }
            }}
          />

          {/* Attachment Previews */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4 pb-2.5">
              {attachments.map((file, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 relative overflow-hidden"
                >
                  {/* File progress bar */}
                  {file.progress !== undefined && file.progress < 100 && (
                    <div 
                      className="absolute bottom-0 left-0 h-0.5 bg-accent-cyan transition-all duration-150" 
                      style={{ width: `${file.progress}%` }}
                    />
                  )}
                  <span>{file.name} ({file.size})</span>
                  <button 
                    type="button" 
                    onClick={() => handleRemoveAttachment(idx)}
                    className="text-slate-500 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Action Controls Bar */}
          <div className="flex flex-wrap items-center justify-between border-t border-white/5 pt-2.5 px-3">
            
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Attach button */}
              <button 
                type="button"
                onClick={handleAddMockAttachment}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition active:scale-95"
                title="Lampirkan File"
              >
                <Plus className="h-4 w-4" />
              </button>

              {/* Goal selection trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setGoalOpen(!goalOpen); setResearchConfigOpen(false); setModelOpen(false); }}
                  className="flex h-8 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition active:scale-95"
                >
                  <Target className="h-3.5 w-3.5 text-accent-cyan" />
                  <span>Goal: {activeGoal}</span>
                  <ChevronDown className="h-3 w-3 text-slate-500" />
                </button>

                {goalOpen && (
                  <div className="absolute left-0 bottom-full mb-2 z-35 w-52 rounded-xl border border-white/10 bg-[#0a0e1c] p-1.5 shadow-2xl">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block px-2.5 py-1">Pilih Target Goal</span>
                    {goals.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => handleGoalSelect(g)}
                        className={`flex w-full items-center rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                          activeGoal === g ? 'bg-accent-cyan/15 text-accent-cyan font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Deep Research settings toggle */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setDeepResearchMode(!deepResearchMode); setResearchConfigOpen(!deepResearchMode); setGoalOpen(false); setModelOpen(false); }}
                  className={`flex h-8 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all active:scale-95 ${
                    deepResearchMode 
                      ? 'bg-accent-cyan/15 border-accent-cyan text-accent-cyan shadow-[0_0_10px_rgba(0,210,255,0.06)]' 
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>Deep Research</span>
                </button>

                {deepResearchMode && researchConfigOpen && (
                  <div className="absolute left-0 bottom-full mb-2 z-35 w-64 rounded-2xl border border-white/10 bg-[#0a0e1c] p-4 shadow-2xl space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Parameter Riset</span>
                      <button type="button" onClick={() => setResearchConfigOpen(false)} className="text-slate-500 hover:text-white">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    
                    {/* Research Depth */}
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Kedalaman Riset</span>
                      <div className="grid grid-cols-4 gap-1 bg-black/45 p-1 rounded-lg border border-white/5">
                        {(['Quick', 'Standard', 'Deep', 'Expert'] as const).map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setResearchDepth(d)}
                            className={`py-1 rounded text-[9px] font-bold transition ${
                              researchDepth === d ? 'bg-accent-cyan text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Research Source Scope */}
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Cakupan Data</span>
                      <select
                        value={researchScope}
                        onChange={(e: any) => setResearchScope(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-[#050814] px-2.5 py-1.5 text-[10px] text-white focus:border-accent-cyan focus:outline-none"
                      >
                        <option>Web</option>
                        <option>Uploaded Files</option>
                        <option>Knowledge Base</option>
                        <option>All Available Sources</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Active Skill Indicator */}
              {selectedSkill && (
                <div className="flex h-8 items-center gap-1.5 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 px-3 py-1.5 text-xs font-extrabold text-accent-cyan">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  <span>Skill: {selectedSkill}</span>
                  <button type="button" onClick={() => setSelectedSkill(null)} className="hover:text-white ml-0.5">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

            </div>

            {/* Right side prompt composers */}
            <div className="flex items-center gap-2">
              
              {/* Model Selection Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setModelOpen(!modelOpen); setGoalOpen(false); setResearchConfigOpen(false); }}
                  className="flex h-8 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition active:scale-95"
                >
                  <span>{selectedModel}</span>
                  <ChevronDown className="h-3 w-3 text-slate-500" />
                  <span className="text-[8px] bg-red-500 text-white px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider animate-bounce">New</span>
                </button>

                {modelOpen && (
                  <div className="absolute right-0 bottom-full mb-2 z-35 w-52 rounded-xl border border-white/10 bg-[#0a0e1c] p-1.5 shadow-2xl">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block px-2.5 py-1">Pilih AI Model</span>
                    {modelOptions.map((opt) => (
                      <button
                        key={opt.name}
                        type="button"
                        onClick={() => { setSelectedModel(opt.name); setModelOpen(false); }}
                        className={`flex w-full items-start rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                          selectedModel === opt.name ? 'bg-accent-cyan/15 text-accent-cyan font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold">{opt.name}</span>
                            {opt.badge && (
                              <span className="text-[7px] bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30 px-1 rounded font-bold uppercase tracking-wider">{opt.badge}</span>
                            )}
                          </div>
                          <p className="text-[9px] text-slate-500 mt-0.5 leading-relaxed">{opt.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Prompt Send Button */}
              <button
                type="submit"
                disabled={!promptInput.trim() || isUploading}
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition active:scale-95 ${
                  promptInput.trim() && !isUploading
                    ? 'bg-white text-slate-950 hover:scale-105 shadow-lg shadow-white/5' 
                    : 'bg-white/5 border border-white/10 text-slate-600 cursor-not-allowed'
                }`}
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>

          </div>

        </form>
        
        {/* Shortcut Guide Footer */}
        <div className="flex justify-between items-center px-4 text-[10px] text-slate-500">
          <span>Shortcut: <kbd className="bg-white/5 border border-white/10 px-1 py-0.2 rounded font-mono text-[9px]">Enter</kbd> untuk Kirim, <kbd className="bg-white/5 border border-white/10 px-1 py-0.2 rounded font-mono text-[9px]">Shift+Enter</kbd> untuk Baris Baru</span>
          {deepResearchMode && (
            <span className="text-accent-cyan font-bold animate-pulse">Deep Research mengonsumsi estimasi 2-8 kredit per tugas.</span>
          )}
        </div>
      </div>
    );
  }
  ```

---

### Task 6: Pembersihan Berkas Halaman Non-Workspace
**Files:**
- Delete: `app/workspace/skills/page.tsx`
- Delete: `app/workspace/scheduled/page.tsx`
- Delete: `app/workspace/desktop/page.tsx`
- Delete: `app/workspace/channels/page.tsx`

- [ ] **Step 1: Hapus berkas route yang tidak dipakai**
  Untuk mencegah overhead Next.js compilation dan merampingkan repositori sesuai instruksi "yang lain hapus saja".
  *Kita akan menghapus berkas-berkas ini.*

---

### Task 7: Verifikasi Linter dan TypeScript Compiler
**Files:**
- None (Kompilasi)

- [ ] **Step 1: Jalankan validasi linter**
  Run: `npm run lint`
  Expected: SUCCESS

- [ ] **Step 2: Jalankan pemeriksaan compiler TypeScript**
  Run: `npx tsc --noEmit`
  Expected: SUCCESS (exit code 0)

- [ ] **Step 3: Jalankan building aplikasi Next.js**
  Run: `npm run build`
  Expected: SUCCESS
