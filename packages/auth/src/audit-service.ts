import { AuditLog, AuditEventType, AuditLogSchema } from './types.js';
import { v4 as uuidv4 } from 'uuid';
// import type { FastifyBaseLogger } from 'fastify';

export interface AuditServiceOptions {
  storage: 'memory' | 'database' | 'redis';
  retention?: number;
}

export interface AuditStorage {
  save(log: AuditLog): Promise<void>;
  query(filters: AuditQueryFilters): Promise<AuditLog[]>;
}

export interface AuditQueryFilters {
  userId?: string;
  eventType?: AuditEventType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditLogEntry {
  userId?: string;
  eventType: AuditEventType;
  resource?: string;
  action: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  private storage: 'memory' | 'database' | 'redis';
  private retention: number;
  private memoryStore: AuditLog[] = [];

  constructor(options: AuditServiceOptions) {
    this.storage = options.storage;
    this.retention = options.retention || 90;
  }

  async log(entry: AuditLogEntry): Promise<void> {
    const auditLog: AuditLog = {
      id: uuidv4(),
      ...entry,
      timestamp: new Date(),
    };

    // Validate the audit log
    try {
      AuditLogSchema.parse(auditLog);
    } catch (error) {
      console.error('Invalid audit log entry:', error);
      return;
    }

    // Save to appropriate storage
    if (this.storage === 'memory') {
      this.memoryStore.push(auditLog);
      // Implement retention policy for memory storage
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retention);
      this.memoryStore = this.memoryStore.filter(log => log.timestamp > cutoffDate);
    } else {
      // TODO: Implement database/redis storage
      console.log(`Audit log: ${entry.eventType} - ${entry.action}`);
    }
  }

  async query(filters: AuditQueryFilters): Promise<AuditLog[]> {
    const { limit = 100 } = filters;
    
    // For memory storage, filter manually
    if (this.storage === 'memory') {
      const logs = Array.from(this.memoryStore);
      // TODO: Apply filters and sorting
      return logs.slice(-limit);
    }
    
    // TODO: Implement database/redis query
    return [];
  }
}

// In-memory storage implementation for development
export class InMemoryAuditStorage implements AuditStorage {
  private logs: AuditLog[] = [];

  async save(log: AuditLog): Promise<void> {
    this.logs.push(log);
    
    // Keep only last 10000 logs in memory
    if (this.logs.length > 10000) {
      this.logs = this.logs.slice(-10000);
    }
  }

  async query(filters: AuditQueryFilters): Promise<AuditLog[]> {
    let results = [...this.logs];

    if (filters.userId) {
      results = results.filter(log => log.userId === filters.userId);
    }

    if (filters.eventType) {
      results = results.filter(log => log.eventType === filters.eventType);
    }

    if (filters.startDate) {
      results = results.filter(log => log.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      results = results.filter(log => log.timestamp <= filters.endDate!);
    }

    // Sort by timestamp descending
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 100;
    results = results.slice(offset, offset + limit);

    return results;
  }
}

// PostgreSQL storage implementation
export class PostgresAuditStorage implements AuditStorage {
  // This would be implemented with actual database queries
  // For now, it's a placeholder
  
  async save(_log: AuditLog): Promise<void> {
    // INSERT INTO audit_logs (...) VALUES (...)
    throw new Error('PostgreSQL audit storage not implemented');
  }

  async query(_filters: AuditQueryFilters): Promise<AuditLog[]> {
    // SELECT * FROM audit_logs WHERE ...
    throw new Error('PostgreSQL audit storage not implemented');
  }
}