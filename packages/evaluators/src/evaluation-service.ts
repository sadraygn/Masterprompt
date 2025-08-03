import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface EvaluationConfig {
  configPath?: string;
  outputPath?: string;
  providers?: string[];
  maxConcurrency?: number;
  cache?: boolean;
}

export interface EvaluationResult {
  success: boolean;
  passRate: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: TestResult[];
  summary: {
    byProvider: Record<string, ProviderSummary>;
    byPrompt: Record<string, PromptSummary>;
  };
}

export interface TestResult {
  description: string;
  vars: Record<string, any>;
  success: boolean;
  score: number;
  provider: string;
  prompt: string;
  output: string;
  assertions: AssertionResult[];
}

export interface AssertionResult {
  type: string;
  passed: boolean;
  score?: number;
  reason?: string;
}

export interface ProviderSummary {
  totalTests: number;
  passedTests: number;
  averageScore: number;
}

export interface PromptSummary {
  totalTests: number;
  passedTests: number;
  averageScore: number;
}

export class EvaluationService {
  private configPath: string;
  private outputPath: string;

  constructor(config: EvaluationConfig = {}) {
    this.configPath = config.configPath || 
      path.join(__dirname, '../configs/promptfooconfig.yaml');
    this.outputPath = config.outputPath || 
      path.join(__dirname, '../results');
  }

  /**
   * Run evaluation using Promptfoo CLI
   */
  async runEvaluation(options: {
    filter?: string;
    providers?: string[];
    maxConcurrency?: number;
  } = {}): Promise<EvaluationResult> {
    // Ensure output directory exists
    await fs.mkdir(this.outputPath, { recursive: true });

    // Build command
    const outputFile = path.join(this.outputPath, `evaluation-${Date.now()}.json`);
    let command = `npx promptfoo@latest eval`;
    command += ` --config ${this.configPath}`;
    command += ` --output ${outputFile}`;
    command += ` --no-progress-bar`;
    
    if (options.filter) {
      command += ` --filter-pattern "${options.filter}"`;
    }
    
    if (options.providers?.length) {
      command += ` --providers ${options.providers.join(',')}`;
    }
    
    if (options.maxConcurrency) {
      command += ` --max-concurrency ${options.maxConcurrency}`;
    }

    // Set environment variables
    const env = {
      ...process.env,
      PROMPTFOO_PASS_RATE_THRESHOLD: '0.8',
    };

    try {
      // Run evaluation
      const { stdout, stderr } = await execAsync(command, { env });
      
      if (stderr && !stderr.includes('warning')) {
        console.warn('Evaluation warnings:', stderr);
      }

      // Parse results
      const resultsJson = await fs.readFile(outputFile, 'utf-8');
      const results = JSON.parse(resultsJson);

      // Process and return structured results
      return this.processResults(results);
    } catch (error: any) {
      // Check if it's a threshold failure (exit code 100)
      if (error.code === 100) {
        // Still try to parse results
        try {
          const resultsJson = await fs.readFile(outputFile, 'utf-8');
          const results = JSON.parse(resultsJson);
          return this.processResults(results);
        } catch {
          // Fall through to error handling
        }
      }
      
      throw new Error(`Evaluation failed: ${error.message}`);
    }
  }

  /**
   * Run evaluation for specific prompts
   */
  async evaluatePrompts(prompts: Array<{
    id: string;
    template: string;
    vars?: Record<string, any>;
  }>): Promise<EvaluationResult> {
    // Create temporary config with specific prompts
    const tempConfig = await this.createTempConfig(prompts);
    
    try {
      const service = new EvaluationService({
        configPath: tempConfig,
        outputPath: this.outputPath,
      });
      
      return await service.runEvaluation();
    } finally {
      // Clean up temp config
      await fs.unlink(tempConfig).catch(() => {});
    }
  }

  /**
   * Get evaluation history
   */
  async getHistory(limit: number = 10): Promise<Array<{
    timestamp: Date;
    result: EvaluationResult;
  }>> {
    const files = await fs.readdir(this.outputPath);
    const evaluationFiles = files
      .filter(f => f.startsWith('evaluation-') && f.endsWith('.json'))
      .sort()
      .reverse()
      .slice(0, limit);

    const history = [];
    for (const file of evaluationFiles) {
      const content = await fs.readFile(path.join(this.outputPath, file), 'utf-8');
      const timestamp = new Date(parseInt(file.match(/evaluation-(\d+)\.json/)?.[1] || '0'));
      history.push({
        timestamp,
        result: this.processResults(JSON.parse(content)),
      });
    }

    return history;
  }

