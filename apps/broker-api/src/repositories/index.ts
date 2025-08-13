export { BaseRepository } from './base.repository';
export { PromptsRepository } from './prompts.repository';
export { WorkflowsRepository } from './workflows.repository';
export { EvaluationsRepository } from './evaluations.repository';
export { ParaphraseHistoryRepository } from './paraphrase-history.repository';

// Export types
export type { Prompt, PromptInsert, PromptUpdate } from './prompts.repository';
export type { Workflow, WorkflowInsert, WorkflowUpdate } from './workflows.repository';
export type { Evaluation, EvaluationInsert } from './evaluations.repository';
export type { ParaphraseHistory, ParaphraseHistoryInsert } from './paraphrase-history.repository';

// Create singleton instances
import { PromptsRepository } from './prompts.repository';
import { WorkflowsRepository } from './workflows.repository';
import { EvaluationsRepository } from './evaluations.repository';
import { ParaphraseHistoryRepository } from './paraphrase-history.repository';

export const promptsRepository = new PromptsRepository();
export const workflowsRepository = new WorkflowsRepository();
export const evaluationsRepository = new EvaluationsRepository();
export const paraphraseHistoryRepository = new ParaphraseHistoryRepository();