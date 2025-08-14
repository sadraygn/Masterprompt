import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hebgfllpnrsqvcrgnqhp.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlYmdmbGxwbnJzcXZjcmducWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMjQ3MzksImV4cCI6MjA3MDYwMDczOX0.T7IUZiZcVakPsCWSCYSYfRGtuCxCKk3gxTuD5we8svE';

export async function GET() {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/workflows`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
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
    
    // Normalize workflow ID - add '-workflow' suffix if not present
    let workflowId = body.workflowId || body.id;
    if (workflowId && !workflowId.endsWith('-workflow')) {
      workflowId = `${workflowId}-workflow`;
    }
    
    // Transform input based on workflow type
    let inputData = {};
    if (typeof body.input === 'string') {
      // For string input, use it as prompt/text
      inputData = { 
        prompt: body.input,
        text: body.input,
        input: body.input 
      };
    } else if (body.input && typeof body.input === 'object') {
      inputData = body.input;
    } else {
      inputData = { input: body.input || '' };
    }
    
    // Merge parameters into config
    const config = {
      ...(body.config || {}),
      ...(body.parameters || {}),
    };
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/workflows/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflowId,
        input: inputData,
        config
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Workflow execution failed:', errorText);
      throw new Error('Failed to execute workflow');
    }

    const data = await response.json();
    
    // Transform response to match frontend expectations
    const result = data.output || data.summary || data.result || JSON.stringify(data);
    
    return NextResponse.json({
      result,
      ...data
    });
  } catch (error) {
    console.error('Error executing workflow:', error);
    return NextResponse.json(
      { error: 'Failed to execute workflow' },
      { status: 500 }
    );
  }
}