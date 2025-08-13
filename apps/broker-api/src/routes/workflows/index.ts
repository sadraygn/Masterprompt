import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { WorkflowRegistry, WorkflowExecutor, registerBuiltinWorkflows } from '@prompt-studio/workflows';
import { FlowiseService } from '../../services/flowise.service.js';
import { workflowsRepository, evaluationsRepository } from '../../repositories/index.js';

const workflowSchema = {
  params: Type.Object({
    id: Type.String(),
  }),
};

const executeSchema = {
  body: Type.Object({
    workflowId: Type.String(),
    input: Type.Object({}),
    config: Type.Optional(Type.Object({})),
  }),
};

const syncSchema = {
  body: Type.Object({
    workflowId: Type.String(),
    direction: Type.Union([Type.Literal('toFlowise'), Type.Literal('fromFlowise')]),
    data: Type.Optional(Type.Any()),
  }),
};

const workflowsRoute: FastifyPluginAsync = async (fastify) => {
  const registry = WorkflowRegistry.getInstance();
  const executor = new WorkflowExecutor();
  const flowiseService = new FlowiseService();

  // Register built-in workflows
  registerBuiltinWorkflows();

  // Enable hot reloading in development
  if (process.env.NODE_ENV !== 'production') {
    registry.enableHotReload();
  }

  // List all workflows
  fastify.get('/', async (request, reply) => {
    try {
      // Get workflows from registry (in-memory)
      const registryWorkflows = registry.list();
      
      // Try to get workflows from database
      const { data: dbWorkflows, error: dbError } = await workflowsRepository.findActive();
      
      if (dbError) {
        fastify.log.warn('Failed to fetch workflows from database:', dbError);
      }
      
      // Merge workflows from both sources
      const workflowMap = new Map();
      
      // Add registry workflows
      registryWorkflows.forEach(w => workflowMap.set(w.id, { ...w, source: 'registry' }));
      
      // Add/update with database workflows
      if (dbWorkflows) {
        dbWorkflows.forEach(w => {
          if (workflowMap.has(w.name)) {
            // Update with database metadata
            const existing = workflowMap.get(w.name);
            workflowMap.set(w.name, {
              ...existing,
              dbId: w.id,
              updatedAt: w.updated_at,
              source: 'both',
            });
          } else {
            // Add database-only workflow
            workflowMap.set(w.name, {
              id: w.name,
              name: w.name,
              description: w.description,
              config: w.config,
              dbId: w.id,
              source: 'database',
              createdAt: w.created_at,
              updatedAt: w.updated_at,
            });
          }
        });
      }
      
      return Array.from(workflowMap.values());
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: {
          message: 'Failed to list workflows',
          type: 'internal_error',
        },
      });
    }
  });

  // Get specific workflow
  fastify.get('/:id', {
    schema: workflowSchema,
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const workflow = registry.get(id);
      if (!workflow) {
        reply.status(404).send({
          error: {
            message: 'Workflow not found',
            type: 'not_found',
          },
        });
        return;
      }
      
      return {
        metadata: workflow.metadata,
        config: workflow.config,
        export: workflow.export(),
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: {
          message: 'Failed to get workflow',
          type: 'internal_error',
        },
      });
    }
  });

  // Execute workflow
  fastify.post('/execute', {
    schema: executeSchema,
  }, async (request, reply) => {
    const startTime = Date.now();
    const { workflowId, input, config } = request.body as { workflowId: string; input: Record<string, any>; config?: Record<string, any> };
    
    try {
      // Broadcast workflow started event
      fastify.broadcastWorkflowEvent(workflowId, 'started', {
        timestamp: new Date(),
        input,
      });
      
      const result = await executor.execute({
        workflowId,
        input,
        config,
        context: {
          userId: (request as any).userId,
          sessionId: (request as any).sessionId,
        },
      });
      
      const executionTime = Date.now() - startTime;
      
      // Save evaluation to database
      const evaluationData = {
        workflow_id: workflowId,
        input_data: input,
        output_data: result,
        metrics: {
          executionTime,
          success: true,
        },
        user_id: (request as any).userId,
      };
      
      const { error: saveError } = await evaluationsRepository.create(evaluationData);
      if (saveError) {
        fastify.log.warn('Failed to save evaluation:', saveError);
      }
      
      // Broadcast workflow completed event
      fastify.broadcastWorkflowEvent(workflowId, 'completed', {
        timestamp: new Date(),
        result,
        executionTime,
      });
      
      return result;
    } catch (error) {
      fastify.log.error(error);
      
      // Broadcast workflow failed event
      fastify.broadcastWorkflowEvent(workflowId, 'failed', {
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
      });
      
      reply.status(500).send({
        error: {
          message: error instanceof Error ? error.message : 'Failed to execute workflow',
          type: 'execution_error',
        },
      });
    }
  });

  // Sync with Flowise
  fastify.post('/sync', {
    schema: syncSchema,
  }, async (request, reply) => {
    try {
      const { workflowId, direction, data } = request.body as { workflowId: string; direction: 'toFlowise' | 'fromFlowise'; data?: any };
      
      if (direction === 'toFlowise') {
        // Export LCEL workflow to Flowise
        const workflow = registry.get(workflowId);
        if (!workflow) {
          reply.status(404).send({
            error: {
              message: 'Workflow not found',
              type: 'not_found',
            },
          });
          return;
        }
        
        const exported = workflow.export();
        const flowiseFormat = flowiseService.convertLCELToFlowise(exported);
        
        // Check if chatflow exists
        const chatflows = await flowiseService.getChatflows();
        const existing = chatflows.find(cf => cf.name === workflow.metadata.name);
        
        let chatflow;
        if (existing) {
          // Update existing
          chatflow = await flowiseService.updateChatflow(existing.id, {
            flowData: JSON.stringify(flowiseFormat),
          });
        } else {
          // Create new
          chatflow = await flowiseService.createChatflow(
            workflow.metadata.name,
            flowiseFormat
          );
        }
        
        return {
          success: true,
          chatflowId: chatflow.id,
          message: existing ? 'Workflow updated in Flowise' : 'Workflow created in Flowise',
        };
        
      } else if (direction === 'fromFlowise') {
        // Import from Flowise to LCEL
        if (!data || !data.chatflowId) {
          reply.status(400).send({
            error: {
              message: 'chatflowId required for import',
              type: 'bad_request',
            },
          });
          return;
        }
        
        const chatflow = await flowiseService.getChatflow(data.chatflowId);
        const lcelFormat = flowiseService.convertFlowiseToLCEL(chatflow.flowData);
        
        // TODO: Create or update LCEL workflow from Flowise data
        // This would require dynamic workflow creation
        
        return {
          success: true,
          workflowId,
          data: lcelFormat,
          message: 'Workflow imported from Flowise',
        };
      }
      
      reply.status(400).send({
        error: {
          message: 'Invalid sync direction',
          type: 'bad_request',
        },
      });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: {
          message: error instanceof Error ? error.message : 'Failed to sync workflow',
          type: 'sync_error',
        },
      });
    }
  });

  // List Flowise chatflows
  fastify.get('/flowise/chatflows', {
  }, async (request, reply) => {
    try {
      const chatflows = await flowiseService.getChatflows();
      return chatflows;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: {
          message: 'Failed to list Flowise chatflows',
          type: 'internal_error',
        },
      });
    }
  });
};

export default workflowsRoute;