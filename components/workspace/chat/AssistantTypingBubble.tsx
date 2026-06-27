'use client';

import React from 'react';

interface AssistantTypingBubbleProps {
  label?: string | null;
}

export default function AssistantTypingBubble({ label }: AssistantTypingBubbleProps) {
  return (
    <div className="flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-indigo-100 bg-[#EEF2FF] text-[10px] font-bold tracking-[0.18em] text-[#4F46E5] select-none">
        HC
      </div>

      <div className="max-w-[30rem] rounded-[24px] rounded-tl-md border border-slate-200 bg-white px-5 py-4 text-slate-800 shadow-[0_10px_25px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.2s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500" />
          </div>
          <span className="text-sm text-slate-500">{label || 'Thinking...'}</span>
        </div>
      </div>
    </div>
  );
}
