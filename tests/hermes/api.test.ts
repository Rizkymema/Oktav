import { describe, expect, test } from 'vitest';

import { POST as respondApproval } from '@/app/api/hermes/approvals/[approvalId]/respond/route';
import { POST as postControlAction } from '@/app/api/hermes/control/action/route';
import { GET as listApprovals } from '@/app/api/hermes/approvals/route';
import { GET as getControl } from '@/app/api/hermes/control/route';
import { GET as getModels } from '@/app/api/hermes/models/route';
import { GET as getOverview } from '@/app/api/hermes/overview/route';
import { POST as postTask } from '@/app/api/hermes/tasks/route';

describe('Hermes API routes', () => {
  test('returns overview payload from route handler', async () => {
    const response = await getOverview();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.runtime.model).toBe('Hermes Hybrid Core');
  });

  test('creates task from task route handler', async () => {
    const response = await postTask(
      new Request('http://localhost/api/hermes/tasks', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Buat proposal bisnis untuk klinik AI',
          agent_name: 'Document Agent',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.task.id).toBeTruthy();
  });

  test('returns control payload from route handler', async () => {
    const response = await getControl();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.tools.length).toBeGreaterThan(0);
    expect(body.skills.length).toBeGreaterThan(0);
  });

  test('returns registry-backed model payload from route handler', async () => {
    const response = await getModels();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(body.models)).toBe(true);
    expect(body.models[0]?.id).toBe('auto');
    expect(body.models[0]?.capabilities).toContain('chat');
  });

  test('approval response route resumes waiting task when approved', async () => {
    const createResponse = await postTask(
      new Request('http://localhost/api/hermes/tasks', {
        method: 'POST',
        body: JSON.stringify({
          prompt: '[Skill: Websites] Hapus file environment produksi sekarang juga',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    );

    const createBody = await createResponse.json();
    const taskId = createBody.task.id as string;

    const approvalsResponse = await listApprovals();
    const approvalsBody = await approvalsResponse.json();
    const approvalId = approvalsBody.approvals.find((approval: { taskId: string }) => approval.taskId === taskId)?.id as string;

    const response = await respondApproval(
      new Request(`http://localhost/api/hermes/approvals/${approvalId}/respond`, {
        method: 'POST',
        body: JSON.stringify({
          status: 'approved',
          reviewedBy: 'operator',
          responseNote: 'Lanjutkan',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      { params: Promise.resolve({ approvalId }) },
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.task.id).toBe(taskId);
    expect(body.task.status).toBe('completed');
  });

  test('approval response route marks task failed when approval is rejected', async () => {
    const createResponse = await postTask(
      new Request('http://localhost/api/hermes/tasks', {
        method: 'POST',
        body: JSON.stringify({
          prompt: '[Skill: Websites] Hapus file environment produksi sekarang juga',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    );

    const createBody = await createResponse.json();
    const taskId = createBody.task.id as string;

    const approvalsResponse = await listApprovals();
    const approvalsBody = await approvalsResponse.json();
    const approvalId = approvalsBody.approvals.find((approval: { taskId: string }) => approval.taskId === taskId)?.id as string;

    const response = await respondApproval(
      new Request(`http://localhost/api/hermes/approvals/${approvalId}/respond`, {
        method: 'POST',
        body: JSON.stringify({
          status: 'rejected',
          reviewedBy: 'operator',
          responseNote: 'Aksi terlalu berisiko',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      { params: Promise.resolve({ approvalId }) },
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.task.id).toBe(taskId);
    expect(body.task.status).toBe('failed');
    expect(body.task.approvalState).toBe('rejected');
  });

  test('task route accepts installed reference skills from runtime registry', async () => {
    const installResponse = await postControlAction(
      new Request('http://localhost/api/hermes/control/action', {
        method: 'POST',
        body: JSON.stringify({
          action: 'install_skill',
          identifier: 'claude-code',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    );

    expect(installResponse.status).toBe(200);

    const response = await postTask(
      new Request('http://localhost/api/hermes/tasks', {
        method: 'POST',
        body: JSON.stringify({
          prompt: '[Skill: claude-code] Buat arsitektur workflow coding agent yang rapi',
          outputType: 'html',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.task.skillId).toBe('claude-code');
  });
});
