export { EvaluationService } from './evaluation-service.js';
export type { 
  EvaluationConfig,
  EvaluationResult,
  TestResult,
  AssertionResult,
  ProviderSummary,
  PromptSummary
} from './evaluation-service.js';

export { PromptfooRunner } from './promptfoo-runner.js';
export type {
  PromptfooTest,
  PromptfooProvider
} from './promptfoo-runner.js';

/**
 * Evaluation tools for the Prompt Engineering Studio
 * 
 * Features:
 * - Automated prompt evaluation with Promptfoo
 * - Regression testing suite
 * - Quality metrics tracking
 * - Security testing
 * - Performance benchmarking
 * - CI/CD integration support
 */