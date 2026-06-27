'use client';

import React from 'react';
import { ArrowUpRight, Clock } from 'lucide-react';
import { mockTemplates } from '@/lib/workspace/mock-data';
import { useWorkspace } from '@/lib/workspace/workspace-context';

export default function TrendingProjects() {
  const { setSelectedSkill, setPromptInput, setDeepResearchMode } = useWorkspace();

  if (mockTemplates.length === 0) {
    return null;
  }

  const handleUseTemplate = (t: typeof mockTemplates[0]) => {
    setSelectedSkill(t.skill);
    setPromptInput(t.prompt);
    if (t.skill === 'Research' || t.desc.toLowerCase().includes('riset') || t.desc.toLowerCase().includes('research')) {
      setDeepResearchMode(true);
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t border-white/5 select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-white tracking-wide">Trending Project Templates</h4>
          <p className="text-[10px] text-slate-500 mt-0.5">Mulai cepat menggunakan template terstruktur untuk hasil terbaik.</p>
        </div>
        <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-slate-400 font-bold uppercase tracking-wider">
          {mockTemplates.length} Templates
        </span>
      </div>
      
      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {mockTemplates.slice(0, 6).map((t) => (
          <div 
            key={t.title}
            onClick={() => handleUseTemplate(t)}
            className="group cursor-pointer rounded-2xl border border-white/5 bg-[#0a0e1c]/45 p-4.5 hover:bg-[#0a0e1c] hover:border-accent-cyan/25 hover:shadow-[0_4px_20px_rgba(0,210,255,0.03)] transition-all duration-300 active:scale-[0.98] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">{t.title}</span>
                <span className="text-[9px] bg-accent-cyan/15 border border-accent-cyan/30 px-2 py-0.5 rounded font-extrabold text-accent-cyan uppercase tracking-wider shrink-0 ml-3">
                  {t.skill}
                </span>
              </div>
              <p className="mt-2.5 text-xs text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                {t.desc}
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
              <span className="flex items-center gap-1 font-mono">
                <Clock className="h-3.5 w-3.5 text-slate-600" />
                {t.estimatedTime}
              </span>
              <span className="flex items-center gap-1 text-slate-500 group-hover:text-indigo-600 transition-colors">
                <span>Gunakan Template</span>
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
