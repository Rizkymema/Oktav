import { NextResponse } from 'next/server';
import { HermesGenerationService } from '@/lib/hermes/services/hermes-generation-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const service = new HermesGenerationService();
    return NextResponse.json({ models: service.listModels() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retrieve models.' },
      { status: 500 }
    );
  }
}
