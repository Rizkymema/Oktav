import fs from 'node:fs';
import path from 'node:path';

import { afterEach, describe, expect, test } from 'vitest';

import {
  buildLocalArtifactUrl,
  getArtifactWorkingDir,
  publishArtifactFile,
} from '@/lib/hermes/runtime/artifact-storage';

const createdFiles: string[] = [];

afterEach(() => {
  for (const filePath of createdFiles.splice(0, createdFiles.length)) {
    try {
      fs.unlinkSync(filePath);
    } catch {}
  }

  delete process.env.VERCEL;
  delete process.env.VERCEL_ENV;
  delete process.env.BLOB_STORE_ID;
  delete process.env.BLOB_READ_WRITE_TOKEN;
});

describe('artifact storage', () => {
  test('uses public artifacts directory outside Vercel runtime', () => {
    expect(getArtifactWorkingDir()).toBe(path.join(process.cwd(), 'public', 'artifacts'));
    expect(buildLocalArtifactUrl('demo.mp4')).toBe('/artifacts/demo.mp4');
  });

  test('returns local artifact url outside Vercel runtime', async () => {
    const artifactPath = path.join(process.cwd(), 'public', 'artifacts', 'storage-local.mp4');
    fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
    fs.writeFileSync(artifactPath, Buffer.from([1, 2, 3]));
    createdFiles.push(artifactPath);

    const published = await publishArtifactFile({
      filename: 'storage-local.mp4',
      localPath: artifactPath,
      contentType: 'video/mp4',
    });

    expect(published).toEqual({
      label: 'storage-local.mp4',
      url: '/artifacts/storage-local.mp4',
    });
  });

  test('uploads artifact to blob-backed url on Vercel runtime', async () => {
    process.env.VERCEL = '1';
    process.env.BLOB_STORE_ID = 'store_test';

    const artifactPath = path.join(process.cwd(), '.tmp', 'storage-cloud.mp4');
    fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
    fs.writeFileSync(artifactPath, Buffer.from([4, 5, 6, 7]));
    createdFiles.push(artifactPath);

    const published = await publishArtifactFile({
      filename: 'storage-cloud.mp4',
      localPath: artifactPath,
      contentType: 'video/mp4',
      putImpl: async (pathname, body, options) => {
        expect(pathname).toMatch(/^artifacts\/\d+-storage-cloud\.mp4$/);
        expect(Buffer.isBuffer(body)).toBe(true);
        expect(body.length).toBe(4);
        expect(options).toEqual({
          access: 'public',
          contentType: 'video/mp4',
        });
        return { url: 'https://blob.example.com/storage-cloud.mp4' };
      },
    });

    expect(published).toEqual({
      label: 'storage-cloud.mp4',
      url: 'https://blob.example.com/storage-cloud.mp4',
    });
  });
});
