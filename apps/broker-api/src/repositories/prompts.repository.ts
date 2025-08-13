import { BaseRepository } from './base.repository';
import type { Database, Tables, Inserts, Updates } from '../lib/database.types';

export type Prompt = Tables<'prompts'>;
export type PromptInsert = Inserts<'prompts'>;
export type PromptUpdate = Updates<'prompts'>;

export class PromptsRepository extends BaseRepository<'prompts'> {
  constructor() {
    super('prompts');
  }

  /**
   * Find prompts by category
   */
  async findByCategory(category: string) {
    if (!this.isAvailable()) {
      return { data: [], error: null };
    }

    return await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
  }

  /**
   * Find prompts by tags (contains any of the provided tags)
   */
  async findByTags(tags: string[]) {
    if (!this.isAvailable()) {
      return { data: [], error: null };
    }

    return await this.supabase
      .from(this.tableName)
      .select('*')
      .overlaps('tags', tags)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
  }

  /**
   * Search prompts by title or description
   */
  async search(query: string) {
    if (!this.isAvailable()) {
      return { data: [], error: null };
    }

    return await this.supabase
      .from(this.tableName)
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,content.ilike.%${query}%`)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
  }

  /**
   * Get prompts by user
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
   * Get public prompts (active and no specific user)
   */
  async findPublic(limit = 50) {
    if (!this.isAvailable()) {
      return { data: [], error: null };
    }

    return await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);
  }

  /**
   * Clone a prompt for a user
   */
  async clone(promptId: string, userId: string, updates?: Partial<PromptInsert>) {
    if (!this.isAvailable()) {
      return { data: null, error: new Error('Database not configured') };
    }

    // Get the original prompt
    const { data: original, error: fetchError } = await this.findById(promptId);
    if (fetchError || !original) {
      return { data: null, error: fetchError || new Error('Prompt not found') };
    }

    // Create a new prompt with the same content
    const newPrompt: PromptInsert = {
      ...original,
      id: undefined, // Let the database generate a new ID
      user_id: userId,
      title: updates?.title || `${original.title} (Copy)`,
      ...updates,
      created_at: undefined,
      updated_at: undefined,
    };

    return await this.create(newPrompt);
  }

  /**
   * Get prompt statistics
   */
  async getStats(userId?: string) {
    if (!this.isAvailable()) {
      return {
        total: 0,
        byCategory: {},
        recentlyUpdated: [],
      };
    }

    const filters = userId ? { user_id: userId } : {};
    
    // Get total count
    const { count: total } = await this.count(filters);

    // Get counts by category
    const { data: categories } = await this.supabase
      .from(this.tableName)
      .select('category')
      .eq('is_active', true);

    const byCategory: Record<string, number> = {};
    if (categories) {
      categories.forEach((item) => {
        const cat = item.category || 'uncategorized';
        byCategory[cat] = (byCategory[cat] || 0) + 1;
      });
    }

    // Get recently updated
    const { data: recentlyUpdated } = await this.supabase
      .from(this.tableName)
      .select('id, title, updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(5);

    return {
      total: total || 0,
      byCategory,
      recentlyUpdated: recentlyUpdated || [],
    };
  }
}