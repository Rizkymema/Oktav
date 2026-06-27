import { randomUUID } from 'node:crypto';

export interface AuditEntry {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export class AuditLogger {
  private readonly entries: AuditEntry[] = [];

  write(type: string, message: string, metadata?: Record<string, unknown>) {
    this.entries.push({
      id: randomUUID(),
      type,
      message,
      createdAt: new Date().toISOString(),
      metadata,
    });
  }

  list() {
    return [...this.entries];
  }
}
