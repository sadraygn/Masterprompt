import { z } from 'zod';
import { Runnable } from '@langchain/core/runnables';

// Workflow metadata schema
export const WorkflowMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string().default('1.0.0'),
  tags: z.array(z.string()).default([]),
  author: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type WorkflowMetadata = z.infer<typeof WorkflowMetadataSchema>;

// Workflow configuration schema
export const WorkflowConfigSchema = z.object({
  model: z.string().default('gpt-3.5-turbo'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().optional(),
  streaming: z.boolean().default(false),
  timeout: z.number().optional(),
  retries: z.number().default(3),
  cache: z.boolean().default(true),
});

export type WorkflowConfig = z.infer<typeof WorkflowConfigSchema>;

// Workflow input/output types
export interface WorkflowInput {
  [key: string]: any;
}

export interface WorkflowOutput {
  result: any;
  metadata?: {
    tokens?: number;
    latency?: number;
    model?: string;
    [key: string]: any;
  };
}

// Base workflow interface
export interface IWorkflow {
  metadata: WorkflowMetadata;
  config: WorkflowConfig;
  chain: Runnable;
  
  execute(input: WorkflowInput): Promise<WorkflowOutput>;
  validate(input: WorkflowInput): Promise<boolean>;
  export(): WorkflowExport;
}

// Workflow export format (for Flowise sync)
export interface WorkflowExport {
  metadata: WorkflowMetadata;
  config: WorkflowConfig;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface WorkflowNode {
  id: string;
  type: string;
  data: {
    label: string;
    config: any;
  };
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

// Workflow events
export type WorkflowEvent = 
  | { type: 'started'; workflowId: string; timestamp: Date }
  | { type: 'completed'; workflowId: string; timestamp: Date; output: WorkflowOutput }
  | { type: 'failed'; workflowId: string; timestamp: Date; error: Error }
  | { type: 'node_started'; workflowId: string; nodeId: string; timestamp: Date }
  | { type: 'node_completed'; workflowId: string; nodeId: string; timestamp: Date };

// Workflow execution context
export interface WorkflowContext {
  workflowId: string;
  executionId: string;
  userId?: string;
  sessionId?: string;
  variables: Map<string, any>;
  events: WorkflowEvent[];
}