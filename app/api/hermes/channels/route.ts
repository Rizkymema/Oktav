import { NextResponse } from 'next/server';
import { StatePersistence } from '@/lib/hermes/runtime/state-persistence';
import { TelegramBotService } from '@/lib/hermes/services/telegram-bot';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const channels = StatePersistence.loadChannels();
    // Jalankan sinkronisasi bot secara asinkron agar tidak memblokir respon API
    TelegramBotService.getInstance().syncBotState().catch(err => {
      console.error('[API Channels] Gagal sinkronisasi bot state pada GET:', err);
    });
    return NextResponse.json(channels);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal memuat channels.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const channels = body.channels || body;
    
    if (!Array.isArray(channels)) {
      throw new Error('Format data channels harus berupa array.');
    }
    
    StatePersistence.saveChannels(channels);
    
    // Jalankan sinkronisasi bot setelah channels baru tersimpan
    TelegramBotService.getInstance().syncBotState().catch(err => {
      console.error('[API Channels] Gagal sinkronisasi bot state pada POST:', err);
    });
    
    return NextResponse.json({ ok: true, count: channels.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal menyimpan channels.' },
      { status: 400 }
    );
  }
}
