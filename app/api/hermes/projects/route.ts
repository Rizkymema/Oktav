import { NextResponse } from 'next/server';
import { StatePersistence } from '@/lib/hermes/runtime/state-persistence';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const projects = StatePersistence.loadProjects();
    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal memuat projects.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const newProject = await request.json();
    const projects = StatePersistence.loadProjects();
    
    // Add to projects list
    projects.unshift(newProject);
    StatePersistence.saveProjects(projects);
    
    return NextResponse.json(newProject);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal menyimpan project baru.' },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const projects = body.projects || body;
    
    if (!Array.isArray(projects)) {
      throw new Error('Format data projects harus berupa array.');
    }
    
    StatePersistence.saveProjects(projects);
    return NextResponse.json({ ok: true, count: projects.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal memutakhirkan projects.' },
      { status: 400 }
    );
  }
}
