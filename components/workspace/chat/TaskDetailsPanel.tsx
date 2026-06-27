'use client';

import React from 'react';

import LiveTaskCard from '@/components/workspace/LiveTaskCard';
import type { Task } from '@/lib/workspace/types';

interface TaskDetailsPanelProps {
  task: Task;
  open: boolean;
}

export default function TaskDetailsPanel({ task, open }: TaskDetailsPanelProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-3">
      <LiveTaskCard task={task} />
    </div>
  );
}
