import { NextResponse } from 'next/server';

import { getHermesRuntime } from '@/lib/hermes';
import { HermesTaskService } from '@/lib/hermes/services/hermes-task-service';
import { TaskRequestResolver } from '@/lib/hermes/services/task-request-resolver';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const runtime = getHermesRuntime();
    const resolver = new TaskRequestResolver(runtime);
    const resolvedTask = resolver.resolve({
      prompt: body.prompt,
      outputType: body.outputType,
      selectedSkill: body.selectedSkill,
    });
    const service = new HermesTaskService(runtime);
    const task = await service.submit({
      goal: resolvedTask.goal,
      prompt: resolvedTask.prompt,
      source: 'Workspace',
      category: resolvedTask.category,
      selectedSkill: resolvedTask.selectedSkill,
      outputType: resolvedTask.outputType,
      selectedModel: body.model,
      projectId: body.projectId,
    });

    return NextResponse.json({ task });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Gagal membuat task.',
      },
      { status: 400 },
    );
  }
}

export async function GET() {
  const tasks = getHermesRuntime().taskManager.listTasks();
  return NextResponse.json({ tasks });
}
