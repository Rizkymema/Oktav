import type { GenvidConfig } from '@/lib/hermes/video/genvid-types';

interface GenvidSubmitResponse {
  task_id: string;
}

export class GenvidClient {
  constructor(private readonly config: GenvidConfig) {}

  private async fetchWithRetry(input: string, init?: RequestInit, attempts = 3) {
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await fetch(input, {
          ...init,
          headers: {
            Connection: 'close',
            ...(init?.headers || {}),
          },
        });
      } catch (error) {
        lastError = error;
        if (attempt === attempts) {
          throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Genvid request failed.');
  }

  async checkHealth() {
    const response = await this.fetchWithRetry(`${this.config.apiUrl}/health`, {
      signal: AbortSignal.timeout(this.config.healthTimeoutMs),
    });

    if (!response.ok) {
      throw new Error('Genvid health check failed.');
    }

    return response.json();
  }

  async submitVideo(payload: Record<string, unknown>) {
    const response = await this.fetchWithRetry(`${this.config.apiUrl}/api/video/generate/async`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Genvid video submission failed.');
    }

    return response.json() as Promise<GenvidSubmitResponse>;
  }

  async getTask(taskId: string) {
    const response = await this.fetchWithRetry(`${this.config.apiUrl}/api/tasks/${taskId}`);

    if (!response.ok) {
      throw new Error(`Genvid task ${taskId} not found.`);
    }

    return response.json();
  }

  async downloadVideo(videoUrl: string) {
    const response = await this.fetchWithRetry(videoUrl);

    if (!response.ok) {
      throw new Error('Failed to download Genvid video output.');
    }

    return Buffer.from(await response.arrayBuffer());
  }
}
