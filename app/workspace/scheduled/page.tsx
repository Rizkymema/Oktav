'use client';

import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Play, 
  Pause, 
  Trash2, 
  Plus, 
  ChevronRight, 
  Sparkles,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface ScheduledTask {
  id: string;
  name: string;
  schedule: string;
  skill: string;
  activeAgent: string;
  lastRun: string;
  status: 'active' | 'paused' | 'running';
  creditsPerRun: number;
}

export default function ScheduledTasksPage() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([
    {
      id: 'sched-001',
      name: 'Laporan Analisis Kompetitor EV Harian',
      schedule: 'Setiap hari pukul 08:00',
      skill: 'Documents',
      activeAgent: 'Research Agent',
      lastRun: '21 Juni 2026 08:00 (Success)',
      status: 'active',
      creditsPerRun: 4
    },
    {
      id: 'sched-002',
      name: 'SOP & Dokumen Internal Auto-Backup',
      schedule: 'Setiap Senin pukul 01:00',
      skill: 'Documents',
      activeAgent: 'Document Agent',
      lastRun: '15 Juni 2026 01:00 (Success)',
      status: 'active',
      creditsPerRun: 2
    },
    {
      id: 'sched-003',
      name: 'Generasi Aset Promo Sosmed Mingguan',
      schedule: 'Setiap hari Jumat pukul 17:00',
      skill: 'Images',
      activeAgent: 'Image Agent',
      lastRun: '19 Juni 2026 17:01 (Success)',
      status: 'active',
      creditsPerRun: 6
    },
    {
      id: 'sched-004',
      name: 'Audit Cashflow & Optimasi Laporan Keuangan',
      schedule: 'Tanggal 1 setiap bulan pukul 00:00',
      skill: 'Sheets',
      activeAgent: 'Data & Sheets Agent',
      lastRun: '1 Juni 2026 00:03 (Success)',
      status: 'paused',
      creditsPerRun: 5
    }
  ]);

  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskSchedule, setNewTaskSchedule] = useState('Setiap hari pukul 09:00');
  const [newTaskSkill, setNewTaskSkill] = useState('Documents');
  const [newTaskAgent, setNewTaskAgent] = useState('Research Agent');

  const handleToggleStatus = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: t.status === 'active' ? 'paused' : 'active'
        };
      }
      return t;
    }));
  };

  const handleDeleteTask = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus jadwal pengerjaan otomatis ini?')) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    const newTask: ScheduledTask = {
      id: `sched-${Math.random().toString(36).substring(7)}`,
      name: newTaskName.trim(),
      schedule: newTaskSchedule,
      skill: newTaskSkill,
      activeAgent: newTaskAgent,
      lastRun: 'Belum pernah dijalankan',
      status: 'active',
      creditsPerRun: newTaskSkill === 'Websites' ? 8 : newTaskSkill === 'Slides' ? 5 : 3
    };

    setTasks(prev => [newTask, ...prev]);
    setNewTaskName('');
  };

  return (
    <div className="h-full w-full overflow-y-auto px-6 py-8 md:px-10 md:py-10 bg-[#050814] scrollbar-thin">
      <div className="mx-auto max-w-4xl space-y-8 pb-16 animate-fade-in select-none">
        
        {/* Page Title */}
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-accent-cyan/20 bg-accent-cyan/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-accent-cyan mb-3">
              <Calendar className="h-3.5 w-3.5" />
              <span>Cron Jobs & Automasi</span>
            </div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Scheduled Tasks (Tugas Terjadwal)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Atur cron job pengerjaan otomatis oleh asisten AI untuk memantau, meriset, dan memperbarui aset proyek secara berkala.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* List of Tasks */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jadwal Aktif ({tasks.length})</h3>
            
            <div className="space-y-3.5">
              {tasks.map(t => (
                <div 
                  key={t.id} 
                  className={`rounded-2xl border bg-[#0a0e1c]/45 p-5 flex flex-col justify-between transition-all duration-300 ${
                    t.status === 'paused' ? 'border-white/5 opacity-55' : 'border-white/5 hover:border-accent-cyan/20 hover:shadow-[0_4px_20px_rgba(0,210,255,0.02)]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block leading-snug">{t.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono mt-1.5 block">
                        Jadwal: <span className="text-accent-cyan font-semibold">{t.schedule}</span>
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider border shrink-0 ${
                      t.status === 'active' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                      t.status === 'paused' ? 'text-slate-400 bg-slate-550/10 border-slate-500/20' :
                      'text-accent-cyan bg-accent-cyan/10 border-accent-cyan/20 animate-pulse'
                    }`}>
                      {t.status}
                    </span>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-white/5 flex flex-wrap gap-y-2 items-center justify-between text-[10px] text-slate-400">
                    <div className="flex gap-4">
                      <span>Skill: <strong className="text-slate-300 font-medium">{t.skill}</strong></span>
                      <span>Agent: <strong className="text-slate-300 font-medium">{t.activeAgent}</strong></span>
                      <span>Biaya: <strong className="text-accent-cyan">{t.creditsPerRun} krd</strong></span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => handleToggleStatus(t.id)}
                        className="p-1.5 rounded-xl border border-white/5 bg-white/5 text-slate-400 hover:text-white transition hover:bg-white/10 active:scale-95"
                        title={t.status === 'active' ? 'Jeda Otomatisasi' : 'Aktifkan Kembali'}
                      >
                        {t.status === 'active' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 text-emerald-400" />}
                      </button>
                      <button 
                        onClick={() => handleDeleteTask(t.id)}
                        className="p-1.5 rounded-xl border border-white/5 bg-white/5 text-slate-400 hover:text-rose-400 transition hover:bg-white/10 active:scale-95"
                        title="Hapus Penjadwalan"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2.5 text-[9px] text-slate-500 font-mono flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-655" />
                    Last Run: {t.lastRun}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Scheduler */}
          <div className="rounded-2xl border border-white/5 bg-[#0a0e1c]/90 p-5 space-y-4 h-fit">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-accent-cyan" />
              Schedule New Task
            </h3>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Atur instruksi regular untuk dijalankan secara berkala pada runtime asisten VPS.
            </p>

            <form onSubmit={handleCreateTask} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block">Nama Jadwal / Pemicu</label>
                <input 
                  type="text" 
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="Contoh: Riset Harga Saham Harian" 
                  className="w-full rounded-xl border border-white/5 bg-[#050814] px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-accent-cyan focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block">Interval Cron Expression</label>
                <select 
                  value={newTaskSchedule}
                  onChange={(e) => setNewTaskSchedule(e.target.value)}
                  className="w-full rounded-xl border border-white/5 bg-[#050814] px-3.5 py-2.5 text-xs text-white focus:border-accent-cyan focus:outline-none font-medium"
                >
                  <option>Setiap jam sekali</option>
                  <option>Setiap hari pukul 09:00</option>
                  <option>Setiap hari pukul 18:00</option>
                  <option>Setiap hari Senin pukul 08:00</option>
                  <option>Setiap hari Jumat pukul 17:00</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block">Skill Output</label>
                <select 
                  value={newTaskSkill}
                  onChange={(e) => setNewTaskSkill(e.target.value)}
                  className="w-full rounded-xl border border-white/5 bg-[#050814] px-3.5 py-2.5 text-xs text-white focus:border-accent-cyan focus:outline-none font-medium"
                >
                  <option>Documents</option>
                  <option>Slides</option>
                  <option>Sheets</option>
                  <option>Images</option>
                  <option>Websites</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block">Agen Pengeksekusi</label>
                <select 
                  value={newTaskAgent}
                  onChange={(e) => setNewTaskAgent(e.target.value)}
                  className="w-full rounded-xl border border-white/5 bg-[#050814] px-3.5 py-2.5 text-xs text-white focus:border-accent-cyan focus:outline-none font-medium"
                >
                  <option>Research Agent</option>
                  <option>Document Agent</option>
                  <option>Image Agent</option>
                  <option>Data & Sheets Agent</option>
                  <option>Project Builder Agent</option>
                </select>
              </div>

              <button 
                type="submit"
                className="ds-btn-primary w-full py-3 hover:bg-opacity-95 transition mt-4"
              >
                Jadwalkan Tugas
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
