import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Tu es un assistant qui analyse des descriptions de segments d'athletes pour le Copenhagen Marathon 2026.

Tu convertis une description en langage naturel en filtres structurés JSON.

Champs disponibles :
- gender: "M" (Homme), "F" (Femme), "X" (Autre)
- age_min: âge minimum (entier, ex: "25")
- age_max: âge maximum (entier, ex: "35")
- nationality: code pays — DK, SE, DE, UK, NL, NO, FR, US, IT, CH, PL, BE
- isReturningAthlete: "true" (déjà participé) ou "false" (première fois)
- total_editions_min: nombre minimum d'éditions courues (entier, ex: "2")
- total_editions_max: nombre maximum d'éditions courues (entier)
- engagement_min: score d'engagement minimum 0–100 (entier, ex: "70")
- city_contains: la ville contient ce texte (ex: "Copenhagen")

Règles de mapping :
- "femmes" → gender = "F" ; "hommes" → gender = "M"
- Nationalités : Danemark/danois → DK, Suède/suédois → SE, Allemagne → DE, UK/britannique → UK, Pays-Bas/néerlandais → NL, Norvège → NO, France/français → FR
- "retournants", "fidèles", "ont déjà participé" → isReturningAthlete = "true"
- "nouveaux", "première fois" → isReturningAthlete = "false"
- "engagement élevé" → engagement_min = "70" ; "très engagés" → engagement_min = "80"
- "au moins N éditions" → total_editions_min = "N"
- Ignore les critères non mappables aux champs listés

Réponds UNIQUEMENT en JSON valide, sans markdown ni backticks :
{
  "filters": [
    { "field": "gender", "value": "F" },
    { "field": "age_min", "value": "25" }
  ],
  "interpretation": "Courte description française du segment détecté"
}

Si aucun filtre détectable, retourne { "filters": [], "interpretation": "Aucun critère reconnu — essaie de préciser genre, âge, nationalité ou ville." }`;

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text?.trim()) {
      return new Response(JSON.stringify({ error: 'Texte manquant' }), { status: 400 });
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Analyse ce segment : "${text}"` }],
    });

    const raw = message.content[0]?.type === 'text' ? message.content[0].text : '';
    const cleaned = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
    const parsed = JSON.parse(cleaned);

    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[parse-segment]', err);
    return new Response(JSON.stringify({ error: 'Erreur lors de l\'analyse' }), { status: 500 });
  }
}
