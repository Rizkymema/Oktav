'use client';

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

import { getBubbleTone } from '@/lib/workspace/chat/chat-presentation';
import type { ChatMessage } from '@/lib/workspace/types';

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  const bubbleTone = getBubbleTone({ sender: message.sender, kind: message.kind });

  return (
    <div className={`flex gap-4 w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex h-8 w-8 mt-1 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[10px] font-bold tracking-[0.18em] text-slate-800 shadow-sm select-none">
          HC
        </div>
      )}

      <div className={`flex max-w-[min(100%,48rem)] flex-col space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`w-full ${
            isUser
              ? 'rounded-3xl bg-slate-100 px-5 py-3.5 text-slate-900'
              : 'py-2 text-slate-800'
          }`}
        >
          <MessageContent text={message.text} />
        </div>
        
        {!isUser && (
          <div className="flex flex-wrap items-center gap-2 px-1 text-[11px] font-medium text-slate-400">
            <span>{message.timestamp}</span>
            {message.skill && (
              <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                {message.skill}
              </span>
            )}
            {message.model && (
              <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                {message.model}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MessageContent({ text }: { text: string }) {
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 text-[15px] leading-7">
      {parts.map((part, index) =>
        part.startsWith('```') ? (
          <CodeBlock key={index} block={part} />
        ) : (
          <InlineMarkdown key={index} text={part} />
        ),
      )}
    </div>
  );
}

function CodeBlock({ block }: { block: string }) {
  const [copied, setCopied] = useState(false);
  const match = block.match(/```(\w*)\n([\s\S]*?)```/);
  const lang = match ? match[1] : 'code';
  const code = match ? match[2] : block.slice(3, -3);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/40 px-4 py-2 text-[11px] text-zinc-400">
        <span className="font-semibold uppercase tracking-wider">{lang || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-zinc-400 transition hover:bg-slate-850 hover:text-zinc-200"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-4 text-[13px] leading-6 text-zinc-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function InlineMarkdown({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <>
      {lines.map((line, index) => {
        if (!line.trim()) {
          return <div key={index} className="h-2" />;
        }
        if (line.startsWith('### ')) {
          return (
            <h3 key={index} className="text-[13px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {parseInline(line.slice(4))}
            </h3>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h2 key={index} className="text-xl font-semibold text-slate-900">
              {parseInline(line.slice(3))}
            </h2>
          );
        }
        if (line.startsWith('# ')) {
          return (
            <h1 key={index} className="text-2xl font-semibold text-slate-900">
              {parseInline(line.slice(2))}
            </h1>
          );
        }

        return (
          <p key={index} className="whitespace-pre-wrap text-current">
            {parseInline(line)}
          </p>
        );
      })}
    </>
  );
}

function parseInline(line: string) {
  const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
  const linkRegex = /\[(.*?)\]\((.*?)\)/g;
  const boldRegex = /\*\*(.*?)\*\*/g;
  const elements: React.ReactNode[] = [];
  let remaining = line;
  let key = 0;

  while (remaining.length > 0) {
    const imgMatch = imageRegex.exec(remaining);
    const linkMatch = linkRegex.exec(remaining);
    const boldMatch = boldRegex.exec(remaining);

    imageRegex.lastIndex = 0;
    linkRegex.lastIndex = 0;
    boldRegex.lastIndex = 0;

    const matches = [
      imgMatch ? { index: imgMatch.index, type: 'img', match: imgMatch } : null,
      linkMatch ? { index: linkMatch.index, type: 'link', match: linkMatch } : null,
      boldMatch ? { index: boldMatch.index, type: 'bold', match: boldMatch } : null,
    ].filter(Boolean) as Array<{ index: number; type: string; match: RegExpExecArray }>;

    if (matches.length === 0) {
      elements.push(<span key={key++}>{remaining}</span>);
      break;
    }

    matches.sort((a, b) => a.index - b.index);
    const earliest = matches[0];

    if (earliest.index > 0) {
      elements.push(<span key={key++}>{remaining.slice(0, earliest.index)}</span>);
    }

    const matchedText = earliest.match[0];
    if (earliest.type === 'img') {
      const alt = earliest.match[1];
      const url = earliest.match[2];
      elements.push(
        <span key={key++} className="block overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={alt} className="max-h-[24rem] w-full object-cover" />
        </span>,
      );
    } else if (earliest.type === 'link') {
      const label = earliest.match[1];
      const url = earliest.match[2];
      elements.push(
        <a
          key={key++}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-indigo-600 underline-offset-4 transition hover:text-indigo-700 hover:underline"
        >
          {label}
        </a>,
      );
    } else if (earliest.type === 'bold') {
      elements.push(
        <strong key={key++} className="font-semibold text-slate-900">
          {earliest.match[1]}
        </strong>,
      );
    }

    remaining = remaining.slice(earliest.index + matchedText.length);
  }

  return elements;
}
