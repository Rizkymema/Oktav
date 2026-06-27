'use client';

import React, { useState } from 'react';
import { ChevronDown, ExternalLink, FileText, FolderOpen, Image as ImageIcon, Sparkles } from 'lucide-react';

import { getAttachmentTone } from '@/lib/workspace/chat/chat-presentation';
import type { Task } from '@/lib/workspace/types';
import TaskDetailsPanel from './TaskDetailsPanel';

interface TaskResultCardProps {
  task: Task;
}

const TERMINAL_STATUSES = new Set(['completed', 'failed', 'cancelled']);

export default function TaskResultCard({ task }: TaskResultCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const primaryItem = task.downloadItems[0];
  const isImage = Boolean(primaryItem?.url.match(/\.(png|jpg|jpeg|svg|webp)$/i));
  const statusTone = getAttachmentTone(task.status);

  return (
    <div className="space-y-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_10px_25px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${statusTone}`}>
            {task.status.replace('_', ' ')}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">{task.summary || task.prompt}</p>
            <p className="mt-1 text-xs text-slate-500">
              {task.agent}
              {task.resolvedModel ? ` • ${task.resolvedModel}` : ''}
            </p>
          </div>
        </div>

        <div className="min-w-[7rem] text-right">
          <div className="text-2xl font-semibold text-slate-900">{task.progress}%</div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">progress</div>
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500"
          style={{ width: `${task.progress}%` }}
        />
      </div>

      {task.status === 'waiting_approval' && (
        <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {task.approvalReason || 'Task ini menunggu approval operator sebelum runtime dilanjutkan.'}
        </div>
      )}

      {primaryItem && (
        <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-slate-50">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={primaryItem.url} alt={primaryItem.label} className="max-h-[22rem] w-full object-cover" />
          ) : (
            <div className="flex items-center gap-4 px-4 py-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
                {task.requestedOutputType === 'html' || task.requestedOutputType === 'zip' ? (
                  <FolderOpen className="h-5 w-5" />
                ) : (
                  <FileText className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{primaryItem.label}</p>
                <p className="text-xs text-slate-500">
                  {task.requestedOutputType?.toUpperCase() || primaryItem.label.split('.').pop()?.toUpperCase() || 'FILE'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {task.downloadItems.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {task.downloadItems.slice(1).map((item) => (
            <a
              key={item.url}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span className="truncate">{item.label}</span>
            </a>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {primaryItem && (
          <a
            href={primaryItem.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-medium text-indigo-600 transition hover:bg-indigo-100"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Open Result</span>
          </a>
        )}
        <button
          type="button"
          onClick={() => setDetailsOpen((open) => !open)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>{detailsOpen ? 'Hide Details' : 'Details'}</span>
          <ChevronDown className={`h-3.5 w-3.5 transition ${detailsOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {!TERMINAL_STATUSES.has(task.status) && (
        <p className="text-xs text-slate-500">
          Task masih berjalan. Detail teknis dan progress live tersedia di panel detail.
        </p>
      )}

      <TaskDetailsPanel task={task} open={detailsOpen} />
    </div>
  );
}
