'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export default function WorkspaceLoading() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-[#050814] text-slate-400 gap-4">
      {/* Spinner */}
      <div className="relative flex items-center justify-center">
        <div className="absolute h-10 w-10 rounded-full border-2 border-white/5 animate-pulse" />
        <Loader2 className="h-6 w-6 text-accent-cyan animate-spin relative" />
      </div>
      
      <div className="space-y-1.5 text-center animate-pulse">
        <span className="text-xs font-bold text-white uppercase tracking-wider block">Menyinkronkan Workspace</span>
        <p className="text-[10px] text-slate-500">Membaca status runtime gateway dari server VPS...</p>
      </div>
    </div>
  );
}
