import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, messages, temperature = 0.7, stream = false } = body;

    // Forward the request to the broker API
    const brokerUrl = process.env.NEXT_PUBLIC_BROKER_URL || 'http://localhost:4000';
    
    const response = await fetch(`${brokerUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        stream,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Broker API error: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Return the response from the broker
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Completions API error:', error);
    
    // Fallback response for testing when broker is not available
    if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
      // Return a mock response for testing
      return NextResponse.json({
        id: 'mock-' + Date.now(),
        object: 'chat.completion',
        created: Date.now(),
        model: body.model || 'gpt-3.5-turbo',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: `This is a mock response. The broker API at ${process.env.NEXT_PUBLIC_BROKER_URL || 'http://localhost:4000'} is not available. 

To get real responses:
1. Make sure Docker containers are running: docker compose up -d
2. Check that the broker API is running on port 4000
3. Ensure LiteLLM is configured with your API keys

Your prompt was: "${body.messages?.[0]?.content?.substring(0, 100)}..."`
          },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 50,
          completion_tokens: 100,
          total_tokens: 150
        }
      });
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}