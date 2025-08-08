import { Runnable } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import { 
  IWorkflow, 
  WorkflowMetadata, 
  WorkflowConfig, 
  WorkflowInput, 
  WorkflowOutput,
  WorkflowExport,
  WorkflowContext,
  WorkflowEvent
} from './types.js';

export abstract class BaseWorkflow implements IWorkflow {
  metadata: WorkflowMetadata;
  config: WorkflowConfig;
  chain!: Runnable;
  protected context?: WorkflowContext;
  private chainInitialized: boolean = false;
  
  constructor(metadata: WorkflowMetadata, config: Partial<WorkflowConfig> = {}) {
    this.metadata = metadata;
    this.config = {
      model: config.model || 'gpt-3.5-turbo',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens,
      streaming: config.streaming ?? false,
      timeout: config.timeout,
      retries: config.retries ?? 3,
      cache: config.cache ?? true,
    };
    
    // Delay chain initialization until first use
    // this.initializeChain();
  }
  
  /**
   * Initialize the LCEL chain
   * Must be implemented by subclasses
   */
  protected abstract initializeChain(): void;
  
  /**
   * Ensure chain is initialized
   */
  protected ensureChainInitialized(): void {
    if (!this.chainInitialized) {
      this.initializeChain();
      this.chainInitialized = true;
    }
  }

  /**
   * Execute the workflow with given input
   */
  async execute(input: WorkflowInput): Promise<WorkflowOutput> {
    const startTime = Date.now();
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Ensure chain is initialized before execution
    this.ensureChainInitialized();
    
    // Create execution context
    this.context = {
      workflowId: this.metadata.id,
      executionId,
      variables: new Map(),
      events: [],
    };
    
    // Emit start event
    this.emitEvent({ 
      type: 'started', 
      workflowId: this.metadata.id, 
      timestamp: new Date() 
    });
    
    try {
      // Validate input
      const isValid = await this.validate(input);
      if (!isValid) {
        throw new Error('Invalid input for workflow');
      }
      
      // Execute the chain
      const result = await this.chain.invoke(input);
      
      // Calculate metadata
      const latency = Date.now() - startTime;
      
      const output: WorkflowOutput = {
        result,
        metadata: {
          latency,
          model: this.config.model,
          workflowId: this.metadata.id,
          executionId,
        },
      };
      
      // Emit completion event
      this.emitEvent({ 
        type: 'completed', 
        workflowId: this.metadata.id, 
        timestamp: new Date(),
        output 
      });
      
      return output;
    } catch (error) {
      // Emit failure event
      this.emitEvent({ 
        type: 'failed', 
        workflowId: this.metadata.id, 
        timestamp: new Date(),
        error: error as Error
      });
      
      throw error;
    }
  }
  
  /**
   * Validate input for the workflow
   * Can be overridden by subclasses for custom validation
   */
  async validate(input: WorkflowInput): Promise<boolean> {
    // Basic validation - ensure input is not empty
    return input && Object.keys(input).length > 0;
  }
  
  /**
   * Export workflow for Flowise compatibility
   */
  export(): WorkflowExport {
    // This is a basic implementation
    // Subclasses should override for specific export logic
    return {
      metadata: this.metadata,
      config: this.config,
      nodes: this.exportNodes(),
      edges: this.exportEdges(),
    };
  }
  
  /**
   * Export nodes for Flowise
   * Should be overridden by subclasses
   */
  protected exportNodes(): any[] {
    return [];
  }
  
  /**
   * Export edges for Flowise
   * Should be overridden by subclasses
   */
  protected exportEdges(): any[] {
    return [];
  }
  
  /**
   * Create a language model instance
   */
  protected createLLM(overrides?: Partial<WorkflowConfig>) {
    const config = { ...this.config, ...overrides };
    
    // Use environment variable or a default API key
    const apiKey = process.env.OPENAI_API_KEY || 'sk-dummy-key-for-initialization';
    
    return new ChatOpenAI({
      modelName: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      streaming: config.streaming,
      timeout: config.timeout,
      maxRetries: config.retries,
      openAIApiKey: apiKey,
    });
  }
  
  /**
   * Emit workflow events
   */
  protected emitEvent(event: WorkflowEvent) {
    if (this.context) {
      this.context.events.push(event);
    }
    
    // In a real implementation, this could emit to an event bus
    // For now, just log it
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Workflow Event] ${event.type}:`, event);
    }
  }
  
  /**
   * Get or set context variables
   */
  protected setVariable(key: string, value: any) {
    if (this.context) {
      this.context.variables.set(key, value);
    }
  }
  
  protected getVariable(key: string): any {
    return this.context?.variables.get(key);
  }
}