import type { HermesTaskRecord } from '@/lib/hermes/contracts/task';
import type { ValidationResult } from '@/lib/hermes/core/validation-engine';

export class RetryEngine {
  constructor(private readonly maxAttempts = 1) {}

  shouldRetry(task: HermesTaskRecord, validation: ValidationResult) {
    return !validation.valid && task.attemptCount < this.maxAttempts;
  }
}
