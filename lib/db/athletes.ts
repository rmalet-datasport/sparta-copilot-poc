import type { Athlete, PastEdition, EngagementData, UpsellItem, AcquisitionSource } from '../types/athlete';

// ─── Name pools by nationality ───────────────────────────────────
const POOL: Record<string, { male: string[]; female: string[]; last: string[]; cities: string[]; zip: string; phone: string; domain: string }> = {
  DK: {
    male: ['Anders', 'Mikkel', 'Christian', 'Rasmus', 'Lars', 'Mads', 'Søren', 'Jonas', 'Jesper', 'Thomas', 'Peter', 'Nicolai', 'Martin', 'Henrik', 'Niels', 'Oliver', 'Frederik', 'Emil', 'Alexander', 'Simon', 'Jacob', 'Kasper', 'Magnus', 'Daniel', 'Adam', 'Lasse', 'Mathias', 'Tobias', 'Carl', 'Poul'],
    female: ['Emma', 'Sofie', 'Anna', 'Katrine', 'Laura', 'Maja', 'Maria', 'Sara', 'Julie', 'Line', 'Camilla', 'Ida', 'Louise', 'Mathilde', 'Astrid', 'Cecilie', 'Pernille', 'Mette', 'Stine', 'Hanne', 'Lotte', 'Vibeke', 'Rikke', 'Tine', 'Dorte', 'Birgitte'],
    last: ['Nielsen', 'Jensen', 'Hansen', 'Pedersen', 'Andersen', 'Christensen', 'Larsen', 'Sørensen', 'Rasmussen', 'Jørgensen', 'Petersen', 'Madsen', 'Kristensen', 'Olsen', 'Thomsen', 'Christiansen', 'Poulsen', 'Johansen', 'Knudsen', 'Mortensen', 'Kjær', 'Møller', 'Lund', 'Holm', 'Lindberg'],
    cities: ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Frederiksberg', 'Roskilde', 'Herning', 'Helsingør', 'Esbjerg', 'Kolding', 'Vejle', 'Horsens'],
    zip: '2', phone: '+45 ', domain: 'gmail.com',
  },
  SE: {
    male: ['Erik', 'Johan', 'Lars', 'Mikael', 'Andreas', 'Peter', 'Jonas', 'Karl', 'Martin', 'Daniel', 'Fredrik', 'Björn', 'Stefan', 'Magnus', 'Henrik', 'David', 'Mattias', 'Tobias', 'Simon', 'Marcus'],
    female: ['Emma', 'Anna', 'Maria', 'Sofia', 'Linnea', 'Sara', 'Maja', 'Linda', 'Jenny', 'Hanna', 'Johanna', 'Karin', 'Camilla', 'Lena', 'Marie', 'Frida', 'Isabella'],
    last: ['Johansson', 'Eriksson', 'Karlsson', 'Andersson', 'Nilsson', 'Larsson', 'Svensson', 'Persson', 'Gustafsson', 'Pettersson', 'Jonsson', 'Jansson', 'Lindqvist', 'Magnusson', 'Olofsson'],
    cities: ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Linköping', 'Västerås', 'Örebro', 'Helsingborg'],
    zip: '1', phone: '+46 ', domain: 'gmail.com',
  },
  DE: {
    male: ['Thomas', 'Michael', 'Andreas', 'Stefan', 'Markus', 'Klaus', 'Jürgen', 'Christian', 'Peter', 'Frank', 'Tobias', 'Sebastian', 'Florian', 'Daniel', 'Jan', 'Felix', 'Max', 'Lukas', 'Simon'],
    female: ['Anna', 'Maria', 'Julia', 'Sarah', 'Katharina', 'Sabine', 'Stefanie', 'Hannah', 'Lena', 'Sophie', 'Claudia', 'Monika', 'Laura', 'Elisabeth'],
    last: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Meyer', 'Weber', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Schäfer', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf'],
    cities: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Stuttgart', 'Düsseldorf', 'Leipzig', 'Bremen', 'Hannover'],
    zip: '1', phone: '+49 ', domain: 'gmail.com',
  },
  UK: {
    male: ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Thomas', 'Andrew', 'Mark', 'Paul', 'Steven', 'Christopher', 'Matthew', 'Ryan', 'Daniel', 'Jack', 'Harry', 'George', 'Oliver'],
    female: ['Sarah', 'Emma', 'Amy', 'Jessica', 'Charlotte', 'Lauren', 'Lucy', 'Katie', 'Sophie', 'Rebecca', 'Hannah', 'Olivia', 'Grace', 'Alice', 'Victoria', 'Chloe', 'Emily'],
    last: ['Smith', 'Jones', 'Williams', 'Brown', 'Taylor', 'Davies', 'Wilson', 'Evans', 'Thomas', 'Roberts', 'Johnson', 'Lewis', 'Walker', 'Hall', 'Young', 'Wright', 'Clarke'],
    cities: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Edinburgh', 'Bristol', 'Sheffield', 'Liverpool', 'Oxford'],
    zip: 'SW', phone: '+44 ', domain: 'gmail.com',
  },
  NL: {
    male: ['Jan', 'Pieter', 'Kees', 'Henk', 'Gerard', 'Joost', 'Thomas', 'Bart', 'Ruben', 'Sander', 'Mark', 'Bas', 'Lars', 'Tim', 'Robin', 'Daan', 'Bram'],
    female: ['Emma', 'Lotte', 'Anna', 'Sophie', 'Julia', 'Iris', 'Fleur', 'Noor', 'Anouk', 'Lisa', 'Mia', 'Roos', 'Eva', 'Hannah'],
    last: ['de Jong', 'van den Berg', 'Janssen', 'de Vries', 'Bakker', 'Visser', 'Smit', 'Meijer', 'Peters', 'Mulder', 'Dekker', 'Brouwer'],
    cities: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Groningen', 'Tilburg'],
    zip: '1', phone: '+31 ', domain: 'gmail.com',
  },
  NO: {
    male: ['Ola', 'Kjetil', 'Lars', 'Erik', 'Bjørn', 'Tor', 'Helge', 'Pål', 'Rune', 'Geir', 'Svein', 'Terje', 'Håkon', 'Eirik', 'Vegard', 'Magnus'],
    female: ['Anne', 'Kari', 'Ingrid', 'Hanne', 'Silje', 'Tone', 'Marit', 'Ida', 'Astrid', 'Cecilie', 'Camilla', 'Tonje'],
    last: ['Hansen', 'Johansen', 'Olsen', 'Nilsen', 'Andersen', 'Larsen', 'Sørensen', 'Berg', 'Haugen', 'Bakke', 'Moe', 'Dahl', 'Lie'],
    cities: ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Kristiansand', 'Tromsø', 'Drammen'],
    zip: '0', phone: '+47 ', domain: 'gmail.com',
  },
  FR: {
    male: ['Jean', 'Pierre', 'Michel', 'François', 'Philippe', 'Alain', 'David', 'Nicolas', 'Thomas', 'Julien', 'Antoine', 'Clément', 'Mathieu', 'Sébastien', 'Guillaume'],
    female: ['Marie', 'Sophie', 'Emma', 'Léa', 'Manon', 'Camille', 'Julie', 'Chloé', 'Pauline', 'Laura', 'Charlotte', 'Lucie'],
    last: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Laurent', 'Simon', 'Girard'],
    cities: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Bordeaux'],
    zip: '7', phone: '+33 ', domain: 'gmail.com',
  },
  US: {
    male: ['John', 'Michael', 'Robert', 'James', 'David', 'William', 'Richard', 'Joseph', 'Thomas', 'Christopher', 'Ryan', 'Jason', 'Kevin', 'Brian', 'Eric'],
    female: ['Jennifer', 'Jessica', 'Lisa', 'Mary', 'Sarah', 'Karen', 'Emily', 'Amanda', 'Melissa', 'Rebecca', 'Lauren', 'Kelly', 'Megan'],
    last: ['Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Davis', 'Rodriguez', 'Martinez', 'Wilson', 'Anderson', 'Taylor', 'Moore'],
    cities: ['New York', 'Boston', 'Chicago', 'Seattle', 'Portland', 'Minneapolis'],
    zip: '1', phone: '+1 ', domain: 'gmail.com',
  },
  IT: {
    male: ['Marco', 'Luca', 'Alessandro', 'Andrea', 'Francesco', 'Lorenzo', 'Matteo', 'Davide', 'Stefano', 'Giovanni'],
    female: ['Giulia', 'Sofia', 'Chiara', 'Alice', 'Martina', 'Laura', 'Francesca', 'Sara'],
    last: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci'],
    cities: ['Milan', 'Rome', 'Florence', 'Turin', 'Bologna', 'Venice'],
    zip: '2', phone: '+39 ', domain: 'gmail.com',
  },
  CH: {
    male: ['Thomas', 'David', 'Stefan', 'Michael', 'Markus', 'Patrick', 'Simon', 'Daniel'],
    female: ['Anna', 'Laura', 'Sophie', 'Sandra', 'Katharina', 'Nicole'],
    last: ['Müller', 'Meier', 'Keller', 'Weber', 'Huber', 'Schneider', 'Fischer', 'Meyer'],
    cities: ['Zurich', 'Geneva', 'Basel', 'Bern', 'Lausanne'],
    zip: '3', phone: '+41 ', domain: 'gmail.com',
  },
  PL: {
    male: ['Piotr', 'Krzysztof', 'Andrzej', 'Tomasz', 'Jan', 'Marcin', 'Michał', 'Paweł'],
    female: ['Anna', 'Maria', 'Katarzyna', 'Magdalena', 'Agnieszka', 'Joanna', 'Monika'],
    last: ['Kowalski', 'Nowak', 'Wójcik', 'Wiśniewski', 'Kaczmarek', 'Zając', 'Lewandowski'],
    cities: ['Warsaw', 'Kraków', 'Gdańsk', 'Wrocław', 'Poznań'],
    zip: '0', phone: '+48 ', domain: 'gmail.com',
  },
  BE: {
    male: ['Jan', 'Thomas', 'Pieter', 'Luc', 'Marc', 'Stefan'],
    female: ['Emma', 'Laura', 'Julie', 'Sophie', 'Nathalie'],
    last: ['Peeters', 'Janssens', 'Maes', 'Jacobs', 'Claes', 'Mertens'],
    cities: ['Brussels', 'Antwerp', 'Ghent', 'Liège'],
    zip: '1', phone: '+32 ', domain: 'gmail.com',
  },
};

