import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an assistant that analyses athlete segment descriptions for the Copenhagen Marathon 2026.

You convert a natural language description into structured JSON filters.

Available fields:
- gender: "M" (Male), "F" (Female), "X" (Other)
- age_min: minimum age (integer, e.g. "25")
- age_max: maximum age (integer, e.g. "35")
- nationality: country code — DK, SE, DE, UK, NL, NO, FR, US, IT, CH, PL, BE
- isReturningAthlete: "true" (previously participated) or "false" (first time)
- total_editions_min: minimum number of editions raced (integer, e.g. "2")
- total_editions_max: maximum number of editions raced (integer)
- engagement_min: minimum engagement score 0–100 (integer, e.g. "70")
- city_contains: city contains this text (e.g. "Copenhagen")

Mapping rules:
- "women", "female" → gender = "F" ; "men", "male" → gender = "M"
- Nationalities: Denmark/Danish → DK, Sweden/Swedish → SE, Germany/German → DE, UK/British → UK, Netherlands/Dutch → NL, Norway/Norwegian → NO, France/French → FR
- "returning", "loyal", "have already participated" → isReturningAthlete = "true"
- "new", "first time" → isReturningAthlete = "false"
- "high engagement" → engagement_min = "70" ; "highly engaged" → engagement_min = "80"
- "at least N editions" → total_editions_min = "N"
- Ignore criteria not mappable to the listed fields

Reply ONLY in valid JSON, no markdown or backticks:
{
  "filters": [
    { "field": "gender", "value": "F" },
    { "field": "age_min", "value": "25" }
  ],
  "interpretation": "Short English description of the detected segment"
}

If no filters can be detected, return { "filters": [], "interpretation": "No recognised criteria — try specifying gender, age, nationality or city." }`;

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text?.trim()) {
      return new Response(JSON.stringify({ error: 'Missing text' }), { status: 400 });
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Analyse this segment: "${text}"` }],
    });

    const raw = message.content[0]?.type === 'text' ? message.content[0].text : '';
    const cleaned = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
    const parsed = JSON.parse(cleaned);

    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[parse-segment]', err);
    return new Response(JSON.stringify({ error: 'Analysis failed' }), { status: 500 });
  }
}
