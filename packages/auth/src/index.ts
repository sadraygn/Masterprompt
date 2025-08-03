export * from './types.js';
export * from './audit-service.js';
export { default as samlPlugin } from './saml-plugin.js';
export { default as rbacPlugin } from './rbac-plugin.js';

// JWT utilities
import jwt from 'jsonwebtoken';
import { JWTPayload, User, RolePermissions } from './types.js';

export interface JWTService {
  sign(user: User): string;
  verify(token: string): JWTPayload;
  refresh(token: string): string;
}

export function createJWTService(secret: string, _options?: {
  expiresIn?: string;
  refreshExpiresIn?: string;
}): JWTService {

  return {
    sign(user: User): string {
      const payload: JWTPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        permissions: [...RolePermissions[user.role], ...(user.permissions || [])],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
      };

      return jwt.sign(payload, secret);
    },

    verify(token: string): JWTPayload {
      return jwt.verify(token, secret) as JWTPayload;
    },

    refresh(token: string): string {
      const payload = this.verify(token);
      
      // Create new token with updated expiration
      const newPayload: JWTPayload = {
        ...payload,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
      };

      return jwt.sign(newPayload, secret);
    },
  };
}

// API Key management
export interface APIKey {
  id: string;
  key: string;
  name: string;
  userId: string;
  permissions: string[];
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdAt: Date;
}

export interface APIKeyService {
  create(userId: string, name: string, permissions: string[], expiresAt?: Date): Promise<APIKey>;
  verify(key: string): Promise<APIKey | null>;
  revoke(id: string): Promise<void>;
  list(userId: string): Promise<APIKey[]>;
  updateLastUsed(key: string): Promise<void>;
}

// Session management
export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  data?: Record<string, any>;
}

export interface SessionService {
  create(userId: string, data?: Record<string, any>): Promise<string>;
  get(sessionId: string): Promise<Session | null>;
  update(sessionId: string, data: Record<string, any>): Promise<void>;
  destroy(sessionId: string): Promise<void>;
  destroyAll(userId: string): Promise<void>;
}