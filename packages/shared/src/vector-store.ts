import { env } from 'process';

export interface VectorDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

export interface VectorSearchResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  score: number;
}

export interface VectorStoreConfig {
  provider: 'weaviate' | 'qdrant';
  host: string;
  apiKey?: string;
  collectionName?: string;
}

export abstract class VectorStore {
  protected config: VectorStoreConfig;

  constructor(config: VectorStoreConfig) {
    this.config = config;
  }

  abstract initialize(): Promise<void>;
  abstract addDocuments(documents: VectorDocument[]): Promise<void>;
  abstract search(query: string, limit?: number): Promise<VectorSearchResult[]>;
  abstract deleteDocument(id: string): Promise<void>;
  abstract clear(): Promise<void>;
}

// Weaviate client implementation
export class WeaviateStore extends VectorStore {
  private client: any; // Will be typed when weaviate-ts-client is installed

  async initialize(): Promise<void> {
    // Dynamic import to avoid loading if not used
    const { default: weaviate } = await import('weaviate-ts-client');
    
    this.client = weaviate.client({
      scheme: 'http',
      host: this.config.host.replace('http://', '').replace('https://', ''),
      apiKey: this.config.apiKey ? new weaviate.ApiKey(this.config.apiKey) : undefined,
    });

    // Create schema if it doesn't exist
    const className = this.config.collectionName || 'PromptDocument';
    
    try {
      await this.client.schema.classGetter().withClassName(className).do();
    } catch (error) {
      // Class doesn't exist, create it
      await this.client.schema.classCreator().withClass({
        class: className,
        vectorizer: 'text2vec-openai',
        moduleConfig: {
          'text2vec-openai': {
            model: 'ada',
            modelVersion: '002',
            type: 'text',
          },
        },
        properties: [
          {
            name: 'content',
            dataType: ['text'],
          },
          {
            name: 'metadata',
            dataType: ['object'],
          },
        ],
      }).do();
    }
  }

  async addDocuments(documents: VectorDocument[]): Promise<void> {
    const className = this.config.collectionName || 'PromptDocument';
    
    const objects = documents.map(doc => ({
      class: className,
      properties: {
        content: doc.content,
        metadata: doc.metadata,
      },
      id: doc.id,
    }));

    await this.client.batch.objectsBatcher()
      .withObjects(...objects)
      .do();
  }

  async search(query: string, limit: number = 10): Promise<VectorSearchResult[]> {
    const className = this.config.collectionName || 'PromptDocument';
    
    const result = await this.client.graphql.get()
      .withClassName(className)
      .withNearText({ concepts: [query] })
      .withLimit(limit)
      .withFields('content metadata _additional { id distance }')
      .do();

    const documents = result.data.Get[className] || [];
    
    return documents.map((doc: any) => ({
      id: doc._additional.id,
      content: doc.content,
      metadata: doc.metadata || {},
      score: 1 - (doc._additional.distance || 0), // Convert distance to similarity score
    }));
  }

  async deleteDocument(id: string): Promise<void> {
    const className = this.config.collectionName || 'PromptDocument';
    
    await this.client.data.deleter()
      .withClassName(className)
      .withId(id)
      .do();
  }

  async clear(): Promise<void> {
    const className = this.config.collectionName || 'PromptDocument';
    
    await this.client.schema.classDeleter()
      .withClassName(className)
      .do();
    
    // Recreate the class
    await this.initialize();
  }
}

// Factory function
export function createVectorStore(config?: Partial<VectorStoreConfig>): VectorStore {
  const finalConfig: VectorStoreConfig = {
    provider: (config?.provider || env.VECTOR_DB || 'weaviate') as 'weaviate' | 'qdrant',
    host: config?.host || env.WEAVIATE_HOST || env.QDRANT_HOST || 'http://localhost:8080',
    apiKey: config?.apiKey || env.WEAVIATE_API_KEY || env.QDRANT_API_KEY,
    collectionName: config?.collectionName || 'PromptDocuments',
  };

  switch (finalConfig.provider) {
    case 'weaviate':
      return new WeaviateStore(finalConfig);
    case 'qdrant':
      throw new Error('Qdrant support not yet implemented');
    default:
      throw new Error(`Unknown vector store provider: ${finalConfig.provider}`);
  }
}