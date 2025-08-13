import { supabaseAdmin, isSupabaseConfigured } from '../lib/supabase';
import type { Database } from '../lib/database.types';

export type TableName = keyof Database['public']['Tables'];

export abstract class BaseRepository<T extends TableName> {
  protected tableName: T;
  protected supabase = supabaseAdmin;

  constructor(tableName: T) {
    this.tableName = tableName;
  }

  /**
   * Check if database is configured and available
   */
  protected isAvailable(): boolean {
    return isSupabaseConfigured();
  }

  /**
   * Get all records with optional filters
   */
  async findAll(filters?: Record<string, any>) {
    if (!this.isAvailable()) {
      console.warn(`Database not configured. Returning empty array for ${this.tableName}`);
      return { data: [], error: null };
    }

    let query = this.supabase.from(this.tableName).select('*');

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key as any, value);
        }
      });
    }

    return await query;
  }

  /**
   * Get a single record by ID
   */
  async findById(id: string) {
    if (!this.isAvailable()) {
      console.warn(`Database not configured. Returning null for ${this.tableName}:${id}`);
      return { data: null, error: null };
    }

    return await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();
  }

  /**
   * Create a new record
   */
  async create(data: Database['public']['Tables'][T]['Insert']) {
    if (!this.isAvailable()) {
      console.warn(`Database not configured. Cannot create record in ${this.tableName}`);
      return { data: null, error: new Error('Database not configured') };
    }

    return await this.supabase
      .from(this.tableName)
      .insert(data as any)
      .select()
      .single();
  }

  /**
   * Update a record by ID
   */
  async update(id: string, data: Database['public']['Tables'][T]['Update']) {
    if (!this.isAvailable()) {
      console.warn(`Database not configured. Cannot update record in ${this.tableName}`);
      return { data: null, error: new Error('Database not configured') };
    }

    return await this.supabase
      .from(this.tableName)
      .update(data as any)
      .eq('id', id)
      .select()
      .single();
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string) {
    if (!this.isAvailable()) {
      console.warn(`Database not configured. Cannot delete record from ${this.tableName}`);
      return { data: null, error: new Error('Database not configured') };
    }

    return await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);
  }

  /**
   * Bulk insert records
   */
  async bulkCreate(data: Database['public']['Tables'][T]['Insert'][]) {
    if (!this.isAvailable()) {
      console.warn(`Database not configured. Cannot bulk create in ${this.tableName}`);
      return { data: null, error: new Error('Database not configured') };
    }

    return await this.supabase
      .from(this.tableName)
      .insert(data as any)
      .select();
  }

  /**
   * Count records with optional filters
   */
  async count(filters?: Record<string, any>) {
    if (!this.isAvailable()) {
      console.warn(`Database not configured. Returning 0 count for ${this.tableName}`);
      return { count: 0, error: null };
    }

    let query = this.supabase.from(this.tableName).select('*', { count: 'exact', head: true });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key as any, value);
        }
      });
    }

    return await query;
  }
}