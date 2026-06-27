import { StatePersistence } from '../runtime/state-persistence';
import { getHermesRuntime } from '../index';
import { HermesTaskService } from './hermes-task-service';
import { createArtifactRegistry } from '../artifacts/artifact-registry';
import { TaskRequestResolver } from './task-request-resolver';
import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs';
import path from 'node:path';

const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL || 'http://localhost:3000';

// Deklarasi global untuk singleton instance agar tidak ter-duplicate saat hot reload Next.js
declare global {
  var __telegramBotInstance: TelegramBotService | undefined;
}

export class TelegramBotService {
  private isPolling: boolean = false;
  private abortController: AbortController | null = null;
  private lastOffset: number = 0;
  private activeToken: string | null = null;
  
  // Mapping dari taskId ke detail pesan Telegram untuk update progress in-place
  private taskMessages = new Map<string, { chatId: number; messageId: number; lastProgress?: number }>();

  // Mapping dari chatId ke model AI terpilih
  private chatModels = new Map<number, string>();
  
  // Registry untuk mendeteksi tipe file dari prompt text secara otomatis
  private artifactRegistry = createArtifactRegistry();

  private unsubscribeFn: (() => void) | null = null;
  private subscribedEventBus: any = null;

  private subscribeToRuntime(runtime: any): void {
    if (this.unsubscribeFn) {
      try {
        this.unsubscribeFn();
      } catch (e) {}
    }
    
    this.subscribedEventBus = runtime.eventBus;
    this.unsubscribeFn = runtime.eventBus.subscribe('task.progress', (task: any) => {
      this.handleTaskUpdate(task).catch((err) => {
        console.error('[Telegram Bot] Gagal meng-update progress task:', err);
      });
    });
    console.log('[Telegram Bot] Berhasil berlangganan ke event bus runtime');
  }

  public static getInstance(): TelegramBotService {
    if (!globalThis.__telegramBotInstance) {
      globalThis.__telegramBotInstance = new TelegramBotService();
    } else {
      // Proteksi Hot Module Replacement (HMR) Next.js:
      // Jika kelas TelegramBotService didesain ulang/dikompilasi ulang (konstruktor berbeda),
      // matikan polling pada instance lama dan buat instance baru dengan kode ter-update.
      const oldInstance = globalThis.__telegramBotInstance;
      if (oldInstance.constructor !== TelegramBotService) {
        console.log('[Telegram Bot] Hot reload terdeteksi. Merefresh instance bot dengan kode baru...');
        try {
          oldInstance.stopPolling();
          if (oldInstance.unsubscribeFn) {
            oldInstance.unsubscribeFn();
          }
        } catch (e) {
          console.error('[Telegram Bot] Gagal mematikan polling/listener instance lama:', e);
        }
        const newInstance = new TelegramBotService();
        // Salin data pelacakan task aktif dan offset agar tidak terputus
        newInstance.taskMessages = oldInstance.taskMessages || new Map();
        newInstance.lastOffset = oldInstance.lastOffset || 0;
        newInstance.chatModels = oldInstance.chatModels || new Map();
        globalThis.__telegramBotInstance = newInstance;
      } else {
        // Cek apakah runtime eventBus telah berubah (HMR di index.ts)
        try {
          const currentRuntime = getHermesRuntime();
          if (oldInstance.subscribedEventBus !== currentRuntime.eventBus) {
            console.log('[Telegram Bot] EventBus runtime berubah. Mendaftarkan ulang event listener...');
            oldInstance.subscribeToRuntime(currentRuntime);
          }
        } catch (runtimeErr) {
          console.error('[Telegram Bot] Gagal sinkronisasi event bus runtime:', runtimeErr);
        }
      }
    }
    return globalThis.__telegramBotInstance;
  }

  private constructor() {
    // Berlangganan ke event progress dari Hermes Event Bus
    try {
      this.subscribeToRuntime(getHermesRuntime());
    } catch (e) {
      console.error('[Telegram Bot] Gagal inisialisasi listener event bus:', e);
    }
  }

