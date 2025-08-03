import { PromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence, RunnableLambda } from '@langchain/core/runnables';
import { z } from 'zod';
import { BaseWorkflow } from '../base-workflow.js';
import { WorkflowInput, WorkflowNode, WorkflowEdge } from '../types.js';

const DATA_EXTRACTION_PROMPT = `Extract structured data from the following text according to the schema provided.

Text:
{text}

Schema Description:
{schema_description}

{format_instructions}`;

export class DataExtractionWorkflow extends BaseWorkflow {
  private outputParser?: JsonOutputParser<any>;
  
  constructor(config?: any) {
    super(
      {
        id: 'data-extraction-workflow',
        name: 'Data Extraction Pipeline',
        description: 'Extract structured data from unstructured text',
        version: '1.0.0',
        tags: ['extraction', 'data-processing', 'nlp'],
        author: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      config
    );
  }
  
  protected initializeChain(): void {
    // Create prompt template
    const prompt = PromptTemplate.fromTemplate(DATA_EXTRACTION_PROMPT);
    
    // Create LLM
    const llm = this.createLLM({
      temperature: 0.1, // Very low temperature for consistent extraction
      maxTokens: 1000,
    });
    
    // Create dynamic parser based on schema
    const createParser = (schema: any) => {
      if (schema) {
        this.outputParser = new JsonOutputParser();
        return this.outputParser;
      }
      // Default schema if none provided
      const defaultSchema = z.object({
        entities: z.array(z.object({
          type: z.string(),
          value: z.string(),
          confidence: z.number().optional(),
        })),
        relationships: z.array(z.object({
          subject: z.string(),
          predicate: z.string(),
          object: z.string(),
        })).optional(),
        metadata: z.record(z.any()).optional(),
      });
      this.outputParser = new JsonOutputParser();
      return this.outputParser;
    };
    
    // Create the chain using LCEL
    this.chain = RunnableSequence.from([
      // Prepare inputs and create parser
      RunnableLambda.from((input: any) => {
        const parser = createParser(input.schema);
        return {
          text: input.text || input.input,
          schema_description: input.schema_description || 'Extract all relevant entities and relationships',
          format_instructions: `Please format your response as a JSON object with entities, relationships, and metadata fields.`,
        };
      }),
      prompt,
      llm,
      // Parse output
      RunnableLambda.from((output: string) => {
        if (this.outputParser) {
          return this.outputParser.parse(output);
        }
        return { error: 'No parser available' };
      }),
    ]);
  }
  
  async validate(input: WorkflowInput): Promise<boolean> {
    const text = input.text || input.input;
    return typeof text === 'string' && text.length > 0;
  }
  
  protected exportNodes(): WorkflowNode[] {
    return [
      {
        id: 'text-input-1',
        type: 'input',
        data: {
          label: 'Text Input',
          config: {
            inputName: 'text',
          },
        },
        position: { x: 50, y: 50 },
      },
      {
        id: 'schema-input-1',
        type: 'input',
        data: {
          label: 'Schema (Optional)',
          config: {
            inputName: 'schema',
            optional: true,
          },
        },
        position: { x: 50, y: 150 },
      },
      {
        id: 'preprocessor-1',
        type: 'lambda',
        data: {
          label: 'Input Processor',
          config: {
            description: 'Prepare inputs and create parser',
          },
        },
        position: { x: 250, y: 100 },
      },
      {
        id: 'prompt-1',
        type: 'promptTemplate',
        data: {
          label: 'Extraction Prompt',
          config: {
            template: DATA_EXTRACTION_PROMPT,
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
            temperature: 0.1,
            maxTokens: 1000,
          },
        },
        position: { x: 650, y: 100 },
      },
      {
        id: 'parser-1',
        type: 'lambda',
        data: {
          label: 'Output Parser',
          config: {
            description: 'Parse structured output',
          },
        },
        position: { x: 850, y: 100 },
      },
    ];
  }
  
  protected exportEdges(): WorkflowEdge[] {
    return [
      {
        id: 'edge-1',
        source: 'text-input-1',
        target: 'preprocessor-1',
        targetHandle: 'text',
      },
      {
        id: 'edge-2',
        source: 'schema-input-1',
        target: 'preprocessor-1',
        targetHandle: 'schema',
      },
      {
        id: 'edge-3',
        source: 'preprocessor-1',
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