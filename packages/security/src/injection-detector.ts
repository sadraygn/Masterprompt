import { OpenAI } from 'openai';

export interface InjectionDetectionResult {
  isInjection: boolean;
  score: number;
  reasons: string[];
  details: {
    heuristicScore: number;
    moderationScore: number;
    patternMatches: string[];
  };
}

export interface InjectionDetectorConfig {
  threshold?: number;
  openaiApiKey?: string;
  enableModeration?: boolean;
  customPatterns?: RegExp[];
}

export class InjectionDetector {
  private threshold: number;
  private openai: OpenAI | null = null;
  private enableModeration: boolean;
  private patterns: RegExp[];

  // Common injection patterns
  private static readonly DEFAULT_PATTERNS: RegExp[] = [
    // Direct injection attempts
    /ignore\s+(all\s+)?(previous|prior|above|preceding)\s+(instructions?|prompts?|commands?)/i,
    /disregard\s+(all\s+)?(previous|prior|above|preceding)/i,
    /forget\s+(everything|all|previous|prior)/i,
    
    // Role hijacking
    /you\s+are\s+now\s+[a-z]/i,
    /act\s+as\s+(?:a\s+)?(?!assistant)/i,
    /pretend\s+(?:to\s+be|you\s+are)/i,
    /new\s+instructions?:\s*/i,
    
    // System command attempts
    /\bsystem\s*[:>]\s*/i,
    /\b(admin|root)\s+access/i,
    /\bexecute\s+command/i,
    
    // Data extraction attempts
    /(?:show|display|print|output|reveal|list)\s+(?:all\s+)?(?:your\s+)?(?:initial|system|hidden|secret|private)\s+(?:prompt|instructions?|commands?|rules?)/i,
    /what\s+(?:are\s+)?your\s+(?:initial\s+)?instructions?/i,
    /repeat\s+(?:your\s+)?(?:system\s+)?(?:prompt|instructions?)/i,
    
    // SQL injection patterns
    /'\s*(?:OR|AND)\s*'?1'?\s*=\s*'?1/i,
    /;\s*(?:DROP|DELETE|TRUNCATE|UPDATE)\s+(?:TABLE|DATABASE)/i,
    /UNION\s+(?:ALL\s+)?SELECT/i,
    
    // Code injection
    /<script[^>]*>/i,
    /javascript:/i,
    /on(?:click|load|error|mouseover)\s*=/i,
    
    // Encoded injection attempts
    /\\x[0-9a-f]{2}/i,
    /\\u[0-9a-f]{4}/i,
    /%[0-9a-f]{2}/i,
  ];

  constructor(config: InjectionDetectorConfig = {}) {
    this.threshold = config.threshold ?? 0.7;
    this.enableModeration = config.enableModeration ?? true;
    this.patterns = [
      ...InjectionDetector.DEFAULT_PATTERNS,
      ...(config.customPatterns || []),
    ];

    if (this.enableModeration && config.openaiApiKey) {
      this.openai = new OpenAI({ apiKey: config.openaiApiKey });
    }
  }

  /**
   * Detect potential prompt injection attempts
   */
  async detect(input: string): Promise<InjectionDetectionResult> {
    const result: InjectionDetectionResult = {
      isInjection: false,
      score: 0,
      reasons: [],
      details: {
        heuristicScore: 0,
        moderationScore: 0,
        patternMatches: [],
      },
    };

    // 1. Heuristic pattern matching
    const heuristicResult = this.runHeuristicDetection(input);
    result.details.heuristicScore = heuristicResult.score;
    result.details.patternMatches = heuristicResult.matches;
    
    if (heuristicResult.score > 0) {
      result.reasons.push(...heuristicResult.reasons);
    }

    // 2. OpenAI Moderation API (if enabled)
    let moderationScore = 0;
    if (this.enableModeration && this.openai) {
      try {
        const moderationResult = await this.runModerationCheck(input);
        moderationScore = moderationResult.score;
        result.details.moderationScore = moderationScore;
        
        if (moderationResult.flagged) {
          result.reasons.push(...moderationResult.reasons);
        }
      } catch (error) {
        console.warn('Moderation check failed:', error);
        // Continue without moderation score
      }
    }

    // 3. Calculate combined score
    // Weight: 70% heuristic, 30% moderation
    result.score = (heuristicResult.score * 0.7) + (moderationScore * 0.3);
    
    // 4. Determine if injection based on threshold
    result.isInjection = result.score >= this.threshold;

    return result;
  }

