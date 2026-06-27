'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  FileDown,
  XCircle,
  RefreshCw,
  FolderOpen,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { Task } from '@/lib/workspace/types';
import { useWorkspace } from '@/lib/workspace/workspace-context';

const highlightLogLine = (log: string) => {
  const timeMatch = log.match(/^\[(.*?)\]\s*(.*)$/);
  if (!timeMatch) return <span className="font-mono text-slate-500">{log}</span>;
  const [, time, message] = timeMatch;

  let messageColor = 'text-slate-300';
  if (message.toLowerCase().includes('success') || message.toLowerCase().includes('selesai') || message.toLowerCase().includes('completed')) {
    messageColor = 'text-emerald-400 font-semibold';
  } else if (message.toLowerCase().includes('error') || message.toLowerCase().includes('failed') || message.toLowerCase().includes('gagal')) {
    messageColor = 'text-rose-400 font-semibold';
  } else if (message.toLowerCase().includes('initiating') || message.toLowerCase().includes('starting') || message.toLowerCase().includes('menginisiasi')) {
    messageColor = 'text-indigo-400';
  } else if (message.toLowerCase().includes('warning') || message.toLowerCase().includes('peringatan')) {
    messageColor = 'text-amber-400';
  }

  return (
    <div className="flex gap-2 leading-relaxed hover:bg-white/5 px-1 rounded transition-colors py-0.5 select-text">
      <span className="text-slate-500 shrink-0 font-medium font-mono select-none">[{time}]</span>
      <span className="text-slate-600 shrink-0 select-none">&gt;</span>
      <span className={`${messageColor} font-mono break-all`}>{message}</span>
    </div>
  );
};

export default function LiveTaskCard({
  task
}: {
  task: Task
}) {
  const router = useRouter();
  const { projects, setActiveTaskId, handleCancelTask, handleRetryTask, handleApprovalResponse } = useWorkspace();

  const resolvedProjectId =
    task.projectId ||
    (projects.some((project) => project.id === `prj-${task.id}`) ? `prj-${task.id}` : undefined);

  const onCancelTask = async () => {
    if (!confirm('Apakah Anda yakin ingin membatalkan pengerjaan tugas ini?')) return;
    await handleCancelTask(task.id);
  };

  const onApprovalDecision = async (status: 'approved' | 'rejected') => {
    if (!task.approvalRequestId) return;

    const responseNote =
      status === 'approved'
        ? 'Approval disetujui dari workspace.'
        : 'Approval ditolak dari workspace.';

    await handleApprovalResponse(task.approvalRequestId, status, responseNote);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'failed': return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'cancelled': return 'text-slate-500 bg-slate-100 border-slate-200';
      default: return 'text-amber-700 bg-amber-50 border-amber-200 animate-pulse';
    }
  };

  const openProject = () => {
    if (!resolvedProjectId) {
      return;
    }

    router.push(`/workspace/projects/${resolvedProjectId}`);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5 select-text">

      {/* Header Info */}
      <div className="flex items-start justify-between border-b border-slate-100 pb-4">
        <div>
          <span className="text-[9px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-500 font-bold uppercase tracking-wider font-mono">
            Task ID: {task.id}
          </span>
          <h4 className="text-sm font-bold text-slate-900 mt-1.5 leading-snug">
            {task.prompt.replace(/\[Skill:.*?\]\s*/, '')}
          </h4>
        </div>

        {/* Status indicator pill */}
        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider border shrink-0 ml-4 ${getStatusColor(task.status)}`}>
          {task.status}
        </span>
      </div>

      {/* Progress & Stepper */}
      <div className="space-y-2">
        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r transition-all duration-500 ${
              task.status === 'failed' ? 'from-rose-500 to-red-600' :
              task.status === 'cancelled' ? 'from-slate-400 to-slate-500' :
              'from-indigo-500 to-indigo-600'
            }`}
            style={{ width: `${task.progress}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500">
          <span className="truncate flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Langkah: {task.summary}
          </span>
          <span>{task.progress}%</span>
        </div>
      </div>

      {task.status === 'waiting_approval' && (
        <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Approval Operator Dibutuhkan
              </p>
              <p className="text-sm leading-relaxed text-amber-900">
                {task.approvalReason || 'Aksi ini memerlukan persetujuan operator sebelum runtime dilanjutkan.'}
              </p>
              {task.approvalActionType && (
                <p className="text-[11px] font-mono text-amber-700/80">
                  Action: {task.approvalActionType}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => void onApprovalDecision('approved')}
              className="flex-1 rounded-xl border border-emerald-200 bg-white py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Setujui & Lanjutkan</span>
            </button>
            <button
              onClick={() => void onApprovalDecision('rejected')}
              className="flex-1 rounded-xl border border-amber-200 bg-white py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-100 transition flex items-center justify-center gap-1.5"
            >
              <XCircle className="h-4 w-4" />
              <span>Tolak Approval</span>
            </button>
          </div>
        </div>
      )}

      {/* Agent & Model details */}
      <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs">
        <div>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Pelaksana Agent</span>
          <span className="font-semibold text-slate-800 mt-0.5 block">{task.agent}</span>
        </div>
        <div>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Kredit Terpakai</span>
          <span className="font-semibold text-slate-800 mt-0.5 block">{task.creditsUsed || 1} Token</span>
        </div>
      </div>

      {/* VPS Live Terminal Logs */}
      {task.logs && task.logs.length > 0 && (
        <div className="space-y-2.5">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2 select-none">
            <Activity className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
            <span>Operational Log Trace (VPS Sandbox)</span>
          </div>
          <div className="h-44 overflow-y-auto rounded-xl bg-slate-900 p-3 border border-slate-800 space-y-1 scrollbar-thin">
            {task.logs.map((log, index) => (
              <div key={index}>
                {highlightLogLine(log)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated Artifacts / Downloadable Files */}
      {task.downloadItems && task.downloadItems.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Artifacts Output:</span>
          <div className="flex flex-wrap gap-2">
            {task.downloadItems.map((item, idx) => {
              const extension = item.label.split('.').pop()?.toUpperCase() || 'FILE';
              return (
                <a
                  key={idx}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 hover:scale-[1.02] transition duration-200"
                >
                  <FileDown className="h-4 w-4 shrink-0" />
                  <div>
                    <span className="block font-bold">{item.label}</span>
                    <span className="text-[8px] opacity-75 font-mono">Format: {extension}</span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Control Actions */}
      {task.status !== 'completed' && task.status !== 'failed' && task.status !== 'cancelled' && (
        <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={() => void onCancelTask()}
            className="flex-1 rounded-xl border border-rose-200 bg-white py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition flex items-center justify-center gap-1.5"
          >
            <XCircle className="h-4 w-4" />
            <span>Batalkan Tugas</span>
          </button>
        </div>
      )}

      {/* Handoff actions when completed */}
      {task.status === 'completed' && resolvedProjectId && (
        <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={openProject}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition flex items-center justify-center gap-1.5"
          >
            <FolderOpen className="h-4 w-4" />
            <span>Buka Proyek</span>
          </button>
        </div>
      )}

      {task.status === 'failed' && (
        <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={() => void handleRetryTask(task.id)}
            className="flex-1 rounded-xl border border-indigo-200 bg-indigo-50 py-2.5 text-xs font-bold text-indigo-600 hover:bg-indigo-100 transition flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry Task</span>
          </button>
        </div>
      )}

    </div>
  );
}
