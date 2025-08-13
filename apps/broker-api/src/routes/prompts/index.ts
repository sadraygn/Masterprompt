import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { promptsRepository } from '../../repositories/index.js';

const promptSchema = {
  body: Type.Object({
    title: Type.String({ minLength: 1, maxLength: 255 }),
    description: Type.Optional(Type.String()),
    content: Type.String({ minLength: 1 }),
    category: Type.Optional(Type.String({ maxLength: 100 })),
    tags: Type.Optional(Type.Array(Type.String())),
    metadata: Type.Optional(Type.Object({})),
    is_active: Type.Optional(Type.Boolean()),
  }),
};

const updatePromptSchema = {
  params: Type.Object({
    id: Type.String(),
  }),
  body: Type.Object({
    title: Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
    description: Type.Optional(Type.String()),
    content: Type.Optional(Type.String({ minLength: 1 })),
    category: Type.Optional(Type.String({ maxLength: 100 })),
    tags: Type.Optional(Type.Array(Type.String())),
    metadata: Type.Optional(Type.Object({})),
    is_active: Type.Optional(Type.Boolean()),
  }),
};

const promptsRoute: FastifyPluginAsync = async (fastify) => {
  // List all prompts
  fastify.get('/', async (request, reply) => {
    try {
      const { category, tags, search, limit = 50 } = request.query as any;
      
      let result;
      if (search) {
        result = await promptsRepository.search(search);
      } else if (category) {
        result = await promptsRepository.findByCategory(category);
      } else if (tags && Array.isArray(tags)) {
        result = await promptsRepository.findByTags(tags);
      } else {
        result = await promptsRepository.findPublic(limit);
      }
      
      if (result.error) {
        throw result.error;
      }
      
      return result.data || [];
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: {
          message: 'Failed to list prompts',
          type: 'internal_error',
        },
      });
    }
  });

  // Get a specific prompt
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { data, error } = await promptsRepository.findById(id);
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        reply.status(404).send({
          error: {
            message: 'Prompt not found',
            type: 'not_found',
          },
        });
        return;
      }
      
      return data;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: {
          message: 'Failed to get prompt',
          type: 'internal_error',
        },
      });
    }
  });

  // Create a new prompt
  fastify.post('/', {
    schema: promptSchema,
  }, async (request, reply) => {
    try {
      const promptData = {
        ...request.body,
        user_id: (request as any).userId,
      };
      
      const { data, error } = await promptsRepository.create(promptData);
      
      if (error) {
        throw error;
      }
      
      reply.status(201).send(data);
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: {
          message: 'Failed to create prompt',
          type: 'internal_error',
        },
      });
    }
  });

  // Update a prompt
  fastify.put('/:id', {
    schema: updatePromptSchema,
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = (request as any).userId;
      
      // Check if prompt exists and user owns it
      const { data: existing, error: fetchError } = await promptsRepository.findById(id);
      
      if (fetchError) {
        throw fetchError;
      }
      
      if (!existing) {
        reply.status(404).send({
          error: {
            message: 'Prompt not found',
            type: 'not_found',
          },
        });
        return;
      }
      
      // Check ownership (allow if no user_id or matches)
      if (existing.user_id && existing.user_id !== userId) {
        reply.status(403).send({
          error: {
            message: 'You do not have permission to update this prompt',
            type: 'forbidden',
          },
        });
        return;
      }
      
      const { data, error } = await promptsRepository.update(id, request.body);
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: {
          message: 'Failed to update prompt',
          type: 'internal_error',
        },
      });
    }
  });

  // Delete a prompt
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = (request as any).userId;
      
      // Check if prompt exists and user owns it
      const { data: existing, error: fetchError } = await promptsRepository.findById(id);
      
      if (fetchError) {
        throw fetchError;
      }
      
      if (!existing) {
        reply.status(404).send({
          error: {
            message: 'Prompt not found',
            type: 'not_found',
          },
        });
        return;
      }
      
      // Check ownership (allow if no user_id or matches)
      if (existing.user_id && existing.user_id !== userId) {
        reply.status(403).send({
          error: {
            message: 'You do not have permission to delete this prompt',
            type: 'forbidden',
          },
        });
        return;
      }
      
      const { error } = await promptsRepository.delete(id);
      
      if (error) {
        throw error;
      }
      
      reply.status(204).send();
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: {
          message: 'Failed to delete prompt',
          type: 'internal_error',
        },
      });
    }
  });

  // Clone a prompt
  fastify.post('/:id/clone', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = (request as any).userId;
      const { title, ...updates } = request.body as any;
      
      const { data, error } = await promptsRepository.clone(id, userId, {
        title,
        ...updates,
      });
      
      if (error) {
        throw error;
      }
      
      reply.status(201).send(data);
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: {
          message: 'Failed to clone prompt',
          type: 'internal_error',
        },
      });
    }
  });

  // Get prompt statistics
  fastify.get('/stats', async (request, reply) => {
    try {
      const userId = (request as any).userId;
      const stats = await promptsRepository.getStats(userId);
      
      return stats;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: {
          message: 'Failed to get prompt statistics',
          type: 'internal_error',
        },
      });
    }
  });
};

export default promptsRoute;