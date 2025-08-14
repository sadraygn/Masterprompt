import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CompletionRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  creativity?: number;
}

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

    // Get API keys from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Parse request
    const { model, messages, temperature = 0.7, max_tokens = 1000, creativity = 0.7 } = await req.json() as CompletionRequest

    // Map creativity to temperature if provided
    const actualTemperature = creativity !== undefined ? creativity : temperature

    // Make request to OpenAI API directly
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: actualTemperature,
        max_tokens,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`LLM API error: ${error}`)
    }

    const completion = await response.json()

    // Log API usage to database
    try {
      await supabaseClient
        .from('api_usage')
        .insert({
          endpoint: '/functions/v1/completions',
          method: 'POST',
          request_body: { model, messages, temperature: actualTemperature, max_tokens },
          response_status: 200,
          response_time_ms: Date.now() - new Date(req.headers.get('x-request-start') || Date.now()).getTime(),
        })
    } catch (logError) {
      console.error('Failed to log API usage:', logError)
      // Don't fail the request if logging fails
    }

    return new Response(
      JSON.stringify(completion),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Completion error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: {
          message: error.message || 'Failed to generate completion',
          type: 'completion_error',
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})