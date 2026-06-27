import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { HermesGenerationService } from '@/lib/hermes/services/hermes-generation-service';

export const runtime = 'nodejs';

// Helper to simulate typing effect for fallback texts
async function* simulateTyping(text: string) {
  const chunkSize = 4;
  for (let i = 0; i < text.length; i += chunkSize) {
    yield text.slice(i, i + chunkSize);
    await new Promise((resolve) => setTimeout(resolve, 15));
  }
}

export async function POST(request: Request) {
  try {
    const { prompt, model, outputType, selectedSkill } = await request.json();
    const generationService = new HermesGenerationService();
    const resolution = generationService.resolveModel({
      modelId: model,
      outputType,
      selectedSkill,
      prompt,
    });
    
    const selectedModel = resolution.model;
    const openaiKey = process.env.OPENAI_API_KEY || process.env.VIDEO_API_KEY;
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    let textStream: AsyncGenerator<string, void, unknown> | null = null;

    // 1. OpenAI Direct Streaming
    if (selectedModel?.source === 'openai-direct' && openaiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: selectedModel.upstreamModel,
            messages: [{ role: 'user', content: prompt }],
            stream: true,
          })
        });

        if (response.ok && response.body) {
          textStream = async function* () {
            const reader = response.body!.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';
              for (const line of lines) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                  try {
                    const data = JSON.parse(line.slice(6));
                    const content = data.choices?.[0]?.delta?.content;
                    if (content) yield content;
                  } catch (e) {
                    // ignore partial json
                  }
                }
              }
            }
          }();
        } else {
          console.error(`OpenAI stream failed:`, response.status);
        }
      } catch (e) {
        console.error('OpenAI stream error:', e);
      }
    }

    // 2. Gemini Direct Streaming
    if (!textStream && selectedModel?.source === 'google-direct' && geminiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const responseStream = await ai.models.generateContentStream({
          model: selectedModel.upstreamModel ?? 'gemini-2.5-flash',
          contents: prompt,
        });
        
        textStream = async function* () {
          for await (const chunk of responseStream) {
            if (chunk.text) yield chunk.text;
          }
        }();
      } catch (e) {
        console.error('Gemini stream error:', e);
      }
    }

    // 3. OpenRouter Streaming
    if (!textStream && openRouterKey && selectedModel) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openRouterKey}`,
            'HTTP-Referer': 'https://hermes-agent-workspace.vercel.app',
            'X-Title': 'Hermes AI Workspace',
          },
          body: JSON.stringify({
            model: selectedModel.source === 'openrouter' ? selectedModel.upstreamModel : selectedModel.id,
            messages: [{ role: 'user', content: prompt }],
            stream: true,
          })
        });
        
        if (response.ok && response.body) {
          textStream = async function* () {
            const reader = response.body!.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';
              for (const line of lines) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                  try {
                    const data = JSON.parse(line.slice(6));
                    const content = data.choices?.[0]?.delta?.content;
                    if (content) yield content;
                  } catch (e) {}
                }
              }
            }
          }();
        }
      } catch (e) {
        console.error('OpenRouter stream error:', e);
      }
    }

    // 4. Gemini Fallback Streaming
    if (!textStream && geminiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const responseStream = await ai.models.generateContentStream({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
        textStream = async function* () {
          for await (const chunk of responseStream) {
            if (chunk.text) yield chunk.text;
          }
        }();
      } catch (e) {
        console.error('Gemini fallback stream error:', e);
      }
    }

    // 5. Hardcoded Fallback Responses (Simulated Stream)
    if (!textStream) {
      const lower = prompt.toLowerCase().trim();
      let reply = `Halo! Saya adalah asisten virtual Hermes AI. Silakan tentukan salah satu format output di atas (Slides, Documents, Sheets, Websites, dll.) jika Anda ingin membuat berkas proyek.\n\n*(Catatan: Atur kunci API yang sesuai pada berkas \`.env.local\` Anda untuk mengaktifkan jawaban cerdas secara langsung)*.`;
      
      if (lower === 'halo' || lower === 'hai' || lower === 'hi' || lower === 'hello' || lower === 'test' || lower === 'tes') {
        reply = "Halo! Senang bertemu dengan Anda. Ada yang bisa saya bantu hari ini?\n\nJika Anda ingin saya membuat file proyek (seperti presentasi PPTX, proposal DOCX, spreadsheet Excel, atau kode Website), silakan pilih format output di menu atas terlebih dahulu.";
      } else if (lower.includes('siapa kamu') || lower.includes('siapa anda') || lower.includes('siapa namamu') || lower.includes('nama')) {
        reply = "Saya adalah Hermes AI Workspace, orkestrator asisten AI yang dirancang untuk membantu Anda memproses berkas riset, menulis proposal, analisis spreadsheet, dan membangun kode pemrograman web secara otomatis.";
      } else if (lower.includes('cara pakai') || lower.includes('cara menggunakan') || lower.includes('panduan') || lower.includes('bantuan')) {
        reply = "Berikut panduan singkat menggunakan Hermes Workspace:\n\n1. **Tanya Jawab Langsung**: Tulis pertanyaan umum Anda di kotak composer (seperti menyapa atau menanyakan info). Asisten akan menjawabnya langsung di gelembung chat ini.\n2. **Pengerjaan File & Proyek**: Pilih salah satu 'Skill Format Output' di bagian atas (misal: *Slides* atau *Websites*), lalu ketik perintah pembuatan (misal: *'Buat pitch deck e-commerce 10 slide'*). Sistem akan memproses tugas tersebut di sandbox runtime dengan visual log terminal pengerjaan.";
      } else if (lower.includes('terima kasih') || lower.includes('thanks') || lower.includes('thank you') || lower.includes('makasih')) {
        reply = "Sama-sama! Senang bisa membantu Anda. Jika ada hal lain yang perlu dikerjakan atau ditanyakan, langsung tulis saja di sini.";
      }

      textStream = simulateTyping(reply);
    }

    // Build the ReadableStream response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of textStream!) {
            controller.enqueue(new TextEncoder().encode(chunk));
          }
        } catch (e) {
          console.error('Streaming error:', e);
          controller.enqueue(new TextEncoder().encode('\n[Error: Stream terputus]'));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal menghasilkan jawaban.' },
      { status: 500 }
    );
  }
}
