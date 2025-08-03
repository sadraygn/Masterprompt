import { PromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { z } from 'zod';
import { BaseWorkflow } from '../base-workflow.js';
import { WorkflowInput, WorkflowNode, WorkflowEdge } from '../types.js';

const CODE_REVIEW_PROMPT = `You are an expert code reviewer. Review the following code and provide structured feedback.

Code to review:
\`\`\`{language}
{code}
\`\`\`

{format_instructions}`;

// Define the output schema
const reviewSchema = z.object({
  summary: z.string().describe('Brief summary of the code review'),
  issues: z.array(z.object({
    severity: z.enum(['critical', 'major', 'minor', 'suggestion']),
    line: z.number().optional(),
    description: z.string(),
    suggestion: z.string().optional(),
  })).describe('List of issues found'),
  positives: z.array(z.string()).describe('Positive aspects of the code'),
  score: z.number().min(0).max(10).describe('Overall code quality score'),
});

export class CodeReviewWorkflow extends BaseWorkflow {
  private outputParser: JsonOutputParser<z.infer<typeof reviewSchema>>;
  
  constructor(config?: any) {
    super(
      {
        id: 'code-review-workflow',
        name: 'Code Review Assistant',
        description: 'Automated code review with structured feedback',
        version: '1.0.0',
        tags: ['code-review', 'development', 'quality'],
        author: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      config
    );
    
    // Initialize output parser
    this.outputParser = new JsonOutputParser<z.infer<typeof reviewSchema>>();
  }
  
  protected initializeChain(): void {
    // Create prompt template with format instructions
    const prompt = PromptTemplate.fromTemplate(CODE_REVIEW_PROMPT);
    
    // Create LLM with higher token limit for detailed reviews
    const llm = this.createLLM({
      temperature: 0.3,
      maxTokens: 1500,
    });
    
    // Create the chain using LCEL
    this.chain = RunnableSequence.from([
      {
        code: (input: any) => input.code,
        language: (input: any) => input.language || 'javascript',
        format_instructions: () => `Please format your response as a JSON object with the following structure:
${JSON.stringify({
  summary: 'Brief summary of the code review',
  issues: [{
    severity: 'critical | major | minor | suggestion',
    line: 'optional line number',
    description: 'issue description',
    suggestion: 'optional suggestion'
  }],
  positives: ['positive aspect 1', 'positive aspect 2'],
  score: 8.5
}, null, 2)}`,
      },
      prompt,
      llm,
      this.outputParser,
    ]);
  }
  
  async validate(input: WorkflowInput): Promise<boolean> {
    return typeof input.code === 'string' && input.code.length > 10;
  }
  
  protected exportNodes(): WorkflowNode[] {
    return [
      {
        id: 'code-input-1',
        type: 'input',
        data: {
          label: 'Code Input',
          config: {
            inputName: 'code',
          },
        },
        position: { x: 50, y: 50 },
      },
      {
        id: 'language-input-1',
        type: 'input',
        data: {
          label: 'Language Input',
          config: {
            inputName: 'language',
            default: 'javascript',
          },
        },
        position: { x: 50, y: 150 },
      },
      {
        id: 'prompt-1',
        type: 'promptTemplate',
        data: {
          label: 'Code Review Prompt',
          config: {
            template: CODE_REVIEW_PROMPT,
          },
        },
        position: { x: 300, y: 100 },
      },
      {
        id: 'llm-1',
        type: 'chatOpenAI',
        data: {
          label: 'OpenAI Chat',
          config: {
            model: this.config.model,
            temperature: 0.3,
            maxTokens: 1500,
          },
        },
        position: { x: 550, y: 100 },
      },
      {
        id: 'parser-1',
        type: 'structuredOutputParser',
        data: {
          label: 'Structured Output',
          config: {
            schema: 'reviewSchema',
          },
        },
        position: { x: 800, y: 100 },
      },
    ];
  }
  
  protected exportEdges(): WorkflowEdge[] {
    return [
      {
        id: 'edge-1',
        source: 'code-input-1',
        target: 'prompt-1',
        targetHandle: 'code',
      },
      {
        id: 'edge-2',
        source: 'language-input-1',
        target: 'prompt-1',
        targetHandle: 'language',
      },
      {
        id: 'edge-3',
        source: 'prompt-1',
        target: 'llm-1',
      },
      {
        id: 'edge-4',
        source: 'llm-1',
        target: 'parser-1',
      },
    ];
  }
}