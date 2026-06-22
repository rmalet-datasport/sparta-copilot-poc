export type AcquisitionSource =
  | 'organic_search'
  | 'social_instagram'
  | 'partner_event'
  | 'contest'
  | 'word_of_mouth'
  | 'returning_athlete'
  | 'external_prospect';

export type UpsellItem =
  | 'accommodation_package'
  | 'charity_bib'
  | 'vip_finish_line'
  | 'race_photo_pack'
  | 'pace_group_access'
  | 'finisher_tshirt_premium';

export type PastEdition = {
  year: number;
  applied: boolean;
  status: 'registered' | 'waitlist' | 'refused' | 'not_applied';
  raceStatus?: 'finisher' | 'dns' | 'dnf';
  finishTime?: string;
  upsellsPurchased?: string[];
};

export type EngagementData = {
  score: number;
  emailOpenRate: number;
  appOpens: number;
  smsClickRate: number;
  instagramFollow: boolean;
  websiteVisits: number;
};

export type Athlete = {
  // ─── IDENTITY ───────────────────────────────────────────────────
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  city: string;
  zipCode: string;
  age: number;
  gender: 'M' | 'F';
  acquisitionSource: AcquisitionSource;

  // ─── HISTORY ────────────────────────────────────────────────────
  pastEditions: PastEdition[];
  totalEditionsApplied: number;
  totalEditionsRaced: number;
  isReturningAthlete: boolean;

  // ─── ENGAGEMENT ─────────────────────────────────────────────────
  engagement: EngagementData;

  // ─── GATE 1 ─────────────────────────────────────────────────────
  registrationDate?: string;
  distance?: 'Marathon 42K' | 'Half Marathon 21K';
  estimatedFinishTime?: string;
  externalProspect?: boolean;
  externalProspectSource?: string;
  candidacyScore?: number;
  anticipatedValue?: number;
  selectionProbability?: number;
  preLotterySegment?: 'ambassador' | 'to_reactivate' | 'opportunist' | 'cold_prospect';

  // ─── GATE 2 ─────────────────────────────────────────────────────
  registrationStatus?: 'registered' | 'waitlist' | 'refused';
  lotteryDate?: string;
  waitlistPosition?: number;
  upsellsPurchased?: UpsellItem[];
  upsellRevenue?: number;
  paymentStatus?: 'paid' | 'pending' | 'failed';
  postLotterySegment?: 'confirmed_engaged' | 'confirmed_passive' | 'waitlist_hot' | 'waitlist_cold' | 'refused_reactivatable' | 'refused_lost';

  // ─── GATE 3 ─────────────────────────────────────────────────────
  raceStatus?: 'finisher' | 'dns' | 'dnf';
  finishTime?: string;
  finishCategory?: string;
  finishRank?: number;
  personalBest?: boolean;
  reRegistrationProbability?: number;
  postRaceSegment?: 'loyal_finisher' | 'champion_ambassador' | 'at_risk_returner' | 'lost_dns' | 'reconquest_dnf';
};
