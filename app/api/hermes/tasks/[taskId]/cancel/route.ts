import { NextResponse } from 'next/server';

import { getHermesRuntime } from '@/lib/hermes';
import { HermesTaskService } from '@/lib/hermes/services/hermes-task-service';

export const runtime = 'nodejs';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await params;
    const service = new HermesTaskService(getHermesRuntime());
    const task = await service.cancel(taskId);
    return NextResponse.json({ task });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Gagal membatalkan task.',
      },
      { status: 400 },
    );
  }
}
