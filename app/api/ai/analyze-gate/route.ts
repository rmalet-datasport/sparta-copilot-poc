import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { formatStatsForPrompt, formatStatsForSubPool } from '@/lib/db/segment-stats'
import { athletes } from '@/lib/db/athletes'

const client = new Anthropic()

function buildSystemPrompt(isSubPool: boolean) {
  const context = isSubPool
    ? 'You are a data analyst for Copenhagen Marathon 2026. Analyze a specific athlete sub-pool and propose exactly 3–4 distinct, actionable sub-segments within it. These are second-level segments discovered inside a broader group.'
    : 'You are a data analyst for Copenhagen Marathon 2026. Analyze the athlete database statistics and propose exactly 4 distinct, non-overlapping audience segments for a marketing campaign.'

  return `${context}

Available filter fields and valid values:
- gender: "M" or "F"
- nationality: "DK", "SE", "DE", "UK", "NL", "NO", "FR", "US", "IT", "CH", "PL", "BE"
- isReturningAthlete: "true" or "false"
- total_editions_min: minimum editions raced, integer as string (e.g. "2")
- total_editions_max: maximum editions raced, integer as string
- engagement_min: minimum engagement score 0–100, integer as string
- age_min / age_max: integer as string
- city_contains: city name substring (e.g. "Copenhagen")
- distance: "Marathon 42K" or "Half Marathon 21K"
- hasInsurance: "true" or "false"

Rules:
- Return exactly ${isSubPool ? '3 or 4' : '4'} segments
- Each segment must have 1–3 filters (AND-combined within a segment)
- Names in English, 2–4 words, capitalize each word
- Base your analysis on the statistics provided — surface patterns genuinely useful for marketing

Return ONLY a valid JSON object with this exact structure, no other text:
{
  "segments": [
    {
      "id": "snake_case_id",
      "name": "Segment Name",
      "description": "One sentence on who they are and what makes them distinct.",
      "suggestedChannels": ["email"],
      "channelRationale": {
        "email": "Why this channel works for this group."
      },
      "filters": [
        { "field": "fieldName", "value": "value" }
      ]
    }
  ]
}`
}

const COLORS = [
  { color: '#16A34A', colorBg: '#F0FDF4' },
  { color: '#2563EB', colorBg: '#EFF6FF' },
  { color: '#EA580C', colorBg: '#FFF7ED' },
  { color: '#7C3AED', colorBg: '#F5F3FF' },
]

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const athleteIds: string[] | undefined = body?.athleteIds
    const parentLabel: string = body?.parentLabel ?? 'this group'

    let stats: string
    let isSubPool = false

    if (athleteIds && athleteIds.length > 0) {
      const pool = athletes.filter(a => athleteIds.includes(a.id))
      stats = formatStatsForSubPool(pool)
      isSubPool = true
    } else {
      stats = formatStatsForPrompt()
    }

    const userContent = isSubPool
      ? `Here are the statistics for the "${parentLabel}" sub-pool:\n\n${stats}\n\nPropose 3–4 sub-segments within this group for targeted campaigns.`
      : `Here are the database statistics for the Copenhagen Marathon 2026 registration pool:\n\n${stats}\n\nPropose 4 segments for the campaign.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      system: buildSystemPrompt(isSubPool),
      messages: [{ role: 'user', content: userContent }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })

    const data = JSON.parse(jsonMatch[0])
    const segments = (data.segments as any[]).slice(0, 4).map((seg, i) => ({
      ...seg,
      filters: (seg.filters ?? []).map((f: any, j: number) => ({ ...f, id: `ai_${i}_${j}` })),
      ...COLORS[i % COLORS.length],
    }))

    return NextResponse.json({ segments })
  } catch (err) {
    console.error('analyze-gate error:', err)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
