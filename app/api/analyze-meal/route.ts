import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType, description } = await req.json();

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: 'Missing image data' }, { status: 400 });
    }

    const hint = description?.trim() ? `\n\nUser note: "${description.trim()}"` : '';

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mimeType, data: imageBase64 },
            },
            {
              type: 'text',
              text: `Analyze this food image and respond with ONLY a JSON object, no markdown, no explanation. Use this exact format:
{
  "description": "brief description of the food (max 40 chars)",
  "calories": 520,
  "protein": 45.2,
  "carbs": 48.1,
  "fat": 8.3,
  "confidence": "high"
}

Estimate realistic values for a typical serving of what you see. If you cannot identify food, return confidence "low" and zeroes.${hint}`,
            },
          ],
        },
      ],
    });

    const text = (response.content[0] as { type: string; text: string }).text.trim();
    // Strip markdown code fences if Claude wraps the JSON
    const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    const nutrition = JSON.parse(cleaned);
    return NextResponse.json(nutrition);
  } catch (err) {
    console.error('analyze-meal error:', err);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
