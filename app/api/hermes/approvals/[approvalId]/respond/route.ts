import { NextResponse } from 'next/server';

import { getHermesRuntime } from '@/lib/hermes';
import { HermesTaskService } from '@/lib/hermes/services/hermes-task-service';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ approvalId: string }> },
) {
  try {
    const body = await request.json();
    const { approvalId } = await params;
    const runtime = getHermesRuntime();
    const approval = runtime.approvalManager.respond(approvalId, {
      status: body.status,
      reviewedBy: body.reviewedBy,
      responseNote: body.responseNote,
    });

    let task;
    if (approval.status === 'approved') {
      task = await new HermesTaskService(runtime).resume(approval.taskId);
    } else if (approval.status === 'rejected') {
      task = await new HermesTaskService(runtime).reject(
        approval.taskId,
        body.responseNote || 'Approval ditolak oleh operator.',
      );
    }

    return NextResponse.json({ approval, task });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Gagal memproses approval.',
      },
      { status: 400 },
    );
  }
}
