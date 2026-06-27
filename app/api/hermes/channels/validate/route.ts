import { NextResponse } from 'next/server';
import { TelegramBotService } from '@/lib/hermes/services/telegram-bot';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ ok: false, error: 'Token tidak boleh kosong.' }, { status: 400 });
    }
    
    const result = await TelegramBotService.getInstance().validateToken(token);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Gagal memvalidasi token.' },
      { status: 500 }
    );
  }
}
