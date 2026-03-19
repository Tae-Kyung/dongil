import { DEFAULT_SYSTEM_PROMPT } from '@/lib/constants/prompts';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ value: DEFAULT_SYSTEM_PROMPT });
}
