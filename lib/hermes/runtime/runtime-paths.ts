import path from 'node:path';

const VERCEL_TMP_ROOT = path.join('/tmp', 'hermes-runtime');

export const isServerlessRuntime = () => Boolean(process.env.VERCEL || process.env.VERCEL_ENV);

export const getRuntimeDataDir = () =>
  isServerlessRuntime() ? VERCEL_TMP_ROOT : path.join(process.cwd(), '.tmp');

export const getRuntimeDataPath = (filename: string) => path.join(getRuntimeDataDir(), filename);
