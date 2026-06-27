import { NextResponse } from 'next/server';
import { StatePersistence } from '@/lib/hermes/runtime/state-persistence';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const notifications = StatePersistence.loadNotifications();
    return NextResponse.json(notifications);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal memuat notifications.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const notifications = body.notifications || body;
    
    if (!Array.isArray(notifications)) {
      throw new Error('Format data notifications harus berupa array.');
    }
    
    StatePersistence.saveNotifications(notifications);
    return NextResponse.json({ ok: true, count: notifications.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal menyimpan notifications.' },
      { status: 400 }
    );
  }
}
