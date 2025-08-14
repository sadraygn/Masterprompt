import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ParaphraseRequest {
  text: string;
  style?: 'formal' | 'casual' | 'technical' | 'simple';
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
    const { text, style = 'neutral' } = await req.json() as ParaphraseRequest

    if (!text || text.length === 0) {
      throw new Error('Text is required')
    }

    if (text.length > 5000) {
      throw new Error('Text too long (max 5000 characters)')
    }

    // Create style-specific prompt
    const stylePrompts = {
      formal: 'Rewrite this text in a formal, professional tone:',
      casual: 'Rewrite this text in a casual, conversational tone:',
      technical: 'Rewrite this text using technical, precise language:',
      simple: 'Rewrite this text using simple, easy-to-understand language:',
      neutral: 'Paraphrase the following text while maintaining its meaning:'
    }

    const prompt = stylePrompts[style as keyof typeof stylePrompts] || stylePrompts.neutral

    const startTime = Date.now()

    // Make request to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful writing assistant that paraphrases text while maintaining its original meaning and intent.'
          },
          {
            role: 'user',
            content: `${prompt}\n\n"${text}"`
          }
        ],
        temperature: 0.7,
        max_tokens: Math.min(text.length * 2, 1000),
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API error: ${error}`)
    }

    const completion = await response.json()
    const paraphrased = completion.choices[0]?.message?.content || ''
    const latency = Date.now() - startTime

    // Save to paraphrase history
    try {
      await supabaseClient
        .from('paraphrase_history')
        .insert({
          original_text: text,
          paraphrased_text: paraphrased,
          style,
          model: 'gpt-3.5-turbo',
          metadata: { latency },
        })
    } catch (saveError) {
      console.error('Failed to save paraphrase history:', saveError)
      // Don't fail the request if saving fails
    }

    // Log API usage
    try {
      await supabaseClient
        .from('api_usage')
        .insert({
          endpoint: '/functions/v1/paraphrase',
          method: 'POST',
          request_body: { text: text.substring(0, 100) + '...', style },
          response_status: 200,
          response_time_ms: latency,
        })
    } catch (logError) {
      console.error('Failed to log API usage:', logError)
    }

    return new Response(
      JSON.stringify({
        original: text,
        paraphrased,
        style,
        latency,
        model: 'gpt-3.5-turbo',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Paraphrase error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: {
          message: error.message || 'Failed to paraphrase text',
          type: 'paraphrase_error',
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})