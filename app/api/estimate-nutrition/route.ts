import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json();
    if (!description?.trim()) {
      return NextResponse.json({ error: 'Missing description' }, { status: 400 });
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `Estimate the nutrition for this meal description. Respond with ONLY a JSON object, no markdown, no explanation:
{
  "calories": 520,
  "protein": 45.2,
  "carbs": 48.1,
  "fat": 8.3,
  "sugars": 6.1,
  "confidence": "medium"
}

Confidence should be "high", "medium", or "low" based on how specific the description is.

Meal: ${description.trim()}`,
      }],
    });

    const text = (response.content[0] as { type: string; text: string }).text.trim();
    const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    const nutrition = JSON.parse(cleaned);
    return NextResponse.json({ ...nutrition, description: description.trim() });
  } catch (err) {
    console.error('estimate-nutrition error:', err);
    return NextResponse.json({ error: 'Estimation failed' }, { status: 500 });
  }
}
