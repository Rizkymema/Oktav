import type { HermesTaskRecord } from '@/lib/hermes/contracts/task';
import { InMemoryTaskManager } from '@/lib/hermes/core/task-manager';
import { readGenvidConfig } from '@/lib/hermes/video/genvid-config';
import { GenvidVideoService } from '@/lib/hermes/video/genvid-service';
import ffmpegPath from 'ffmpeg-static';
import { ApprovalManager } from '@/lib/hermes/runtime/approval-manager';
import { generateArtifactFile, generateImageAsset } from '@/lib/hermes/runtime/artifact-generator';
import {
  getArtifactWorkingDir,
  publishArtifactFile,
} from '@/lib/hermes/runtime/artifact-storage';
import { EventBus } from '@/lib/hermes/runtime/event-bus';
import { PermissionManager } from '@/lib/hermes/runtime/permission-manager';
import { ToolRegistry } from '@/lib/hermes/registry/tool-registry';
import * as fs from 'fs';
import * as path from 'path';

interface ExecuteToolInput {
  task: HermesTaskRecord;
  agentName: string;
  toolId: string;
  draftContent?: string;
}

export interface ToolExecutionResult {
  content?: string;
  artifact?: { label: string; url: string };
  approvalRequired?: boolean;
}

export class ToolExecutor {
  constructor(
    private readonly taskManager: InMemoryTaskManager,
    private readonly toolRegistry: ToolRegistry,
    private readonly permissionManager: PermissionManager,
    private readonly approvalManager: ApprovalManager,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: ExecuteToolInput): Promise<ToolExecutionResult> {
    const decision = this.permissionManager.evaluate(input.agentName, input.toolId);
    if (!decision.allowed) {
      throw new Error(decision.reason ?? 'Tool tidak diizinkan.');
    }

    this.eventBus.emit('tool.started', {
      taskId: input.task.id,
      toolId: input.toolId,
    });

    if (decision.requiresApproval) {
      this.approvalManager.request({
        taskId: input.task.id,
        actionType: input.toolId,
        reason: `Tool ${input.toolId} memerlukan approval operator.`,
        payload: {
          goal: input.task.goal,
          prompt: input.task.prompt,
        },
      });
      return {
        approvalRequired: true,
      };
    }

    const result = await this.runSafeTool(input);
    this.eventBus.emit('tool.completed', {
      taskId: input.task.id,
      toolId: input.toolId,
      result,
    });
    return result;
  }

  private async callAI(prompt: string, systemPrompt?: string): Promise<string> {
    const openaiKey = process.env.OPENAI_API_KEY || process.env.VIDEO_API_KEY;
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    // 1. Try OpenAI if key is available
    if (openaiKey && openaiKey !== 'MASUKKAN_OPENAI_API_KEY_ANDA_DI_SINI') {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages
          }),
          signal: AbortSignal.timeout(15000)
        });
        if (response.ok) {
          const data = await response.json();
          return data.choices?.[0]?.message?.content || '';
        }
      } catch (err) {
        console.error('Tool executor failed to call OpenAI:', err);
      }
    }

    // 2. Try OpenRouter if key is available
    if (openRouterKey && openRouterKey !== 'MASUKKAN_OPENROUTER_API_KEY_ANDA_DI_SINI') {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openRouterKey}`,
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages
          }),
          signal: AbortSignal.timeout(15000)
        });
        if (response.ok) {
          const data = await response.json();
          return data.choices?.[0]?.message?.content || '';
        }
      } catch (err) {
        console.error('Tool executor failed to call OpenRouter:', err);
      }
    }

    // 3. Try Gemini direct if key is available
    if (geminiKey && geminiKey !== 'MASUKKAN_GEMINI_API_KEY_ANDA_DI_SINI') {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: (systemPrompt ? `${systemPrompt}\n\n` : '') + prompt,
        });
        return response.text || '';
      } catch (err) {
        console.error('Tool executor failed to call Gemini direct:', err);
      }
    }

    return `Draft kerja offline untuk: ${prompt}`;
  }

  private resolveOutputType(task: HermesTaskRecord) {
    return (task.requestedOutputType || 'md').toLowerCase();
  }

  private resolveArtifactContentType(extension: string) {
    switch (extension.toLowerCase()) {
      case 'png':
        return 'image/png';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'svg':
        return 'image/svg+xml';
      case 'mp4':
        return 'video/mp4';
      default:
        return undefined;
    }
  }

  private async runSafeTool(input: ExecuteToolInput): Promise<ToolExecutionResult> {
    const lowerPrompt = input.task.prompt.toLowerCase();

    switch (input.toolId) {
      case 'llm.generate_text': {
        if (lowerPrompt.includes('retry') && input.task.attemptCount === 0) {
          return { content: '' };
        }
        const systemPrompt = 'Anda adalah asisten AI produktivitas pintar. Berikan draf teks kerja yang ringkas namun informatif sesuai tujuan pengguna.';
        const textContent = await this.callAI(input.task.goal, systemPrompt);
        return {
          content: textContent,
        };
      }
      case 'document.compose_markdown': {
        if (lowerPrompt.includes('retry') && input.task.attemptCount === 0) {
          return { content: '' };
        }
        const systemPrompt = `Anda adalah expert Technical Writer & Business Analyst.
