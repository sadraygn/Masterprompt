import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hebgfllpnrsqvcrgnqhp.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlYmdmbGxwbnJzcXZjcmducWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMjQ3MzksImV4cCI6MjA3MDYwMDczOX0.T7IUZiZcVakPsCWSCYSYfRGtuCxCKk3gxTuD5we8svE';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/paraphrase`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
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