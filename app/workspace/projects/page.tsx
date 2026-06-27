'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Folder, 
  Search, 
  Clock, 
  Sliders, 
  ArrowUpRight, 
  CheckCircle2, 
  XCircle, 
  Activity,
  Plus
} from 'lucide-react';
import { useWorkspace } from '@/lib/workspace/workspace-context';

export default function ProjectsListPage() {
  const { projects } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSkill, setFilterSkill] = useState('All');
  const [sortBy, setSortBy] = useState<'latest' | 'name'>('latest');

  const filteredProjects = projects
    .filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSkill = filterSkill === 'All' ? true : p.type === filterSkill;
      return matchSearch && matchSkill;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return b.lastUpdate.localeCompare(a.lastUpdate); // Latest first based on date string comparison
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'failed': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-amber-400 bg-amber-500/10 border-amber-500/20 animate-pulse';
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="h-full w-full overflow-y-auto px-6 py-8 md:px-10 md:py-10 bg-[#050814] scrollbar-thin">
      <div className="mx-auto max-w-4xl space-y-8 pb-16 animate-fade-in select-none">
        
        {/* Title Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Folder className="h-6 w-6 text-accent-cyan" />
              Workspace Projects
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Jelajahi dan kelola folder workspace serta luaran artifact yang dikelola oleh Hermes.
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-[#0a0e1c]/45 p-4 rounded-2xl border border-white/5">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 items-stretch sm:items-center">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama project..."
                className="w-full rounded-xl border border-white/5 bg-[#050814] py-1.5 pl-9 pr-3 text-xs text-white placeholder-slate-655 focus:border-accent-cyan focus:outline-none"
              />
            </div>
            
            {/* Sort Selection Box */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Sort:</span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="rounded-xl border border-white/5 bg-[#050814] px-3 py-1.5 text-xs text-slate-350 focus:border-accent-cyan focus:outline-none font-semibold cursor-pointer"
              >
                <option value="latest">Latest Update</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>
          </div>

          <div className="flex gap-1.5 overflow-x-auto py-1 scrollbar-none">
            {['All', 'Slides', 'Documents', 'Sheets', 'Images', 'Websites'].map((skill) => (
              <button
                key={skill}
                onClick={() => setFilterSkill(skill)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition shrink-0 ${
                  filterSkill === skill
                    ? 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/25 shadow-[0_0_10px_rgba(0,210,255,0.04)]'
                    : 'bg-white/5 border border-transparent text-slate-500 hover:text-white'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Cards Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {filteredProjects.map((p) => (
            <Link
              key={p.id}
              href={`/workspace/projects/${p.id}`}
              className="group rounded-2xl border border-white/5 bg-[#0a0e1c]/45 p-5 hover:bg-[#0a0e1c] hover:border-accent-cyan/20 hover:shadow-[0_4px_25px_rgba(0,210,255,0.03)] transition duration-300 active:scale-[0.98] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-white group-hover:text-accent-cyan transition-colors">{p.name}</span>
                    <span className="text-[9px] text-slate-500 font-mono font-bold block mt-1 uppercase">{p.type} Project</span>
                  </div>
                  
                  <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider border shrink-0 ${getStatusColor(p.status)}`}>
                    {p.status}
                  </span>
                </div>

                <p className="mt-3 text-xs text-slate-400 leading-relaxed min-h-[40px]">
                  {p.description || 'Tidak ada deskripsi detail untuk proyek ini.'}
                </p>

                {/* Meta stats */}
                <div className="mt-4 space-y-2 border-t border-white/5 pt-3 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold uppercase">Workspace Path</span>
                    <span className="text-slate-400 font-mono truncate max-w-[170px] select-all">{p.path}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold uppercase">Total Aset</span>
                    <span className="text-slate-350 font-bold">{p.file_count} File ({formatBytes(p.size_bytes)})</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-white/5 flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase">
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="h-3.5 w-3.5 text-slate-600" />
                  Update: {p.lastUpdate}
                </span>
                <span className="flex items-center gap-1 text-slate-500 group-hover:text-accent-cyan transition-colors">
                  <span>Buka Proyek</span>
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>

            </Link>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-20 rounded-2xl border border-dashed border-white/10 text-xs text-slate-500">
            Tidak ada proyek yang sesuai dengan kriteria pencarian.
          </div>
        )}

      </div>
    </div>
  );
}
