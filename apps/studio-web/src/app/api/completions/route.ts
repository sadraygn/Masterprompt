import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, messages, temperature = 0.7, stream = false } = body;

    // Use Supabase Edge Function instead of broker API
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hebgfllpnrsqvcrgnqhp.supabase.co';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlYmdmbGxwbnJzcXZjcmducWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMjQ3MzksImV4cCI6MjA3MDYwMDczOX0.T7IUZiZcVakPsCWSCYSYfRGtuCxCKk3gxTuD5we8svE';
    
    const response = await fetch(`${supabaseUrl}/functions/v1/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
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
    
    // Return the response from Supabase Edge Function
    return NextResponse.json(data);
    
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