  /**
   * Compare evaluation results
   */
  compareResults(result1: EvaluationResult, result2: EvaluationResult): {
    passRateDiff: number;
    scoreImprovement: number;
    regressions: string[];
    improvements: string[];
  } {
    const passRateDiff = result2.passRate - result1.passRate;
    
    // Calculate average scores
    const avgScore1 = result1.results.reduce((sum, r) => sum + r.score, 0) / result1.results.length;
    const avgScore2 = result2.results.reduce((sum, r) => sum + r.score, 0) / result2.results.length;
    const scoreImprovement = avgScore2 - avgScore1;

    // Find regressions and improvements
    const regressions: string[] = [];
    const improvements: string[] = [];

    // Create maps for comparison
    const results1Map = new Map(
      result1.results.map(r => [`${r.description}-${r.provider}`, r])
    );
    const results2Map = new Map(
      result2.results.map(r => [`${r.description}-${r.provider}`, r])
    );

    for (const [key, r2] of results2Map) {
      const r1 = results1Map.get(key);
      if (r1) {
        if (r2.success && !r1.success) {
          improvements.push(`${r2.description} (${r2.provider})`);
        } else if (!r2.success && r1.success) {
          regressions.push(`${r2.description} (${r2.provider})`);
        }
      }
    }

    return {
      passRateDiff,
      scoreImprovement,
      regressions,
      improvements,
    };
  }

  /**
   * Process raw Promptfoo results into structured format
   */
  private processResults(raw: any): EvaluationResult {
    const results: TestResult[] = [];
    const byProvider: Record<string, ProviderSummary> = {};
    const byPrompt: Record<string, PromptSummary> = {};

    let totalTests = 0;
    let passedTests = 0;

    // Process each result
    for (const result of raw.results || []) {
      const testResult: TestResult = {
        description: result.description || 'Unnamed test',
        vars: result.vars || {},
        success: result.success || false,
        score: result.score || 0,
        provider: result.provider || 'unknown',
        prompt: result.prompt?.label || 'unknown',
        output: result.output || '',
        assertions: [],
      };

      // Process assertions
      for (const assertion of result.assertions || []) {
        testResult.assertions.push({
          type: assertion.type,
          passed: assertion.passed || false,
          score: assertion.score,
          reason: assertion.reason,
        });
      }

      results.push(testResult);
      totalTests++;
      if (testResult.success) passedTests++;

      // Update provider summary
      if (!byProvider[testResult.provider]) {
        byProvider[testResult.provider] = {
          totalTests: 0,
          passedTests: 0,
          averageScore: 0,
        };
      }
      byProvider[testResult.provider].totalTests++;
      if (testResult.success) byProvider[testResult.provider].passedTests++;

      // Update prompt summary
      if (!byPrompt[testResult.prompt]) {
        byPrompt[testResult.prompt] = {
          totalTests: 0,
          passedTests: 0,
          averageScore: 0,
        };
      }
      byPrompt[testResult.prompt].totalTests++;
      if (testResult.success) byPrompt[testResult.prompt].passedTests++;
    }

    // Calculate averages
    for (const provider of Object.keys(byProvider)) {
      const providerResults = results.filter(r => r.provider === provider);
      byProvider[provider].averageScore = 
        providerResults.reduce((sum, r) => sum + r.score, 0) / providerResults.length;
    }

    for (const prompt of Object.keys(byPrompt)) {
      const promptResults = results.filter(r => r.prompt === prompt);
      byPrompt[prompt].averageScore = 
        promptResults.reduce((sum, r) => sum + r.score, 0) / promptResults.length;
    }

    return {
      success: passedTests / totalTests >= 0.8,
      passRate: totalTests > 0 ? passedTests / totalTests : 0,
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      results,
      summary: {
        byProvider,
        byPrompt,
      },
    };
  }

  /**
   * Create temporary config file
   */
  private async createTempConfig(prompts: Array<{
    id: string;
    template: string;
    vars?: Record<string, any>;
  }>): Promise<string> {
    // Load base config
    const baseConfig = yaml.load(
      await fs.readFile(this.configPath, 'utf-8')
    ) as any;

    // Update prompts
    baseConfig.prompts = prompts.map(p => ({
      id: p.id,
      raw: p.template,
    }));

    // Update tests if vars provided
    if (prompts.some(p => p.vars)) {
      baseConfig.tests = prompts
        .filter(p => p.vars)
        .map(p => ({
          description: `Test for ${p.id}`,
          vars: p.vars,
        }));
    }

    // Write temp config
    const tempPath = path.join(this.outputPath, `temp-config-${Date.now()}.yaml`);
    await fs.writeFile(tempPath, yaml.dump(baseConfig));

    return tempPath;
  }

  /**
   * Generate HTML report
   */
  async generateReport(result: EvaluationResult): Promise<string> {
    const reportPath = path.join(this.outputPath, `report-${Date.now()}.html`);
    
    // Run promptfoo share command to generate HTML
    const command = `npx promptfoo@latest share --output ${reportPath}`;
    
    try {
      await execAsync(command);
      return reportPath;
    } catch (error: any) {
      throw new Error(`Failed to generate report: ${error.message}`);
    }
  }
}