  /**
   * Menyinkronkan status polling bot dengan konfigurasi channels saat ini
   */
  public async syncBotState(): Promise<void> {
    try {
      const channels = StatePersistence.loadChannels();
      const tgChannel = channels.find((c) => c.type === 'telegram');

      if (!tgChannel) {
        this.stopPolling();
        return;
      }

      const isConnected = tgChannel.status === 'connected';
      const token = tgChannel.token?.trim();

      if (!isConnected || !token) {
        if (this.isPolling) {
          console.log('[Telegram Bot] Stop polling karena status tidak terhubung atau token kosong.');
          this.stopPolling();
        }
        return;
      }

      // Jika token berubah atau belum mulai polling, mulai ulang
      if (this.activeToken !== token || !this.isPolling) {
        console.log('[Telegram Bot] Konfigurasi berubah/baru ditemukan. Memulai ulang polling...');
        this.stopPolling();
        this.activeToken = token;
        this.startPolling(token);
      }
    } catch (error) {
      console.error('[Telegram Bot] Gagal sinkronisasi bot state:', error);
    }
  }

  /**
   * Memvalidasi token bot ke API Telegram
   */
  public async validateToken(token: string): Promise<{ ok: boolean; botName?: string; username?: string; error?: string }> {
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      if (!response.ok) {
        const errorData = await response.json();
        return { ok: false, error: errorData.description || 'Token tidak valid' };
      }
      const data = await response.json();
      if (data.ok && data.result) {
        return {
          ok: true,
          botName: data.result.first_name,
          username: `@${data.result.username}`,
        };
      }
      return { ok: false, error: 'Respons Telegram tidak valid' };
    } catch (e: any) {
      return { ok: false, error: e.message || 'Gagal menghubungi server Telegram' };
    }
  }

  /**
   * Memulai proses long polling Telegram
   */
  private startPolling(token: string): void {
    if (this.isPolling) return;

    this.isPolling = true;
    this.abortController = new AbortController();

    // Jalankan polling dalam background promise
    (async () => {
      console.log('[Telegram Bot] Memulai long polling...');
      
      // Bersihkan antrean pesan lama saat startup agar tidak memproses ulang pesan mati
      try {
        const clearRes = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=-1&limit=1`, {
          signal: this.abortController?.signal
        });
        if (clearRes.ok) {
          const clearData = await clearRes.json();
          if (clearData.ok && clearData.result.length > 0) {
            this.lastOffset = clearData.result[0].update_id + 1;
            console.log(`[Telegram Bot] Antrean lama dibersihkan. Memulai offset baru: ${this.lastOffset}`);
          }
        }
      } catch (err) {
        console.error('[Telegram Bot] Gagal membersihkan antrean startup:', err);
      }

      while (this.isPolling) {
        try {
          const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${this.lastOffset}&timeout=20`;
          const response = await fetch(url, {
            signal: this.abortController?.signal,
          });

          if (!response.ok) {
            console.error(`[Telegram Bot] Error polling status: ${response.status}`);
            await new Promise((r) => setTimeout(r, 5000));
            continue;
          }

          const data = await response.json();
          if (data.ok && Array.isArray(data.result)) {
            for (const update of data.result) {
              this.lastOffset = Math.max(this.lastOffset, update.update_id + 1);
              if (update.message) {
                this.handleIncomingMessage(token, update.message).catch((e) => {
                  console.error('[Telegram Bot] Gagal memproses pesan:', e);
                });
              } else if (update.callback_query) {
                this.handleCallbackQuery(token, update.callback_query).catch((e) => {
                  console.error('[Telegram Bot] Gagal memproses callback query:', e);
                });
              }
            }
          }
        } catch (error: any) {
          if (error.name === 'AbortError') {
            console.log('[Telegram Bot] Polling dihentikan (AbortError).');
            break;
          }
          console.error('[Telegram Bot] Error polling loop:', error);
          await new Promise((r) => setTimeout(r, 5000));
        }
      }
    })();
  }

  /**
   * Menghentikan proses polling
   */
  private stopPolling(): void {
    this.isPolling = false;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.activeToken = null;
  }

  /**
   * Memproses pesan masuk dari Telegram
   */
  private async handleIncomingMessage(token: string, message: any): Promise<void> {
    const chatId = message.chat.id;
    const text = message.text?.trim();

    if (!text) return;

    // Send typing action to Telegram
    this.sendChatAction(token, chatId, 'typing').catch(() => {});

    const activeModelId = this.chatModels?.get?.(chatId) ?? 'auto';

    // 1. Tangani perintah pembuka
    if (text.startsWith('/start') || text.startsWith('/help')) {
      const providerConfig = {
        openRouterApiKey: process.env.OPENROUTER_API_KEY,
        openAiApiKey: process.env.OPENAI_API_KEY || process.env.VIDEO_API_KEY,
        geminiApiKey: process.env.GEMINI_API_KEY,
        googleApiKey: process.env.GOOGLE_API_KEY,
      };
      const modelRegistry = require('../models/model-registry').createModelRegistry(providerConfig);
      const availableModels = modelRegistry.listForUi();
      const activeModel = availableModels.find((m: any) => m.id === activeModelId);
      const activeModelName = activeModel ? activeModel.name : activeModelId;

      const helpMsg = `Selamat datang di *Hermes AI Assistant!* 🤖\n\nHubungkan Telegram ini dengan workspace lokal Anda untuk memicu pengerjaan tugas secara otonom dari mana saja.\n\n⚙️ *Model Aktif:* \`${activeModelName}\`\n\n💡 *Daftar Perintah (Slash Commands):*\n• \`/slides <topik>\` - Membuat presentasi Slide (.pptx)\n• \`/docx <topik>\` - Membuat dokumen proposal/laporan (.docx)\n• \`/xlsx <topik>\` - Membuat analisis Excel (.xlsx)\n• \`/web <topik>\` - Membuat website frontend (.html)\n• \`/img <deskripsi>\` - Menghasilkan gambar ilustrasi (.png)\n• \`/video <deskripsi>\` - Menghasilkan video promosi pendek (.mp4)\n• \`/chat <pesan>\` - Obrolan tanya jawab langsung dengan AI\n• \`/model\` - Pilih model AI yang digunakan\n\n*Atau ketik secara alami, contoh:*\n_"Buatkan slide presentasi tentang profil startup kesehatan 5 slide"_\nSistem otomatis mendeteksi skill format yang sesuai!`;
      const keyboard = this.getModelKeyboard(availableModels, activeModelId);
      await this.sendMessage(token, chatId, helpMsg, keyboard);
      return;
    }

    if (text.startsWith('/model') || text.startsWith('/models')) {
      const providerConfig = {
        openRouterApiKey: process.env.OPENROUTER_API_KEY,
        openAiApiKey: process.env.OPENAI_API_KEY || process.env.VIDEO_API_KEY,
        geminiApiKey: process.env.GEMINI_API_KEY,
        googleApiKey: process.env.GOOGLE_API_KEY,
      };
      const modelRegistry = require('../models/model-registry').createModelRegistry(providerConfig);
      const availableModels = modelRegistry.listForUi();
      const activeModel = availableModels.find((m: any) => m.id === activeModelId);
      const activeModelName = activeModel ? activeModel.name : activeModelId;

      const modelMsg = `🤖 *[Hermes AI]* Pilih Model AI\n\nModel aktif saat ini: *${activeModelName}*\n\nSilakan pilih model di bawah ini untuk digunakan pada chat dan pengerjaan tugas berikutnya:`;
      const keyboard = this.getModelKeyboard(availableModels, activeModelId);
      await this.sendMessage(token, chatId, modelMsg, keyboard);
      return;
    }

    // 2. Cek apakah pesan diawali dengan perintah eksplisit (Slash Commands)
    let explicitSkill: string | undefined = undefined;
    let explicitPrompt: string = text;

    if (text.startsWith('/slides ')) {
      explicitSkill = 'Slides';
      explicitPrompt = text.slice(8).trim();
    } else if (text.startsWith('/docx ') || text.startsWith('/document ')) {
      explicitSkill = 'Documents';
      explicitPrompt = text.startsWith('/docx ') ? text.slice(6).trim() : text.slice(10).trim();
    } else if (text.startsWith('/xlsx ') || text.startsWith('/sheets ')) {
      explicitSkill = 'Sheets';
      explicitPrompt = text.startsWith('/xlsx ') ? text.slice(6).trim() : text.slice(8).trim();
    } else if (text.startsWith('/web ') || text.startsWith('/website ')) {
      explicitSkill = 'Websites';
      explicitPrompt = text.startsWith('/web ') ? text.slice(5).trim() : text.slice(9).trim();
    } else if (text.startsWith('/img ') || text.startsWith('/image ')) {
      explicitSkill = 'Images';
      explicitPrompt = text.startsWith('/img ') ? text.slice(5).trim() : text.slice(7).trim();
    } else if (text.startsWith('/video ') || text.startsWith('/videos ')) {
      explicitSkill = 'Videos';
      explicitPrompt = text.startsWith('/video ') ? text.slice(7).trim() : text.slice(8).trim();
    } else if (text.startsWith('/chat ')) {
      const chatPrompt = text.slice(6).trim();
      const reply = await this.generateChatResponse(chatId, chatPrompt);
      await this.sendMessage(token, chatId, reply);
      return;
    }

    // 3. Klasifikasi pesan (Eksplisit atau Natural Language matching)
    let isTask = explicitSkill !== undefined;
    let selectedSkill = explicitSkill;
    let finalPrompt = explicitPrompt;

    if (!isTask) {
      // Deteksi otomatis menggunakan aturan regex dari ArtifactRegistry
      const resolvedArtifact = this.artifactRegistry.resolve({
        prompt: text,
      });

      // Jika mencocokkan pola generator, tandai sebagai tugas
      const matchesTaskPatterns = /\b(buat|bikin|generate|buatkan|tulis|rancang|create|make)\b/i.test(text);
      if (matchesTaskPatterns && resolvedArtifact && resolvedArtifact.defaultSkill) {
        isTask = true;
        selectedSkill = resolvedArtifact.defaultSkill;
        finalPrompt = text;
      }
    }

    // 4. Jalankan sebagai Task atau Chat
    if (isTask && selectedSkill) {
      try {
        // Kirim status awal ke Telegram
        const initialStatus = `🤖 *[Hermes AI]* Memulai pengerjaan tugas...\n📂 *Tugas:* "${finalPrompt}"\n⚙️ *Status:* \`PLANNING\`\n⏳ Harap tunggu, asisten otonom sedang merumuskan rencana eksekusi...`;
        const statusMsg = await this.sendMessage(token, chatId, initialStatus);
        
        if (!statusMsg || !statusMsg.message_id) {
          throw new Error('Gagal mengirim pesan status ke Telegram');
        }

        // Generate task ID beforehand to set the mapping before submit execution (avoids race condition)
        const taskId = require('node:crypto').randomUUID();

        // Simpan pemetaan ID task dengan pesan Telegram SEBELUM disubmit
        this.taskMessages.set(taskId, {
          chatId,
          messageId: statusMsg.message_id,
          lastProgress: 0,
        });

        // Jalankan task di Hermes Orchestrator
        const runtime = getHermesRuntime();
        const resolver = new TaskRequestResolver(runtime);
        const resolvedTask = resolver.resolve({
          prompt: selectedSkill ? `[Skill: ${selectedSkill}] ${finalPrompt}` : finalPrompt,
          selectedSkill,
        });
        const taskService = new HermesTaskService(runtime);
        
        const task = await taskService.submit({
          id: taskId,
          goal: resolvedTask.goal,
          prompt: resolvedTask.prompt,
          source: `telegram:${chatId}`,
          category: resolvedTask.category,
          selectedSkill: resolvedTask.selectedSkill,
          outputType: resolvedTask.outputType,
          selectedModel: activeModelId,
        });

        console.log(`[Telegram Bot] Sukses men-submit task ${task.id} dari chatId ${chatId}`);
      } catch (err: any) {
        console.error('[Telegram Bot] Gagal memicu pengerjaan task:', err);
        await this.sendMessage(token, chatId, `❌ *Gagal memicu tugas:* ${err.message || err}`);
      }
    } else {
      // Masuk ke mode tanya-jawab santai (Chatbot)
      const reply = await this.generateChatResponse(chatId, text);
      await this.sendMessage(token, chatId, reply);
    }
  }

  /**
   * Menangani pembaruan progress tugas dari Event Bus
   */
  private async handleTaskUpdate(task: any): Promise<void> {
    if (!task || !task.source || !task.source.startsWith('telegram:')) {
      return;
    }

    const taskId = task.id;
    const mapping = this.taskMessages.get(taskId);
    if (!mapping) return;

    const token = this.activeToken;
    if (!token) return;

    const { chatId, messageId, lastProgress } = mapping;

    // Untuk menghindari spam getUpdates / editMessage berlebih di Telegram,
    // batasi pembaruan pesan jika progressnya tidak berubah signifikan, kecuali jika status berubah
    if (lastProgress === task.progress && task.status !== 'completed' && task.status !== 'failed' && task.status !== 'waiting_approval') {
      return;
    }

    mapping.lastProgress = task.progress;
    this.taskMessages.set(taskId, mapping);

    // Kirim feedback mengetik/mengunggah file sesuai status
    if (task.status === 'completed') {
      this.sendChatAction(token, chatId, 'upload_document').catch(() => {});
    } else {
      this.sendChatAction(token, chatId, 'typing').catch(() => {});
    }

    // Format progress bar visual
    const progressBar = this.getProgressBar(task.progress);

    if (task.status === 'completed') {
      // 1. Edit pesan status menjadi Selesai
      const duration = task.durationSeconds ? `${task.durationSeconds} detik` : 'beberapa saat';
      const projectUrl = `${APP_BASE_URL}/workspace/projects/prj-${task.id}`;
      
      let downloadLinksText = '';
      if (task.downloadItems && task.downloadItems.length > 0) {
        downloadLinksText = `\n` + task.downloadItems.map((item: any) => `• [Unduh ${item.label} (Web)](${APP_BASE_URL}/artifacts/${item.label})`).join('\n');
      }

      const completeText = `✅ *[Hermes AI]* Tugas Selesai!\n📂 *Tugas:* "${task.goal}"\n⏱️ *Durasi:* \`${duration}\`\n📊 *Progress:* ${progressBar} 100%\n\n💻 *Akses Web:*\n• [Buka Proyek di Dasbor Web](${projectUrl})${downloadLinksText}\n\n💾 *Mengirim berkas langsung ke Telegram Anda...*`;
      await this.editMessage(token, chatId, messageId, completeText);

      // 2. Unggah file yang berhasil dibuat ke Telegram
      if (task.downloadItems && task.downloadItems.length > 0) {
        for (const item of task.downloadItems) {
          const artifactsDir = 'd:/Project Apk-Web/AI ASSISTENT/public/artifacts';
          const filePath = path.join(artifactsDir, item.label);
          
          if (fs.existsSync(filePath)) {
            console.log(`[Telegram Bot] Mengirim file ${item.label} (${filePath}) ke Telegram`);
            if (item.label.toLowerCase().endsWith('.mp4')) {
              await this.sendVideo(token, chatId, filePath, item.label, `Berikut berkas hasil pengerjaan untuk tugas: *"${task.goal}"*`);
            } else {
              await this.sendDocument(token, chatId, filePath, item.label, `Berikut berkas hasil pengerjaan untuk tugas: *"${task.goal}"*`);
            }
          } else {
            console.warn(`[Telegram Bot] Berkas ${filePath} tidak ditemukan di disk.`);
            await this.sendMessage(token, chatId, `⚠️ Berkas hasil *${item.label}* berhasil dibuat namun tidak dapat ditemukan di folder public server.`);
          }
        }
      } else {
        await this.sendMessage(token, chatId, `📝 Hasil pengerjaan:\n\n${task.result || 'Tugas selesai dikerjakan otonom.'}`);
      }

      // Hapus dari map pemantauan
      this.taskMessages.delete(taskId);
    } else if (task.status === 'failed') {
      // Edit pesan status menjadi Gagal
      const errorMsg = task.error || task.summary || 'Detail kesalahan tidak diketahui.';
      const failText = `❌ *[Hermes AI]* Tugas Gagal!\n📂 *Tugas:* "${task.goal}"\n📊 *Progress:* ${progressBar} ${task.progress}%\n\n⚠️ *Kesalahan:* _${errorMsg}_`;
      await this.editMessage(token, chatId, messageId, failText);

      this.taskMessages.delete(taskId);
    } else if (task.status === 'waiting_approval') {
      // Edit pesan status menunggu persetujuan
      const approvalText = `⚠️ *[Hermes AI]* Tugas memerlukan persetujuan Anda!\n📂 *Tugas:* "${task.goal}"\n📊 *Progress:* ${progressBar} ${task.progress}%\n\n📝 *Deskripsi:* Tugas memerlukan otorisasi eksekusi tindakan berisiko. Silakan masuk ke panel Control Room di website untuk menyetujui.`;
      await this.editMessage(token, chatId, messageId, approvalText);
    } else {
      // Edit status progress reguler
      const progressText = `🤖 *[Hermes AI]* Sedang memproses tugas...\n📂 *Tugas:* "${task.goal}"\n⚙️ *Status:* \`${task.status.toUpperCase()}\` (Fase: \`${task.phase}\`)\n📊 *Progress:* ${progressBar} ${task.progress}%\n\n📝 *Log:* _"${task.summary}"_`;
      await this.editMessage(token, chatId, messageId, progressText);
    }
  }

  /**
   * Membuat visual progress bar [████░░░░░░]
   */
  private getProgressBar(progress: number): string {
    const totalBlocks = 10;
    const filledBlocks = Math.round((Math.max(0, Math.min(100, progress)) / 100) * totalBlocks);
    const emptyBlocks = totalBlocks - filledBlocks;
    return '`[' + '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks) + ']`';
  }

  /**
   * Menghasilkan jawaban obrolan menggunakan LLM atau fallback lokal
   */
  private async generateChatResponse(chatId: number, prompt: string): Promise<string> {
    const openaiKey = process.env.OPENAI_API_KEY || process.env.VIDEO_API_KEY;
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    const activeModelId = this.chatModels?.get?.(chatId) ?? 'auto';

    try {
      const providerConfig = {
        openRouterApiKey: openRouterKey,
        openAiApiKey: openaiKey,
        geminiApiKey: geminiKey,
        googleApiKey: geminiKey,
      };
      const modelRegistry = require('../models/model-registry').createModelRegistry(providerConfig);
      const resolvedModel = modelRegistry.resolveModel({ requestedModelId: activeModelId, capability: 'chat' });

      if (resolvedModel) {
        // 1. Google Gemini Direct Call
        if (resolvedModel.source === 'google-direct' && geminiKey && geminiKey !== 'MASUKKAN_GEMINI_API_KEY_ANDA_DI_SINI') {
          const ai = new GoogleGenAI({ apiKey: geminiKey });
          const response = await ai.models.generateContent({
            model: resolvedModel.upstreamModel,
            contents: prompt,
          });
          if (response.text) return response.text;
        }

        // 2. OpenAI Direct Call
        if (resolvedModel.source === 'openai-direct' && openaiKey && openaiKey !== 'MASUKKAN_OPENAI_API_KEY_ANDA_DI_SINI') {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openaiKey}`,
            },
            body: JSON.stringify({
              model: resolvedModel.upstreamModel,
              messages: [{ role: 'user', content: prompt }]
            })
          });
          if (response.ok) {
            const data = await response.json();
            const reply = data.choices?.[0]?.message?.content;
            if (reply) return reply;
          }
        }

        // 3. OpenRouter Call
        if (resolvedModel.source === 'openrouter' && openRouterKey && openRouterKey !== 'MASUKKAN_OPENROUTER_API_KEY_DI_SINI') {
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openRouterKey}`,
              'HTTP-Referer': 'https://hermes-agent-workspace.vercel.app',
              'X-Title': 'Hermes AI Telegram Bot',
            },
            body: JSON.stringify({
              model: resolvedModel.upstreamModel,
              messages: [{ role: 'user', content: prompt }]
            })
          });
          if (response.ok) {
            const data = await response.json();
            const reply = data.choices?.[0]?.message?.content;
            if (reply) return reply;
          }
        }
      }
    } catch (err) {
      console.error('[Telegram Bot] Gagal memanggil model terpilih:', err);
    }

    // Default Fallbacks jika provider terpilih gagal atau model = auto
    // 1. Google Gemini Direct Call Fallback
    if (geminiKey && geminiKey !== 'MASUKKAN_GEMINI_API_KEY_ANDA_DI_SINI') {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
        if (response.text) return response.text;
      } catch (e) {
        console.error('[Telegram Bot] Gagal direct Gemini API fallback:', e);
      }
    }

    // 2. OpenRouter API Call Fallback
    if (openRouterKey && openRouterKey !== 'MASUKKAN_OPENROUTER_API_KEY_DI_SINI') {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openRouterKey}`,
            'HTTP-Referer': 'https://hermes-agent-workspace.vercel.app',
            'X-Title': 'Hermes AI Telegram Bot',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [{ role: 'user', content: prompt }]
          })
        });
        if (response.ok) {
          const data = await response.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) return reply;
        }
      } catch (e) {
        console.error('[Telegram Bot] Gagal OpenRouter API fallback:', e);
      }
    }

    // 3. Fallback Obrolan Lokal (Offline Mode)
    const lower = prompt.toLowerCase().trim();
    if (lower === 'halo' || lower === 'hai' || lower === 'hi' || lower === 'hello' || lower === 'test' || lower === 'tes') {
      return "Halo! Ada yang bisa saya bantu hari ini?\n\nJika Anda ingin saya membuat berkas proyek (seperti PPTX, Word DOCX, Excel Spreadsheet, atau Website), silakan gunakan perintah slash, contoh: `/slides Pitch Deck Startup` atau `/web Halaman Landing Page`.";
    } else if (lower.includes('siapa kamu') || lower.includes('siapa anda') || lower.includes('nama')) {
      return "Saya adalah Hermes AI Workspace Bot, orkestrator asisten AI yang dapat membantu Anda memproses riset, menyusun presentasi, dan memprogram kode web secara otomatis langsung dari Telegram.";
    } else if (lower.includes('cara pakai') || lower.includes('cara menggunakan') || lower.includes('bantuan')) {
      return "Gunakan perintah berikut:\n\n1. `/slides <topik>` - Membuat slide PPTX\n2. `/docx <topik>` - Membuat dokumen Word\n3. `/xlsx <topik>` - Membuat sheet Excel\n4. `/web <topik>` - Membuat website HTML\n5. `/img <deskripsi>` - Membuat gambar PNG\n\nAnda juga dapat menulis permintaan langsung seperti: _\"Bikin slide bisnis kopi\"_";
    }

    return `Halo! Saya menerima pesan Anda: "${prompt}".\n\nUntuk mengobrol cerdas secara penuh, pastikan Anda telah memasukkan kunci API \`GEMINI_API_KEY\` atau \`OPENROUTER_API_KEY\` pada berkas \`.env.local\` proyek Anda.`;
  }

  // ==========================================
  // TELEGRAM BOT API RAW UTILITIES
  // ==========================================

  private async sendMessage(token: string, chatId: number, text: string, replyMarkup?: any): Promise<any> {
    try {
      const body: any = {
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
      };
      if (replyMarkup) {
        body.reply_markup = replyMarkup;
      }
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!data.ok) {
        console.error('[Telegram API Error] Gagal kirim pesan:', data.description || data);
      }
      return data.ok ? data.result : null;
    } catch (e) {
      console.error('[Telegram API] Gagal kirim pesan:', e);
      return null;
    }
  }

  private async editMessage(token: string, chatId: number, messageId: number, text: string, replyMarkup?: any): Promise<any> {
    try {
      const body: any = {
        chat_id: chatId,
        message_id: messageId,
        text: text,
        parse_mode: 'Markdown',
      };
      if (replyMarkup) {
        body.reply_markup = replyMarkup;
      }
      const response = await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!data.ok) {
        console.error('[Telegram API Error] Gagal edit pesan:', data.description || data);
      }
      return data.ok ? data.result : null;
    } catch (e) {
      console.error('[Telegram API] Gagal edit pesan:', e);
      return null;
    }
  }

  private async sendDocument(token: string, chatId: number, filePath: string, filename: string, caption?: string): Promise<any> {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const blob = new Blob([fileBuffer]);
      const formData = new FormData();
      formData.append('chat_id', chatId.toString());
      formData.append('document', blob, filename);
      if (caption) {
        formData.append('caption', caption);
        formData.append('parse_mode', 'Markdown');
      }

      const response = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!data.ok) {
        console.error('[Telegram API Error] Gagal kirim berkas:', data.description || data);
      }
      return data.ok ? data.result : null;
    } catch (e) {
      console.error('[Telegram API] Gagal kirim berkas:', e);
      return null;
    }
  }

  private async sendVideo(token: string, chatId: number, filePath: string, filename: string, caption?: string): Promise<any> {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const blob = new Blob([fileBuffer]);
      const formData = new FormData();
      formData.append('chat_id', chatId.toString());
      formData.append('video', blob, filename);
      if (caption) {
        formData.append('caption', caption);
        formData.append('parse_mode', 'Markdown');
      }

      const response = await fetch(`https://api.telegram.org/bot${token}/sendVideo`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!data.ok) {
        console.error('[Telegram API Error] Gagal kirim video:', data.description || data);
      }
      return data.ok ? data.result : null;
    } catch (e) {
      console.error('[Telegram API] Gagal kirim video:', e);
      return null;
    }
  }

  private async sendChatAction(token: string, chatId: number, action: 'typing' | 'upload_document'): Promise<any> {
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          action: action,
        }),
      });
    } catch (e) {}
  }

  /**
   * Menghasilkan layout keyboard inline untuk pemilihan model
   */
  private getModelKeyboard(availableModels: any[], activeModelId: string): any {
    const keyboardRows = [];
    for (let i = 0; i < availableModels.length; i += 2) {
      const row = [];
      const m1 = availableModels[i];
      const isM1Active = m1.id === activeModelId;
      row.push({
        text: `${isM1Active ? '✅ ' : ''}${m1.name}`,
        callback_data: `setmodel:${m1.id}`,
      });

      if (i + 1 < availableModels.length) {
        const m2 = availableModels[i + 1];
        const isM2Active = m2.id === activeModelId;
        row.push({
          text: `${isM2Active ? '✅ ' : ''}${m2.name}`,
          callback_data: `setmodel:${m2.id}`,
        });
      }
      keyboardRows.push(row);
    }
    return { inline_keyboard: keyboardRows };
  }

  /**
   * Menjawab callback query Telegram (menghilangkan loading state tombol)
   */
  private async answerCallbackQuery(token: string, callbackQueryId: string, text?: string, showAlert: boolean = false): Promise<any> {
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text: text,
          show_alert: showAlert,
        }),
      });
      const data = await response.json();
      return data.ok ? data.result : null;
    } catch (e) {
      console.error('[Telegram API] Gagal menjawab callback query:', e);
      return null;
    }
  }

  /**
   * Memproses callback query dari inline keyboard Telegram
   */
  private async handleCallbackQuery(token: string, callbackQuery: any): Promise<void> {
    const callbackQueryId = callbackQuery.id;
    const message = callbackQuery.message;
    const data = callbackQuery.data;
    const chatId = message.chat.id;
    const messageId = message.message_id;

    if (!data) return;

    if (data.startsWith('setmodel:')) {
      const modelId = data.slice(9);
      
      // Simpan model pilihan user
      if (!this.chatModels) {
        this.chatModels = new Map();
      }
      this.chatModels.set(chatId, modelId);
      
      // Ambil nama model untuk tampilan
      const providerConfig = {
        openRouterApiKey: process.env.OPENROUTER_API_KEY,
        openAiApiKey: process.env.OPENAI_API_KEY || process.env.VIDEO_API_KEY,
        geminiApiKey: process.env.GEMINI_API_KEY,
        googleApiKey: process.env.GOOGLE_API_KEY,
      };
      const modelRegistry = require('../models/model-registry').createModelRegistry(providerConfig);
      const availableModels = modelRegistry.listForUi();
      const selectedModel = availableModels.find((m: any) => m.id === modelId);
      const modelName = selectedModel ? selectedModel.name : modelId;

      // Jawab callback query untuk memunculkan notifikasi toast di aplikasi Telegram
      await this.answerCallbackQuery(token, callbackQueryId, `Model aktif diubah ke ${modelName}`);

      // Edit pesan awal untuk menunjukkan model aktif terbaru
      const helpMsg = `🤖 *[Hermes AI]* Pilih Model AI\n\nModel aktif saat ini: *${modelName}*\n\nSilakan pilih model di bawah ini untuk digunakan pada chat dan pengerjaan tugas berikutnya:`;
      const keyboard = this.getModelKeyboard(availableModels, modelId);

      await this.editMessage(token, chatId, messageId, helpMsg, keyboard);
    }
  }
}
