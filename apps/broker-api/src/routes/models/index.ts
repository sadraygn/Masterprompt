import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { BrokerService } from '../../services/broker.service.js';

const modelsSchema = {
  response: {
    200: Type.Object({
      object: Type.Literal('list'),
      data: Type.Array(Type.Object({
        id: Type.String(),
        object: Type.Literal('model'),
        created: Type.Number(),
        owned_by: Type.String(),
      })),
    }),
  },
};

const modelsRoute: FastifyPluginAsync = async (fastify) => {
  const broker = new BrokerService();

  fastify.get('/models', {
    schema: modelsSchema,
  }, async (request, reply) => {
    try {
      const models = await broker.listModels();
      return {
        object: 'list',
        data: models,
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: {
          message: error instanceof Error ? error.message : 'Failed to list models',
          type: 'internal_error',
        },
      });
    }
  });
};

export default modelsRoute;