'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  AudioLines,
  ChevronDown,
  FileArchive,
  FileCode,
  FileText,
  Globe,
  Image as ImageIcon,
  Mic,
  Plus,
  Send,
  Sparkles,
  Table as FileSpreadsheet,
  Target,
  X,
} from 'lucide-react';

import { getComposerChrome } from '@/lib/workspace/chat/chat-presentation';
import { useWorkspace } from '@/lib/workspace/workspace-context';

type AttachmentItem = {
  name: string;
  size: string;
  progress?: number;
};

const GOALS = ['Quick Task', 'Deep Research', 'Create Content', 'Build Project', 'Analyze Data', 'Automate Workflow'];

const triggerClassName =
  'flex h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-800 active:scale-95 cursor-pointer';

export default function PromptComposer() {
  const {
    promptInput,
    setPromptInput,
    selectedSkill,
    setSelectedSkill,
    selectedModel,
    setSelectedModel,
    availableModels,
    deepResearchMode,
    setDeepResearchMode,
    researchDepth,
    setResearchDepth,
    researchScope,
    setResearchScope,
    handleSubmitPrompt,
  } = useWorkspace();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [modelSearch, setModelSearch] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [researchConfigOpen, setResearchConfigOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [activeGoal, setActiveGoal] = useState('Quick Task');
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`;
  }, [promptInput]);

  const handleGoalSelect = (goal: string) => {
    setActiveGoal(goal);
    setGoalOpen(false);
    setDeepResearchMode(goal === 'Deep Research');
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);

    if (!event.dataTransfer.files?.length) {
      return;
    }

    const newFiles: AttachmentItem[] = [];

    for (let index = 0; index < event.dataTransfer.files.length; index += 1) {
      const file = event.dataTransfer.files[index];
      const sizeMb = file.size / (1024 * 1024);
      const size = sizeMb < 1 ? `${Math.round(file.size / 1024)} KB` : `${sizeMb.toFixed(1)} MB`;

      newFiles.push({
        name: file.name,
        size,
        progress: 0,
      });
    }

    setAttachments((current) => [...current, ...newFiles]);

    newFiles.forEach((file) => {
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 20;
        setAttachments((current) => {
          const next = [...current];
          const targetIndex = next.findIndex((item) => item.name === file.name);

          if (targetIndex >= 0) {
            next[targetIndex] = { ...next[targetIndex], progress: currentProgress };
          }

          return next;
        });

        if (currentProgress >= 100) {
          clearInterval(interval);
        }
      }, 150);
    });
  };

  const handleFileSelection = (files: FileList | null) => {
    if (!files?.length) {
      return;
    }

    const nextFiles: AttachmentItem[] = [];

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const sizeMb = file.size / (1024 * 1024);
      const size = sizeMb < 1 ? `${Math.round(file.size / 1024)} KB` : `${sizeMb.toFixed(1)} MB`;

      nextFiles.push({
        name: file.name,
        size,
        progress: 100,
      });
    }

    setAttachments((current) => {
      const knownNames = new Set(current.map((item) => item.name));
      return [...current, ...nextFiles.filter((item) => !knownNames.has(item.name))];
    });
  };

  const handlePickFiles = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveAttachment = (targetIndex: number) => {
    setAttachments((current) => current.filter((_, index) => index !== targetIndex));
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!promptInput.trim()) {
      return;
    }

    handleSubmitPrompt(promptInput);
    setAttachments([]);
  };

  const isUploading = attachments.some((item) => item.progress !== undefined && item.progress < 100);
  const composerChrome = getComposerChrome({ focused: isFocused, dragging: isDragging });

  const getFileIcon = (name: string) => {
    const extension = name.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'pdf':
      case 'doc':
      case 'docx':
      case 'txt':
      case 'md':
        return FileText;
      case 'xls':
      case 'xlsx':
      case 'csv':
        return FileSpreadsheet;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
      case 'webp':
        return ImageIcon;
      case 'zip':
      case 'rar':
      case 'tar':
      case 'gz':
        return FileArchive;
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
      case 'json':
      case 'html':
      case 'css':
        return FileCode;
      default:
        return FileText;
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full rounded-2xl border p-3 transition-all duration-300 ${composerChrome}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => {
          handleFileSelection(event.target.files);
          event.currentTarget.value = '';
        }}
      />
      {isDragging && (
        <div className="absolute inset-0 z-40 flex items-center justify-center rounded-2xl border border-dashed border-indigo-200 bg-white/95">
          <div className="text-center">
            <Plus className="mx-auto mb-2 h-7 w-7 text-indigo-500" />
            <p className="text-sm font-semibold text-slate-800">Drop file ke sini</p>
            <p className="mt-1 text-xs text-slate-500">Format PDF, DOCX, XLSX, PNG aman diunggah</p>
          </div>
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={promptInput}
        onChange={(event) => setPromptInput(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={
          selectedSkill
            ? `Jelaskan apa yang ingin Anda riset, buat, atau analisis dengan skill ${selectedSkill} bersama HermesClaw...`
            : 'Jelaskan apa yang ingin Anda riset, buat, analisis, otomatisasi, atau bangun bersama HermesClaw...'
        }
        rows={2}
        className="min-h-[56px] max-h-[200px] w-full resize-none bg-transparent px-3 py-2 text-[15px] leading-7 text-slate-800 placeholder:text-slate-400 focus:outline-none"
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            onSubmit(event);
          }
        }}
      />

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-3 pb-3">
          {attachments.map((file, index) => {
            const FileIcon = getFileIcon(file.name);

            return (
              <div
                key={`${file.name}-${index}`}
                className="relative flex items-center gap-2 overflow-hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-600"
              >
                {file.progress !== undefined && file.progress < 100 && (
                  <div
                    className="absolute bottom-0 left-0 h-0.5 bg-indigo-500 transition-all duration-150"
                    style={{ width: `${file.progress}%` }}
                  />
                )}
                <FileIcon className="h-3.5 w-3.5 text-indigo-500" />
                <span className="max-w-[150px] truncate font-medium">{file.name}</span>
                <span className="text-[9px] text-slate-400">({file.size})</span>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(index)}
                  className="rounded-full p-0.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handlePickFiles}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 active:scale-95 cursor-pointer"
            title="Lampirkan File"
          >
            <Plus className="h-4 w-4" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setGoalOpen((open) => !open);
                setResearchConfigOpen(false);
                setModelOpen(false);
              }}
              className={triggerClassName}
            >
              <Target className="h-3.5 w-3.5 text-indigo-500" />
              <span>Goal: {activeGoal}</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {goalOpen && (
              <div className="absolute bottom-full left-0 z-40 mb-2 w-52 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
                <span className="block px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">Pilih Target Goal</span>
                {GOALS.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => handleGoalSelect(goal)}
                    className={`flex w-full items-center rounded-xl px-2.5 py-1.5 text-left text-xs transition ${
                      activeGoal === goal
                        ? 'bg-indigo-50 font-semibold text-indigo-600'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setDeepResearchMode(!deepResearchMode);
                setResearchConfigOpen(!deepResearchMode);
                setGoalOpen(false);
                setModelOpen(false);
              }}
              className={`flex h-8 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-95 cursor-pointer ${
                deepResearchMode ? 'border-indigo-200 bg-indigo-50 text-indigo-600' : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Deep Research</span>
            </button>

            {deepResearchMode && researchConfigOpen && (
              <div className="absolute bottom-full left-0 z-40 mb-2 w-64 space-y-3.5 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Parameter Riset</span>
                  <button
                    type="button"
                    onClick={() => setResearchConfigOpen(false)}
                    className="rounded-full p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Kedalaman Riset</span>
                  <div className="grid grid-cols-4 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                    {(['Quick', 'Standard', 'Deep', 'Expert'] as const).map((depth) => (
                      <button
                        key={depth}
                        type="button"
                        onClick={() => setResearchDepth(depth)}
                        className={`rounded-lg py-1 text-[9px] font-semibold transition ${
                          researchDepth === depth
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {depth}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Cakupan Data</span>
                  <select
                    value={researchScope}
                    onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                      setResearchScope(event.target.value as typeof researchScope)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] font-medium text-slate-800 focus:border-indigo-500/40 focus:outline-none"
                  >
                    <option>Web</option>
                    <option>Uploaded Files</option>
                    <option>Knowledge Base</option>
                    <option>Connected Tools</option>
                    <option>All Available Sources</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {selectedSkill && (
            <div className="flex h-8 items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              <span>Skill: {selectedSkill}</span>
              <button type="button" onClick={() => setSelectedSkill(null)} className="ml-0.5 transition hover:text-indigo-800">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setModelOpen((open) => !open);
                setGoalOpen(false);
                setResearchConfigOpen(false);
              }}
              className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
            >
              <span className="max-w-[120px] truncate">
                {availableModels.find((model) => model.id === selectedModel)?.name || selectedModel}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {modelOpen && (
              <div className="absolute bottom-full right-0 z-40 mb-2 w-64 rounded-2xl border border-slate-100 bg-white p-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
                <span className="mb-1 block px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">Pilih AI Model</span>

                <div className="mb-2 border-b border-slate-100 px-2 pb-2">
                  <input
                    type="text"
                    placeholder="Cari model..."
                    value={modelSearch}
                    onChange={(event) => setModelSearch(event.target.value)}
                    onClick={(event) => event.stopPropagation()}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[10px] text-slate-800 placeholder:text-slate-400 focus:border-indigo-500/40 focus:outline-none"
                  />
                </div>

                <div className="max-h-60 space-y-1 overflow-y-auto pr-1">
                  {availableModels
                    .filter(
                      (option) =>
                        option.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
                        option.id.toLowerCase().includes(modelSearch.toLowerCase()),
                    )
                    .map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setSelectedModel(option.id);
                          setModelOpen(false);
                          setModelSearch('');
                        }}
                        className={`flex w-full items-start rounded-xl px-2.5 py-1.5 text-left text-xs transition ${
                          selectedModel === option.id
                            ? 'bg-indigo-50 font-semibold text-indigo-600'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold">{option.name}</span>
                            {option.badge && (
                              <span className="rounded border border-indigo-200 bg-indigo-50 px-1 text-[7px] font-bold uppercase tracking-wider text-indigo-600">
                                {option.badge}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 max-w-[200px] truncate text-[9px] leading-normal text-slate-400" title={option.desc}>
                            {option.desc}
                          </p>
                          <p className="mt-0.5 text-[8px] uppercase tracking-wider text-slate-400">
                            {option.capabilities.join(' • ')}
                          </p>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!promptInput.trim() || isUploading}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition active:scale-95 cursor-pointer ${
              promptInput.trim() && !isUploading
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </form>
  );
}
