import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hebgfllpnrsqvcrgnqhp.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlYmdmbGxwbnJzcXZjcmducWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMjQ3MzksImV4cCI6MjA3MDYwMDczOX0.T7IUZiZcVakPsCWSCYSYfRGtuCxCKk3gxTuD5we8svE';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract enhancement parameters
    const {
      prompt,
      enhancementModel,
      targetModel,
      creativity = 5,
      thinkingDepth = false,
      style,
      enhancementLevel = 'moderate',
      includeExamples = false
    } = body;

    // Validate prompt
    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: { message: 'Prompt is required', type: 'validation_error' } },
        { status: 400 }
      );
    }

    if (prompt.length > 10000) {
      return NextResponse.json(
        { error: { message: 'Prompt too long (max 10000 characters)', type: 'validation_error' } },
        { status: 400 }
      );
    }

    // Call Supabase Edge Function for enhancement
    const response = await fetch(`${SUPABASE_URL}/functions/v1/prompt-enhance`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        enhancementModel,
        targetModel,
        creativity,
        thinkingDepth,
        style,
        enhancementLevel,
        includeExamples
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const enhancementResult = await response.json();
    
    // Add frontend-specific formatting
    return NextResponse.json({
      success: true,
      original: enhancementResult.original,
      enhanced: enhancementResult.enhanced,
      strategy: enhancementResult.strategy,
      metrics: {
        ...enhancementResult.metrics,
        improvementPercentage: ((enhancementResult.metrics.improvementRatio - 1) * 100).toFixed(1)
      },
      parameters: enhancementResult.parameters,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Enhancement API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to enhance prompt', 
          type: 'internal_error',
          details: errorMessage 
        } 
      },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}