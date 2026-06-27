'use client';

import React, { useState } from 'react';
import { 
  Download, 
  Monitor, 
  Folder, 
  Terminal, 
  Activity, 
  RefreshCw, 
  Cpu, 
  HardDrive,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface MappedFolder {
  localPath: string;
  vpsPath: string;
  fileCount: number;
  status: 'synced' | 'syncing' | 'error';
}

export default function DesktopAccessPage() {
  const [isConnected, setIsConnected] = useState(true);
  const [mappedFolders, setMappedFolders] = useState<MappedFolder[]>([
    {
      localPath: 'D:\\Project Apk-Web\\AI ASSISTENT',
      vpsPath: '/home/ubuntu/hermes-runtime/workspace',
      fileCount: 42,
      status: 'synced'
    },
    {
      localPath: 'D:\\Project Apk-Web\\Hermes Agent',
      vpsPath: '/home/ubuntu/hermes-runtime/hermes-agent',
      fileCount: 88,
      status: 'synced'
    }
  ]);

  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      alert('Sinkronisasi folder lokal dengan VPS berhasil diselesaikan!');
    }, 1500);
  };

  return (
    <div className="h-full w-full overflow-y-auto px-6 py-8 md:px-10 md:py-10 bg-[#050814] scrollbar-thin">
      <div className="mx-auto max-w-4xl space-y-8 pb-16 animate-fade-in select-none">
        
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-accent-cyan/20 bg-accent-cyan/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-accent-cyan mb-3">
              <Monitor className="h-3.5 w-3.5" />
              <span>Desktop Sync Client</span>
            </div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Desktop Sync & File Access
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Hubungkan host lokal Anda dengan VPS sandboxed runtime Hermes untuk menulis dan membaca file proyek secara sinkron.
            </p>
          </div>

          <button 
            onClick={handleManualSync}
            disabled={isSyncing}
            className="ds-btn-primary px-4 py-2.5 text-xs rounded-xl hover:opacity-90 tracking-wide font-bold self-start sm:self-center shrink-0 flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>

        {/* Connection Status Indicator */}
        <div className="rounded-2xl border border-white/5 bg-[#0a0e1c]/60 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
              isConnected 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              <Monitor className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Status Klien Sinkronisasi Desktop</span>
              <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                IP: <strong className="text-slate-300">127.0.0.1 (Localhost)</strong> • Mapped Port: <strong className="text-slate-300">22900</strong>
              </span>
            </div>
          </div>

          <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider border shrink-0 flex items-center gap-1 ${
            isConnected 
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.06)]' 
              : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            {isConnected ? 'Connected & Active' : 'Disconnected'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Mapped Folders Table */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Diretori yang Dipetakan ({mappedFolders.length})</h3>
            
            <div className="space-y-3">
              {mappedFolders.map((fold, idx) => (
                <div key={idx} className="rounded-2xl border border-white/5 bg-[#0a0e1c]/45 p-4 space-y-3 hover:border-accent-cyan/15 transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Folder #{idx + 1}</span>
                    <span className="flex items-center gap-1 text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase">
                      <CheckCircle2 className="h-3 w-3" /> Synced
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 block">Host Lokal</span>
                      <span className="text-slate-300 font-mono text-[11px] select-all block mt-0.5 bg-black/30 p-2 rounded-lg border border-white/5">{fold.localPath}</span>
                    </div>

                    <div className="flex items-center justify-center text-slate-600 py-1">
                      <Terminal className="h-4 w-4" />
                    </div>

                    <div>
                      <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 block">Runtime VPS Sandboxed</span>
                      <span className="text-slate-300 font-mono text-[11px] select-all block mt-0.5 bg-black/30 p-2 rounded-lg border border-white/5">{fold.vpsPath}</span>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-white/5 text-[10px] text-slate-500 flex justify-between">
                    <span>Total Aset Terpantau:</span>
                    <span className="text-slate-300 font-bold font-mono">{fold.fileCount} File</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Download binary panels */}
          <div className="rounded-2xl border border-white/10 bg-[#0a0e1c] p-5 space-y-4 h-fit">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Download className="h-4.5 w-4.5 text-accent-cyan" />
              Download Client Binary
            </h3>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Unduh klien desktop ringan untuk meluncurkan sync listener background service secara lokal di sistem operasi Anda.
            </p>

            <div className="space-y-2 pt-2">
              {[
                { os: 'Windows x64', ext: '.msi / .exe', link: 'hermes-sync-setup-win.exe' },
                { os: 'macOS Apple/Intel', ext: '.dmg', link: 'hermes-sync-setup-mac.dmg' },
                { os: 'Linux Deb/Rpm', ext: '.tar.gz', link: 'hermes-sync-setup-linux.tar.gz' }
              ].map(bin => (
                <button
                  key={bin.os}
                  onClick={() => alert(`Mengunduh instalan klien: ${bin.link}`)}
                  className="w-full flex items-center justify-between rounded-xl border border-white/5 bg-[#050814]/75 px-3.5 py-3 text-xs text-slate-300 hover:bg-accent-cyan/10 hover:text-accent-cyan hover:border-accent-cyan/20 transition active:scale-95 text-left"
                >
                  <div>
                    <span className="font-bold block text-white">{bin.os}</span>
                    <span className="text-[9px] text-slate-500 font-mono">{bin.ext}</span>
                  </div>
                  <Download className="h-4 w-4" />
                </button>
              ))}
            </div>

            <div className="mt-4 pt-3.5 border-t border-white/5 text-[9px] text-slate-500 leading-relaxed flex gap-1.5">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              <span>
                Membutuhkan hak akses Administrator untuk mengaktifkan daemon file watcher secara real-time pada Windows.
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
