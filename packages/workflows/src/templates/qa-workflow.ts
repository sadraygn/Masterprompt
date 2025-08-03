import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence, RunnableParallel } from '@langchain/core/runnables';
import { BaseWorkflow } from '../base-workflow.js';
import { WorkflowInput, WorkflowNode, WorkflowEdge } from '../types.js';

const QA_PROMPT = `Answer the following question based on the provided context.

Context: {context}

Question: {question}

Answer:`;

export class QAWorkflow extends BaseWorkflow {
  constructor(config?: any) {
    super(
      {
        id: 'qa-workflow',
        name: 'Question Answering',
        description: 'Answer questions based on provided context',
        version: '1.0.0',
        tags: ['qa', 'rag', 'context'],
        author: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      config
    );
  }
  
  protected initializeChain(): void {
    // Create prompt template
    const prompt = PromptTemplate.fromTemplate(QA_PROMPT);
    
    // Create LLM
    const llm = this.createLLM({
      temperature: 0.2, // Lower temperature for factual answers
    });
    
    // Create output parser
    const outputParser = new StringOutputParser();
    
    // Create the chain using LCEL with parallel processing
    this.chain = RunnableSequence.from([
      // Prepare inputs in parallel
      RunnableParallel.from({
        context: (input: any) => input.context || '',
        question: (input: any) => input.question || input.query || input.input,
      }),
      prompt,
      llm,
      outputParser,
    ]);
  }
  
  async validate(input: WorkflowInput): Promise<boolean> {
    const question = input.question || input.query || input.input;
    const context = input.context;
    
    return (
      typeof question === 'string' && 
      question.length > 0 &&
      typeof context === 'string' &&
      context.length > 0
    );
  }
  
  protected exportNodes(): WorkflowNode[] {
    return [
      {
        id: 'context-1',
        type: 'input',
        data: {
          label: 'Context Input',
          config: {
            inputName: 'context',
          },
        },
        position: { x: 50, y: 50 },
      },
      {
        id: 'question-1',
        type: 'input',
        data: {
          label: 'Question Input',
          config: {
            inputName: 'question',
          },
        },
        position: { x: 50, y: 150 },
      },
      {
        id: 'parallel-1',
        type: 'parallel',
        data: {
          label: 'Parallel Inputs',
          config: {},
        },
        position: { x: 250, y: 100 },
      },
      {
        id: 'prompt-1',
        type: 'promptTemplate',
        data: {
          label: 'QA Prompt',
          config: {
            template: QA_PROMPT,
          },
        },
        position: { x: 450, y: 100 },
      },
      {
        id: 'llm-1',
        type: 'chatOpenAI',
        data: {
          label: 'OpenAI Chat',
          config: {
            model: this.config.model,
            temperature: 0.2,
          },
        },
        position: { x: 650, y: 100 },
      },
      {
        id: 'parser-1',
        type: 'outputParser',
        data: {
          label: 'String Parser',
          config: {},
        },
        position: { x: 850, y: 100 },
      },
    ];
  }
  
  protected exportEdges(): WorkflowEdge[] {
    return [
      {
        id: 'edge-1',
        source: 'context-1',
        target: 'parallel-1',
        targetHandle: 'context',
      },
      {
        id: 'edge-2',
        source: 'question-1',
        target: 'parallel-1',
        targetHandle: 'question',
      },
      {
        id: 'edge-3',
        source: 'parallel-1',
        target: 'prompt-1',
      },
      {
        id: 'edge-4',
        source: 'prompt-1',
        target: 'llm-1',
      },
      {
        id: 'edge-5',
        source: 'llm-1',
        target: 'parser-1',
      },
    ];
  }
}