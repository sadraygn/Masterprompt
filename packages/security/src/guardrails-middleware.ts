import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

export interface ValidationRule {
  type: 'length' | 'format' | 'contains' | 'schema' | 'custom';
  config: any;
}

export interface GuardrailsConfig {
  maxRetries?: number;
  retryDelay?: number;
  validationRules?: ValidationRule[];
}

export class GuardrailsMiddleware {
  private maxRetries: number;
  private retryDelay: number;
  private validationRules: ValidationRule[];

  constructor(config: GuardrailsConfig = {}) {
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
    this.validationRules = config.validationRules ?? [];
  }

  /**
   * Validate LLM output with automatic retry
   */
  async validateWithRetry<T>(
    output: string,
    schema?: z.ZodSchema<T>,
    customValidator?: (output: string) => Promise<{ valid: boolean; fixed?: string }>
  ): Promise<{
    valid: boolean;
    output: string;
    errors: string[];
    retries: number;
  }> {
    let currentOutput = output;
    let errors: string[] = [];
    let retries = 0;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const validationResult = await this.validate(currentOutput, schema, customValidator);
      
      if (validationResult.valid) {
        return {
          valid: true,
          output: validationResult.output || currentOutput,
          errors: [],
          retries,
        };
      }

      errors = validationResult.errors;
      
      // If we have a fixed output, use it for the next attempt
      if (validationResult.fixedOutput && attempt < this.maxRetries) {
        currentOutput = validationResult.fixedOutput;
        retries++;
        await this.delay(this.retryDelay);
        continue;
      }

      // No fix available, exit
      break;
    }

    return {
      valid: false,
      output: currentOutput,
      errors,
      retries,
    };
  }

  /**
   * Core validation logic
   */
  private async validate<T>(
    output: string,
    schema?: z.ZodSchema<T>,
    customValidator?: (output: string) => Promise<{ valid: boolean; fixed?: string }>
  ): Promise<{
    valid: boolean;
    output?: string;
    fixedOutput?: string;
    errors: string[];
  }> {
    const errors: string[] = [];
    let fixedOutput: string | undefined;

    // 1. Apply validation rules
    for (const rule of this.validationRules) {
      const ruleResult = await this.applyRule(output, rule);
      if (!ruleResult.valid) {
        errors.push(ruleResult.error || 'Validation failed');
        if (ruleResult.fixed) {
          fixedOutput = ruleResult.fixed;
        }
      }
    }

    // 2. Schema validation (if provided)
    if (schema) {
      try {
        // Try to parse JSON and validate
        const parsed = JSON.parse(output);
        schema.parse(parsed);
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push(...error.errors.map(e => `${e.path.join('.')}: ${e.message}`));
        } else if (error instanceof SyntaxError) {
          errors.push('Invalid JSON format');
          // Attempt to fix common JSON issues
          fixedOutput = this.attemptJsonFix(output);
        } else {
          errors.push('Schema validation failed');
        }
      }
    }

    // 3. Custom validation (if provided)
    if (customValidator) {
      const customResult = await customValidator(fixedOutput || output);
      if (!customResult.valid) {
        errors.push('Custom validation failed');
      }
      if (customResult.fixed) {
        fixedOutput = customResult.fixed;
      }
    }

    return {
      valid: errors.length === 0,
      output: errors.length === 0 ? output : undefined,
      fixedOutput,
      errors,
    };
  }

  /**
   * Apply individual validation rule
   */
  private async applyRule(
    output: string,
    rule: ValidationRule
  ): Promise<{ valid: boolean; error?: string; fixed?: string }> {
    switch (rule.type) {
      case 'length':
        const { min, max } = rule.config;
        if (output.length < min) {
          return {
            valid: false,
            error: `Output too short (${output.length} < ${min})`,
          };
        }
        if (output.length > max) {
          return {
            valid: false,
            error: `Output too long (${output.length} > ${max})`,
            fixed: output.substring(0, max),
          };
        }
        return { valid: true };

      case 'format':
        const { pattern } = rule.config;
        const regex = new RegExp(pattern);
        if (!regex.test(output)) {
          return {
            valid: false,
            error: `Output doesn't match required format: ${pattern}`,
          };
        }
        return { valid: true };

      case 'contains':
        const { required, forbidden } = rule.config;
        
        if (required) {
          for (const term of required) {
            if (!output.includes(term)) {
              return {
                valid: false,
                error: `Output missing required term: ${term}`,
              };
            }
          }
        }
        
        if (forbidden) {
          for (const term of forbidden) {
            if (output.includes(term)) {
              return {
                valid: false,
                error: `Output contains forbidden term: ${term}`,
                fixed: output.replace(new RegExp(term, 'g'), ''),
              };
            }
          }
        }
        
        return { valid: true };

      case 'schema':
        try {
          const parsed = JSON.parse(output);
          const schemaValidator = z.object(rule.config);
          schemaValidator.parse(parsed);
          return { valid: true };
        } catch (error) {
          return {
            valid: false,
            error: 'Schema validation failed',
          };
        }

      case 'custom':
        const result = await rule.config(output);
        return result;

      default:
        return { valid: true };
    }
  }

  /**
   * Attempt to fix common JSON formatting issues
   */
  private attemptJsonFix(output: string): string {
    let fixed = output.trim();

    // Remove markdown code blocks
    fixed = fixed.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '');

    // Fix common issues
    // Add missing quotes around keys
    fixed = fixed.replace(/(\w+):/g, '"$1":');
    
    // Fix single quotes to double quotes
    fixed = fixed.replace(/'/g, '"');
    
    // Remove trailing commas
    fixed = fixed.replace(/,\s*([}\]])/g, '$1');
    
    // Ensure proper JSON wrapping
    if (!fixed.startsWith('{') && !fixed.startsWith('[')) {
      fixed = `{${fixed}}`;
    }

    return fixed;
  }

  /**
   * Create Fastify middleware
   */
  createFastifyPlugin() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      // Add validation method to request
      (request as any).validateOutput = async (
        output: string,
        schema?: z.ZodSchema<any>
      ) => {
        return this.validateWithRetry(output, schema);
      };
    };
  }

  /**
   * Add validation rule
   */
  addRule(rule: ValidationRule): void {
    this.validationRules.push(rule);
  }

  /**
   * Create predefined rules
   */
  static createRules = {
    maxLength: (max: number): ValidationRule => ({
      type: 'length',
      config: { min: 0, max },
    }),
    
    minLength: (min: number): ValidationRule => ({
      type: 'length',
      config: { min, max: Infinity },
    }),
    
    noPersonalInfo: (): ValidationRule => ({
      type: 'format',
      config: {
        pattern: '^(?!.*\\b(?:ssn|social security|credit card|\\d{3}-\\d{2}-\\d{4})\\b).*$',
      },
    }),
    
    noProfanity: (): ValidationRule => ({
      type: 'contains',
      config: {
        forbidden: ['profanity1', 'profanity2'], // Add actual profanity list
      },
    }),
    
    jsonFormat: (): ValidationRule => ({
      type: 'custom',
      config: async (output: string) => {
        try {
          JSON.parse(output);
          return { valid: true };
        } catch {
          return { valid: false, error: 'Invalid JSON format' };
        }
      },
    }),
  };

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}