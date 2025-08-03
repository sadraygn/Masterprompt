export { InjectionDetector } from './injection-detector.js';
export type { InjectionDetectionResult, InjectionDetectorConfig } from './injection-detector.js';

export { GuardrailsMiddleware } from './guardrails-middleware.js';
export type { ValidationRule, GuardrailsConfig } from './guardrails-middleware.js';

// Re-export useful Zod types for schema validation
export { z } from 'zod';

/**
 * Security utilities for the Prompt Engineering Studio
 * 
 * Features:
 * - Prompt injection detection with configurable threshold
 * - Output validation with automatic retry
 * - Schema-based validation
 * - Custom validation rules
 */