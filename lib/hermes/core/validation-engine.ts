export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export class ValidationEngine {
  validate(input: { result?: string; downloadCount?: number }) : ValidationResult {
    if (!input.result || input.result.trim().length === 0) {
      return {
        valid: false,
        reason: 'Output kosong.',
      };
    }

    if ((input.downloadCount ?? 0) === 0) {
      return {
        valid: false,
        reason: 'Artifact belum tersedia.',
      };
    }

    return { valid: true };
  }
}
