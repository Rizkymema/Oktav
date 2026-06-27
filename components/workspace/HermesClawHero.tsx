'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

export default function HermesClawHero() {
  return (
    <div className="flex flex-col items-center text-center space-y-5 py-6 select-none animate-fade-in">
      
      {/* Avatar Container */}
      <div className="relative">
        {/* Glow rings */}
        <div className="absolute inset-0 rounded-full bg-accent-cyan/15 blur-xl animate-pulse" />
        <div className="absolute inset-[-4px] rounded-full bg-gradient-to-tr from-accent-cyan to-indigo-500 opacity-30 blur-sm animate-spin" style={{ animationDuration: '8s' }} />
        
        {/* Robot Circle */}
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-[#0a0e1c] to-[#161b24] border border-accent-cyan/30 shadow-lg shadow-accent-cyan/5">
          <div className="flex flex-col items-center justify-center space-y-1.5 bg-[#050814] w-[70px] h-[70px] rounded-full border border-white/5">
            {/* Eyes */}
            <div className="flex gap-2">
              <div className="h-2 w-3 rounded-full bg-accent-cyan animate-pulse shadow-[0_0_8px_#00d2ff]"></div>
              <div className="h-2 w-3 rounded-full bg-accent-cyan animate-pulse shadow-[0_0_8px_#00d2ff]"></div>
            </div>
            {/* Smile mouth */}
            <div className="h-1.5 w-5 rounded-full bg-slate-600"></div>
          </div>
        </div>
      </div>

      {/* Greeting Copy */}
      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
          <span>Hi, I&apos;m HermesClaw</span>
          <Sparkles className="h-5 w-5 text-accent-cyan animate-pulse" />
        </h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
          Tim AI Anda siap melakukan riset, membuat konten, menganalisis data, dan membangun project.
        </p>
      </div>

    </div>
  );
}
