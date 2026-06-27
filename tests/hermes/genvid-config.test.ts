import { describe, expect, it, vi } from 'vitest';

describe('readGenvidConfig', () => {
  it('reads genvid env vars with defaults', async () => {
    vi.resetModules();
    process.env.GENVID_ENABLED = 'true';
    process.env.GENVID_API_URL = 'http://127.0.0.1:8000';
    process.env.GENVID_ROOT = 'D:\\genvid\\Pixelle-Video-main';
    process.env.GENVID_AUTO_START = 'false';
    process.env.GENVID_FALLBACK_MODE = 'legacy_ffmpeg';

    const { readGenvidConfig } = await import('@/lib/hermes/video/genvid-config');
    const config = readGenvidConfig();

    expect(config.enabled).toBe(true);
    expect(config.apiUrl).toBe('http://127.0.0.1:8000');
    expect(config.root).toContain('Pixelle-Video-main');
    expect(config.autoStart).toBe(false);
    expect(config.fallbackMode).toBe('legacy_ffmpeg');
    expect(config.frameTemplate).toBe('1080x1920/static_default.html');
    expect(config.sceneCount).toBe(5);
    expect(config.pollIntervalMs).toBeGreaterThan(0);
  });
});
