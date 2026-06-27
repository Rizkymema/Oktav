'use client';

import React, { useState } from 'react';
import { Compass, Sparkles, Search, Sliders, Check, Download, Info } from 'lucide-react';
import { useWorkspace } from '@/lib/workspace/workspace-context';

export default function ExploreSkillsPage() {
  const { controlSkills, handleInstallSkill, handleUninstallSkill } = useWorkspace();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [installingSkill, setInstallingSkill] = useState<string | null>(null);

  const categories = ['All', 'Content', 'Research', 'Coding', 'Data', 'Design', 'Automation'];

  const filteredSkills = controlSkills.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          skill.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || skill.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const onInstallClick = async (skillName: string, isInstalled: boolean) => {
    setInstallingSkill(skillName);
    // Simulasikan delay instalasi
    setTimeout(async () => {
      if (isInstalled) {
        await handleUninstallSkill(skillName);
      } else {
        await handleInstallSkill(skillName);
      }
      setInstallingSkill(null);
    }, 1000);
  };

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-[#050814] px-6 py-8 md:px-10 md:py-10 animate-fade-in scrollbar-thin">
      <div className="mx-auto w-full max-w-5xl space-y-8 pb-16">
        
        {/* Header section */}
        <div className="border-b border-white/10 pb-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent-cyan/20 bg-accent-cyan/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-accent-cyan mb-3 select-none">
            <Compass className="h-3.5 w-3.5" />
            <span>Katalog Skill Core</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight select-none">Katalog AI Skill & Integrasi VPS</h2>
          <p className="text-xs text-slate-400 mt-1 select-none">Aktifkan skill spesifik untuk memperluas kapabilitas eksekusi runtime asisten HermesClaw Anda.</p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center border-b border-white/5 pb-5 select-none">
          {/* Categories tab */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  selectedCategory === cat 
                    ? 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/25 shadow-[0_0_12px_rgba(0,210,255,0.06)]' 
                    : 'bg-white/5 border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama skill..."
              className="w-full rounded-xl border border-white/5 bg-[#0a0e1c] py-2 pl-9 pr-4 text-xs text-white placeholder-slate-600 focus:border-accent-cyan/35 focus:outline-none"
            />
          </div>
        </div>

        {/* Skills Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSkills.length > 0 ? (
            filteredSkills.map(skill => {
              const isInstalled = Boolean(skill.installed);
              return (
                <div 
                  key={skill.name}
                  className="rounded-2xl border border-white/5 bg-[#0a0e1c]/45 p-5 flex flex-col justify-between hover:border-accent-cyan/20 hover:shadow-[0_4px_20px_rgba(0,210,255,0.02)] transition-all duration-300 group"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center select-none">
                      <span className="text-[9px] font-extrabold bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg text-slate-400 uppercase tracking-wider">
                        {skill.category}
                      </span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                        Biaya: {skill.estimatedCredits} krd
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-accent-cyan transition duration-200">
                        {skill.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed min-h-[50px]">
                        {skill.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 mt-5 flex items-center justify-between select-none">
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-550 uppercase tracking-wider font-semibold">
                      <Compass className="h-3.5 w-3.5 text-slate-655" />
                      <span>{skill.agent}</span>
                    </div>

                    <button
                      onClick={() => onInstallClick(skill.name, !!isInstalled)}
                      disabled={installingSkill === skill.name}
                      className={`text-[10px] px-3.5 py-1.5 rounded-xl font-bold border transition duration-300 ${
                        installingSkill === skill.name
                          ? 'bg-white/5 border-white/10 text-slate-500 cursor-not-allowed ds-shimmer'
                          : isInstalled
                            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/40 active:scale-95'
                            : 'bg-accent-cyan text-slate-950 border-transparent hover:bg-[#38bdf8] hover:shadow-[0_0_12px_rgba(0,210,255,0.25)] active:scale-95'
                      }`}
                    >
                      {installingSkill === skill.name ? (
                        <span>Processing...</span>
                      ) : isInstalled ? (
                        <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Installed</span>
                      ) : (
                        <span className="flex items-center gap-1"><Download className="h-3 w-3" /> Install</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center text-xs text-slate-500 border border-dashed border-white/5 rounded-2xl">
              Tidak ada skill yang cocok dengan pencarian Anda.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
