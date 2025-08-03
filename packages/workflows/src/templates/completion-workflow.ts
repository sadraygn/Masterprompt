import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { BaseWorkflow } from '../base-workflow.js';
import { WorkflowInput, WorkflowNode, WorkflowEdge } from '../types.js';

export class CompletionWorkflow extends BaseWorkflow {
  constructor(config?: any) {
    super(
      {
        id: 'completion-workflow',
        name: 'Basic Completion',
        description: 'Simple prompt completion workflow',
        version: '1.0.0',
        tags: ['basic', 'completion'],
        author: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      config
    );
  }
  
  protected initializeChain(): void {
    // Create prompt template
    const prompt = PromptTemplate.fromTemplate(`{input}`);
    
    // Create LLM
    const llm = this.createLLM();
    
    // Create output parser
    const outputParser = new StringOutputParser();
    
    // Create the chain using LCEL
    this.chain = RunnableSequence.from([
      prompt,
      llm,
      outputParser,
    ]);
  }
  
  async validate(input: WorkflowInput): Promise<boolean> {
    return typeof input.input === 'string' && input.input.length > 0;
  }
  
  protected exportNodes(): WorkflowNode[] {
    return [
      {
        id: 'prompt-1',
        type: 'promptTemplate',
        data: {
          label: 'Prompt Template',
          config: {
            template: '{input}',
          },
        },
        position: { x: 100, y: 100 },
      },
      {
        id: 'llm-1',
        type: 'chatOpenAI',
        data: {
          label: 'OpenAI Chat',
          config: {
            model: this.config.model,
            temperature: this.config.temperature,
          },
        },
        position: { x: 300, y: 100 },
      },
      {
        id: 'parser-1',
        type: 'outputParser',
        data: {
          label: 'String Parser',
          config: {},
        },
        position: { x: 500, y: 100 },
      },
    ];
  }
  
  protected exportEdges(): WorkflowEdge[] {
    return [
      {
        id: 'edge-1',
        source: 'prompt-1',
        target: 'llm-1',
      },
      {
        id: 'edge-2',
        source: 'llm-1',
        target: 'parser-1',
      },
    ];
  }
}