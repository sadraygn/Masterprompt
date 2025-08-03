import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence, RunnablePassthrough } from '@langchain/core/runnables';
import { BaseWorkflow } from '../base-workflow.js';
import { WorkflowInput, WorkflowNode, WorkflowEdge } from '../types.js';

const SUMMARIZATION_PROMPT = `Summarize the following text into key points:

Text: {text}

Summary:`;

export class SummarizationWorkflow extends BaseWorkflow {
  constructor(config?: any) {
    super(
      {
        id: 'summarization-workflow',
        name: 'Text Summarization',
        description: 'Summarize long text into key points',
        version: '1.0.0',
        tags: ['summarization', 'text-processing'],
        author: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      config
    );
  }
  
  protected initializeChain(): void {
    // Create prompt template
    const prompt = PromptTemplate.fromTemplate(SUMMARIZATION_PROMPT);
    
    // Create LLM with specific settings for summarization
    const llm = this.createLLM({
      temperature: 0.3, // Lower temperature for more focused summaries
      maxTokens: 500,
    });
    
    // Create output parser
    const outputParser = new StringOutputParser();
    
    // Create the chain using LCEL
    this.chain = RunnableSequence.from([
      {
        text: (input: any) => input.text || input.input || input,
      },
      prompt,
      llm,
      outputParser,
    ]);
  }
  
  async validate(input: WorkflowInput): Promise<boolean> {
    const text = input.text || input.input;
    return typeof text === 'string' && text.length > 50; // Require at least 50 chars
  }
  
  protected exportNodes(): WorkflowNode[] {
    return [
      {
        id: 'input-1',
        type: 'input',
        data: {
          label: 'Text Input',
          config: {},
        },
        position: { x: 50, y: 100 },
      },
      {
        id: 'prompt-1',
        type: 'promptTemplate',
        data: {
          label: 'Summarization Prompt',
          config: {
            template: SUMMARIZATION_PROMPT,
          },
        },
        position: { x: 250, y: 100 },
      },
      {
        id: 'llm-1',
        type: 'chatOpenAI',
        data: {
          label: 'OpenAI Chat',
          config: {
            model: this.config.model,
            temperature: 0.3,
            maxTokens: 500,
          },
        },
        position: { x: 450, y: 100 },
      },
      {
        id: 'parser-1',
        type: 'outputParser',
        data: {
          label: 'String Parser',
          config: {},
        },
        position: { x: 650, y: 100 },
      },
    ];
  }
  
  protected exportEdges(): WorkflowEdge[] {
    return [
      {
        id: 'edge-1',
        source: 'input-1',
        target: 'prompt-1',
      },
      {
        id: 'edge-2',
        source: 'prompt-1',
        target: 'llm-1',
      },
      {
        id: 'edge-3',
        source: 'llm-1',
        target: 'parser-1',
      },
    ];
  }
}