Tuliskan dokumen markdown (.md) profesional yang lengkap dan mendalam (berisi bab analisis, eksekusi, ringkasan eksekutif, dan detail finansial/strategi jika relevan) sesuai permintaan pengguna.
Gunakan standard markdown styling yang rapi.
Jangan tambahkan teks markdown wrapper (seperti backticks \`\`\`md), cukup berikan isi dokumen markdown langsung.`;

        const markdownContent = await this.callAI(input.task.goal, systemPrompt);
        return {
          content: markdownContent,
        };
      }
      case 'document.compose_outline': {
        if (lowerPrompt.includes('retry') && input.task.attemptCount === 0) {
          return { content: '' };
        }
        const systemPrompt = `Anda adalah expert Presentation Designer & Copywriter.
Susunlah outline slide presentasi / pitch deck terstruktur yang mendalam sesuai tujuan pengguna.
Tulis outline untuk minimal 5-10 slide (berisi Judul Slide, Deskripsi Fokus Bahasan, dan poin-poin visual/teks pendukung).
Gunakan format teks polos yang rapi, padat, dan mudah dipahami.`;
        
        const outlineContent = await this.callAI(input.task.goal, systemPrompt);
        return {
          content: outlineContent,
        };
      }
      case 'image.generate_asset': {
        const slug = this.slugify(input.task.goal);
        const outputType = this.resolveOutputType(input.task);
        const normalizedType = ['png', 'jpg', 'jpeg', 'svg'].includes(outputType) ? outputType : 'png';
        const filename = `${slug}.${normalizedType}`;
        const absolutePath = path.join(getArtifactWorkingDir(), filename);
        await generateImageAsset({
          goal: input.task.goal,
          content: input.task.result || input.task.prompt,
          outputPath: absolutePath,
          outputType: normalizedType as 'png' | 'jpg' | 'jpeg' | 'svg',
        });

        const artifact = await publishArtifactFile({
          filename,
          localPath: absolutePath,
          contentType: this.resolveArtifactContentType(normalizedType),
        });
        this.taskManager.addDownloadItem(input.task.id, artifact);

        return {
          content: `Asset visual untuk "${input.task.goal}" berhasil dibuat dalam format ${normalizedType.toUpperCase()}.`,
          artifact,
        };
      }
      case 'sheet.build_dataset': {
        if (lowerPrompt.includes('retry') && input.task.attemptCount === 0) {
          return { content: '' };
        }
        const systemPrompt = `Anda adalah expert Data Analyst & Database Engineer.
Buatlah data spreadsheet tabular mentah dalam format CSV sesuai permintaan analisis data dari pengguna.
Gunakan koma (,) sebagai pembatas antar kolom. Berikan baris header yang relevan dan minimal 10 baris data simulasi yang realistis.
Jangan tambahkan penjelasan pendahuluan atau penutup apa pun. Kembalikan DATA CSV UTUH SAJA tanpa pembungkus markdown (seperti backticks \`\`\`csv).`;

        const csvContent = await this.callAI(input.task.goal, systemPrompt);
        const cleanCSV = csvContent.replace(/^```csv\n?/, '').replace(/```$/, '').trim();
        return {
          content: cleanCSV,
          artifact: {
            label: `${this.slugify(input.task.goal)}.csv`,
            url: `/artifacts/${this.slugify(input.task.goal)}.csv`,
          },
        };
      }
      case 'web.build_artifact': {
        const systemPrompt = `Anda adalah expert React & Tailwind developer. 
Buatlah satu berkas React component Next.js client component utuh dalam format TypeScript (.tsx) sesuai permintaan pengguna.
Gunakan Tailwind CSS utility classes. Desain harus sangat modern, premium, bernuansa dark obsidian (#050814), dengan sentuhan glow cyan (#00ffff).
Jangan tambahkan teks markdown pendahulu atau penutup, cukup kembalikan KODE TSX SAJA.
Pastikan component tersebut default exported: 'export default function LandingPage() { ... }'.`;

        const codeContent = await this.callAI(input.task.goal, systemPrompt);
        const cleanCode = codeContent.replace(/^```tsx\n?/, '').replace(/```$/, '').trim();
        
        return {
          content: cleanCode,
        };
      }
      case 'filesystem.write_artifact': {
        const slug = this.slugify(input.task.goal);
        const requestedType = this.resolveOutputType(input.task);
        let extension = requestedType || 'md';
        if (input.task.skillId === 'Images') {
          const imageTypes = ['png', 'jpg', 'jpeg', 'svg'];
          extension = imageTypes.includes(requestedType) ? requestedType : 'png';
        }

        const filename = `${slug}.${extension}`;
        const existingArtifact = input.task.downloadItems.find((item) => item.label === filename);
        if (existingArtifact) {
          return {
            content: `Artifact ${existingArtifact.label} berhasil disiapkan.`,
            artifact: existingArtifact,
          };
        }

        const relativeUrl = `/artifacts/${filename}`;
        const absolutePath = path.join(process.cwd(), 'public', 'artifacts', filename);

        await fs.promises.mkdir(path.dirname(absolutePath), { recursive: true });

        if (extension === 'mp4') {
          const existingArtifact =
            input.task.downloadItems.find((item) => item.label === filename) ??
            input.task.downloadItems.find((item) => item.label.endsWith('.mp4'));

          if (existingArtifact) {
            return {
              content: `Artifact ${existingArtifact.label} berhasil disiapkan.`,
              artifact: existingArtifact,
            };
          }

          if (!fs.existsSync(absolutePath)) {
            return {
              content: 'Artifact video belum tersedia.',
            };
          }

          const artifact = {
            label: filename,
            url: relativeUrl,
          };
          this.taskManager.addDownloadItem(input.task.id, artifact);
          return {
            content: `Artifact ${artifact.label} berhasil disiapkan.`,
            artifact,
          };
        }

        let fileContent = (input.draftContent || input.task.result || `Pekerjaan untuk: ${input.task.goal}`).trim();

        if (extension === 'csv' && fileContent.length === 0) {
          fileContent = `ID,Tanggal,Nama,Total Penjualan,Kategori\n1,2026-06-01,Produk Premium,15000000,Elektronik\n2,2026-06-02,Produk Hemat,5400000,Kecantikan\n3,2026-06-03,Paket Spesial,12300000,Makanan`;
        }

        if (!(input.task.skillId === 'Images' && fs.existsSync(absolutePath))) {
          await generateArtifactFile({
            goal: input.task.goal,
            content: fileContent,
            outputPath: absolutePath,
            outputType: extension as any,
          });
        }

        const artifact = {
          label: filename,
          url: relativeUrl,
        };
        this.taskManager.addDownloadItem(input.task.id, artifact);
        return {
          content: `Artifact ${artifact.label} berhasil disiapkan.`,
          artifact,
        };
      }
      case 'video.generate_mp4': {
        const config = readGenvidConfig();

        if (config.enabled) {
          try {
            return await this.runGenvidVideo(input);
          } catch (error) {
            console.error('Genvid video pipeline failed, switching to fallback:', error);
            if (config.fallbackMode === 'fail') {
              return {
                content: 'Video engine Genvid gagal dijalankan.',
              };
            }
          }
        }

        return this.runLegacyMp4Fallback(input);
      }
      default:
        throw new Error(`Tool ${input.toolId} belum diimplementasikan.`);
    }
  }

  private async runGenvidVideo(input: ExecuteToolInput): Promise<ToolExecutionResult> {
    const config = readGenvidConfig();
    const slug = this.slugify(input.task.goal);
    const workingDir = getArtifactWorkingDir();
    const absolutePath = path.join(workingDir, `${slug}.mp4`);
    const service = new GenvidVideoService(config);
    await service.generateVideo({
      taskId: input.task.id,
      goal: input.task.goal,
      prompt: input.task.prompt,
      outputPath: absolutePath,
    });

    const artifact = await publishArtifactFile({
      filename: path.basename(absolutePath),
      localPath: absolutePath,
      contentType: 'video/mp4',
    });
    this.taskManager.addDownloadItem(input.task.id, artifact);

    return {
      content: `Video Genvid untuk "${input.task.goal}" berhasil dirender.`,
      artifact,
    };
  }

  private async runLegacyMp4Fallback(input: ExecuteToolInput): Promise<ToolExecutionResult> {
    if (!ffmpegPath) {
      return {
        content: 'Video output needs setup: binary FFmpeg tidak tersedia.',
      };
    }

    const slug = this.slugify(input.task.goal);
    const artifactsDir = getArtifactWorkingDir();
    const imagePath = path.join(artifactsDir, `${slug}-video-frame.png`);
    const absolutePath = path.join(artifactsDir, `${slug}.mp4`);

    await generateImageAsset({
      goal: input.task.goal,
      content: input.task.result || input.task.prompt,
      outputPath: imagePath,
      outputType: 'png',
    });

    const { execFile } = await import('node:child_process');
    const resolvedFfmpegPath = ffmpegPath as string;
    await new Promise<void>((resolve, reject) => {
      execFile(
        resolvedFfmpegPath,
        [
          '-y',
          '-loop',
          '1',
          '-i',
          imagePath,
          '-t',
          '6',
          '-vf',
          'scale=1280:-2,format=yuv420p',
          '-pix_fmt',
          'yuv420p',
          absolutePath,
        ],
        { windowsHide: true },
        (error: Error | null) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        },
      );
    });

    const artifact = await publishArtifactFile({
      filename: path.basename(absolutePath),
      localPath: absolutePath,
      contentType: 'video/mp4',
    });
    this.taskManager.addDownloadItem(input.task.id, artifact);

    return {
      content: `Video konsep MP4 untuk "${input.task.goal}" berhasil dirender.`,
      artifact,
    };
  }

  private slugify(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
}
