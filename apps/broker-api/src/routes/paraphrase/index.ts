import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { OllamaService } from '../../services/ollama.service.js';

const paraphraseSchema = {
  body: Type.Object({
    text: Type.String({ minLength: 1, maxLength: 5000 }),
    style: Type.Optional(Type.Union([
      Type.Literal('formal'),
      Type.Literal('casual'),
      Type.Literal('technical'),
      Type.Literal('simple'),
    ])),
  }),
  response: {
    200: Type.Object({
      original: Type.String(),
      paraphrased: Type.String(),
      style: Type.Optional(Type.String()),
      latency: Type.Number(),
      model: Type.String(),
    }),
  },
};

const modelsSchema = {
  response: {
    200: Type.Object({
      models: Type.Array(Type.Object({
        name: Type.String(),
        size: Type.Number(),
        parameter_size: Type.Optional(Type.String()),
        quantization: Type.Optional(Type.String()),
      })),
    }),
  },
};

const paraphraseRoute: FastifyPluginAsync = async (fastify) => {
  const ollamaService = new OllamaService();

  // Check Ollama health on startup
  const isHealthy = await ollamaService.healthCheck();
  if (!isHealthy) {
    fastify.log.warn('Ollama service is not available. Paraphrase features will be disabled.');
  }

  // Paraphrase endpoint
  fastify.post('/', {
    schema: paraphraseSchema,
  }, async (request, reply) => {
    try {
      const { text, style } = request.body as { text: string; style?: 'formal' | 'casual' | 'technical' | 'simple' };
      
      // Check if Ollama is available
      const isHealthy = await ollamaService.healthCheck();
      if (!isHealthy) {
        reply.status(503).send({
          error: {
            message: 'Ollama service is not available',
            type: 'service_unavailable',
          },
        });
        return;
      }

      const startTime = Date.now();
      const paraphrased = await ollamaService.paraphrase(text, style);
      const latency = Date.now() - startTime;

      // Log for monitoring
      fastify.log.info({
        msg: 'Paraphrase completed',
        latency,
        textLength: text.length,
        style,
      });

      return {
        original: text,
        paraphrased,
        style,
        latency,
        model: 'llama3:8b',
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: {
          message: error instanceof Error ? error.message : 'Failed to paraphrase text',
          type: 'paraphrase_error',
        },
      });
    }
  });

  // Batch paraphrase endpoint
  fastify.post('/batch', {
    schema: {
      body: Type.Object({
        texts: Type.Array(Type.String({ minLength: 1, maxLength: 5000 }), { maxItems: 10 }),
        style: Type.Optional(Type.Union([
          Type.Literal('formal'),
          Type.Literal('casual'),
          Type.Literal('technical'),
          Type.Literal('simple'),
        ])),
      }),
    },
  }, async (request, reply) => {
    try {
      const { texts, style } = request.body as { texts: string[]; style?: 'formal' | 'casual' | 'technical' | 'simple' };
      
      // Check if Ollama is available
      const isHealthy = await ollamaService.healthCheck();
      if (!isHealthy) {
        reply.status(503).send({
          error: {
            message: 'Ollama service is not available',
            type: 'service_unavailable',
          },
        });
        return;
      }

      const results = await Promise.all(
        texts.map(async (text) => {
          const startTime = Date.now();
          try {
            const paraphrased = await ollamaService.paraphrase(text, style);
            return {
              original: text,
              paraphrased,
              latency: Date.now() - startTime,
              success: true,
            };
          } catch (error) {
            return {
              original: text,
              error: error instanceof Error ? error.message : 'Failed',
              success: false,
            };
          }
        })
      );

      return {
        results,
        style,
        model: 'llama3:8b',
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: {
          message: 'Failed to process batch paraphrase',
          type: 'batch_error',
        },
      });
    }
  });

  // List available models
  fastify.get('/models', {
    schema: modelsSchema,
  }, async (request, reply) => {
    try {
      const models = await ollamaService.listModels();
      
      return {
        models: models.map(model => ({
          name: model.name,
          size: model.size,
          parameter_size: model.details?.parameter_size,
          quantization: model.details?.quantization_level,
        })),
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: {
          message: 'Failed to list models',
          type: 'internal_error',
        },
      });
    }
  });

  // Health check endpoint
  fastify.get('/health', async (request, reply) => {
    try {
      const isHealthy = await ollamaService.healthCheck();
      
      if (isHealthy) {
        return {
          status: 'ok',
          service: 'ollama',
          available: true,
        };
      } else {
        reply.status(503).send({
          status: 'unavailable',
          service: 'ollama',
          available: false,
        });
      }
    } catch (error) {
      reply.status(503).send({
        status: 'error',
        service: 'ollama',
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
};

export default paraphraseRoute;