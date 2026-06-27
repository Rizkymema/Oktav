import { NextResponse } from 'next/server';

import { getHermesRuntime } from '@/lib/hermes';
import { HermesOverviewService } from '@/lib/hermes/services/hermes-overview-service';
import { TelegramBotService } from '@/lib/hermes/services/telegram-bot';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  // Sync Telegram Bot state in background on overview requests to ensure it runs when the website is loaded
  TelegramBotService.getInstance().syncBotState().catch((err) => {
    console.error('[API Overview] Gagal sinkronisasi bot state pada GET:', err);
  });

  const service = new HermesOverviewService(getHermesRuntime());
  const overview = await service.getOverview();
  return NextResponse.json(overview);
}
