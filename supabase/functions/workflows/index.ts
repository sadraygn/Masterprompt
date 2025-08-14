import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WorkflowExecuteRequest {
  workflowId: string;
  input: Record<string, any>;
  config?: Record<string, any>;
}

// Built-in workflows
const BUILTIN_WORKFLOWS = {
  'completion-workflow': {
    id: 'completion-workflow',
    name: 'Basic Completion',
    description: 'Simple prompt completion workflow',
    execute: async (input: any, config: any) => {
      const prompt = input.prompt || input.text || input.input;
      const model = config?.model || 'gpt-3.5-turbo';
      
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openaiApiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: config?.temperature || 0.7,
          max_tokens: config?.maxTokens || 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${await response.text()}`);
      }

      const completion = await response.json();
      return {
        output: completion.choices[0]?.message?.content || '',
        usage: completion.usage,
      };
    }
  },
  
  'summarization-workflow': {
    id: 'summarization-workflow',
    name: 'Text Summarization',
    description: 'Summarize long text into key points',
    execute: async (input: any, config: any) => {
      const text = input.text || input.input;
      const model = config?.model || 'gpt-3.5-turbo';
      
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openaiApiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that summarizes text into key points. Provide a concise summary with the most important information.'
            },
            {
              role: 'user',
              content: `Please summarize the following text:\n\n${text}`
            }
          ],
          temperature: config?.temperature || 0.5,
          max_tokens: config?.maxTokens || 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${await response.text()}`);
      }

      const completion = await response.json();
      return {
        summary: completion.choices[0]?.message?.content || '',
        usage: completion.usage,
      };
    }
  }
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const url = new URL(req.url)
    const path = url.pathname

    // List workflows
    if (req.method === 'GET' && path.endsWith('/workflows')) {
      // Get workflows from database
      const { data: dbWorkflows } = await supabaseClient
        .from('workflows')
        .select('*')
        .eq('is_active', true)

      // Merge with built-in workflows
      const allWorkflows = [
        ...Object.values(BUILTIN_WORKFLOWS).map(w => ({ ...w, source: 'builtin' })),
        ...(dbWorkflows || []).map(w => ({ ...w, source: 'database' }))
      ]

      return new Response(
        JSON.stringify(allWorkflows),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Execute workflow
    if (req.method === 'POST' && path.includes('/execute')) {
      const { workflowId, input, config } = await req.json() as WorkflowExecuteRequest
      const startTime = Date.now()

      let result;

      // Check if it's a built-in workflow
      if (BUILTIN_WORKFLOWS[workflowId as keyof typeof BUILTIN_WORKFLOWS]) {
        const workflow = BUILTIN_WORKFLOWS[workflowId as keyof typeof BUILTIN_WORKFLOWS]
        result = await workflow.execute(input, config)
      } else {
        // Try to get from database
        const { data: dbWorkflow } = await supabaseClient
          .from('workflows')
          .select('*')
          .eq('id', workflowId)
          .single()

        if (!dbWorkflow) {
          throw new Error(`Workflow ${workflowId} not found`)
        }

        // For database workflows, we'll implement a basic executor
        // This is simplified - in production you'd want more sophisticated workflow execution
        result = { output: 'Database workflow execution not fully implemented yet', config: dbWorkflow.config }
      }

      const executionTime = Date.now() - startTime

      // Save evaluation
      try {
        await supabaseClient
          .from('evaluations')
          .insert({
            workflow_id: workflowId,
            input_data: input,
            output_data: result,
            metrics: { executionTime, success: true },
          })
      } catch (saveError) {
        console.error('Failed to save evaluation:', saveError)
      }

      // Log API usage
      try {
        await supabaseClient
          .from('api_usage')
          .insert({
            endpoint: '/functions/v1/workflows/execute',
            method: 'POST',
            request_body: { workflowId, input },
            response_status: 200,
            response_time_ms: executionTime,
          })
      } catch (logError) {
        console.error('Failed to log API usage:', logError)
      }

      return new Response(
        JSON.stringify({ ...result, executionTime }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404 
      }
    )

  } catch (error) {
    console.error('Workflow error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: {
          message: error.message || 'Workflow execution failed',
          type: 'workflow_error',
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})