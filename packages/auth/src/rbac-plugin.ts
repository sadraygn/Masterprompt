import fp from 'fastify-plugin';
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { User, UserRole, RolePermissions, AuditEventType } from './types.js';
import { AuditService } from './audit-service.js';

declare module 'fastify' {
  interface FastifyInstance {
    requireRole: (role: UserRole) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requirePermission: (permission: string) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAnyPermission: (permissions: string[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAllPermissions: (permissions: string[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  
  interface FastifyRequest {
    user?: User;
  }
}

interface RBACPluginOptions {
  auditService: AuditService;
  onPermissionDenied?: (user: User | undefined, permission: string, request: FastifyRequest) => Promise<void>;
}

const rbacPlugin: FastifyPluginAsync<RBACPluginOptions> = async (
  fastify,
  options
) => {
  const { auditService, onPermissionDenied } = options;

  // Helper function to get user permissions
  function getUserPermissions(user: User): Set<string> {
    const rolePermissions = RolePermissions[user.role] || [];
    const allPermissions = new Set([...rolePermissions, ...(user.permissions || [])]);
    return allPermissions;
  }

  // Helper function to check if user has permission
  function hasPermission(user: User | undefined, permission: string): boolean {
    if (!user) return false;
    const permissions = getUserPermissions(user);
    return permissions.has(permission);
  }

  // Require specific role
  fastify.decorate('requireRole', (role: UserRole) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user;

      if (!user) {
        reply.code(401).send({ error: 'Authentication required' });
        return;
      }

      // Admin role has access to everything
      if (user.role === UserRole.ADMIN) {
        return;
      }

      // Check if user has the required role or higher
      const roleHierarchy: Record<UserRole, number> = {
        [UserRole.VIEWER]: 0,
        [UserRole.EDITOR]: 1,
        [UserRole.ADMIN]: 2,
      };

      if (roleHierarchy[user.role] < roleHierarchy[role]) {
        await auditService.log({
          userId: user.id,
          eventType: AuditEventType.PERMISSION_DENIED,
          action: 'role_check_failed',
          metadata: { requiredRole: role, userRole: user.role },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        reply.code(403).send({
          error: 'Forbidden',
          message: `Role ${role} required`,
        });
        return;
      }
    };
  });

  // Require specific permission
  fastify.decorate('requirePermission', (permission: string) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user;

      if (!user) {
        reply.code(401).send({ error: 'Authentication required' });
        return;
      }

      if (!hasPermission(user, permission)) {
        await auditService.log({
          userId: user.id,
          eventType: AuditEventType.PERMISSION_DENIED,
          action: 'permission_check_failed',
          resource: request.url,
          metadata: { requiredPermission: permission },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        if (onPermissionDenied) {
          await onPermissionDenied(user, permission, request);
        }

        reply.code(403).send({
          error: 'Forbidden',
          message: 'Insufficient permissions',
          required: permission,
        });
        return;
      }
    };
  });

  // Require any of the specified permissions
  fastify.decorate('requireAnyPermission', (permissions: string[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user;

      if (!user) {
        reply.code(401).send({ error: 'Authentication required' });
        return;
      }

      const hasAnyPermission = permissions.some(permission => 
        hasPermission(user, permission)
      );

      if (!hasAnyPermission) {
        await auditService.log({
          userId: user.id,
          eventType: AuditEventType.PERMISSION_DENIED,
          action: 'permission_check_failed',
          resource: request.url,
          metadata: { requiredPermissions: permissions },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        reply.code(403).send({
          error: 'Forbidden',
          message: 'Insufficient permissions',
          requiredAny: permissions,
        });
        return;
      }
    };
  });

  // Require all of the specified permissions
  fastify.decorate('requireAllPermissions', (permissions: string[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user;

      if (!user) {
        reply.code(401).send({ error: 'Authentication required' });
        return;
      }

      const missingPermissions = permissions.filter(permission => 
        !hasPermission(user, permission)
      );

      if (missingPermissions.length > 0) {
        await auditService.log({
          userId: user.id,
          eventType: AuditEventType.PERMISSION_DENIED,
          action: 'permission_check_failed',
          resource: request.url,
          metadata: { 
            requiredPermissions: permissions,
            missingPermissions,
          },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        reply.code(403).send({
          error: 'Forbidden',
          message: 'Insufficient permissions',
          requiredAll: permissions,
          missing: missingPermissions,
        });
        return;
      }
    };
  });

  // Add permissions to request for easy access
  fastify.addHook('onRequest', async (request) => {
    if (request.user) {
      (request as any).permissions = getUserPermissions(request.user);
    }
  });

  fastify.log.info('RBAC plugin registered');
};

export default fp(rbacPlugin as any, {
  name: '@prompt-studio/auth-rbac',
  dependencies: [],
});