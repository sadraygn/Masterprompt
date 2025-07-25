import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';

const healthRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', {
    schema: {
      response: {
        200: Type.Object({
          status: Type.Literal('ok'),
          timestamp: Type.String(),
          uptime: Type.Number(),
        }),
      },
    },
  }, async (request, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });
};

export default healthRoute;