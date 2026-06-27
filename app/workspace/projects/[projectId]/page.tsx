'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  Bot,
  Download,
  File,
  FileCode,
  FileText,
  Folder,
  Image as ImageIcon,
  Layout,
  MessageSquare,
  Table as TableIcon,
} from 'lucide-react';

import LiveTaskCard from '@/components/workspace/LiveTaskCard';
import MessageBubble from '@/components/workspace/chat/MessageBubble';
import TaskResultCard from '@/components/workspace/chat/TaskResultCard';
import { createProjectNotification } from '@/lib/workspace/notification-factory';
import {
  buildProjectWorkspaceIntent,
  resolveProjectArtifacts,
  resolveProjectMessages,
  resolveProjectTasks,
} from '@/lib/workspace/project-runtime';
import { useWorkspace } from '@/lib/workspace/workspace-context';

type ProjectTab = 'overview' | 'chat' | 'tasks' | 'files' | 'settings';

const TABS: ProjectTab[] = ['overview', 'chat', 'tasks', 'files', 'settings'];

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
  const { projects, tasks, messages, setProjects, setNotifications } = useWorkspace();

  const project = projects.find((item) => item.id === projectId);
  const queryTab = searchParams.get('tab');
  const queryTaskId = searchParams.get('taskId');
  const [activeTabOverride, setActiveTabOverride] = useState<ProjectTab | null>(null);
  const [selectedTaskIdOverride, setSelectedTaskIdOverride] = useState<string | null>(null);

  const activeTab =
    activeTabOverride ?? (queryTab && TABS.includes(queryTab as ProjectTab) ? (queryTab as ProjectTab) : 'overview');
  const selectedTaskId = selectedTaskIdOverride ?? queryTaskId;

  const projectTasks = useMemo(() => (project ? resolveProjectTasks(project, tasks) : []), [project, tasks]);
  const projectMessages = useMemo(
    () => resolveProjectMessages(projectTasks.map((task) => task.id), messages),
    [messages, projectTasks],
  );
  const projectFiles = useMemo(() => resolveProjectArtifacts(projectTasks), [projectTasks]);
  const selectedTask = projectTasks.find((task) => task.id === selectedTaskId) ?? projectTasks[0];

  if (!project) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#0c0b09] px-6">
        <div className="space-y-4 text-center">
          <Folder className="mx-auto h-12 w-12 text-stone-600" />
          <p className="text-xs text-stone-400">Proyek tidak ditemukan atau belum ada proyek terdaftar.</p>
          <Link
            href="/workspace/projects"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#f2dfbe] transition hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Daftar Proyek</span>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusTone = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20';
      case 'failed':
        return 'text-rose-300 bg-rose-400/10 border-rose-400/20';
      case 'waiting_approval':
        return 'text-amber-200 bg-amber-300/10 border-amber-300/20';
      default:
        return 'text-[#f2dfbe] bg-[#d4c2a1]/12 border-[#d4c2a1]/18';
    }
  };

  const handleRunTask = () => {
    const intent = buildProjectWorkspaceIntent(project);
    const query = new URLSearchParams({
      focus: 'compose',
      projectId: intent.projectId,
      projectName: intent.projectName,
      projectType: intent.projectType,
    });
    router.push(`/workspace?${query.toString()}`);
  };

  const getFileIcon = (name: string) => {
    const extension = name.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'pptx':
        return Layout;
      case 'docx':
      case 'pdf':
      case 'md':
      case 'txt':
        return FileText;
      case 'xlsx':
      case 'csv':
        return TableIcon;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'webp':
      case 'svg':
        return ImageIcon;
      case 'html':
      case 'css':
      case 'js':
      case 'json':
      case 'tsx':
      case 'ts':
        return FileCode;
      default:
        return File;
    }
  };

  const handleDeleteProject = () => {
    if (confirm('Apakah Anda yakin ingin menghapus proyek ini secara permanen? Tindakan ini tidak dapat dibatalkan.')) {
      setProjects((current) => current.filter((item) => item.id !== project.id));
      setNotifications((current) => [createProjectNotification({ kind: 'deleted', project }), ...current]);
      router.push('/workspace/projects');
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-[#0c0b09] px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-5xl space-y-8 pb-16">
        <div className="space-y-4">
          <Link
            href="/workspace/projects"
            className="inline-flex items-center gap-1.5 text-xs text-stone-500 transition hover:text-stone-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Daftar Proyek</span>
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-semibold text-stone-50">
                <Folder className="h-6 w-6 text-[#d4c2a1]" />
                {project.name}
              </h2>
              <p className="mt-1 select-all font-mono text-xs text-stone-400">{project.path}</p>
            </div>

            <button
              onClick={handleRunTask}
              className="self-start rounded-xl border border-[#d4c2a1]/20 bg-[#d4c2a1]/12 px-4 py-2 text-xs font-semibold tracking-wide text-[#f2dfbe] transition hover:bg-[#d4c2a1]/18 sm:self-center"
            >
              Lanjutkan di Composer
            </button>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-white/8 pb-px">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTabOverride(tab)}
              className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
                activeTab === tab
                  ? 'border-b border-[#d4c2a1] text-[#f2dfbe]'
                  : 'text-stone-500 hover:text-stone-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="space-y-4 rounded-[26px] border border-white/8 bg-[#12110f]/70 p-5 md:col-span-2">
                <span className="block text-xs font-semibold uppercase tracking-wider text-stone-100">Ringkasan Proyek</span>
                <p className="select-text text-sm leading-7 text-stone-400">
                  {project.description ||
                    'Proyek workspace aktif dengan artifact dan log runtime yang disinkronkan dari Hermes Core.'}
                </p>

                <div className="grid grid-cols-2 gap-4 border-t border-white/8 pt-4 text-xs">
                  <div>
                    <span className="block font-semibold uppercase text-stone-500">Kategori</span>
                    <span className="mt-0.5 block text-stone-200">{project.category}</span>
                  </div>
                  <div>
                    <span className="block font-semibold uppercase text-stone-500">Format Output</span>
                    <span className="mt-0.5 block text-stone-200">{project.type}</span>
                  </div>
                  <div>
                    <span className="block font-semibold uppercase text-stone-500">Update Terakhir</span>
                    <span className="mt-0.5 block text-stone-200">{project.lastUpdate}</span>
                  </div>
                  <div>
                    <span className="block font-semibold uppercase text-stone-500">Status Eksekusi</span>
                    <span
                      className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getStatusTone(project.status)}`}
                    >
                      {project.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="h-fit space-y-4 rounded-[26px] border border-white/8 bg-[#12110f]/70 p-5">
                <span className="block text-xs font-semibold uppercase tracking-wider text-stone-100">Agent Pelaksana</span>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#d4c2a1]/20 bg-[#d4c2a1]/12 text-[#f2dfbe]">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-stone-100">{project.activeAgent || 'Hermes Core'}</span>
                    <span className="block text-[10px] uppercase tracking-wider text-stone-500">Core Orchestrator</span>
                  </div>
                </div>

                <div className="space-y-2 border-t border-white/8 pt-3.5 text-[11px] text-stone-400">
                  <div className="flex justify-between">
                    <span>Artifact Runtime</span>
                    <span className="font-mono font-semibold text-stone-200">{projectFiles.length} File</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Task Terkait</span>
                    <span className="font-mono font-semibold text-stone-200">{projectTasks.length} Task</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#d4c2a1]" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-100">Percakapan Terkait Proyek</h4>
              </div>

              {projectMessages.length > 0 ? (
                <div className="space-y-4">
                  {projectMessages.map((message) => {
                    const linkedTask = message.taskId ? projectTasks.find((task) => task.id === message.taskId) : undefined;

                    return (
                      <div key={message.id} className="space-y-3 rounded-[24px] border border-white/8 bg-[#12110f]/65 p-4">
                        <MessageBubble message={message} />
                        {linkedTask && <TaskResultCard task={linkedTask} />}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3 rounded-[24px] border border-white/8 bg-[#12110f]/65 p-6 text-center">
                  <p className="mx-auto max-w-sm text-sm leading-7 text-stone-400">
                    Belum ada thread runtime yang tertaut ke proyek ini. Lanjutkan pekerjaan dari composer utama untuk membuat percakapan proyek.
                  </p>
                  <button
                    onClick={handleRunTask}
                    className="mt-2 rounded-xl border border-white/8 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-stone-200 transition hover:bg-white/[0.06]"
                  >
                    Buka Composer
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">Riwayat Eksekusi ({projectTasks.length})</h3>

              {projectTasks.length > 0 ? (
                <div className="space-y-3">
                  {projectTasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => setSelectedTaskIdOverride(task.id)}
                      className={`w-full rounded-[24px] border bg-[#12110f]/65 p-4 text-left transition ${
                        selectedTask?.id === task.id ? 'border-[#d4c2a1]/20' : 'border-white/8 hover:bg-[#141311]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-stone-100">
                              {task.prompt.replace(/\[Skill:.*?\]\s*/, '')}
                            </span>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider ${getStatusTone(task.status)}`}
                            >
                              {task.status}
                            </span>
                          </div>
                          <p className="font-mono text-[10px] text-stone-500">
                            ID: {task.id} • Agent: {task.agent} • {task.createdTime}
                          </p>
                        </div>

                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#f2dfbe]">
                          <span>Detail</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-white/10 py-10 text-center text-xs text-stone-500">
                  Tidak ada riwayat eksekusi terpisah untuk proyek ini.
                </div>
              )}

              {selectedTask && (
                <div className="pt-2">
                  <LiveTaskCard task={selectedTask} />
                </div>
              )}
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-4 rounded-[26px] border border-white/8 bg-[#12110f]/70 p-6">
              <div className="flex items-center justify-between border-b border-white/8 pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-100">Berkas Runtime Proyek</span>
                <span className="text-[10px] font-semibold uppercase text-stone-500">{projectFiles.length} File Terdeteksi</span>
              </div>

              {projectFiles.length > 0 ? (
                <div className="space-y-2.5">
                  {projectFiles.map((file) => {
                    const FileIcon = getFileIcon(file.name);

                    return (
                      <div
                        key={`${file.name}-${file.url}`}
                        className="flex items-center justify-between rounded-2xl border border-white/8 bg-[#0d0d0b] p-3.5 text-xs transition hover:bg-[#141311]"
                      >
                        <div className="flex items-center gap-2.5">
                          <FileIcon className="h-4.5 w-4.5 text-[#d4c2a1]" />
                          <span className="font-medium text-stone-200">{file.name}</span>
                        </div>
                        <div className="flex items-center gap-4 text-stone-500">
                          <span>{file.size}</span>
                          <span className="font-mono text-[9px]">{file.time}</span>
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded p-1 text-stone-400 transition hover:bg-white/[0.05] hover:text-[#f2dfbe]"
                            title="Buka / Unduh Berkas"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3 py-10 text-center text-xs text-stone-500">
                  <p>Belum ada artifact runtime yang tersimpan untuk proyek ini.</p>
                  <button
                    onClick={handleRunTask}
                    className="rounded-xl border border-white/8 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-stone-200 transition hover:bg-white/[0.06]"
                  >
                    Buat Artifact dari Composer
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4 rounded-[26px] border border-white/8 bg-[#12110f]/70 p-6">
              <span className="block text-xs font-semibold uppercase tracking-wider text-stone-100">Pengaturan Folder Proyek</span>

              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-white/8 py-2.5">
                  <div>
                    <span className="block font-medium text-stone-200">Sinkronisasi Folder Lokal</span>
                    <span className="text-[10px] text-stone-500">Proyek ini mengikuti sinkronisasi runtime workspace.</span>
                  </div>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-emerald-300">
                    Active
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-white/8 py-2.5">
                  <div>
                    <span className="block font-medium text-stone-200">Artifact Download</span>
                    <span className="text-[10px] text-stone-500">File hasil task dapat dibuka ulang dari tab files dan notifikasi.</span>
                  </div>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-emerald-300">
                    Enabled
                  </span>
                </div>

                <button
                  onClick={handleDeleteProject}
                  className="block rounded-xl border border-rose-400/20 bg-rose-400/8 px-4.5 py-2.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-400/12"
                >
                  Hapus Proyek Workspace
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
