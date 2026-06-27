import { NextResponse } from 'next/server';

import { getHermesRuntime } from '@/lib/hermes';
import { HermesTaskService } from '@/lib/hermes/services/hermes-task-service';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await params;
    const service = new HermesTaskService(getHermesRuntime());
    const task = await service.getTask(taskId);
    return NextResponse.json({ task });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Task tidak ditemukan.',
      },
      { status: 404 },
    );
  }
}
