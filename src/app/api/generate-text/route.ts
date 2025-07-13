import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    const result = await ai.generate({ prompt });
    return NextResponse.json({ result });
  } catch (error: any) {
    const message = typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : String(error);
    return NextResponse.json({ error: message || 'Unknown error' }, { status: 500 });
  }
}
