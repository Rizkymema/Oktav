import { NextResponse } from 'next/server';

import { getHermesRuntime } from '@/lib/hermes';
import { HermesControlService } from '@/lib/hermes/services/hermes-control-service';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const service = new HermesControlService(getHermesRuntime());
    await service.handleAction({
      action: body.action,
      ...body,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Gagal menjalankan aksi control.',
      },
      { status: 400 },
    );
  }
}
