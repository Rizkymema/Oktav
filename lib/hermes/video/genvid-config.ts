import path from 'node:path';

import type { GenvidConfig, GenvidFallbackMode } from '@/lib/hermes/video/genvid-types';

const readBool = (value: string | undefined, fallback: boolean) =>
  value ? value.toLowerCase() === 'true' : fallback;

const readNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const readGenvidConfig = (): GenvidConfig => ({
  enabled: readBool(process.env.GENVID_ENABLED, false),
  apiUrl: process.env.GENVID_API_URL?.trim() || 'http://127.0.0.1:8000',
  root: process.env.GENVID_ROOT?.trim() || path.join(process.cwd(), 'integrations', 'genvid'),
  autoStart: readBool(process.env.GENVID_AUTO_START, false),
  startCommand:
    process.env.GENVID_START_COMMAND?.trim() ||
    'uv run python api/app.py --host 127.0.0.1 --port 8000',
  healthTimeoutMs: readNumber(process.env.GENVID_HEALTH_TIMEOUT_MS, 5000),
  pollIntervalMs: readNumber(process.env.GENVID_POLL_INTERVAL_MS, 2500),
  pollTimeoutMs: readNumber(process.env.GENVID_POLL_TIMEOUT_MS, 300000),
  frameTemplate:
    process.env.GENVID_FRAME_TEMPLATE?.trim() || '1080x1920/static_default.html',
  sceneCount: readNumber(process.env.GENVID_SCENE_COUNT, 5),
  fallbackMode:
    (process.env.GENVID_FALLBACK_MODE as GenvidFallbackMode | undefined) || 'legacy_ffmpeg',
});
