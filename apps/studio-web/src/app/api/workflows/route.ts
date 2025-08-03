import { NextResponse } from 'next/server';

const BROKER_API_URL = process.env.BROKER_API_URL || 'http://localhost:4000';
const API_TOKEN = process.env.API_BEARER_TOKEN || 'bearer-token-change-me';

export async function GET() {
  try {
    const response = await fetch(`${BROKER_API_URL}/v1/workflows`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch workflows');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching workflows:', error);
    
    // Return mock data for development
    return NextResponse.json([
      { id: 'completion-workflow', name: 'Basic Completion', description: 'Simple prompt completion workflow', tags: ['basic'] },
      { id: 'summarization-workflow', name: 'Text Summarization', description: 'Summarize long text into key points', tags: ['summarization'] },
      { id: 'qa-workflow', name: 'Question Answering', description: 'Answer questions based on context', tags: ['qa', 'rag'] },
      { id: 'code-review-workflow', name: 'Code Review', description: 'Automated code review', tags: ['code', 'quality'] },
      { id: 'data-extraction-workflow', name: 'Data Extraction', description: 'Extract structured data', tags: ['extraction', 'nlp'] },
    ]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${BROKER_API_URL}/v1/workflows`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error('Failed to create workflow');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    );
  }
}