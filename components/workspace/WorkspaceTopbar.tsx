'use client';

import React from 'react';
import { Bell, ChevronRight, Menu, Sparkles } from 'lucide-react';

import { useWorkspace } from '@/lib/workspace/workspace-context';

export default function WorkspaceTopbar({
  onToggleSidebar,
  isSidebarCollapsed,
  onToggleNotifications,
}: {
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
  onToggleNotifications: () => void;
}) {
  const { projects, notifications } = useWorkspace();
  const activeProject = projects.length > 0 ? projects[0] : null;
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <header className="relative z-20 flex h-14 items-center justify-between border-b border-slate-200/80 bg-white px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50/50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
          title={isSidebarCollapsed ? 'Buka Sidebar' : 'Tutup Sidebar'}
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <span className="text-slate-400">Workspace</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          <span className="flex items-center gap-1.5 text-slate-900">
            {activeProject ? activeProject.name : 'HermesClaw Workspace'}
            {activeProject && (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600">
                {activeProject.type}
              </span>
            )}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-1 rounded-full border border-slate-200 bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white sm:flex">
          <Sparkles className="h-3 w-3 text-slate-300" />
          <span>HermesClaw AI</span>
        </div>

        <button
          onClick={onToggleNotifications}
          className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50/50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
          title={`Notifikasi (${unreadCount} Baru)`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white shadow-sm">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
