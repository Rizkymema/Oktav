'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, AlertTriangle, ArrowRight, Bell, CheckCircle2, ShieldAlert, X } from 'lucide-react';

import { useWorkspace } from '@/lib/workspace/workspace-context';

export default function NotificationCenter({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { notifications, setNotifications } = useWorkspace();
  const [filter, setFilter] = useState<'all' | 'tasks' | 'projects' | 'channels' | 'credits' | 'security'>('all');

  const filteredNotifications = notifications.filter((notification) => (filter === 'all' ? true : notification.type === filter));

  const markAllAsRead = () => {
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications((current) =>
      current.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    );
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications((current) => current.filter((notification) => notification.id !== id));
  };

  const handleNotificationOpen = (id: string, actionUrl?: string) => {
    handleMarkAsRead(id);
    if (actionUrl) {
      router.push(actionUrl);
      onClose();
    }
  };

  return (
    <div className="fixed bottom-0 right-0 top-0 z-40 flex w-96 flex-col border-l border-white/8 bg-[#12110f] shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/8 bg-[#171614] px-6 py-5">
        <div className="flex items-center gap-2">
          <Bell className="h-4.5 w-4.5 text-[#d4c2a1]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-100">Notification Center</span>
        </div>
        <button onClick={onClose} className="rounded-lg p-1 text-stone-400 transition hover:bg-white/[0.05] hover:text-stone-100">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-white/8 bg-[#141311] px-4 py-2">
        {(['all', 'tasks', 'projects', 'channels', 'credits', 'security'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`shrink-0 rounded-lg px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider transition ${
              filter === tab
                ? 'border border-[#d4c2a1]/20 bg-[#d4c2a1]/14 text-[#f2dfbe]'
                : 'text-stone-500 hover:text-stone-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex justify-between border-b border-white/8 bg-white/[0.02] px-6 py-2.5 text-[9px] font-semibold uppercase text-stone-500">
        <button onClick={markAllAsRead} className="transition hover:text-stone-200">
          Tandai semua dibaca
        </button>
        <button onClick={clearAllNotifications} className="transition hover:text-stone-200">
          Hapus semua
        </button>
      </div>

      <div className="scrollbar-thin flex-1 space-y-2.5 overflow-y-auto p-4">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationOpen(notification.id, notification.actionUrl)}
              className={`group relative cursor-pointer rounded-2xl border p-4 transition-all duration-300 ${
                notification.read
                  ? 'border-white/8 bg-white/[0.02] opacity-70 hover:opacity-100'
                  : 'border-[#d4c2a1]/15 bg-[#d4c2a1]/08 hover:border-[#d4c2a1]/30'
              }`}
            >
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  handleDeleteNotification(notification.id);
                }}
                className="absolute right-3.5 top-3.5 rounded-lg p-1 text-stone-600 opacity-0 transition group-hover:opacity-100 hover:bg-white/[0.05] hover:text-rose-400"
                title="Hapus Notifikasi"
              >
                <X className="h-3 w-3" />
              </button>

              <div className="flex items-start gap-3.5 pr-4">
                <div
                  className={`mt-0.5 rounded-xl p-2 shrink-0 ${
                    notification.type === 'tasks'
                      ? 'bg-emerald-400/10 text-emerald-300'
                      : notification.type === 'security'
                        ? 'bg-rose-400/10 text-rose-300'
                        : notification.type === 'credits'
                          ? 'bg-amber-400/10 text-amber-300'
                          : 'bg-white/[0.05] text-stone-300'
                  }`}
                >
                  {notification.type === 'tasks' && <CheckCircle2 className="h-3.5 w-3.5" />}
                  {notification.type === 'security' && <ShieldAlert className="h-3.5 w-3.5" />}
                  {notification.type === 'credits' && <AlertTriangle className="h-3.5 w-3.5" />}
                  {notification.type !== 'tasks' && notification.type !== 'security' && notification.type !== 'credits' && (
                    <Activity className="h-3.5 w-3.5" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold leading-snug text-stone-100">{notification.title}</span>
                    <span className="text-[8px] font-mono text-stone-500">{notification.time}</span>
                  </div>
                  <p className="pt-0.5 text-[11px] leading-relaxed text-stone-400">{notification.description}</p>
                  {notification.actionUrl && notification.actionLabel && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleNotificationOpen(notification.id, notification.actionUrl);
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#d4c2a1]/20 bg-[#d4c2a1]/12 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#f2dfbe] transition hover:bg-[#d4c2a1]/18"
                    >
                      <span>{notification.actionLabel}</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center text-[11px] text-stone-600">Tidak ada notifikasi yang sesuai.</div>
        )}
      </div>
    </div>
  );
}
