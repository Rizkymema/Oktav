'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Plus, 
  Settings, 
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  Save,
  Key,
  Check,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import type { IMChannel } from '@/lib/workspace/types';

export default function ChannelsPage() {
  const [channels, setChannels] = useState<IMChannel[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);

  // State untuk konfigurasi Telegram
  const [telegramToken, setTelegramToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState(false);

  // Fetch channels dari backend pada mount
  useEffect(() => {
    fetch('/api/hermes/channels')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setChannels(data);
          const tgChan = data.find(c => c.type === 'telegram');
          if (tgChan?.token) {
            setTelegramToken(tgChan.token);
          }
        }
      })
      .catch(e => console.error("Gagal mengambil channels dari backend:", e));
  }, []);

  const handleRefreshConnections = () => {
    setIsRefreshing(true);
    fetch('/api/hermes/channels')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setChannels(data);
          const tgChan = data.find(c => c.type === 'telegram');
          if (tgChan?.token) {
            setTelegramToken(tgChan.token);
          }
        }
        setIsRefreshing(false);
      })
      .catch(e => {
        console.error("Gagal merefresh channels:", e);
        setIsRefreshing(false);
      });
  };

  const handleToggleChannel = (channelName: string, currentStatus: IMChannel['status']) => {
    const targetChan = channels.find(c => c.name === channelName);
    
    // Jika mengaktifkan Telegram namun token kosong, arahkan ke konfigurasi
    if (targetChan?.type === 'telegram' && currentStatus === 'not_connected' && !telegramToken) {
      setValidationError("Harap masukkan Token Bot Telegram terlebih dahulu pada panel konfigurasi di bawah.");
      setActiveChannelId(channelName);
      // Scroll ke panel konfigurasi
      setTimeout(() => {
        document.getElementById('config-panel')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }

    const updatedChannels = channels.map(c => {
      if (c.name === channelName) {
        const isCurrentlyConnected = currentStatus === 'connected';
        return {
          ...c,
          status: (isCurrentlyConnected ? 'not_connected' : 'connected') as IMChannel['status'],
          lastActivity: isCurrentlyConnected ? undefined : 'Baru saja',
          account: isCurrentlyConnected ? undefined : c.account,
          botName: isCurrentlyConnected ? undefined : c.botName,
          webhookUrl: isCurrentlyConnected ? undefined : c.webhookUrl,
        };
      }
      return c;
    });

    setChannels(updatedChannels);

    // Simpan ke backend
    fetch('/api/hermes/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channels: updatedChannels })
    })
    .then(() => {
      if (channelName === 'Telegram Assistant Bot' && currentStatus === 'connected') {
        setValidationSuccess(false);
      }
    })
    .catch(e => console.error("Gagal menyimpan channels ke backend:", e));
  };

  const handleSaveTelegramConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramToken.trim()) {
      setValidationError("Token Bot tidak boleh kosong.");
      return;
    }

    setIsValidating(true);
    setValidationError(null);
    setValidationSuccess(false);

    try {
      // 1. Validasi token ke Telegram via Backend
      const valRes = await fetch('/api/hermes/channels/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: telegramToken.trim() })
      });
      
      const valData = await valRes.json();

      if (!valRes.ok || !valData.ok) {
        throw new Error(valData.error || "Validasi token gagal. Pastikan token BotFather benar.");
      }

      // 2. Jika valid, update state channels lokal dengan data dari Telegram
      const updatedChannels = channels.map(c => {
        if (c.type === 'telegram') {
          return {
            ...c,
            status: 'connected' as const,
            token: telegramToken.trim(),
            botName: valData.botName,
            account: valData.username,
            lastActivity: 'Baru saja',
            webhookUrl: 'Long Polling Mode (Active)'
          };
        }
        return c;
      });

      setChannels(updatedChannels);

      // 3. Simpan konfigurasi baru ke backend
      const saveRes = await fetch('/api/hermes/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channels: updatedChannels })
      });

      if (!saveRes.ok) {
        throw new Error("Gagal menyimpan konfigurasi ke backend.");
      }

      setValidationSuccess(true);
      // Auto-hide alert setelah 4 detik
      setTimeout(() => setValidationSuccess(false), 4000);

    } catch (err: any) {
      setValidationError(err.message || "Terjadi kesalahan saat memverifikasi token.");
    } finally {
      setIsValidating(false);
    }
  };

  const getStatusColor = (status: IMChannel['status']) => {
    switch (status) {
      case 'connected': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'error': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'reconnecting': return 'text-amber-400 bg-amber-500/10 border-amber-500/20 animate-pulse';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getActiveChannel = () => channels.find(c => c.name === activeChannelId);

  return (
    <div className="h-full w-full overflow-y-auto px-6 py-8 md:px-10 md:py-10 bg-[#050814] scrollbar-thin">
      <div className="mx-auto max-w-4xl space-y-8 pb-16 animate-fade-in select-none">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-accent-cyan/20 bg-accent-cyan/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-accent-cyan mb-3">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Integrasi IM Chatbot</span>
            </div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Connected Channels (IM Gateways)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Hubungkan asisten AI Hermes dengan platform instant messaging Anda untuk memicu instruksi pengerjaan via chat.
            </p>
          </div>
 
          <button 
            onClick={handleRefreshConnections}
            disabled={isRefreshing}
            className="ds-btn-secondary px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 self-start sm:self-center shrink-0 border border-white/5"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Checking...' : 'Refresh Gateway'}</span>
          </button>
        </div>

        {/* Channels Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          <div className="space-y-4 md:col-span-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Integrasi Saluran</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {channels.map((chan) => (
                <div 
                  key={chan.name}
                  onClick={() => setActiveChannelId(activeChannelId === chan.name ? null : chan.name)}
                  className={`rounded-2xl border bg-[#0a0e1c]/45 p-5 cursor-pointer transition-all duration-300 hover:border-accent-cyan/20 relative group ${
                    chan.status === 'connected' ? 'border-white/5' : 'border-white/5 opacity-70'
                  } ${activeChannelId === chan.name ? 'border-accent-cyan/30 bg-[#0a0e1c]/70' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block group-hover:text-accent-cyan transition-colors">{chan.name}</span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase mt-1 block">Platform: {chan.type}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider border shrink-0 ${getStatusColor(chan.status)}`}>
                        {chan.status.replace('_', ' ')}
                      </span>
                      {/* Connection Toggle Switch */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleChannel(chan.name, chan.status);
                        }}
                        className="text-slate-500 hover:text-white transition"
                        title={chan.status === 'connected' ? 'Disconnect Channel' : 'Connect Channel'}
                      >
                        {chan.status === 'connected' ? (
                          <ToggleRight className="h-5.5 w-5.5 text-accent-cyan" />
                        ) : (
                          <ToggleLeft className="h-5.5 w-5.5 text-slate-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  {chan.status === 'connected' ? (
                    <div className="mt-4 space-y-2 border-t border-white/5 pt-3 text-[10px] text-slate-400">
                      <div className="flex justify-between">
                        <span>Bot Name:</span>
                        <span className="text-slate-200 font-bold">{chan.botName || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Account:</span>
                        <span className="text-slate-200 font-mono">{chan.account || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className="text-emerald-400 font-mono font-bold truncate max-w-[150px]">{chan.webhookUrl || '-'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase">
                      <span>Belum Terhubung</span>
                      <span className="flex items-center gap-0.5 text-accent-cyan group-hover:translate-x-0.5 transition-transform">
                        <span>Connect</span>
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  )}

                  {chan.permissions && chan.permissions.length > 0 && activeChannelId === chan.name && (
                    <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5 animate-fade-in">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Izin Akses Aktif:</span>
                      <div className="flex flex-wrap gap-1">
                        {chan.permissions.map((p, idx) => (
                          <span key={idx} className="bg-white/5 px-2 py-0.5 rounded text-[9px] text-slate-400">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Konfigurasi Channel Panel */}
          {activeChannelId && getActiveChannel() && (
            <div id="config-panel" className="rounded-2xl border border-white/5 bg-[#0a0e1c] p-6 space-y-5 md:col-span-2 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <Settings className="h-5 w-5 text-accent-cyan" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Konfigurasi Integrasi: {getActiveChannel()?.name}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Masukkan kredensial otentikasi di bawah ini untuk menghubungkan bot.
                  </p>
                </div>
              </div>

              {getActiveChannel()?.type === 'telegram' ? (
                <form onSubmit={handleSaveTelegramConfig} className="space-y-4">
                  {/* Alert Error */}
                  {validationError && (
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 flex items-start gap-2.5 text-xs text-rose-400 animate-fade-in">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{validationError}</span>
                    </div>
                  )}

                  {/* Alert Success */}
                  {validationSuccess && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-start gap-2.5 text-xs text-emerald-400 animate-fade-in">
                      <Check className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>Bot Telegram berhasil dikonfigurasi dan terhubung! Menginisiasi polling latar belakang...</span>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Key className="h-3 w-3 text-accent-cyan" />
                      Telegram Bot Token
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type={showToken ? 'text' : 'password'}
                        value={telegramToken}
                        onChange={(e) => setTelegramToken(e.target.value)}
                        placeholder="Contoh: 1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                        className="ds-input w-full pr-12 text-xs font-mono"
                        disabled={isValidating}
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-3 text-slate-500 hover:text-white transition"
                        title={showToken ? "Sembunyikan Token" : "Tampilkan Token"}
                      >
                        {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <span className="text-[9px] text-slate-500">
                      Dapatkan Token Bot Anda melalui chat resmi dengan <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-accent-cyan hover:underline inline-flex items-center gap-0.5">@BotFather di Telegram <ExternalLink className="h-2 w-2" /></a>.
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveChannelId(null)}
                      className="ds-btn-secondary px-4 py-2 text-xs rounded-xl"
                      disabled={isValidating}
                    >
                      Batal
                    </button>
                    
                    <button
                      type="submit"
                      className="ds-btn-primary px-4 py-2 text-xs rounded-xl flex items-center gap-1.5 min-w-[140px]"
                      disabled={isValidating}
                    >
                      {isValidating ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Memvalidasi...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-3.5 w-3.5" />
                          <span>Simpan & Hubungkan</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-xs text-slate-400 py-4 flex flex-col items-center justify-center text-center gap-2">
                  <div className="p-3 rounded-full bg-white/5">
                    <ShieldAlert className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Integrasi Segera Hadir</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Integrasi untuk saluran {getActiveChannel()?.type} sedang dikembangkan dan akan segera siap digunakan di versi berikutnya.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Connection Wizard / Documentation Help */}
          <div className="rounded-2xl border border-white/5 bg-[#0a0e1c] p-6 space-y-4 md:col-span-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="h-4.5 w-4.5 text-accent-cyan" />
              Sistem Keamanan & Enkripsi Webhook Gateway
            </h3>
            <div className="text-xs text-slate-400 space-y-3 leading-relaxed">
              <p>
                Seluruh komunikasi melalui antrean webhook IM Gateway dienkripsi menggunakan protokol **ECDSA-SHA256**. Asisten AI tidak akan pernah menyimpan log percakapan langsung atau data sensitif di luar lingkungan sandbox pengerjaan proyek lokal Anda.
              </p>
              <p>
                Untuk menghubungkan saluran chatbot baru secara manual, masukkan endpoint webhook Anda pada pengaturan asisten di Control Server utama, atau gunakan CLI berikut pada VPS terminal:
              </p>
              <pre className="p-3 bg-[#050814] border border-white/5 rounded-xl text-[10px] text-emerald-400 font-mono overflow-x-auto select-all">
                hermes-cli channel:add --platform discord --bot-token &lt;YOUR_DISCORD_TOKEN&gt;
              </pre>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
