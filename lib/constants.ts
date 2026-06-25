export const EVENT = {
  name: 'Copenhagen Marathon',
  edition: 2026,
  date: '2026-05-17',
  city: 'Copenhagen',
  country: 'Denmark',
  capacity: 15000,
  ballotOpenDate: '2025-11-01',
  ballotCloseDate: '2025-12-15',
  lotteryDate: '2026-01-10',
  waitlistDeadline: '2026-03-01',
  distances: ['Marathon 42K', 'Half Marathon 21K'],
  historicalReturnRate: 0.30,
  totalApplicants: 20000,
};

export const SEGMENT_SIZES = {
  gate0: {
    past_finishers: 5200,
    past_refused: 8400,
    international_targets: 12000,
    external_prospects: 1600,
  },
  gate1: {
    ambassador: 3200,
    to_reactivate: 2800,
    opportunist: 7500,
    cold_prospect: 6500,
  },
  gate2: {
    confirmed_engaged: 8200,
    confirmed_passive: 3800,
    waitlist_hot: 800,
    waitlist_cold: 1200,
    refused_reactivatable: 2400,
    refused_lost: 3600,
  },
  gate3: {
    loyal_finisher: 6800,
    champion_ambassador: 1400,
    at_risk_returner: 2100,
    lost_dns: 1200,
    reconquest_dnf: 500,
  },
};

export const REREGISTRATION_RATES = {
  naturalReturnRate: 0.30,
  aiTargetedReturnRate: 0.50,
  incrementalAthletes: 2240,
  incrementalRevenue: 224000,
};

export const KPI = {
  gate0: {
    totalApplicantsTarget: 20000,
    historicalAvgApplicants: 17500,
    avgRevenuePerEdition: 1350000,
    avgUpsellRevenuePerEdition: 66000,
  },
  gate1: {
    totalApplications: 20000,
    avgCandidacyScore: 62,
    avgAnticipatedValue: 148,
    externalProspects: 1600,
  },
  gate2: {
    totalConfirmed: 12000,
    totalWaitlist: 2000,
    totalRefused: 6000,
    avgUpsellRevenue: 25,
    upsellConversionRate: 0.22,
  },
  gate3: {
    totalFinishers: 11200,
    avgFinishTime: '4:12:34',
    personalBestRate: 0.28,
    projectedReRegistration: 0.50,
  },
};

export const CHANNELS = ['email', 'sms', 'push', 'instagram', 'offline'] as const;
export type Channel = typeof CHANNELS[number];

export const CHANNEL_LABELS: Record<Channel, string> = {
  email: 'Email',
  sms: 'SMS',
  push: 'Push',
  instagram: 'Instagram',
  offline: 'Offline / Ambassador',
};

export const DEFAULT_CHANNELS: Record<string, Channel[]> = {
  // Gate 1
  ambassador: ['email', 'push'],
  to_reactivate: ['email', 'sms'],
  opportunist: ['email'],
  cold_prospect: ['email'],
  // Gate 0
  past_finishers: ['email', 'push'],
  past_refused: ['email', 'sms'],
  international_targets: ['email', 'instagram'],
  external_prospects: ['email'],
  // Gate 2
  confirmed_engaged: ['email', 'push'],
  confirmed_passive: ['email', 'sms'],
  waitlist_hot: ['email', 'sms'],
  waitlist_cold: ['email'],
  refused_reactivatable: ['email'],
  refused_lost: ['email'],
  // Gate 3
  loyal_finisher: ['email', 'push'],
  champion_ambassador: ['email', 'instagram', 'offline'],
  at_risk_returner: ['email', 'sms'],
  lost_dns: ['email'],
  reconquest_dnf: ['email', 'sms'],
};
