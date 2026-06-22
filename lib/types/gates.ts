import type { Athlete } from './athlete';

export type Gate1Athlete = Pick<Athlete,
  'id' | 'firstName' | 'lastName' | 'nationality' | 'acquisitionSource' |
  'pastEditions' | 'isReturningAthlete' | 'engagement' |
  'registrationDate' | 'distance' | 'candidacyScore' |
  'anticipatedValue' | 'selectionProbability' | 'preLotterySegment' |
  'externalProspect' | 'externalProspectSource'
>;

export type Gate2Athlete = Gate1Athlete & Pick<Athlete,
  'registrationStatus' | 'waitlistPosition' | 'upsellsPurchased' |
  'upsellRevenue' | 'paymentStatus' | 'postLotterySegment'
>;

export type Gate3Athlete = Gate2Athlete & Pick<Athlete,
  'raceStatus' | 'finishTime' | 'finishCategory' | 'finishRank' |
  'personalBest' | 'reRegistrationProbability' | 'postRaceSegment'
>;