  /**
   * Run heuristic pattern-based detection
   */
  private runHeuristicDetection(input: string): {
    score: number;
    matches: string[];
    reasons: string[];
  } {
    const matches: string[] = [];
    const reasons: string[] = [];
    let score = 0;

    // Check each pattern
    for (const pattern of this.patterns) {
      const match = input.match(pattern);
      if (match) {
        matches.push(match[0]);
        score += 0.3; // Each pattern match adds to score
      }
    }

    // Additional heuristics
    
    // Check for suspicious length (very short prompts trying to override)
    if (input.length < 20 && /^(ignore|forget|disregard)/i.test(input)) {
      score += 0.4;
      reasons.push('Suspicious short override command');
    }

    // Check for multiple instruction markers
    const instructionMarkers = (input.match(/[:\->]\s*(ignore|forget|new|system)/gi) || []).length;
    if (instructionMarkers > 1) {
      score += 0.2 * instructionMarkers;
      reasons.push(`Multiple instruction override attempts (${instructionMarkers})`);
    }

    // Check for encoded content
    if (/(%[0-9a-f]{2}|\\x[0-9a-f]{2}|\\u[0-9a-f]{4}){3,}/i.test(input)) {
      score += 0.3;
      reasons.push('Encoded content detected');
    }

    // Cap score at 1.0
    score = Math.min(score, 1.0);

    if (matches.length > 0) {
      reasons.push(`Pattern matches: ${matches.join(', ')}`);
    }

    return { score, matches, reasons };
  }

  /**
   * Run OpenAI moderation check
   */
  private async runModerationCheck(input: string): Promise<{
    score: number;
    flagged: boolean;
    reasons: string[];
  }> {
    if (!this.openai) {
      return { score: 0, flagged: false, reasons: [] };
    }

    const moderation = await this.openai.moderations.create({ input });
    const result = moderation.results[0];
    
    if (!result) {
      return { score: 0, flagged: false, reasons: [] };
    }

    const reasons: string[] = [];
    let score = 0;

    // Check if any category was flagged
    if (result.flagged) {
      const flaggedCategories = Object.entries(result.categories)
        .filter(([_, flagged]) => flagged)
        .map(([category]) => category);
      
      reasons.push(`OpenAI moderation flagged: ${flaggedCategories.join(', ')}`);
      
      // Calculate score based on severity
      const scores = result.category_scores;
      score = Math.max(
        scores.harassment || 0,
        scores['harassment/threatening'] || 0,
        scores['self-harm'] || 0,
        scores['self-harm/intent'] || 0,
        scores['self-harm/instructions'] || 0,
        scores.sexual || 0,
        scores['sexual/minors'] || 0,
        scores.violence || 0,
        scores['violence/graphic'] || 0,
      );
    }

    return { score, flagged: result.flagged, reasons };
  }

  /**
   * Add custom patterns to the detector
   */
  addPatterns(patterns: RegExp[]): void {
    this.patterns.push(...patterns);
  }

  /**
   * Update threshold
   */
  setThreshold(threshold: number): void {
    if (threshold < 0 || threshold > 1) {
      throw new Error('Threshold must be between 0 and 1');
    }
    this.threshold = threshold;
  }

  /**
   * Get current configuration
   */
  getConfig(): {
    threshold: number;
    patternsCount: number;
    moderationEnabled: boolean;
  } {
    return {
      threshold: this.threshold,
      patternsCount: this.patterns.length,
      moderationEnabled: this.enableModeration && !!this.openai,
    };
  }
}