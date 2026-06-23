import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { SYSTEM_PROMPTS, buildUserPrompt, buildRegeneratePrompt } from '@/lib/ai/prompts';
import { SEGMENT_SIZES } from '@/lib/constants';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gate, segment, channels, customInstructions, channelToRegenerate, segmentDescription, historicalExamples } = body;

    const systemPrompt = SYSTEM_PROMPTS[gate as string]?.[segment as string];

    if (!systemPrompt) {
      return new Response(JSON.stringify({ error: `No prompt for ${gate}/${segment}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const segmentSize = (SEGMENT_SIZES as Record<string, Record<string, number>>)[gate as string]?.[segment as string] ?? 1000;

    const userPrompt = channelToRegenerate
      ? buildRegeneratePrompt(channelToRegenerate, customInstructions ?? '', historicalExamples ?? [])
      : buildUserPrompt({
          channels: channels ?? [],
          customInstructions,
          segmentDescription,
          segmentStats: { size: segmentSize },
          historicalExamples: historicalExamples ?? [],
        });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const raw = message.content[0]?.type === 'text' ? message.content[0].text : '';
    const text = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();

    return new Response(text, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    console.error('[AI Route Error]', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
