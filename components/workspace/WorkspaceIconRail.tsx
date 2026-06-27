'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Folder, HelpCircle, Home, Settings } from 'lucide-react';

export default function WorkspaceIconRail() {
  const pathname = usePathname();

  const mainNav = [
    { icon: Home, label: 'Workspace', path: '/workspace' },
    { icon: Folder, label: 'Projects', path: '/workspace/projects' },
  ];

  const bottomNav = [
    { icon: HelpCircle, label: 'Bantuan', onClick: () => alert('Membuka dokumentasi bantuan HermesClaw.') },
    { icon: Settings, label: 'Pengaturan', onClick: () => alert('Buka pengaturan profil.') },
  ];

  return (
    <div className="relative z-20 flex h-full w-[72px] flex-col items-center justify-between border-r border-slate-200/80 bg-slate-50/80 py-5">
      <div className="flex w-full flex-col items-center gap-6">
        <Link
          href="/workspace"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-900 text-sm font-bold text-white shadow-sm hover:bg-slate-800"
        >
          H
        </Link>

        <div className="flex w-full flex-col items-center gap-4">
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || (item.path !== '/workspace' && pathname.startsWith(item.path));

            return (
              <Link
                key={item.label}
                href={item.path}
                className={`group relative flex h-11 w-11 items-center justify-center rounded-2xl border transition-all ${
                  isActive
                    ? 'border-slate-200 bg-slate-100 text-slate-900'
                    : 'border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title={item.label}
              >
                <Icon className="h-[18px] w-[18px]" />
                <span className="absolute left-[72px] z-50 scale-0 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-800 shadow-md transition-all duration-150 group-hover:left-[62px] group-hover:scale-100">
                  {item.label}
                </span>
                {isActive && <div className="absolute left-0 top-3 h-5 w-0.5 rounded-r bg-slate-900" />}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex w-full flex-col items-center gap-4">
        {bottomNav.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              onClick={item.onClick}
              className="group relative flex h-11 w-11 items-center justify-center rounded-2xl border border-transparent text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
              title={item.label}
            >
              <Icon className="h-[18px] w-[18px]" />
              <span className="absolute left-[72px] z-50 scale-0 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-800 shadow-md transition-all duration-150 group-hover:left-[62px] group-hover:scale-100">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
