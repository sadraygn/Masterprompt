import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EnhanceRequest {
  prompt: string;
  enhancementModel?: string; // Which AI model performs the enhancement
  targetModel?: string; // Optional: which AI the prompt is intended for
  creativity?: number; // 0-10
  thinkingDepth?: boolean;
  style?: 'technical' | 'creative' | 'balanced' | 'precise';
  enhancementLevel?: 'light' | 'moderate' | 'aggressive';
  includeExamples?: boolean;
}

interface EnhancementStrategy {
  name: string;
  systemPrompt: string;
  userPromptTemplate: string;
}

const ENHANCEMENT_STRATEGIES: Record<string, EnhancementStrategy> = {
  technical: {
    name: 'Technical Enhancement',
    systemPrompt: 'You are an expert prompt engineer specializing in technical and precise prompt optimization. Your goal is to enhance prompts for maximum clarity, specificity, and effectiveness while maintaining technical accuracy.',
    userPromptTemplate: `Enhance this prompt for technical precision and clarity:

Original Prompt: "{prompt}"

Requirements:
- Add specific technical constraints and parameters
- Include output format specifications
- Add error handling instructions
- Maintain precise, unambiguous language
- Include relevant technical context

Enhanced Prompt:`
  },
  creative: {
    name: 'Creative Enhancement',
    systemPrompt: 'You are a creative prompt engineer who transforms basic prompts into rich, imaginative, and engaging instructions that inspire high-quality creative outputs.',
    userPromptTemplate: `Transform this prompt into a more creative and engaging version:

Original Prompt: "{prompt}"

Requirements:
- Add vivid descriptions and creative context
- Include inspiring examples or analogies
- Expand the creative possibilities
- Maintain the core intent while adding flair
- Encourage innovative thinking

Enhanced Prompt:`
  },
  balanced: {
    name: 'Balanced Enhancement',
    systemPrompt: 'You are a skilled prompt engineer who enhances prompts for optimal performance across different AI models. Balance clarity with creativity, structure with flexibility.',
    userPromptTemplate: `Improve this prompt for better AI model performance:

Original Prompt: "{prompt}"

Requirements:
- Clarify ambiguous instructions
- Add helpful context and constraints
- Structure for easy understanding
- Include format specifications where needed
- Balance detail with conciseness

Enhanced Prompt:`
  },
  precise: {
    name: 'Precise Enhancement',
    systemPrompt: 'You are a prompt optimization specialist focused on eliminating ambiguity and maximizing prompt effectiveness through precise language and clear structure.',
    userPromptTemplate: `Optimize this prompt for maximum precision and effectiveness:

Original Prompt: "{prompt}"

Requirements:
- Eliminate all ambiguity
- Add explicit success criteria
- Define exact output requirements
- Include step-by-step structure if applicable
- Specify constraints and boundaries

Enhanced Prompt:`
  }
};

function selectEnhancementStrategy(creativity: number, style?: string): EnhancementStrategy {
  // If style is explicitly provided, use it
  if (style && ENHANCEMENT_STRATEGIES[style]) {
    return ENHANCEMENT_STRATEGIES[style];
  }
  
  // Otherwise, select based on creativity level
  if (creativity <= 3) {
    return ENHANCEMENT_STRATEGIES.precise;
  } else if (creativity <= 6) {
    return ENHANCEMENT_STRATEGIES.balanced;
  } else {
    return ENHANCEMENT_STRATEGIES.creative;
  }
}

function addThinkingDepth(prompt: string, add: boolean): string {
  if (!add) return prompt;
  
  const thinkingAdditions = [
    '\n\nPlease think through this step-by-step before providing your response.',
    '\n\nExplain your reasoning and thought process.',
    '\n\nBreak down your approach into clear steps.',
  ];
  
  // Check if thinking depth is already present
  const hasThinking = thinkingAdditions.some(addition => 
    prompt.toLowerCase().includes('step-by-step') || 
    prompt.toLowerCase().includes('reasoning') ||
    prompt.toLowerCase().includes('thought process')
  );
  
  if (!hasThinking) {
    return prompt + thinkingAdditions[0];
  }
  
  return prompt;
}

function addExamples(prompt: string, include: boolean): string {
  if (!include) return prompt;
  
  // Check if examples might be helpful
  const needsExamples = !prompt.toLowerCase().includes('example') && 
                        !prompt.toLowerCase().includes('e.g.') &&
                        !prompt.toLowerCase().includes('for instance');
  
  if (needsExamples) {
    return prompt + '\n\nPlease provide specific examples to illustrate your response.';
  }
  
  return prompt;
}

