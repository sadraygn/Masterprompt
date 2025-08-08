import { WorkflowRegistry } from './workflow-registry.js';
import { CompletionWorkflow } from './templates/completion-workflow.js';
import { SummarizationWorkflow } from './templates/summarization-workflow.js';
import { QAWorkflow } from './templates/qa-workflow.js';
import { CodeReviewWorkflow } from './templates/code-review-workflow.js';
import { DataExtractionWorkflow } from './templates/data-extraction-workflow.js';

/**
 * Register all built-in workflow templates
 */
export function registerBuiltinWorkflows(): void {
  const registry = WorkflowRegistry.getInstance();
  
  // Register all built-in workflows
  registry.register(CompletionWorkflow);
  registry.register(SummarizationWorkflow);
  registry.register(QAWorkflow);
  registry.register(CodeReviewWorkflow);
  registry.register(DataExtractionWorkflow);
  
  console.log(`[WorkflowRegistry] Registered ${registry.list().length} built-in workflows`);
}