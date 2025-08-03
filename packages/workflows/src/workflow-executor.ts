import { BaseWorkflow } from './base-workflow.js';
import { WorkflowInput, WorkflowOutput, WorkflowContext } from './types.js';
import { WorkflowRegistry } from './workflow-registry.js';

export interface ExecutionOptions {
  workflowId: string;
  input: WorkflowInput;
  config?: any;
  context?: Partial<WorkflowContext>;
  onProgress?: (event: any) => void;
}

export class WorkflowExecutor {
  private registry: WorkflowRegistry;
  private executions: Map<string, WorkflowContext> = new Map();
  
  constructor() {
    this.registry = WorkflowRegistry.getInstance();
  }
  
  /**
   * Execute a workflow by ID
   */
  async execute(options: ExecutionOptions): Promise<WorkflowOutput> {
    const { workflowId, input, config, context, onProgress } = options;
    
    // Get or create workflow instance
    const workflow = config 
      ? this.registry.createInstance(workflowId, config)
      : this.registry.get(workflowId);
      
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }
    
    // Create execution context
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const executionContext: WorkflowContext = {
      workflowId,
      executionId,
      userId: context?.userId,
      sessionId: context?.sessionId,
      variables: new Map(),
      events: [],
    };
    
    this.executions.set(executionId, executionContext);
    
    try {
      // Set up progress callback if provided
      if (onProgress) {
        this.setupProgressTracking(workflow, onProgress);
      }
      
      // Execute workflow
      const output = await workflow.execute(input);
      
      // Store execution result
      executionContext.events.push({
        type: 'completed',
        workflowId,
        timestamp: new Date(),
        output,
      });
      
      return output;
    } catch (error) {
      // Store execution error
      executionContext.events.push({
        type: 'failed',
        workflowId,
        timestamp: new Date(),
        error: error as Error,
      });
      
      throw error;
    } finally {
      // Clean up after some time
      setTimeout(() => {
        this.executions.delete(executionId);
      }, 3600000); // 1 hour
    }
  }
  
  /**
   * Execute multiple workflows in parallel
   */
  async executeBatch(executions: ExecutionOptions[]): Promise<WorkflowOutput[]> {
    const promises = executions.map(exec => this.execute(exec));
    return Promise.all(promises);
  }
  
  /**
   * Execute workflows in sequence with pipeline
   */
  async executePipeline(
    pipeline: Array<{ workflowId: string; transform?: (output: any) => any }>
  ): Promise<WorkflowOutput> {
    let currentInput: any = {};
    let finalOutput: WorkflowOutput | undefined;
    
    for (const stage of pipeline) {
      const output = await this.execute({
        workflowId: stage.workflowId,
        input: currentInput,
      });
      
      // Transform output if needed
      currentInput = stage.transform 
        ? stage.transform(output.result)
        : { previous: output.result };
        
      finalOutput = output;
    }
    
    if (!finalOutput) {
      throw new Error('Pipeline produced no output');
    }
    
    return finalOutput;
  }
  
  /**
   * Get execution history for a workflow
   */
  getExecutionHistory(workflowId: string): WorkflowContext[] {
    const history: WorkflowContext[] = [];
    
    for (const context of this.executions.values()) {
      if (context.workflowId === workflowId) {
        history.push(context);
      }
    }
    
    return history;
  }
  
  /**
   * Get specific execution by ID
   */
  getExecution(executionId: string): WorkflowContext | undefined {
    return this.executions.get(executionId);
  }
  
  /**
   * Set up progress tracking for a workflow
   */
  private setupProgressTracking(workflow: BaseWorkflow, onProgress: (event: any) => void) {
    // This would hook into workflow events
    // For now, we'll use a simple implementation
    const originalExecute = workflow.execute.bind(workflow);
    
    workflow.execute = async (input: WorkflowInput) => {
      onProgress({ type: 'started', timestamp: new Date() });
      
      try {
        const result = await originalExecute(input);
        onProgress({ type: 'completed', timestamp: new Date(), result });
        return result;
      } catch (error) {
        onProgress({ type: 'failed', timestamp: new Date(), error });
        throw error;
      }
    };
  }
  
  /**
   * Create a chainable workflow builder
   */
  createChain() {
    return new WorkflowChainBuilder(this);
  }
}

/**
 * Fluent API for building workflow chains
 */
export class WorkflowChainBuilder {
  private stages: Array<{ workflowId: string; transform?: (output: any) => any }> = [];
  
  constructor(private executor: WorkflowExecutor) {}
  
  add(workflowId: string, transform?: (output: any) => any) {
    this.stages.push({ workflowId, transform });
    return this;
  }
  
  async execute(initialInput: WorkflowInput): Promise<WorkflowOutput> {
    return this.executor.executePipeline(this.stages);
  }
}