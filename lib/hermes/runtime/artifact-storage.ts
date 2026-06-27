import fs from 'node:fs/promises';
import path from 'node:path';

export interface PublishedArtifact {
  label: string;
  url: string;
}

interface PublishArtifactInput {
  filename: string;
  localPath: string;
  contentType?: string;
  putImpl?: (
    pathname: string,
    body: Buffer,
    options: { access: 'public'; contentType?: string },
  ) => Promise<{ url: string }>;
}

const TMP_ARTIFACT_DIR = path.join('/tmp', 'hermes-artifacts');

export const isVercelRuntime = () => Boolean(process.env.VERCEL || process.env.VERCEL_ENV);

export const hasVercelBlobBinding = () =>
  Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);

export const getArtifactWorkingDir = () =>
  isVercelRuntime() ? TMP_ARTIFACT_DIR : path.join(process.cwd(), 'public', 'artifacts');

export const buildLocalArtifactUrl = (filename: string) => `/artifacts/${filename}`;

export const publishArtifactFile = async (
  input: PublishArtifactInput,
): Promise<PublishedArtifact> => {
  if (!isVercelRuntime()) {
    return {
      label: input.filename,
      url: buildLocalArtifactUrl(input.filename),
    };
  }

  if (!hasVercelBlobBinding()) {
    console.warn(
      'Vercel Blob storage tidak terkonfigurasi. Menggunakan fallback URL lokal untuk artifact.'
    );
    return {
      label: input.filename,
      url: buildLocalArtifactUrl(input.filename),
    };
  }

  const body = await fs.readFile(input.localPath);
  const put =
    input.putImpl ??
    (async (pathname: string, fileBody: Buffer, options: { access: 'public'; contentType?: string }) => {
      const { put: vercelPut } = await import('@vercel/blob');
      return vercelPut(pathname, fileBody, options);
    });

  const blob = await put(`artifacts/${Date.now()}-${input.filename}`, body, {
    access: 'public',
    contentType: input.contentType,
  });

  return {
    label: input.filename,
    url: blob.url,
  };
};
