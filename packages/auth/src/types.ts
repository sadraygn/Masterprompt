import { z } from 'zod';

// User roles
export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

// User schema
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().optional(),
  role: z.nativeEnum(UserRole),
  permissions: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastLoginAt: z.date().optional(),
});

export type User = z.infer<typeof UserSchema>;

// Session schema
export const SessionSchema = z.object({
  id: z.string(),
  userId: z.string().uuid(),
  expiresAt: z.date(),
  data: z.record(z.any()).optional(),
});

export type Session = z.infer<typeof SessionSchema>;

// SAML configuration
export const SAMLConfigSchema = z.object({
  entryPoint: z.string().url(),
  issuer: z.string(),
  cert: z.string(),
  privateKey: z.string().optional(),
  signatureAlgorithm: z.enum(['sha256', 'sha512']).default('sha256'),
  identifierFormat: z.string().optional(),
  acceptedClockSkewMs: z.number().default(0),
  attributeMapping: z.object({
    email: z.string().default('email'),
    name: z.string().default('name'),
    role: z.string().default('role'),
  }).optional(),
});

export type SAMLConfig = z.infer<typeof SAMLConfigSchema>;

// JWT payload
export const JWTPayloadSchema = z.object({
  sub: z.string().uuid(),
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
  permissions: z.array(z.string()),
  iat: z.number(),
  exp: z.number(),
});

export type JWTPayload = z.infer<typeof JWTPayloadSchema>;

// Auth configuration
export interface AuthConfig {
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  session: {
    secret: string;
    cookieName: string;
    maxAge: number;
    secure: boolean;
    httpOnly: boolean;
    sameSite: 'strict' | 'lax' | 'none';
  };
  saml?: {
    enabled: boolean;
    providers: Record<string, SAMLConfig>;
  };
  redis: {
    url: string;
    keyPrefix: string;
  };
}

// Permission definitions
export const Permissions = {
  // Workflow permissions
  WORKFLOW_CREATE: 'workflow:create',
  WORKFLOW_READ: 'workflow:read',
  WORKFLOW_UPDATE: 'workflow:update',
  WORKFLOW_DELETE: 'workflow:delete',
  WORKFLOW_EXECUTE: 'workflow:execute',
  
  // Prompt permissions
  PROMPT_CREATE: 'prompt:create',
  PROMPT_READ: 'prompt:read',
  PROMPT_UPDATE: 'prompt:update',
  PROMPT_DELETE: 'prompt:delete',
  PROMPT_SHARE: 'prompt:share',
  
  // Admin permissions
  ADMIN_USERS: 'admin:users',
  ADMIN_BILLING: 'admin:billing',
  ADMIN_SETTINGS: 'admin:settings',
  ADMIN_AUDIT: 'admin:audit',
  
  // API permissions
  API_KEY_CREATE: 'api:key:create',
  API_KEY_REVOKE: 'api:key:revoke',
  
  // Cache permissions
  CACHE_INVALIDATE: 'cache:invalidate',
  CACHE_VIEW: 'cache:view',
} as const;

// Role-based permission mapping
export const RolePermissions: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: Object.values(Permissions),
  [UserRole.EDITOR]: [
    Permissions.WORKFLOW_CREATE,
    Permissions.WORKFLOW_READ,
    Permissions.WORKFLOW_UPDATE,
    Permissions.WORKFLOW_EXECUTE,
    Permissions.PROMPT_CREATE,
    Permissions.PROMPT_READ,
    Permissions.PROMPT_UPDATE,
    Permissions.PROMPT_SHARE,
    Permissions.API_KEY_CREATE,
    Permissions.API_KEY_REVOKE,
  ],
  [UserRole.VIEWER]: [
    Permissions.WORKFLOW_READ,
    Permissions.WORKFLOW_EXECUTE,
    Permissions.PROMPT_READ,
  ],
};

// Audit log event types
export enum AuditEventType {
  LOGIN = 'auth.login',
  LOGOUT = 'auth.logout',
  LOGIN_FAILED = 'auth.login.failed',
  PERMISSION_DENIED = 'auth.permission.denied',
  API_KEY_CREATED = 'auth.api_key.created',
  API_KEY_REVOKED = 'auth.api_key.revoked',
  ROLE_CHANGED = 'auth.role.changed',
}

// Audit log entry
export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().optional(),
  eventType: z.nativeEnum(AuditEventType),
  resource: z.string().optional(),
  action: z.string(),
  metadata: z.record(z.any()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: z.date(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;