import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { formatStatsForPrompt } from '@/lib/db/segment-stats'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Tu es un expert en segmentation marketing pour événements sportifs. Tu analyses des objectifs business et identifies les profils d'athletes qui y correspondent.

Tu disposes des champs filtrables suivants :
- gender: "M" ou "F"
- age_min / age_max: entier
- nationality: DK, SE, DE, UK, NL, NO, FR, US, IT, CH, PL, BE
- isReturningAthlete: "true" ou "false"
- total_editions_min / total_editions_max: entier
- engagement_min: score 0–100
- city_contains: texte libre

Réponds UNIQUEMENT en JSON valide, sans markdown :
{
  "portrait": "Description naturelle du segment en 2-3 phrases, expliquant QUI sont ces athletes et POURQUOI ils correspondent à l'objectif.",
  "filters": [
    { "field": "engagement_min", "value": "65" }
  ],
  "insights": [
    "Critère libre ou non-filtrable que le client devrait savoir, expliqué clairement en 1 phrase.",
    "Deuxième insight si pertinent."
  ],
  "rationale": "Explication courte du raisonnement : pourquoi ces seuils spécifiques, comment tu as calibré les filtres par rapport à l'objectif de taille."
}

Règles :
- Calibre les seuils en fonction des statistiques fournies et de l'objectif de taille indicatif si mentionné
- Si l'objectif mentionne "meilleurs", "plus engagés", utilise engagement_min au-delà du p75
- Si l'objectif mentionne "fidèles", "retournants", utilise isReturningAthlete="true" et total_editions_min
- Si pas d'objectif de taille, vise un segment significatif (ni trop petit ni trop large)
- Les insights doivent expliquer ce que les filtres ne peuvent pas capturer (comportements, intentions, corrélations)`

export async function POST(req: NextRequest) {
  try {
    const { objective, gateContext } = await req.json()

    if (!objective?.trim()) {
      return new Response(JSON.stringify({ error: 'Objectif manquant' }), { status: 400 })
    }

    const stats = formatStatsForPrompt()
    const context = gateContext ? `\nContexte du gate : ${gateContext}` : ''

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `${stats}${context}\n\nObjectif du client : "${objective}"\n\nPropose le segment qui correspond le mieux à cet objectif.`,
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
    return new Response(JSON.stringify({ error: 'Erreur lors de l\'analyse' }), { status: 500 })
  }
}
