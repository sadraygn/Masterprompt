import { FastifyRequest, FastifyReply } from 'fastify';
import { CompletionResponse } from '@prompt-studio/shared';

// Simple validation patterns for PII detection
const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b(?:\+?1[-.]?)?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  creditCard: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
};

// Profanity/toxicity word list (simplified - in production use a comprehensive list or API)
const TOXIC_PATTERNS = [
  /\b(hate|kill|murder|die|attack)\b/gi,
  // Add more patterns as needed
];

function checkForPII(content: string): { found: boolean; types: string[] } {
  const foundTypes: string[] = [];
  
  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    if (pattern.test(content)) {
      foundTypes.push(type);
    }
  }
  
  return { found: foundTypes.length > 0, types: foundTypes };
}

function checkForToxicity(content: string): { found: boolean; matches: string[] } {
  const matches: string[] = [];
  
  for (const pattern of TOXIC_PATTERNS) {
    const contentMatches = content.match(pattern);
    if (contentMatches) {
      matches.push(...contentMatches);
    }
  }
  
  return { found: matches.length > 0, matches };
}

function sanitizePII(content: string): string {
  let sanitized = content;
  
  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    sanitized = sanitized.replace(pattern, `[${type.toUpperCase()}_REDACTED]`);
  }
  
  return sanitized;
}

export async function validateOutput(
  response: CompletionResponse,
  validationType: string[] = ['toxicity', 'pii']
): Promise<{ isValid: boolean; issues: string[]; sanitized?: CompletionResponse }> {
  const issues: string[] = [];
  const sanitizedResponse = JSON.parse(JSON.stringify(response)); // Deep clone
  let needsSanitization = false;
  
  try {
    // Validate each choice in the response
    for (let i = 0; i < response.choices.length; i++) {
      const content = response.choices[i].message.content;
      
      if (validationType.includes('pii')) {
        const piiCheck = checkForPII(content);
        if (piiCheck.found) {
          issues.push(`PII detected in choice ${i}: ${piiCheck.types.join(', ')}`);
          sanitizedResponse.choices[i].message.content = sanitizePII(content);
          needsSanitization = true;
        }
      }
      
      if (validationType.includes('toxicity')) {
        const toxicityCheck = checkForToxicity(content);
        if (toxicityCheck.found) {
          issues.push(`Potentially toxic content in choice ${i}: ${toxicityCheck.matches.join(', ')}`);
          // For toxicity, we don't automatically sanitize - just flag it
        }
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      sanitized: needsSanitization ? sanitizedResponse : undefined
    };
  } catch (error) {
    console.error('Validation error:', error);
    // Don't block on validation errors
    return {
      isValid: true,
      issues: ['Validation error: ' + (error as Error).message]
    };
  }
}

export function guardrailsMiddleware(
  validationTypes: string[] = ['toxicity', 'pii']
) {
  return async function(
    request: FastifyRequest,
    reply: FastifyReply,
    payload: any
  ) {
    // Only validate completion responses
    if (payload && typeof payload === 'object' && 'choices' in payload) {
      const validation = await validateOutput(payload as CompletionResponse, validationTypes);
      
      if (!validation.isValid) {
        request.log.warn({
          msg: 'Guardrails validation failed',
          issues: validation.issues
        });
        
        // Return sanitized response with warning header
        reply.header('X-Guardrails-Modified', 'true');
        reply.header('X-Guardrails-Issues', validation.issues.join(', '));
        
        return validation.sanitized;
      }
    }
    
    return payload;
  };
}