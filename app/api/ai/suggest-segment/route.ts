import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { formatStatsForPrompt } from '@/lib/db/segment-stats'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a marketing segmentation expert for sporting events. You analyse business objectives and identify the athlete profiles that match them.

Available filterable fields:
- gender: "M" or "F"
- age_min / age_max: integer
- nationality: DK, SE, DE, UK, NL, NO, FR, US, IT, CH, PL, BE
- isReturningAthlete: "true" or "false"
- total_editions_min / total_editions_max: integer
- engagement_min: score 0–100
- city_contains: free text

Reply ONLY in valid JSON, no markdown:
{
  "portrait": "Natural description of the segment in 2-3 sentences, explaining WHO these athletes are and WHY they match the objective.",
  "filters": [
    { "field": "engagement_min", "value": "65" }
  ],
  "insights": [
    "A free-text or non-filterable criterion the client should know, explained clearly in 1 sentence.",
    "Second insight if relevant."
  ],
  "rationale": "Short explanation of the reasoning: why these specific thresholds, how you calibrated the filters against the target size objective."
}

Rules:
- Calibrate thresholds based on the provided statistics and the indicative size objective if mentioned
- If the objective mentions "best", "most engaged", use engagement_min above the p75
- If the objective mentions "loyal", "returning", use isReturningAthlete="true" and total_editions_min
- If no size objective, aim for a meaningful segment (neither too small nor too large)
- Insights should explain what the filters cannot capture (behaviours, intentions, correlations)`

export async function POST(req: NextRequest) {
  try {
    const { objective, gateContext } = await req.json()

    if (!objective?.trim()) {
      return new Response(JSON.stringify({ error: 'Missing objective' }), { status: 400 })
    }

    const stats = formatStatsForPrompt()
    const context = gateContext ? `\nGate context: ${gateContext}` : ''

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `${stats}${context}\n\nClient objective: "${objective}"\n\nPropose the segment that best matches this objective.`,
      }],
    })

    const raw = message.content[0]?.type === 'text' ? message.content[0].text : ''
    const cleaned = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()
    const parsed = JSON.parse(cleaned)

    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[suggest-segment]', err)
    return new Response(JSON.stringify({ error: 'Analysis failed' }), { status: 500 })
  }
}
