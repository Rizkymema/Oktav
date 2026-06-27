'use client';

import React, { useEffect } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-[#050814] text-slate-400 p-6 gap-5">
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-center max-w-md space-y-3">
        <ShieldAlert className="h-10 w-10 text-rose-400 mx-auto" />
        <div>
          <span className="text-sm font-bold text-white uppercase tracking-wider block">Terjadi Kesalahan Kompilasi</span>
          <p className="text-xs text-rose-400/80 mt-1.5 leading-relaxed">
            Gagal merender halaman workspace. Masalah ini bisa disebabkan oleh hilangnya session cookie atau token gateway terputus.
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => reset()}
          className="ds-btn-primary px-4 py-2 text-xs rounded-xl hover:opacity-90 transition flex items-center gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Coba Lagi</span>
        </button>
        
        <button
          onClick={() => window.location.href = '/workspace'}
          className="ds-btn-secondary px-4 py-2 text-xs rounded-xl hover:bg-white/10 transition"
        >
          Muat Ulang Halaman
        </button>
      </div>
    </div>
  );
}
