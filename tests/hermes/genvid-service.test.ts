import fs from 'node:fs';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

const artifactPath = path.join(process.cwd(), 'public', 'artifacts', 'genvid-test.mp4');

afterEach(() => {
  vi.restoreAllMocks();
  try {
    fs.unlinkSync(artifactPath);
  } catch {}
});

describe('GenvidVideoService', () => {
  it('polls the remote task and mirrors the finished mp4 locally', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'healthy' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ task_id: 'task-123' }), { status: 200 }))
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            task_id: 'task-123',
            status: 'completed',
            result: {
              video_url: 'http://127.0.0.1:8000/api/files/run/final.mp4',
              duration: 12.5,
              file_size: 512,
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(Uint8Array.from(Array.from({ length: 256 }, (_, index) => index % 255)), {
          status: 200,
          headers: { 'content-type': 'video/mp4' },
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const { GenvidVideoService } = await import('@/lib/hermes/video/genvid-service');
    const service = new GenvidVideoService({
      enabled: true,
      apiUrl: 'http://127.0.0.1:8000',
      root: 'D:\\genvid\\Pixelle-Video-main',
      autoStart: false,
      startCommand: 'uv run python api/app.py --host 127.0.0.1 --port 8000',
      healthTimeoutMs: 5000,
      pollIntervalMs: 1,
      pollTimeoutMs: 2000,
      frameTemplate: '1080x1920/static_default.html',
      sceneCount: 4,
      fallbackMode: 'legacy_ffmpeg',
    });

    const result = await service.generateVideo({
      prompt: 'Buat video promosi parfum mewah',
      goal: 'Video Promosi Parfum',
      outputPath: artifactPath,
      taskId: 'hermes-task-1',
    });

    expect(result.duration).toBe(12.5);
    expect(result.fileSize).toBe(512);
    expect(fs.existsSync(artifactPath)).toBe(true);
    expect(fs.readFileSync(artifactPath).length).toBeGreaterThan(64);
    expect(fetchMock.mock.calls[1]?.[0]).toContain('/api/video/generate/async');
    expect(fetchMock.mock.calls[1]?.[1]?.body).toContain('"frame_template":"1080x1920/static_default.html"');
    expect(fetchMock.mock.calls[1]?.[1]?.body).toContain('"n_scenes":4');
  });
});
