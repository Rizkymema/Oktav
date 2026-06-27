import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

import { GenvidClient } from '@/lib/hermes/video/genvid-client';
import type { GenvidConfig } from '@/lib/hermes/video/genvid-types';

interface GenerateVideoInput {
  taskId: string;
  goal: string;
  prompt: string;
  outputPath: string;
}

interface CompletedTaskResult {
  video_url: string;
  duration: number;
  file_size: number;
}

interface CompletedTaskPayload {
  status: string;
  result?: CompletedTaskResult;
}

export class GenvidVideoService {
  private readonly client: GenvidClient;

  constructor(private readonly config: GenvidConfig) {
    this.client = new GenvidClient(config);
  }

  async generateVideo(input: GenerateVideoInput) {
    await this.ensureServiceAvailable();

    const submitResult = await this.client.submitVideo({
      text: input.prompt,
      mode: 'generate',
      title: input.goal,
      n_scenes: this.config.sceneCount,
      frame_template: this.config.frameTemplate,
    });

    const startedAt = Date.now();
    while (Date.now() - startedAt < this.config.pollTimeoutMs) {
      const task = (await this.client.getTask(submitResult.task_id)) as CompletedTaskPayload;

      if (task.status === 'completed' && task.result) {
        const videoBuffer = await this.client.downloadVideo(task.result.video_url);
        await fs.promises.mkdir(path.dirname(input.outputPath), { recursive: true });
        await fs.promises.writeFile(input.outputPath, videoBuffer);

        return {
          remoteTaskId: submitResult.task_id,
          duration: task.result.duration,
          fileSize: task.result.file_size,
          outputPath: input.outputPath,
        };
      }

      if (task.status === 'failed' || task.status === 'cancelled') {
        throw new Error('Genvid task failed.');
      }

      await new Promise((resolve) => setTimeout(resolve, this.config.pollIntervalMs));
    }

    throw new Error('Genvid task timed out.');
  }

  private async ensureServiceAvailable() {
    try {
      await this.client.checkHealth();
      return;
    } catch (error) {
      if (!this.config.autoStart) {
        throw error;
      }
    }

    spawn(this.config.startCommand, {
      cwd: this.config.root,
      detached: true,
      shell: true,
      stdio: 'ignore',
      windowsHide: true,
    }).unref();

    const startupDeadline = Date.now() + Math.min(this.config.pollTimeoutMs, 120000);
    while (Date.now() < startupDeadline) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        await this.client.checkHealth();
        return;
      } catch {}
    }

    throw new Error('Genvid service failed to start.');
  }
}
