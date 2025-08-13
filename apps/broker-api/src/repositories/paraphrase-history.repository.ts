import { BaseRepository } from './base.repository';
import type { Tables, Inserts } from '../lib/database.types';

export type ParaphraseHistory = Tables<'paraphrase_history'>;
export type ParaphraseHistoryInsert = Inserts<'paraphrase_history'>;

export class ParaphraseHistoryRepository extends BaseRepository<'paraphrase_history'> {
  constructor() {
    super('paraphrase_history');
  }

  /**
   * Get paraphrase history by user
   */
  async findByUser(userId: string, limit = 50) {
    if (!this.isAvailable()) {
      return { data: [], error: null };
    }

    return await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
  }

  /**
   * Get paraphrase history by style
   */
  async findByStyle(style: string) {
    if (!this.isAvailable()) {
      return { data: [], error: null };
    }

    return await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('style', style)
      .order('created_at', { ascending: false });
  }

  /**
   * Get paraphrase history by model
   */
  async findByModel(model: string) {
    if (!this.isAvailable()) {
      return { data: [], error: null };
    }

    return await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('model', model)
      .order('created_at', { ascending: false });
  }

  /**
   * Search paraphrase history
   */
  async search(query: string) {
    if (!this.isAvailable()) {
      return { data: [], error: null };
    }

    return await this.supabase
      .from(this.tableName)
      .select('*')
      .or(`original_text.ilike.%${query}%,paraphrased_text.ilike.%${query}%`)
      .order('created_at', { ascending: false });
  }

  /**
   * Save paraphrase result
   */
  async saveParaphrase(
    originalText: string,
    paraphrasedText: string,
    options: {
      style?: string;
      tone?: string;
      model?: string;
      userId?: string;
      metadata?: any;
    } = {}
  ) {
    if (!this.isAvailable()) {
      console.warn('Database not configured. Cannot save paraphrase history');
      return { data: null, error: new Error('Database not configured') };
    }

    const data: ParaphraseHistoryInsert = {
      original_text: originalText,
      paraphrased_text: paraphrasedText,
      style: options.style,
      tone: options.tone,
      model: options.model,
      user_id: options.userId,
      metadata: options.metadata,
    };

    return await this.create(data);
  }

  /**
   * Get paraphrase statistics
   */
  async getStats(userId?: string) {
    if (!this.isAvailable()) {
      return {
        total: 0,
        byStyle: {},
        byModel: {},
        recentParaphrases: [],
      };
    }

    const filters = userId ? { user_id: userId } : {};
    
    // Get all paraphrases for stats
    const { data: paraphrases } = await this.findAll(filters);
    
    if (!paraphrases || paraphrases.length === 0) {
      return {
        total: 0,
        byStyle: {},
        byModel: {},
        recentParaphrases: [],
      };
    }

    // Group by style
    const byStyle: Record<string, number> = {};
    paraphrases.forEach(p => {
      const style = p.style || 'default';
      byStyle[style] = (byStyle[style] || 0) + 1;
    });

    // Group by model
    const byModel: Record<string, number> = {};
    paraphrases.forEach(p => {
      const model = p.model || 'unknown';
      byModel[model] = (byModel[model] || 0) + 1;
    });

    // Get recent paraphrases
    const recentParaphrases = paraphrases
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        original: p.original_text.substring(0, 50) + '...',
        paraphrased: p.paraphrased_text.substring(0, 50) + '...',
        style: p.style,
        created_at: p.created_at,
      }));

    return {
      total: paraphrases.length,
      byStyle,
      byModel,
      recentParaphrases,
    };
  }
}