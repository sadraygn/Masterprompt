import { BaseRepository } from './base.repository';
import type { Tables, Inserts } from '../lib/database.types';

export type Evaluation = Tables<'evaluations'>;
export type EvaluationInsert = Inserts<'evaluations'>;

export class EvaluationsRepository extends BaseRepository<'evaluations'> {
  constructor() {
    super('evaluations');
  }

  /**
   * Get evaluations by prompt
   */
  async findByPrompt(promptId: string) {
    if (!this.isAvailable()) {
      return { data: [], error: null };
    }

    return await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('prompt_id', promptId)
      .order('created_at', { ascending: false });
  }

  /**
   * Get evaluations by workflow
   */
  async findByWorkflow(workflowId: string) {
    if (!this.isAvailable()) {
      return { data: [], error: null };
    }

    return await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('workflow_id', workflowId)
      .order('created_at', { ascending: false });
  }

  /**
   * Get evaluations by model
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
   * Get evaluations by user
   */
  async findByUser(userId: string, limit = 100) {
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
   * Get evaluation statistics
   */
  async getStats(userId?: string) {
    if (!this.isAvailable()) {
      return {
        total: 0,
        averageScore: 0,
        byModel: {},
        topPerformers: [],
      };
    }

    const filters = userId ? { user_id: userId } : {};
    
    // Get all evaluations for stats
    const { data: evaluations } = await this.findAll(filters);
    
    if (!evaluations || evaluations.length === 0) {
      return {
        total: 0,
        averageScore: 0,
        byModel: {},
        topPerformers: [],
      };
    }

    // Calculate average score
    const scores = evaluations
      .filter(e => e.score !== null)
      .map(e => e.score as number);
    const averageScore = scores.length > 0 
      ? scores.reduce((a, b) => a + b, 0) / scores.length 
      : 0;

    // Group by model
    const byModel: Record<string, { count: number; avgScore: number }> = {};
    evaluations.forEach(e => {
      const model = e.model || 'unknown';
      if (!byModel[model]) {
        byModel[model] = { count: 0, avgScore: 0 };
      }
      byModel[model].count++;
      if (e.score) {
        byModel[model].avgScore = 
          (byModel[model].avgScore * (byModel[model].count - 1) + e.score) / 
          byModel[model].count;
      }
    });

    // Get top performers
    const topPerformers = evaluations
      .filter(e => e.score !== null)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5)
      .map(e => ({
        id: e.id,
        score: e.score,
        model: e.model,
        prompt_id: e.prompt_id,
        created_at: e.created_at,
      }));

    return {
      total: evaluations.length,
      averageScore,
      byModel,
      topPerformers,
    };
  }
}