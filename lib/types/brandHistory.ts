export interface BrandExample {
  channel?: string;   // 'email' | 'sms' | 'push' | 'instagram'
  gate?: string;      // 'gate0' | 'gate1' | 'gate2' | 'gate3' (normalisé)
  segment?: string;
  subject?: string;
  title?: string;
  body?: string;
  caption?: string;
  hashtags?: string;
}
