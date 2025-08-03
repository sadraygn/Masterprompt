import { FastifyRequest, FastifyReply } from 'fastify';
import { InjectionDetector } from '@prompt-studio/security';
import { CompletionRequest } from '@prompt-studio/shared';

const detector = new InjectionDetector({
  threshold: 0.7,
  openaiApiKey: process.env.OPENAI_API_KEY,
});

export async function checkInjection(
  request: FastifyRequest<{ Body: CompletionRequest }>,
  reply: FastifyReply
) {
  try {
    // Check all messages for potential injection
    const messages = request.body.messages || [];
    
    for (const message of messages) {
      if (message.role === 'user' || message.role === 'system') {
        const result = await detector.detect(message.content);
        
        if (result.isInjection) {
          request.log.warn({
            msg: 'Potential injection detected',
            score: result.score,
            patterns: result.details.patternMatches,
            message: message.content.substring(0, 100) + '...'
          });
          
          return reply.code(400).send({
            error: {
              message: 'Potential prompt injection detected. Please rephrase your request.',
              type: 'injection_detected',
              code: 'INJECTION_DETECTED',
              details: {
                score: result.score,
                patterns: result.details.patternMatches
              }
            }
          });
        }
      }
    }
  } catch (error) {
    request.log.error({ error }, 'Error checking for injection');
    // Don't block the request if injection detection fails
    // Log and continue
  }
}