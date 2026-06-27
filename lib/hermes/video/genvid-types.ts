export type GenvidFallbackMode = 'legacy_ffmpeg' | 'fail';

export interface GenvidConfig {
  enabled: boolean;
  apiUrl: string;
  root: string;
  autoStart: boolean;
  startCommand: string;
  healthTimeoutMs: number;
  pollIntervalMs: number;
  pollTimeoutMs: number;
  frameTemplate: string;
  sceneCount: number;
  fallbackMode: GenvidFallbackMode;
}
