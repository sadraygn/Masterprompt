import { BaseWorkflow } from './base-workflow.js';
import { WorkflowMetadata } from './types.js';
import { watch } from 'chokidar';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class WorkflowRegistry {
  private static instance: WorkflowRegistry;
  private workflows: Map<string, typeof BaseWorkflow> = new Map();
  private instances: Map<string, BaseWorkflow> = new Map();
  private watcher?: any;
  
  private constructor() {}
  
  static getInstance(): WorkflowRegistry {
    if (!WorkflowRegistry.instance) {
      WorkflowRegistry.instance = new WorkflowRegistry();
    }
    return WorkflowRegistry.instance;
  }
  
  /**
   * Register a workflow class
   */
  register(WorkflowClass: typeof BaseWorkflow) {
    const instance = new (WorkflowClass as any)();
    const metadata = instance.metadata;
    
    this.workflows.set(metadata.id, WorkflowClass);
    this.instances.set(metadata.id, instance);
    
    console.log(`[WorkflowRegistry] Registered workflow: ${metadata.id}`);
  }
  
  /**
   * Get a workflow instance by ID
   */
  get(id: string): BaseWorkflow | undefined {
    return this.instances.get(id);
  }
  
  /**
   * Get a new instance of a workflow
   */
  createInstance(id: string, config?: any): BaseWorkflow | undefined {
    const WorkflowClass = this.workflows.get(id);
    if (!WorkflowClass) {
      return undefined;
    }
    
    return new (WorkflowClass as any)(config);
  }
  
  /**
   * List all registered workflows
   */
  list(): WorkflowMetadata[] {
    return Array.from(this.instances.values()).map(w => w.metadata);
  }
  
  /**
   * Enable hot reloading for development
   */
  enableHotReload(templatesPath?: string) {
    const watchPath = templatesPath || join(__dirname, 'templates');
    
    console.log(`[WorkflowRegistry] Enabling hot reload for: ${watchPath}`);
    
    this.watcher = watch(watchPath, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100,
      },
    });
    
    this.watcher.on('change', async (path: string) => {
      console.log(`[WorkflowRegistry] File changed: ${path}`);
      await this.reloadWorkflow(path);
    });
    
    this.watcher.on('add', async (path: string) => {
      console.log(`[WorkflowRegistry] File added: ${path}`);
      await this.loadWorkflow(path);
    });
    
    this.watcher.on('unlink', (path: string) => {
      console.log(`[WorkflowRegistry] File removed: ${path}`);
      // Handle workflow removal if needed
    });
  }
  
  /**
   * Disable hot reloading
   */
  disableHotReload() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = undefined;
      console.log('[WorkflowRegistry] Hot reload disabled');
    }
  }
  
  /**
   * Reload a workflow from file
   */
  private async reloadWorkflow(filePath: string) {
    try {
      // Clear the module cache
      delete require.cache[require.resolve(filePath)];
      
      // Re-import the module
      const module = await import(`${filePath}?t=${Date.now()}`);
      
      // Look for exported workflow classes
      for (const exportName of Object.keys(module)) {
        const ExportedClass = module[exportName];
        
        if (ExportedClass.prototype instanceof BaseWorkflow) {
          this.register(ExportedClass);
          console.log(`[WorkflowRegistry] Reloaded workflow from ${filePath}`);
        }
      }
    } catch (error) {
      console.error(`[WorkflowRegistry] Error reloading workflow:`, error);
    }
  }
  
  /**
   * Load a new workflow from file
   */
  private async loadWorkflow(filePath: string) {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.js')) {
      return;
    }
    
    try {
      const module = await import(filePath);
      
      // Look for exported workflow classes
      for (const exportName of Object.keys(module)) {
        const ExportedClass = module[exportName];
        
        if (ExportedClass.prototype instanceof BaseWorkflow) {
          this.register(ExportedClass);
          console.log(`[WorkflowRegistry] Loaded workflow from ${filePath}`);
        }
      }
    } catch (error) {
      console.error(`[WorkflowRegistry] Error loading workflow:`, error);
    }
  }
  
  /**
   * Export all workflows for Flowise sync
   */
  exportAll() {
    const exports = [];
    
    for (const workflow of this.instances.values()) {
      exports.push(workflow.export());
    }
    
    return exports;
  }
  
  /**
   * Import workflows from Flowise format
   */
  importFromFlowise(flowiseData: any[]) {
    // This would convert Flowise format to our workflow format
    // Implementation depends on Flowise export structure
    console.log('[WorkflowRegistry] Importing from Flowise:', flowiseData.length, 'workflows');
    
    // TODO: Implement Flowise import logic
  }
}