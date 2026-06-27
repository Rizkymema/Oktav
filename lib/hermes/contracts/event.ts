export interface HermesExecutionEvent {
  id: string;
  taskId: string;
  type: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