// ─── Deterministic shuffle ───────────────────────────────────────
function deterministicShuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  const n = result.length;
  for (let i = n - 1; i > 0; i--) {
    const j = Math.abs((i * 2654435761) | 0) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function lerp(min: number, max: number, t: number): number {
  return Math.round(min + (max - min) * t);
}

// ─── Build nationality array (500 entries) ───────────────────────
const NAT_DIST = [
  { nat: 'DK', count: 190 }, { nat: 'SE', count: 70 }, { nat: 'DE', count: 60 },
  { nat: 'UK', count: 50 }, { nat: 'NL', count: 40 }, { nat: 'NO', count: 35 },
  { nat: 'FR', count: 25 }, { nat: 'US', count: 10 }, { nat: 'IT', count: 7 },
  { nat: 'CH', count: 5 }, { nat: 'PL', count: 5 }, { nat: 'BE', count: 3 },
];

const NATIONALITIES = deterministicShuffle(
  NAT_DIST.flatMap(({ nat, count }) => Array(count).fill(nat))
);

const PRE_LOTTERY_SEGMENTS: string[] = deterministicShuffle([
  ...Array(160).fill('ambassador'),
  ...Array(140).fill('to_reactivate'),
  ...Array(125).fill('opportunist'),
  ...Array(75).fill('cold_prospect'),
]);

const POST_LOTTERY_SEGMENTS: string[] = deterministicShuffle([
  ...Array(205).fill('confirmed_engaged'),
  ...Array(95).fill('confirmed_passive'),
  ...Array(20).fill('waitlist_hot'),
  ...Array(30).fill('waitlist_cold'),
  ...Array(60).fill('refused_reactivatable'),
  ...Array(90).fill('refused_lost'),
]);

// Map registered athlete index (j) → post-race segment
// Registered = confirmed_engaged + confirmed_passive = 300 total
const POST_RACE_SEGMENTS: string[] = deterministicShuffle([
  ...Array(170).fill('loyal_finisher'),
  ...Array(35).fill('champion_ambassador'),
  ...Array(53).fill('at_risk_returner'),
  ...Array(30).fill('lost_dns'),
  ...Array(12).fill('reconquest_dnf'),
]);

const UPSELL_ITEMS: UpsellItem[] = [
  'accommodation_package', 'charity_bib', 'vip_finish_line',
  'race_photo_pack', 'pace_group_access', 'finisher_tshirt_premium',
];

const UPSELL_PRICES: Record<UpsellItem, number> = {
  accommodation_package: 180, charity_bib: 50, vip_finish_line: 75,
  race_photo_pack: 35, pace_group_access: 25, finisher_tshirt_premium: 40,
};

const EXTERNAL_SOURCES = [
  'Nike Running Club Copenhagen Contest',
  'Intersport Partner Program',
  'Parkrun Denmark Partnership',
];

const ACQ_SOURCES: AcquisitionSource[] = [
  'organic_search', 'social_instagram', 'partner_event', 'contest', 'word_of_mouth', 'returning_athlete',
];

function generatePhone(prefix: string, seed: number): string {
  const n = 10000000 + (Math.abs(seed * 12345 + 67890) % 90000000);
  return `${prefix}${n}`;
}

function generateZip(nat: string, seed: number): string {
  const p = POOL[nat];
  if (['UK'].includes(nat)) return `${p.zip}W${(seed % 9) + 1} ${(seed % 9) + 1}${String.fromCharCode(65 + seed % 26)}${String.fromCharCode(65 + (seed * 3) % 26)}`;
  return `${p.zip}${String(1000 + (Math.abs(seed) % 9000)).substring(0, 4)}`;
}

function generatePastEditions(seed: number, isReturning: boolean, segment: string): PastEdition[] {
  const editions: PastEdition[] = [];
  const years = [2021, 2022, 2023, 2024, 2025];

  for (let y = 0; y < years.length; y++) {
    const year = years[y];
    const yearSeed = seed * 31 + y;

    if (!isReturning) {
      // Non-returning: mostly not applied
      const applied = yearSeed % 7 === 0;
      editions.push({ year, applied, status: applied ? 'refused' : 'not_applied' });
      continue;
    }

    // Returning athlete: more history
    const applied = yearSeed % 3 !== 0 || y > 1;
    if (!applied) {
      editions.push({ year, applied: false, status: 'not_applied' });
      continue;
    }

    const statusRoll = yearSeed % 10;
    let status: 'registered' | 'waitlist' | 'refused';
    if (statusRoll < 6) status = 'registered';
    else if (statusRoll < 8) status = 'waitlist';
    else status = 'refused';

    if (status === 'registered') {
      const raceRoll = yearSeed % 8;
      const raceStatus = raceRoll < 6 ? 'finisher' : raceRoll < 7 ? 'dns' : 'dnf';
      const h = 3 + (yearSeed % 2);
      const m = yearSeed % 60;
      const s = (yearSeed * 7) % 60;
      const finishTime = raceStatus === 'finisher'
        ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : undefined;
      const upsells = raceStatus === 'finisher' && yearSeed % 3 === 0
        ? [UPSELL_ITEMS[yearSeed % UPSELL_ITEMS.length]] : undefined;
      editions.push({ year, applied: true, status, raceStatus, finishTime, upsellsPurchased: upsells });
    } else {
      editions.push({ year, applied: true, status });
    }
  }

  return editions;
}

function generateEngagement(segment: string, seed: number): EngagementData {
  const t = (seed % 100) / 100;
  let baseScore: number;

  switch (segment) {
    case 'ambassador': baseScore = lerp(65, 95, t); break;
    case 'to_reactivate': baseScore = lerp(20, 55, t); break;
    case 'opportunist': baseScore = lerp(45, 70, t); break;
    case 'cold_prospect': baseScore = lerp(15, 45, t); break;
    case 'confirmed_engaged': baseScore = lerp(61, 92, t); break;
    case 'confirmed_passive': baseScore = lerp(20, 59, t); break;
    case 'champion_ambassador': baseScore = lerp(76, 98, t); break;
    default: baseScore = lerp(30, 70, t);
  }

  return {
    score: baseScore,
    emailOpenRate: parseFloat((0.3 + (baseScore / 100) * 0.5).toFixed(2)),
    appOpens: lerp(0, 45, baseScore / 100),
    smsClickRate: parseFloat((0.15 + (baseScore / 100) * 0.35).toFixed(2)),
    instagramFollow: baseScore > 60,
    websiteVisits: lerp(0, 25, baseScore / 100),
  };
}

// ─── Main generator ──────────────────────────────────────────────
function generateAthletes(): Athlete[] {
  const athletes: Athlete[] = [];
  let registeredCount = 0;

  for (let i = 0; i < 500; i++) {
    const nat = NATIONALITIES[i];
    const pool = POOL[nat];
    const preLotSeg = PRE_LOTTERY_SEGMENTS[i] as Athlete['preLotterySegment'];
    const postLotSeg = POST_LOTTERY_SEGMENTS[i] as Athlete['postLotterySegment'];

    const isMale = (i * 7 + 3) % 2 === 0;
    const gender: 'M' | 'F' = isMale ? 'M' : 'F';
    const firstNames = isMale ? pool.male : pool.female;
    const firstName = pick(firstNames, i * 13 + 7);
    const lastName = pick(pool.last, i * 11 + 3);
    const city = pick(pool.cities, i * 17 + 5);

    const age = 25 + (i * 13 + 7) % 30;
    const isExternal = i % 13 === 7; // ~38 athletes
    const isReturning = !isExternal && (preLotSeg === 'ambassador' || preLotSeg === 'to_reactivate' || (i % 4 !== 0));

    const pastEditions = generatePastEditions(i, isReturning, preLotSeg!);
    const totalApplied = pastEditions.filter(e => e.applied).length;
    const totalRaced = pastEditions.filter(e => e.raceStatus === 'finisher').length;

    const email = `${firstName.toLowerCase().replace(/[^a-z]/g, '')}.${lastName.toLowerCase().replace(/[^a-z]/g, '')}${i}@${pool.domain}`;
    const phone = generatePhone(pool.phone, i);
    const zip = generateZip(nat, i);

    const acqSource: AcquisitionSource = isExternal
      ? 'external_prospect'
      : isReturning ? 'returning_athlete' : pick(ACQ_SOURCES, i);

    // Engagement based on pre-lottery segment
    const engSeed = i * 37 + 11;
    const engagement = generateEngagement(preLotSeg!, engSeed);

    // Gate 1 values
    const regDay = 1 + (i % 45);
    const regMonth = regDay <= 30 ? 11 : 12;
    const regDayAdj = regDay <= 30 ? regDay : regDay - 30;
    const registrationDate = `2025-${String(regMonth).padStart(2, '0')}-${String(regDayAdj).padStart(2, '0')}`;
    const distance = (i * 3 + 1) % 3 === 0 ? 'Half Marathon 21K' : 'Marathon 42K';
    const estimatedH = distance === 'Marathon 42K' ? (3 + (i % 3)) : (1 + (i % 2));
    const estimatedM = (i * 7) % 60;
    const estimatedFinishTime = `${estimatedH}:${String(estimatedM).padStart(2, '0')}:00`;

    let candidacyScore: number, anticipatedValue: number, selectionProbability: number;
    switch (preLotSeg) {
      case 'ambassador':
        candidacyScore = lerp(72, 95, (i % 160) / 159);
        anticipatedValue = lerp(180, 420, (i % 160) / 159);
        selectionProbability = parseFloat((0.6 + ((i % 160) / 159) * 0.3).toFixed(2));
        break;
      case 'to_reactivate':
        candidacyScore = lerp(55, 80, (i % 140) / 139);
        anticipatedValue = lerp(120, 320, (i % 140) / 139);
        selectionProbability = parseFloat((0.08 + ((i % 140) / 139) * 0.32).toFixed(2));
        break;
      case 'opportunist':
        candidacyScore = lerp(40, 68, (i % 125) / 124);
        anticipatedValue = lerp(45, 140, (i % 125) / 124);
        selectionProbability = parseFloat((0.5 + ((i % 125) / 124) * 0.3).toFixed(2));
        break;
      default: // cold_prospect
        candidacyScore = lerp(18, 45, (i % 75) / 74);
        anticipatedValue = lerp(20, 90, (i % 75) / 74);
        selectionProbability = parseFloat((0.04 + ((i % 75) / 74) * 0.3).toFixed(2));
    }

    // Gate 2 values
    const isRegistered = postLotSeg === 'confirmed_engaged' || postLotSeg === 'confirmed_passive';
    const isWaitlist = postLotSeg === 'waitlist_hot' || postLotSeg === 'waitlist_cold';
    const isRefused = postLotSeg === 'refused_reactivatable' || postLotSeg === 'refused_lost';

    const registrationStatus: Athlete['registrationStatus'] = isRegistered ? 'registered' : isWaitlist ? 'waitlist' : 'refused';
    const waitlistPosition = isWaitlist ? (postLotSeg === 'waitlist_hot' ? 10 + (i % 190) : 201 + (i % 600)) : undefined;

    // Upsells for registered athletes
    let upsellsPurchased: UpsellItem[] | undefined;
    let upsellRevenue: number | undefined;
    let paymentStatus: Athlete['paymentStatus'] = undefined;

    if (isRegistered) {
      paymentStatus = 'paid';
      if (i % 3 !== 0) {
        const upsellCount = 1 + (i % 3);
        upsellsPurchased = [];
        upsellRevenue = 0;
        for (let u = 0; u < upsellCount; u++) {
          const item = UPSELL_ITEMS[(i + u * 7) % UPSELL_ITEMS.length];
          if (!upsellsPurchased.includes(item)) {
            upsellsPurchased.push(item);
            upsellRevenue += UPSELL_PRICES[item];
          }
        }
      } else {
        upsellsPurchased = [];
        upsellRevenue = 0;
      }
    }

    // Gate 3 values (only for registered athletes)
    let raceStatus: Athlete['raceStatus'] = undefined;
    let finishTime: string | undefined;
    let finishCategory: string | undefined;
    let finishRank: number | undefined;
    let personalBest: boolean | undefined;
    let reRegistrationProbability: number | undefined;
    let postRaceSegment: Athlete['postRaceSegment'] = undefined;

    if (isRegistered) {
      const j = registeredCount;
      const postRaceSeg = POST_RACE_SEGMENTS[j] as Athlete['postRaceSegment'];
      postRaceSegment = postRaceSeg;
      registeredCount++;

      raceStatus = postRaceSeg === 'lost_dns' ? 'dns' : postRaceSeg === 'reconquest_dnf' ? 'dnf' : 'finisher';

      if (raceStatus === 'finisher') {
        const fH = distance === 'Marathon 42K' ? 3 + (j % 2) : 1 + (j % 2);
        const fM = j % 60;
        const fS = (j * 7) % 60;
        finishTime = `${fH}:${String(fM).padStart(2, '0')}:${String(fS).padStart(2, '0')}`;

        const ageGroup = Math.floor(age / 5) * 5;
        finishCategory = `${gender}${ageGroup}-${ageGroup + 4}`;
        finishRank = 100 + (j * 37) % 9800;
        personalBest = postRaceSeg === 'champion_ambassador' || (j % 5 === 0);
        reRegistrationProbability = postRaceSeg === 'loyal_finisher'
          ? parseFloat((0.71 + (j % 29) / 100).toFixed(2))
          : postRaceSeg === 'champion_ambassador'
          ? parseFloat((0.75 + (j % 25) / 100).toFixed(2))
          : parseFloat((0.10 + (j % 30) / 100).toFixed(2));
      }
    }

    const athlete: Athlete = {
      id: `ATH-${String(i + 1).padStart(4, '0')}`,
      firstName, lastName, email, phone, nationality: nat, city, zipCode: zip,
      age, gender, acquisitionSource: acqSource,
      pastEditions, totalEditionsApplied: totalApplied, totalEditionsRaced: totalRaced,
      isReturningAthlete: isReturning,
      engagement,
      registrationDate, distance, estimatedFinishTime,
      externalProspect: isExternal,
      externalProspectSource: isExternal ? EXTERNAL_SOURCES[i % EXTERNAL_SOURCES.length] : undefined,
      candidacyScore, anticipatedValue, selectionProbability, preLotterySegment: preLotSeg,
      registrationStatus, lotteryDate: '2026-01-10', waitlistPosition,
      upsellsPurchased, upsellRevenue, paymentStatus,
      postLotterySegment: postLotSeg,
      raceStatus, finishTime, finishCategory, finishRank, personalBest,
      reRegistrationProbability, postRaceSegment,
    };

    athletes.push(athlete);
  }

  return athletes;
}

export const athletes: Athlete[] = generateAthletes();

export function getAthletesByPreLotterySegment(segment: Athlete['preLotterySegment']): Athlete[] {
  return athletes.filter(a => a.preLotterySegment === segment);
}

export function getAthletesByPostLotterySegment(segment: Athlete['postLotterySegment']): Athlete[] {
  return athletes.filter(a => a.postLotterySegment === segment);
}

export function getAthletesByPostRaceSegment(segment: Athlete['postRaceSegment']): Athlete[] {
  return athletes.filter(a => a.postRaceSegment === segment);
}
