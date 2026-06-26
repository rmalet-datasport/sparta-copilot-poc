import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { SYSTEM_PROMPTS, buildUserPrompt, buildRegeneratePrompt } from '@/lib/ai/prompts';
import { SEGMENT_SIZES } from '@/lib/constants';
import { isRateLimited } from '@/lib/rate-limit';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const VALID_CHANNELS = new Set(['email', 'sms', 'push', 'instagram', 'linkedin', 'facebook', 'partner'])

function buildDryRunAsset(channel: string) {
  switch (channel) {
    case 'email':     return { channel, subject: '[DRY RUN] Test subject', body: '[DRY RUN] Test body', meta: 'dry-run fixture' }
    case 'sms':       return { channel, body: '[DRY RUN] Test SMS body', meta: 'dry-run fixture' }
    case 'push':      return { channel, title: '[DRY RUN] Test push title', body: '[DRY RUN] Test push body', meta: 'dry-run fixture' }
    case 'instagram': return { channel, caption: '[DRY RUN] Test caption', hashtags: '#test #dryrun', meta: 'dry-run fixture' }
    case 'linkedin':  return { channel, title: '[DRY RUN] LinkedIn headline', body: '[DRY RUN] LinkedIn post body', hashtags: '#test #dryrun', meta: 'dry-run fixture' }
    case 'facebook':  return { channel, title: '[DRY RUN] Facebook hook', body: '[DRY RUN] Facebook post body', hashtags: '#test #dryrun', meta: 'dry-run fixture' }
    case 'partner':   return { channel, title: '[DRY RUN] Campaign name', caption: '[DRY RUN] Flyer tagline', body: '[DRY RUN] Ambassador briefing', utmCampaign: 'dryrun_campaign', distributionPoints: 'Running store A, Gym B, Parkrun C', meta: 'dry-run fixture' }
    default:          return { channel, body: '[DRY RUN]', meta: 'dry-run fixture' }
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  if (isRateLimited(ip, 20, 60_000)) {
    return new Response(JSON.stringify({ error: 'Too many requests. Please wait a minute.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  try {
    const body = await req.json();
    const { gate, segment, channels, customInstructions, channelToRegenerate, segmentDescription, historicalExamples, selectedRaces, _dryRun } = body;

    const systemPrompt = SYSTEM_PROMPTS[gate as string]?.[segment as string];

    if (!systemPrompt) {
      return new Response(JSON.stringify({ error: `No prompt for ${gate}/${segment}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const channelList: string[] = channelToRegenerate ? [channelToRegenerate] : (channels ?? [])
    const invalidChannels = channelList.filter(c => !VALID_CHANNELS.has(c))
    if (invalidChannels.length > 0) {
      return new Response(JSON.stringify({ error: `Unknown channel(s): ${invalidChannels.join(', ')}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (_dryRun) {
      const assets = channelList.map(buildDryRunAsset)
      return new Response(JSON.stringify({ assets }), {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }

    const segmentSize = (SEGMENT_SIZES as Record<string, Record<string, number>>)[gate as string]?.[segment as string] ?? 1000;

    const userPrompt = channelToRegenerate
      ? buildRegeneratePrompt(channelToRegenerate, customInstructions ?? '', historicalExamples ?? [], selectedRaces ?? [])
      : buildUserPrompt({
          channels: channels ?? [],
          customInstructions,
          segmentDescription,
          segmentStats: { size: segmentSize },
          historicalExamples: historicalExamples ?? [],
          selectedRaces: selectedRaces ?? [],
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
