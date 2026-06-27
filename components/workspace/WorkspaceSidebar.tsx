'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  ChevronRight,
  Compass,
  Download,
  Folder,
  HelpCircle,
  Home,
  Layers,
  Plus,
  Search,
  Settings,
  Trash2,
} from 'lucide-react';

import { useWorkspace } from '@/lib/workspace/workspace-context';
import type { Project } from '@/lib/workspace/types';

export default function WorkspaceSidebar({
  isCollapsed,
  onOpenNewProject,
}: {
  isCollapsed: boolean;
  onOpenNewProject: () => void;
}) {
  const pathname = usePathname();
  const { projects, setProjects, credits, connected } = useWorkspace();
  const [projectSearch, setProjectSearch] = useState('');

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(projectSearch.toLowerCase()),
  );

  const groupedProjects = useMemo(() => {
    const groups: Record<string, Project[]> = {
      'Hari Ini': [],
      Kemarin: [],
      '7 Hari Terakhir': [],
      Sebelumnya: [],
    };

    filteredProjects.forEach((project) => {
      const updateStr = project.lastUpdate || '';

      if (updateStr.includes('Baru saja') || updateStr.startsWith('22 Juni 2026')) {
        groups['Hari Ini'].push(project);
      } else if (updateStr.startsWith('21 Juni 2026')) {
        groups.Kemarin.push(project);
      } else {
        const match = updateStr.match(/^(\d+)\s+(\w+)\s+(\d+)/);
        if (match) {
          const day = Number.parseInt(match[1], 10);
          const month = match[2];
          const year = Number.parseInt(match[3], 10);

          if (year === 2026 && month === 'Juni' && 22 - day <= 7) {
            groups['7 Hari Terakhir'].push(project);
            return;
          }
        }

        groups.Sebelumnya.push(project);
      }
    });

    return groups;
  }, [filteredProjects]);

  const handleDeleteProject = (event: React.MouseEvent, id: string) => {
    event.preventDefault();
    event.stopPropagation();

    if (confirm('Apakah Anda yakin ingin menghapus proyek ini secara permanen dari riwayat?')) {
      setProjects((current) => current.filter((project) => project.id !== id));
    }
  };

  const mainLinks = [
    { label: 'Explore Skills', path: '/workspace/skills', icon: Compass },
    { label: 'Scheduled Tasks', path: '/workspace/scheduled', icon: Calendar },
    { label: 'Projects', path: '/workspace/projects', icon: Folder },
  ];

  return (
    <aside
      className={`relative z-10 flex h-full shrink-0 flex-col border-r border-slate-200 bg-white transition-all duration-300 ${
        isCollapsed ? 'pointer-events-none w-0 overflow-hidden border-r-0 opacity-0' : 'w-[280px] opacity-100'
      }`}
    >
      <div className="border-b border-slate-200 p-4">
        <button
          onClick={onOpenNewProject}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold tracking-wide text-white transition hover:bg-slate-800 shadow-sm hover:shadow active:scale-97 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </button>
      </div>

      <div className="space-y-1 px-4 py-4">
        <Link
          href="/workspace"
          className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-xs font-semibold tracking-wide transition ${
            pathname === '/workspace'
              ? 'border-slate-200 bg-slate-100 text-slate-900'
              : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <Home className="h-4 w-4" />
            <span>Workspace Home</span>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-700">
            Live
          </span>
        </Link>

        {mainLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.path || pathname.startsWith(link.path);

          return (
            <Link
              key={link.label}
              href={link.path}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-xs font-semibold tracking-wide transition ${
                isActive
                  ? 'border-slate-200 bg-slate-100 text-slate-900'
                  : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4 py-2">
        <div className="mb-2 flex items-center justify-between px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          <span>Project History</span>
          <Layers className="h-3.5 w-3.5" />
        </div>

        <div className="relative mb-3 px-1">
          <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={projectSearch}
            onChange={(event) => setProjectSearch(event.target.value)}
            placeholder="Cari project..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8.5 pr-3 text-[11px] text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none transition-all duration-200"
          />
        </div>

        <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto pr-1">
          {filteredProjects.length > 0 ? (
            Object.entries(groupedProjects).map(([groupName, groupItems]) => {
              if (groupItems.length === 0) {
                return null;
              }

              return (
                <div key={groupName} className="space-y-1">
                  <span className="block px-3 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    {groupName}
                  </span>

                  {groupItems.map((project) => {
                    const isProjectActive = pathname === `/workspace/projects/${project.id}`;

                    return (
                      <div key={project.id} className="group/item relative flex w-full items-center">
                        <Link
                          href={`/workspace/projects/${project.id}`}
                          className={`flex flex-1 items-center gap-2.5 rounded-xl px-3 py-2 pr-9 text-left text-xs transition ${
                            isProjectActive
                              ? 'border-slate-205 bg-slate-100 font-semibold text-slate-900'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <div
                            className={`h-2 w-2 shrink-0 rounded-full ${
                              project.status === 'completed'
                                ? 'bg-emerald-400'
                                : project.status === 'failed'
                                  ? 'bg-rose-400'
                                  : project.status === 'running'
                                    ? 'bg-slate-900'
                                    : 'bg-slate-400'
                            }`}
                          />
                          <div className="flex-1 truncate">
                            <p className="truncate text-[11px] font-medium">{project.name}</p>
                            <span className="block text-[9px] font-semibold text-slate-450">{project.type}</span>
                          </div>
                        </Link>

                        <button
                          onClick={(event) => handleDeleteProject(event, project.id)}
                          className="absolute right-2 z-20 rounded-lg p-1.5 text-slate-400 opacity-0 transition group-hover/item:opacity-100 hover:bg-slate-100 hover:text-rose-500"
                          title="Hapus Proyek dari Riwayat"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })
          ) : (
            <div className="py-5 text-center text-[10px] text-slate-400">Tidak ada riwayat proyek</div>
          )}
        </div>
      </div>

      <div className="space-y-4 border-t border-slate-200 p-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs">
          <div className="mb-1.5 flex justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            <span>Daily Limit</span>
            <span className="font-bold text-slate-800">
              {credits.used} / {credits.max}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/60">
            <div
              className="h-full bg-slate-900 transition-all duration-500"
              style={{ width: `${Math.min(100, (credits.used / credits.max) * 100)}%` }}
            />
          </div>
        </div>

        <Link
          href="/workspace/desktop"
          className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-600 transition hover:bg-slate-100 hover:text-slate-800 hover:border-slate-300"
        >
          <div className="flex items-center gap-2">
            <Download className="h-3.5 w-3.5 text-slate-750" />
            <span className="font-medium">Desktop Access</span>
          </div>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-emerald-600">
            Sync
          </span>
        </Link>

        <Link
          href="/workspace/channels"
          className="group block rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 transition hover:bg-slate-100 hover:border-slate-300"
        >
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400 group-hover:text-slate-800">
            <span>Connect IM Channel</span>
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>

          <div className="mt-2.5 flex items-center gap-2">
            {['whatsapp', 'telegram', 'discord', 'slack', 'line'].map((item) => (
              <div
                key={item}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-[9px] font-bold text-slate-500 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-800 cursor-pointer"
                title={`Hubungkan ${item.toUpperCase()}`}
              >
                {item === 'whatsapp' && 'WA'}
                {item === 'telegram' && 'TG'}
                {item === 'discord' && 'DC'}
                {item === 'slack' && 'SL'}
                {item === 'line' && 'LN'}
              </div>
            ))}
          </div>
        </Link>

        <div className="flex items-center justify-between border-t border-slate-200 px-2 pt-1">
          <span className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {connected ? 'Gateway: Live' : 'Gateway: Offline'}
            </span>
          </span>
          <div className="flex items-center gap-3">
            <button className="text-slate-400 transition hover:text-slate-600" title="Pengaturan">
              <Settings className="h-4 w-4" />
            </button>
            <button className="text-slate-400 transition hover:text-slate-600" title="Bantuan">
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
