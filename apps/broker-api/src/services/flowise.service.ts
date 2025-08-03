import { env } from '../config/env.js';

export interface FlowiseNode {
  id: string;
  type: string;
  data: {
    label: string;
    name: string;
    version: number;
    type: string;
    baseClasses: string[];
    category: string;
    inputs?: Record<string, any>;
    outputs?: Record<string, any>;
  };
  position: { x: number; y: number };
  width?: number;
  height?: number;
}

export interface FlowiseEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  data?: any;
}

export interface FlowiseChatflow {
  id: string;
  name: string;
  flowData: string; // JSON string containing nodes and edges
  deployed?: boolean;
  isPublic?: boolean;
  apikeyid?: string;
  chatbotConfig?: string;
  createdDate?: string;
  updatedDate?: string;
}

export class FlowiseService {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = env.FLOWISE_API_URL || 'http://localhost:3100';
    this.apiKey = env.FLOWISE_API_KEY || '';
  }

  /**
   * Get all chatflows
   */
  async getChatflows(): Promise<FlowiseChatflow[]> {
    const response = await fetch(`${this.apiUrl}/api/v1/chatflows`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch chatflows: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get a specific chatflow
   */
  async getChatflow(id: string): Promise<FlowiseChatflow> {
    const response = await fetch(`${this.apiUrl}/api/v1/chatflows/${id}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch chatflow: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create a new chatflow
   */
  async createChatflow(name: string, flowData: any): Promise<FlowiseChatflow> {
    const response = await fetch(`${this.apiUrl}/api/v1/chatflows`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        flowData: JSON.stringify(flowData),
        deployed: false,
        isPublic: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create chatflow: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Update an existing chatflow
   */
  async updateChatflow(id: string, updates: Partial<FlowiseChatflow>): Promise<FlowiseChatflow> {
    const response = await fetch(`${this.apiUrl}/api/v1/chatflows/${id}`, {
      method: 'PUT',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update chatflow: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Delete a chatflow
   */
  async deleteChatflow(id: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/api/v1/chatflows/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete chatflow: ${response.statusText}`);
    }
  }

  /**
   * Execute a chatflow (prediction)
   */
  async executeChatflow(id: string, question: string, overrideConfig?: any): Promise<any> {
    const response = await fetch(`${this.apiUrl}/api/v1/prediction/${id}`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        overrideConfig,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to execute chatflow: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Convert LCEL workflow to Flowise format
   */
  convertLCELToFlowise(lcelWorkflow: any): { nodes: FlowiseNode[]; edges: FlowiseEdge[] } {
    const nodes: FlowiseNode[] = [];
    const edges: FlowiseEdge[] = [];
    
    // This is a simplified conversion - real implementation would be more complex
    // and would need to map LCEL components to Flowise node types
    
    if (lcelWorkflow.nodes && lcelWorkflow.edges) {
      // Already in a compatible format
      return { nodes: lcelWorkflow.nodes, edges: lcelWorkflow.edges };
    }

    // Example conversion for a simple chain
    let xPos = 100;
    const yPos = 100;
    const nodeSpacing = 250;

    // Add nodes based on LCEL structure
    if (lcelWorkflow.prompt) {
      nodes.push({
        id: 'prompt-node',
        type: 'promptTemplate',
        data: {
          label: 'Prompt Template',
          name: 'promptTemplate',
          version: 1,
          type: 'PromptTemplate',
          baseClasses: ['PromptTemplate'],
          category: 'Prompts',
          inputs: {
            template: lcelWorkflow.prompt,
          },
        },
        position: { x: xPos, y: yPos },
      });
      xPos += nodeSpacing;
    }

    // Add LLM node
    nodes.push({
      id: 'llm-node',
      type: 'chatOpenAI',
      data: {
        label: 'ChatOpenAI',
        name: 'chatOpenAI',
        version: 1,
        type: 'ChatOpenAI',
        baseClasses: ['ChatOpenAI', 'BaseChatModel'],
        category: 'Chat Models',
        inputs: {
          modelName: lcelWorkflow.model || 'gpt-3.5-turbo',
          temperature: lcelWorkflow.temperature || 0.7,
        },
      },
      position: { x: xPos, y: yPos },
    });

    // Connect nodes
    if (nodes.length > 1) {
      for (let i = 0; i < nodes.length - 1; i++) {
        edges.push({
          id: `edge-${i}`,
          source: nodes[i].id,
          target: nodes[i + 1].id,
        });
      }
    }

    return { nodes, edges };
  }

  /**
   * Convert Flowise format to LCEL workflow
   */
  convertFlowiseToLCEL(flowiseData: string | { nodes: FlowiseNode[]; edges: FlowiseEdge[] }): any {
    let parsedData: { nodes: FlowiseNode[]; edges: FlowiseEdge[] };
    
    if (typeof flowiseData === 'string') {
      parsedData = JSON.parse(flowiseData);
    } else {
      parsedData = flowiseData;
    }

    // This is a simplified conversion
    const lcelWorkflow: any = {
      nodes: parsedData.nodes,
      edges: parsedData.edges,
    };

    // Extract key components
    const promptNode = parsedData.nodes.find(n => n.type === 'promptTemplate');
    const llmNode = parsedData.nodes.find(n => n.type === 'chatOpenAI');

    if (promptNode?.data.inputs?.template) {
      lcelWorkflow.prompt = promptNode.data.inputs.template;
    }

    if (llmNode?.data.inputs) {
      lcelWorkflow.model = llmNode.data.inputs.modelName;
      lcelWorkflow.temperature = llmNode.data.inputs.temperature;
    }

    return lcelWorkflow;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {};
    
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }
}