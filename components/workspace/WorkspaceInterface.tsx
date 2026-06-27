'use client';

import React, { useEffect, useRef } from 'react';
import { FileText, Globe, Image as ImageIcon, Layout, Table, Video as VideoIcon } from 'lucide-react';

import { isNearBottom } from '@/lib/workspace/chat/chat-helpers';
import { getThreadShellTone } from '@/lib/workspace/chat/chat-presentation';
import { useWorkspace } from '@/lib/workspace/workspace-context';
import HermesClawHero from './HermesClawHero';
import PromptComposer from './PromptComposer';
import TrendingProjects from './TrendingProjects';
import AssistantTypingBubble from './chat/AssistantTypingBubble';
import MessageBubble from './chat/MessageBubble';
import TaskResultCard from './chat/TaskResultCard';

const QUICK_SKILLS = [
  {
    name: 'Slides',
    icon: Layout,
    tone: 'text-slate-600 border-slate-200 bg-white hover:bg-slate-50',
  },
  {
    name: 'Documents',
    icon: FileText,
    tone: 'text-slate-600 border-slate-200 bg-white hover:bg-slate-50',
  },
  {
    name: 'Images',
    icon: ImageIcon,
    tone: 'text-slate-600 border-slate-200 bg-white hover:bg-slate-50',
  },
  {
    name: 'Sheets',
    icon: Table,
    tone: 'text-slate-600 border-slate-200 bg-white hover:bg-slate-50',
  },
  {
    name: 'Websites',
    icon: Globe,
    tone: 'text-slate-600 border-slate-200 bg-white hover:bg-slate-50',
  },
  {
    name: 'Videos',
    icon: VideoIcon,
    tone: 'text-slate-600 border-slate-200 bg-white hover:bg-slate-50',
  },
];

export default function WorkspaceInterface() {
  const { messages, tasks, selectedSkill, setSelectedSkill, isAssistantTyping, assistantStatusLabel, credits, connected, projects } = useWorkspace();

  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const shellTone = getThreadShellTone(messages.length === 0 ? 'onboarding' : 'thread');

  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport || !shouldAutoScrollRef.current) {
      return;
    }

    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, tasks, isAssistantTyping]);

  const handleThreadScroll = () => {
    const viewport = scrollViewportRef.current;
    if (!viewport) {
      return;
    }

    shouldAutoScrollRef.current = isNearBottom({
      scrollTop: viewport.scrollTop,
      clientHeight: viewport.clientHeight,
      scrollHeight: viewport.scrollHeight,
    });
  };

  return (
    <div className={`relative flex h-full w-full flex-col overflow-hidden ${shellTone}`}>
      <div
        ref={scrollViewportRef}
        onScroll={handleThreadScroll}
        className="flex-1 overflow-y-auto px-4 pb-52 pt-6 md:px-8 md:pb-60 md:pt-8"
      >
        <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col justify-center">
          {messages.length === 0 ? renderOnboardingState() : renderConversationThread()}
        </div>
      </div>

      <>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-white via-white/95 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 px-4 pb-5 md:px-8 md:pb-7">
          <div className="mx-auto max-w-3xl w-full">
            {messages.length === 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                {QUICK_SKILLS.map((skill) => {
                  const Icon = skill.icon;
                  const isSelected = selectedSkill === skill.name;
                  return (
                    <button
                      key={skill.name}
                      type="button"
                      onClick={() => setSelectedSkill(isSelected ? null : skill.name)}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition active:scale-95 cursor-pointer ${
                        isSelected
                          ? 'border-slate-800 bg-slate-900 text-white hover:bg-slate-800'
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                      <span>{skill.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
            <PromptComposer />
          </div>
        </div>
      </>
    </div>
  );

  function renderConversationThread() {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-7 pb-8">
        {messages.map((message) => {
          const task = message.taskId ? tasks.find((item) => item.id === message.taskId) : null;
          const isAssistantMessage = message.sender === 'assistant';

          return (
            <div key={message.id} className="space-y-3">
              <MessageBubble message={message} />
              {isAssistantMessage && task && (
                <div className="pl-11">
                  <TaskResultCard task={task} />
                </div>
              )}
            </div>
          );
        })}

        {isAssistantTyping && <AssistantTypingBubble label={assistantStatusLabel} />}
      </div>
    );
  }

  function renderOnboardingState() {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] w-full max-w-3xl mx-auto px-4 py-8 animate-fade-in">
        
        {/* Standalone Hero */}
        <div className="mb-12">
          <HermesClawHero />
        </div>

        {/* Templates Section */}
        <div className="w-full border-t border-slate-100 pt-6">
          <TrendingProjects />
        </div>

      </div>
    );
  }
}
