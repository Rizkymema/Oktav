import { describe, expect, test } from 'vitest';

import {
  getAttachmentTone,
  getBubbleTone,
  getComposerChrome,
  getThreadShellTone,
} from '@/lib/workspace/chat/chat-presentation';

describe('chat presentation helpers', () => {
  test('returns warm assistant and restrained user bubble tones', () => {
    expect(getBubbleTone({ sender: 'assistant', kind: 'message' })).toMatchObject({
      container: 'border-[#2a2a24]',
      text: 'text-stone-100',
    });
    expect(getBubbleTone({ sender: 'user', kind: 'message' })).toMatchObject({
      container: 'bg-[#1c1b18]',
      text: 'text-stone-50',
    });
  });

  test('keeps error and approval attachments readable without neon glow', () => {
    expect(getAttachmentTone('waiting_approval')).toContain('border-amber-200/30');
    expect(getAttachmentTone('failed')).toContain('border-rose-200/30');
  });

  test('returns calmer shell tones for onboarding and active thread', () => {
    expect(getThreadShellTone('thread')).toContain('#171512');
    expect(getComposerChrome({ focused: true, dragging: false })).toContain('border-stone-200/18');
  });
});
