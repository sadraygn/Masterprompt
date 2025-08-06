import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { BrokerService } from '../../services/broker.service.js';
import { guardrailsMiddleware } from '../../middleware/guardrails-validation.js';

const completionSchema = {
  body: Type.Object({
    model: Type.String({ description: 'Model identifier (e.g., gpt-3.5-turbo, gemini-pro)' }),
    messages: Type.Array(Type.Object({
      role: Type.String({ enum: ['system', 'user', 'assistant'] }),
      content: Type.String(),
    })),
    creativity: Type.Optional(Type.Number({ 
      minimum: 0, 
      maximum: 10,
      description: 'Creativity level (0-10), mapped to temperature',
    })),
    temperature: Type.Optional(Type.Number({ 
      minimum: 0, 
      maximum: 2,
      description: 'Direct temperature setting (overrides creativity)',
    })),
    max_tokens: Type.Optional(Type.Number({ minimum: 1 })),
    userId: Type.Optional(Type.String()),
    sessionId: Type.Optional(Type.String()),
    stream: Type.Optional(Type.Boolean()),
  }),
  response: {
    200: Type.Object({
      id: Type.String(),
      object: Type.String(),
      created: Type.Number(),
      model: Type.String(),
      choices: Type.Array(Type.Object({
        index: Type.Number(),
        message: Type.Object({
          role: Type.String(),
          content: Type.String(),
        }),
        finish_reason: Type.Union([Type.String(), Type.Null()]),
      })),
      usage: Type.Optional(Type.Object({
        prompt_tokens: Type.Number(),
        completion_tokens: Type.Number(),
        total_tokens: Type.Number(),
      })),
    }),
  },
};

const completionsRoute: FastifyPluginAsync = async (fastify) => {
  const broker = new BrokerService();

  fastify.post('/chat/completions', {
    schema: completionSchema,
    onSend: guardrailsMiddleware(['toxicity', 'pii']),
  }, async (request, reply) => {
    try {
      const response = await broker.executePrompt(request.body as any);
      return response;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: {
          message: error instanceof Error ? error.message : 'Internal server error',
          type: 'internal_error',
        },
      });
    }
  });
};

export default completionsRoute;