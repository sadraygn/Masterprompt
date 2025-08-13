import { BaseRepository } from './base.repository';
import type { Database, Tables, Inserts, Updates } from '../lib/database.types';

export type Workflow = Tables<'workflows'>;
export type WorkflowInsert = Inserts<'workflows'>;
export type WorkflowUpdate = Updates<'workflows'>;

export class WorkflowsRepository extends BaseRepository<'workflows'> {
  constructor() {
    super('workflows');
  }

  /**
   * Get active workflows
   */
  async findActive() {
    if (!this.isAvailable()) {
      return { data: [], error: null };
    }

    return await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
  }

  /**
   * Get workflows by user
   */
  async findByUser(userId: string) {
    if (!this.isAvailable()) {
      return { data: [], error: null };
    }

    return await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
  }

  /**
   * Search workflows by name or description
   */
  async search(query: string) {
    if (!this.isAvailable()) {
      return { data: [], error: null };
    }

    return await this.supabase
      .from(this.tableName)
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
  }

  /**
   * Clone a workflow for a user
   */
  async clone(workflowId: string, userId: string, updates?: Partial<WorkflowInsert>) {
    if (!this.isAvailable()) {
      return { data: null, error: new Error('Database not configured') };
    }

    // Get the original workflow
    const { data: original, error: fetchError } = await this.findById(workflowId);
    if (fetchError || !original) {
      return { data: null, error: fetchError || new Error('Workflow not found') };
    }

    // Create a new workflow with the same config
    const newWorkflow: WorkflowInsert = {
      ...original,
      id: undefined, // Let the database generate a new ID
      user_id: userId,
      name: updates?.name || `${original.name} (Copy)`,
      ...updates,
      created_at: undefined,
      updated_at: undefined,
    };

    return await this.create(newWorkflow);
  }

  /**
   * Update workflow configuration
   */
  async updateConfig(id: string, config: any) {
    if (!this.isAvailable()) {
      return { data: null, error: new Error('Database not configured') };
    }

    return await this.update(id, { config });
  }

  /**
   * Toggle workflow active status
   */
  async toggleActive(id: string) {
    if (!this.isAvailable()) {
      return { data: null, error: new Error('Database not configured') };
    }

    // Get current status
    const { data: workflow, error: fetchError } = await this.findById(id);
    if (fetchError || !workflow) {
      return { data: null, error: fetchError || new Error('Workflow not found') };
    }

    // Toggle the status
    return await this.update(id, { is_active: !workflow.is_active });
  }

  /**
   * Get workflow statistics
   */
  async getStats(userId?: string) {
    if (!this.isAvailable()) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        recentlyUpdated: [],
      };
    }

    const filters = userId ? { user_id: userId } : {};
    
    // Get total count
    const { count: total } = await this.count(filters);

    // Get active count
    const { count: active } = await this.count({ ...filters, is_active: true });

    // Get inactive count
    const inactive = (total || 0) - (active || 0);

    // Get recently updated
    const { data: recentlyUpdated } = await this.supabase
      .from(this.tableName)
      .select('id, name, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5);

    return {
      total: total || 0,
      active: active || 0,
      inactive,
      recentlyUpdated: recentlyUpdated || [],
    };
  }

  /**
   * Sync with in-memory registry
   */
  async syncWithRegistry(registryWorkflows: any[]) {
    if (!this.isAvailable()) {
      console.warn('Database not configured. Cannot sync workflows');
      return { synced: 0, errors: [] };
    }

    let synced = 0;
    const errors: string[] = [];

    for (const workflow of registryWorkflows) {
      try {
        // Check if workflow exists
        const { data: existing } = await this.supabase
          .from(this.tableName)
          .select('id')
          .eq('name', workflow.name)
          .single();

        if (existing) {
          // Update existing workflow
          await this.update(existing.id, {
            config: workflow,
            is_active: true,
          });
        } else {
          // Create new workflow
          await this.create({
            name: workflow.name,
            description: workflow.description || '',
            config: workflow,
            is_active: true,
          });
        }
        synced++;
      } catch (error) {
        errors.push(`Failed to sync ${workflow.name}: ${error}`);
      }
    }

    return { synced, errors };
  }
}