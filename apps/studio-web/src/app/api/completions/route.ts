import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      model, 
      messages, 
      temperature = 0.7, 
      stream = false,
      autoEnhance = false,
      enhancementParams = {}
    } = body;

    // Use Supabase Edge Function instead of broker API
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hebgfllpnrsqvcrgnqhp.supabase.co';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlYmdmbGxwbnJzcXZjcmducWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMjQ3MzksImV4cCI6MjA3MDYwMDczOX0.T7IUZiZcVakPsCWSCYSYfRGtuCxCKk3gxTuD5we8svE';
    
    // Enhance prompt if auto-enhance is enabled
    let finalMessages = messages;
    let enhancementData = null;
    
    if (autoEnhance && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        try {
          const enhanceResponse = await fetch(`${supabaseUrl}/functions/v1/prompt-enhance`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: lastMessage.content,
              creativity: enhancementParams.creativity || temperature * 10,
              thinkingDepth: enhancementParams.thinkingDepth || false,
              style: enhancementParams.style,
              enhancementLevel: enhancementParams.level || 'moderate',
              includeExamples: enhancementParams.includeExamples || false
            }),
          });
          
          if (enhanceResponse.ok) {
            enhancementData = await enhanceResponse.json();
            // Replace the last message with the enhanced version
            finalMessages = [
              ...messages.slice(0, -1),
              { ...lastMessage, content: enhancementData.enhanced }
            ];
          }
        } catch (error) {
          console.warn('Enhancement failed, using original prompt:', error);
        }
      }
    }
    
    const response = await fetch(`${supabaseUrl}/functions/v1/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        model,
        messages: finalMessages,
        temperature,
        max_tokens: body.max_tokens || 1000,
        creativity: temperature, // Map temperature to creativity parameter
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: errorText, type: 'supabase_error' } };
      }
      
      return NextResponse.json(
        errorData,
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Return the response from Supabase Edge Function with enhancement info
    return NextResponse.json({
      ...data,
      enhancement: enhancementData ? {
        applied: true,
        original: messages[messages.length - 1]?.content,
        enhanced: enhancementData.enhanced,
        metrics: enhancementData.metrics,
        strategy: enhancementData.strategy
      } : null
    });
    
  } catch (error) {
    console.error('Completions API error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to connect to Supabase Edge Function', 
          type: 'connection_error',
          details: error.message 
        } 
      },
      { status: 500 }
    );
  }
}