function applyEnhancementLevel(prompt: string, level: string): string {
  switch (level) {
    case 'light':
      // Minor improvements only
      return prompt;
    case 'aggressive':
      // Add comprehensive enhancements
      const additions = [];
      
      if (!prompt.includes('format')) {
        additions.push('Format your response clearly with appropriate sections.');
      }
      
      if (!prompt.includes('consider')) {
        additions.push('Consider multiple perspectives and edge cases.');
      }
      
      if (!prompt.includes('quality')) {
        additions.push('Ensure high quality and accuracy in your response.');
      }
      
      if (additions.length > 0) {
        return prompt + '\n\nAdditional requirements:\n' + additions.map(a => `- ${a}`).join('\n');
      }
      return prompt;
    default:
      // Moderate enhancements
      return prompt;
  }
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

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Parse request
    const { 
      prompt,
      enhancementModel = 'gpt-3.5-turbo', // Default to GPT-3.5 if not specified
      targetModel,
      creativity = 5, 
      thinkingDepth = false,
      style,
      enhancementLevel = 'moderate',
      includeExamples = false
    } = await req.json() as EnhanceRequest

    if (!prompt || prompt.length === 0) {
      throw new Error('Prompt is required')
    }

    if (prompt.length > 10000) {
      throw new Error('Prompt too long (max 10000 characters)')
    }

    const startTime = Date.now()
    
    // Select enhancement strategy based on parameters
    const strategy = selectEnhancementStrategy(creativity, style);
    
    // Prepare the enhancement prompt with optional target model context
    let userPrompt = strategy.userPromptTemplate.replace('{prompt}', prompt);
    
    // Add target model optimization if specified
    if (targetModel) {
      userPrompt += `\n\nNote: This prompt will be used with ${targetModel}. Please optimize it specifically for that model's capabilities and characteristics.`;
    }
    
    // Call OpenAI to enhance the prompt
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: enhancementModel, // Use the selected enhancement model
        messages: [
          {
            role: 'system',
            content: strategy.systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: Math.min(creativity / 10, 0.9), // Map creativity to temperature
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API error: ${error}`)
    }

    const completion = await response.json()
    let enhancedPrompt = completion.choices[0]?.message?.content || prompt
    
    // Apply additional enhancements
    enhancedPrompt = addThinkingDepth(enhancedPrompt, thinkingDepth)
    enhancedPrompt = addExamples(enhancedPrompt, includeExamples)
    enhancedPrompt = applyEnhancementLevel(enhancedPrompt, enhancementLevel)
    
    const latency = Date.now() - startTime
    
    // Calculate metrics
    const originalTokens = Math.ceil(prompt.length / 4)
    const enhancedTokens = Math.ceil(enhancedPrompt.length / 4)
    const improvementRatio = enhancedTokens / originalTokens
    
    // Save enhancement history
    try {
      await supabaseClient
        .from('prompt_enhancements')
        .insert({
          original_prompt: prompt,
          enhanced_prompt: enhancedPrompt,
          strategy: strategy.name,
          creativity_level: creativity,
          thinking_depth: thinkingDepth,
          enhancement_level: enhancementLevel,
          metrics: {
            original_tokens: originalTokens,
            enhanced_tokens: enhancedTokens,
            improvement_ratio: improvementRatio,
            latency
          }
        })
    } catch (saveError) {
      console.error('Failed to save enhancement history:', saveError)
      // Don't fail the request if saving fails
    }
    
    // Log API usage
    try {
      await supabaseClient
        .from('api_usage')
        .insert({
          endpoint: '/functions/v1/prompt-enhance',
          method: 'POST',
          request_body: { 
            prompt: prompt.substring(0, 100) + '...', 
            creativity,
            style,
            enhancementLevel
          },
          response_status: 200,
          response_time_ms: latency,
        })
    } catch (logError) {
      console.error('Failed to log API usage:', logError)
    }

    return new Response(
      JSON.stringify({
        original: prompt,
        enhanced: enhancedPrompt,
        strategy: strategy.name,
        enhancementModel, // Which model performed the enhancement
        targetModel, // Optional: which model the prompt is optimized for
        metrics: {
          originalTokens,
          enhancedTokens,
          improvementRatio: improvementRatio.toFixed(2),
          latency
        },
        parameters: {
          creativity,
          thinkingDepth,
          style: style || 'auto',
          enhancementLevel,
          includeExamples
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Enhancement error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: {
          message: error.message || 'Failed to enhance prompt',
          type: 'enhancement_error',
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})