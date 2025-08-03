import { NextResponse } from 'next/server';

const BROKER_API_URL = process.env.BROKER_API_URL || 'http://localhost:4000';
const API_TOKEN = process.env.API_BEARER_TOKEN || 'bearer-token-change-me';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${BROKER_API_URL}/v1/paraphrase`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in paraphrase API:', error);
    return NextResponse.json(
      { error: { message: 'Failed to process paraphrase request', type: 'internal_error' } },
      { status: 500 }
    );
  }
}