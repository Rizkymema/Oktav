import { NextResponse } from 'next/server';

import { getHermesRuntime } from '@/lib/hermes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    approvals: getHermesRuntime().approvalManager.listAll(),
  });
}
