import { NextResponse } from 'next/server';

import { getHermesRuntime } from '@/lib/hermes';
import { HermesControlService } from '@/lib/hermes/services/hermes-control-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const service = new HermesControlService(getHermesRuntime());
  const payload = await service.getControlState();
  return NextResponse.json(payload);
}
